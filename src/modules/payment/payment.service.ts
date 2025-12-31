import crypto from 'crypto';
import axios from 'axios';
import { PrismaClient, OrderStatus, TicketStatus } from '@prisma/client';
import { logger } from '../../utils/logger';
import { AppError } from '../../middleware/errorHandler';
import redis from '../../config/cache';
import { emailQueue } from '../../config/queue'; 
import { immutableAuditService } from '../../services/immutableAudit.service';
import { Request } from 'express';
import { generateQRCode } from '../../utils/ticket.utils';

const prisma = new PrismaClient();

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

interface WebhookPayload {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    paid_at?: string;
    customer?: {
      email: string;
      first_name?: string;
      last_name?: string;
    };
    authorization?: {
      channel: string;
      card_type?: string;
      last4?: string;
      exp_month?: string;
      exp_year?: string;
      bank?: string;
    };
    metadata?: any;
    gateway_response?: string;
    fees?: number;
    currency?: string;
    ip_address?: string;
  };
}

export class PaymentService {
  private readonly paystackSecretKey: string;
  private readonly paystackBaseUrl = 'https://api.paystack.co';
  private readonly webhookIdempotencyTTL = 604800;
  private readonly maxWebhookAge = 48;
  private readonly amountTolerancePercent = 0.01;
  private readonly webhookRateLimitWindow = 60;
  private readonly webhookRateLimitMax = 50;
  private readonly isDevelopment: boolean;

  private readonly paystackWebhookIPs = [
    '52.31.139.75',
    '52.49.173.169',
    '52.214.14.220',
  ];

  constructor() {
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.isDevelopment = process.env.NODE_ENV === 'development';

    if (!this.paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }
  }

  private toKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  private fromKobo(amount: number): number {
    return Math.round(amount) / 100;
  }

  private isAmountValid(expected: number, paid: number, tolerancePercent: number = this.amountTolerancePercent): boolean {
    const tolerance = expected * tolerancePercent;
    const difference = Math.abs(expected - paid);
    return difference <= tolerance && paid >= expected;
  }

  private sanitizeErrorForClient(error: any): string {
    if (this.isDevelopment && error instanceof Error) {
      return error.message;
    }
    
    if (error instanceof AppError) {
      return error.message;
    }

    return 'Payment processing failed. Please contact support if the issue persists.';
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private sanitizeMetadata(metadata: any): any {
    if (!metadata || typeof metadata !== 'object') {
      return {};
    }

    const sanitized: any = {};
    const allowedKeys = ['orderId', 'customerId', 'ticketCount', 'gameSession'];
    
    for (const key of allowedKeys) {
      if (key in metadata) {
        sanitized[key] = metadata[key];
      }
    }

    return sanitized;
  }

  private async validateWebhookSourceIP(ipAddress: string): Promise<boolean> {
    if (this.isDevelopment) {
      logger.debug('Skipping IP validation in development', { ipAddress });
      return true;
    }

    const isValid = this.paystackWebhookIPs.includes(ipAddress);
    
    if (!isValid) {
      await immutableAuditService.createLog({
        action: 'WEBHOOK_INVALID_SOURCE_IP',
        entity: 'PAYMENT',
        entityId: 'UNKNOWN',
        ipAddress,
        metadata: {
          expectedIPs: this.paystackWebhookIPs,
          receivedIP: ipAddress,
        },
        success: false,
      });

      logger.error('Webhook from unauthorized IP', {
        ipAddress,
        allowedIPs: this.paystackWebhookIPs,
      });
    }

    return isValid;
  }

  private async checkWebhookRateLimit(reference: string, ipAddress: string): Promise<boolean> {
    const rateLimitKey = `webhook:ratelimit:${ipAddress}`;
    
    try {
      const current = await redis.incr(rateLimitKey);
      
      if (current === 1) {
        await redis.expire(rateLimitKey, this.webhookRateLimitWindow);
      }

      if (current > this.webhookRateLimitMax) {
        logger.warn('Webhook rate limit exceeded', {
          ipAddress,
          reference,
          requests: current,
          limit: this.webhookRateLimitMax,
          window: this.webhookRateLimitWindow,
        });

        await immutableAuditService.createLog({
          action: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
          entity: 'PAYMENT',
          entityId: reference,
          ipAddress,
          metadata: {
            requests: current,
            limit: this.webhookRateLimitMax,
          },
          success: false,
        });

        return false;
      }

      return true;
    } catch (error) {
      logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress,
      });
      return true;
    }
  }

  async handleWebhook(payload: WebhookPayload, signature: string, req: Request) {
    const startTime = Date.now();
    let lockAcquired = false;
    const reference = payload?.data?.reference;
    const event = payload?.event;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    
    try {
      if (!signature) {
        await this.logWebhookFailure(payload, ipAddress, 'Missing signature');
        throw new AppError(401, 'Webhook authentication failed');
      }

      this.validateWebhookPayload(payload);

      const isValidIP = await this.validateWebhookSourceIP(ipAddress);
      if (!isValidIP) {
        await this.logWebhookFailure(payload, ipAddress, 'Unauthorized source IP');
        throw new AppError(403, 'Webhook source not authorized');
      }

      const isRateLimitOk = await this.checkWebhookRateLimit(reference, ipAddress);
      if (!isRateLimitOk) {
        throw new AppError(429, 'Rate limit exceeded');
      }

      await this.validateWebhookTimestamp(payload.data);

      await this.verifyWebhookSignature(signature, req);

      const idempotencyHash = this.generateIdempotencyHash(event, reference, payload.data.paid_at);
      const isDuplicate = await this.checkIdempotency(event, reference, idempotencyHash);

      if (isDuplicate) {
        logger.info('Duplicate webhook ignored', { event, reference, ipAddress });
        return { message: 'Webhook already processed', event, duplicate: true };
      }

      lockAcquired = await this.acquireWebhookLock(event, reference);

      if (!lockAcquired) {
        logger.warn('Webhook lock acquisition failed', {
          event,
          reference,
          ipAddress,
        });
        throw new AppError(409, 'Webhook is already being processed');
      }

      await this.markWebhookProcessing(event, reference, idempotencyHash);

      logger.info(`Processing webhook: ${event}`, { 
        reference, 
        status: payload.data.status,
        amount: this.fromKobo(payload.data.amount),
        ipAddress,
      });

      const result = await this.processWebhookEvent(payload, ipAddress, idempotencyHash);

      await this.markWebhookCompleted(event, reference, idempotencyHash);

      await immutableAuditService.createLog({
        action: 'WEBHOOK_PROCESSED',
        entity: 'PAYMENT',
        entityId: reference,
        ipAddress,
        metadata: {
          event,
          reference,
          status: payload.data.status,
          amount: this.fromKobo(payload.data.amount),
          processingTime: Date.now() - startTime
        }
      });

      logger.info('Webhook processed successfully', {
        event,
        reference,
        processingTime: Date.now() - startTime,
        ipAddress,
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Webhook processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
        reference,
        processingTime,
        ipAddress,
      });

      await immutableAuditService.createLog({
        action: 'WEBHOOK_FAILED',
        entity: 'PAYMENT',
        entityId: reference,
        ipAddress,
        metadata: {
          event,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        },
        success: false,
      });

      if (lockAcquired && reference && event) {
        await this.releaseWebhookLock(event, reference);
      }

      throw error;
    } finally {
      if (lockAcquired && reference && event) {
        await this.releaseWebhookLock(event, reference);
      }
    }
  }

  private validateWebhookPayload(payload: any): asserts payload is WebhookPayload {
    if (!payload || typeof payload !== 'object') {
      throw new AppError(400, 'Invalid payload structure');
    }

    if (!payload.event || typeof payload.event !== 'string') {
      throw new AppError(400, 'Missing or invalid event');
    }

    if (!payload.data || typeof payload.data !== 'object') {
      throw new AppError(400, 'Missing or invalid data');
    }

    if (!payload.data.reference || typeof payload.data.reference !== 'string') {
      throw new AppError(400, 'Missing or invalid reference');
    }

    if (typeof payload.data.amount !== 'number' || payload.data.amount < 0) {
      throw new AppError(400, 'Invalid amount');
    }

    if (!payload.data.status || typeof payload.data.status !== 'string') {
      throw new AppError(400, 'Missing or invalid status');
    }

    if (payload.data.customer?.email && !this.validateEmail(payload.data.customer.email)) {
      throw new AppError(400, 'Invalid email format');
    }
  }

  private async addJitter(): Promise<void> {
    const jitter = 100 + Math.floor(Math.random() * 200);
    await new Promise(resolve => setTimeout(resolve, jitter));
  }
  
  private async verifyWebhookSignature(signature: string, req: Request): Promise<void> {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      logger.error('Raw body unavailable for signature verification');
      throw new AppError(500, 'Webhook verification failed');
    }

    const hash = crypto
      .createHmac('sha512', this.paystackSecretKey)
      .update(rawBody)
      .digest('hex');

    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      const hashBuffer = Buffer.from(hash, 'hex');

      if (signatureBuffer.length !== hashBuffer.length) {
        await this.addJitter();
        logger.warn('Signature length mismatch', {
          ip: req.ip,
          expectedLength: hashBuffer.length,
          receivedLength: signatureBuffer.length,
        });
        throw new AppError(401, 'Webhook authentication failed');
      }

      if (!crypto.timingSafeEqual(signatureBuffer, hashBuffer)) {
        await this.addJitter();
        logger.warn('Signature verification failed', {
          ip: req.ip,
          signaturePrefix: signature.substring(0, 16),
        });
        throw new AppError(401, 'Webhook authentication failed');
      }

      await immutableAuditService.createLog({
        action: 'WEBHOOK_SIGNATURE_VERIFIED',
        entity: 'PAYMENT',
        entityId: 'SIGNATURE_CHECK',
        ipAddress: req.ip,
        metadata: {
          signatureLength: signatureBuffer.length,
        },
      });

    } catch (error) {
      await this.addJitter();
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Signature verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
      });
      throw new AppError(401, 'Webhook authentication failed');
    }
  }

  private generateIdempotencyHash(event: string, reference: string, timestamp?: string): string {
    const timestampStr = timestamp || Date.now().toString();
    return crypto
      .createHash('sha256')
      .update(`${event}:${reference}:${timestampStr}`)
      .digest('hex')
      .substring(0, 32);
  }
  
  private async checkIdempotency(event: string, reference: string, idempotencyHash: string): Promise<boolean> {
    const idempotencyKey = `webhook:${event}:${reference}:${idempotencyHash}`;
    const redisStatus = await redis.get(idempotencyKey);
      
    if (redisStatus) {
      return true;
    }
    
    const existing = await prisma.webhookLog.findUnique({
      where: {
        event_reference: {
          event,
          reference
        }
      }
    });

    if (existing && existing.idempotencyHash === idempotencyHash) {
      logger.info('Duplicate webhook detected via DB check', {
        event,
        reference,
        idempotencyHash
      });
      return true;
    }

    return false;
  }

  private async acquireWebhookLock(event: string, reference: string): Promise<boolean> {
    const lockKey = `webhook:lock:${event}:${reference}`;
    const lockValue = crypto.randomBytes(16).toString('hex');
    
    const result = await redis.set(lockKey, lockValue, 'EX', 120, 'NX');
    
    return result === 'OK';
  }

  private async releaseWebhookLock(event: string, reference: string): Promise<void> {
    const lockKey = `webhook:lock:${event}:${reference}`;
    await redis.del(lockKey);
  }

  private async markWebhookProcessing(event: string, reference: string, idempotencyHash: string): Promise<void> {
    const idempotencyKey = `webhook:${event}:${reference}:${idempotencyHash}`;
    await redis.setex(idempotencyKey, this.webhookIdempotencyTTL, 'processing');
  }

  private async markWebhookCompleted(event: string, reference: string, idempotencyHash: string): Promise<void> {
    const idempotencyKey = `webhook:${event}:${reference}:${idempotencyHash}`;
    await redis.setex(idempotencyKey, this.webhookIdempotencyTTL, 'completed');

    await prisma.webhookLog.upsert({
      where: {
        event_reference: {
          event,
          reference
        }
      },
      update: {
        status: 'completed',
        processedAt: new Date(),
        idempotencyHash
      },
      create: {
        event,
        reference,
        status: 'completed',
        processedAt: new Date(),
        idempotencyHash
      }
    });
  }

  private async validateWebhookTimestamp(data: any): Promise<void> {
    if (data.paid_at) {
      const paidAt = new Date(data.paid_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > this.maxWebhookAge) {
        logger.warn('Webhook timestamp too old', {
          paidAt: paidAt.toISOString(),
          hoursDiff,
          maxAge: this.maxWebhookAge
        });
        throw new AppError(400, 'Webhook timestamp expired');
      }

      if (hoursDiff < -1) {
        logger.warn('Webhook timestamp from future', {
          paidAt: paidAt.toISOString(),
          hoursDiff
        });
        throw new AppError(400, 'Invalid webhook timestamp');
      }
    }
  }

  private async processWebhookEvent(payload: WebhookPayload, ipAddress: string, idempotencyHash: string) {
    const { event, data } = payload;

    switch (event) {
      case 'charge.success':
        return await this.handleSuccessfulPayment(data, ipAddress, idempotencyHash);

      case 'charge.failed':
        return await this.handleFailedPayment(data, ipAddress);

      case 'charge.disputed':
        return await this.handleDisputedPayment(data, ipAddress);

      case 'transfer.success':
        return await this.handleTransferSuccess(data, ipAddress);

      case 'transfer.failed':
        return await this.handleTransferFailed(data, ipAddress);

      case 'refund.processed':
        return await this.handleRefundProcessed(data, ipAddress);

      default:
        logger.info(`Unhandled webhook event: ${event}`, { data });
        return { message: 'Event acknowledged but not processed', event };
    }
  }

  private async handleSuccessfulPayment(data: any, ipAddress: string, idempotencyHash: string) {
    const reference = data.reference;

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { 
          OR: [
            { orderNumber: reference },
            { paymentReference: reference }
          ]
        },
        include: {
          customer: true,
          tickets: true
        }
      });

      if (!order) {
        logger.warn('Order not found for webhook', { reference, ipAddress });
        throw new AppError(404, 'Order not found');
      }

      if (order.status === OrderStatus.COMPLETED) {
        logger.info('Order already completed', { 
          reference, 
          orderId: order.id,
          ipAddress,
        });
        return { 
          message: 'Order already completed', 
          orderId: order.id,
          alreadyProcessed: true 
        };
      }

      const expectedAmountKobo = this.toKobo(parseFloat(order.amount.toString()));
      const paidAmountKobo = data.amount;

      if (!this.isAmountValid(expectedAmountKobo, paidAmountKobo)) {
        const shortage = this.fromKobo(expectedAmountKobo - paidAmountKobo);

        await this.logPaymentMismatch(
          order, 
          expectedAmountKobo, 
          paidAmountKobo,
          'underpayment',
          ipAddress
        );

        logger.error('Payment amount insufficient', {
          orderId: order.id,
          expected: this.fromKobo(expectedAmountKobo),
          received: this.fromKobo(paidAmountKobo),
          shortage,
          ipAddress,
        });

        throw new AppError(
          400, 
          'Payment verification failed'
        );
      }

      const paymentMetadata: any = {
        channel: data.authorization?.channel,
        card_type: data.authorization?.card_type,
        last4: data.authorization?.last4,
        bank: data.authorization?.bank,
        gateway_response: data.gateway_response,
        ip_address: data.ip_address
      };

      if (paidAmountKobo > expectedAmountKobo) {
        const excess = this.fromKobo(paidAmountKobo - expectedAmountKobo);
        const variancePercent = ((paidAmountKobo - expectedAmountKobo) / expectedAmountKobo * 100).toFixed(2);

        logger.warn('Customer overpaid - flagged for manual review', {
          orderId: order.id,
          expected: this.fromKobo(expectedAmountKobo),
          received: this.fromKobo(paidAmountKobo),
          excess,
          variancePercent,
          ipAddress,
        });

        await this.logPaymentMismatch(order, expectedAmountKobo, paidAmountKobo, 'overpayment', ipAddress);

        paymentMetadata.overpaymentDetected = true;
        paymentMetadata.expectedAmount = this.fromKobo(expectedAmountKobo);
        paymentMetadata.receivedAmount = this.fromKobo(paidAmountKobo);
        paymentMetadata.excessAmount = excess;
        paymentMetadata.requiresManualReview = true;
        paymentMetadata.flaggedAt = new Date().toISOString();
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.COMPLETED,
          paymentStatus: 'paid',
          paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
          paidAmount: this.fromKobo(paidAmountKobo),
          paymentMethod: data.authorization?.channel,
          paymentMetadata: paymentMetadata as any
        }
      });

      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: parseFloat(order.amount.toString()) },
          lastPurchase: new Date()
        }
      });

      const activatedTickets = await Promise.all(
        order.tickets.map(async (ticket) => {
          if (ticket.status === TicketStatus.PENDING) {
            const qrCodePath = await generateQRCode(ticket.ticketCode, {
              orderId: order.id,
              customerId: order.customerId,
              gameSession: ticket.gameSession,
              validUntil: ticket.validUntil,
            });

            return await tx.ticket.update({
              where: { id: ticket.id },
              data: {
                status: TicketStatus.ACTIVE,
                qrCodePath
              }
            });
          }
          return ticket;
        })
      );

      await this.sendPaymentConfirmationEmail(order, data);

      await immutableAuditService.createLog({
        userId: order.customerId,
        action: 'PAYMENT_SUCCESS',
        entity: 'ORDER',
        entityId: order.id,
        ipAddress,
        changes: {
          from: { status: order.status },
          to: { status: OrderStatus.COMPLETED }
        },
        metadata: {
          reference: data.reference,
          amount: this.fromKobo(paidAmountKobo),
          channel: data.authorization?.channel,
          ticketsActivated: activatedTickets.length,
          idempotencyHash,
          overpaymentFlagged: paymentMetadata.overpaymentDetected || false,
        }
      });

      logger.info('Payment processed successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        reference: data.reference,
        amount: this.fromKobo(paidAmountKobo),
        ticketsActivated: activatedTickets.length,
        customerEmail: order.customer.email,
        ipAddress,
      });

      return {
        message: 'Payment processed successfully',
        orderId: order.id,
        reference,
        ticketsActivated: activatedTickets.length
      };
    }, {
      isolationLevel: 'Serializable',
      timeout: 15000
    });
  }

  private async handleFailedPayment(data: any, ipAddress: string) {
    const reference = data.reference;

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderNumber: reference },
          { paymentReference: reference }
        ]
      },
      include: { customer: true }
    });

    if (!order) {
      logger.warn('Order not found for failed payment', { reference, ipAddress });
      return { message: 'Order not found', reference };
    }

    await this.sendPaymentFailureEmail(order, data);

    await immutableAuditService.createLog({
      userId: order.customerId,
      action: 'PAYMENT_FAILED',
      entity: 'ORDER',
      entityId: order.id,
      ipAddress,
      metadata: {
        reference,
        reason: data.gateway_response,
        amount: this.fromKobo(data.amount)
      },
      success: false,
    });

    logger.warn('Payment failed', {
      orderId: order.id,
      reference,
      reason: data.gateway_response,
      ipAddress,
    });

    return {
      message: 'Payment failure recorded',
      orderId: order.id,
      reference
    };
  }

  private async handleDisputedPayment(data: any, ipAddress: string) {
    const reference = data.reference;

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [
            { orderNumber: reference },
            { paymentReference: reference }
          ]
        },
        include: { 
          customer: true,
          tickets: true 
        }
      });

      if (!order) {
        logger.warn('Order not found for disputed payment', { reference, ipAddress });
        return { message: 'Order not found', reference };
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: 'disputed',
          paymentMetadata: {
            disputed: true,
            disputeReason: data.reason,
            disputedAt: new Date().toISOString()
          } as any
        }
      });

      await tx.ticket.updateMany({
        where: { orderId: order.id },
        data: { status: TicketStatus.CANCELLED }
      });

      await emailQueue.add('payment-dispute-alert', {
        to: process.env.ADMIN_EMAIL || 'admin@jgpnr.com',
        subject: '🚨 Payment Dispute Alert',
        orderNumber: order.orderNumber,
        reference,
        amount: order.amount,
        customerEmail: order.customer.email,
        reason: data.reason,
      });

      await immutableAuditService.createLog({
        userId: order.customerId,
        action: 'PAYMENT_DISPUTED',
        entity: 'ORDER',
        entityId: order.id,
        ipAddress,
        metadata: {
          reference,
          reason: data.reason,
          amount: order.amount
        },
        success: false,
      });

      logger.error('Payment disputed (chargeback)', {
        orderId: order.id,
        reference,
        reason: data.reason,
        ipAddress,
      });

      return {
        message: 'Payment dispute recorded',
        orderId: order.id,
        reference,
        action: 'tickets_cancelled'
      };
    });
  }

  private async handleTransferSuccess(data: any, ipAddress: string) {
    logger.info('Transfer success webhook received', { 
      reference: data.reference,
      ipAddress,
    });

    await immutableAuditService.createLog({
      action: 'TRANSFER_SUCCESS',
      entity: 'PAYMENT',
      entityId: data.reference,
      ipAddress,
      metadata: { amount: this.fromKobo(data.amount) }
    });

    return { message: 'Transfer success recorded' };
  }

  private async handleTransferFailed(data: any, ipAddress: string) {
    logger.warn('Transfer failed webhook received', { 
      reference: data.reference,
      ipAddress,
    });

    await immutableAuditService.createLog({
      action: 'TRANSFER_FAILED',
      entity: 'PAYMENT',
      entityId: data.reference,
      ipAddress,
      metadata: { reason: data.gateway_response },
      success: false,
    });

    return { message: 'Transfer failure recorded' };
  }

  private async handleRefundProcessed(data: any, ipAddress: string) {
    const reference = data.reference;

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          OR: [
            { orderNumber: reference },
            { paymentReference: reference }
          ]
        },
        include: { customer: true }
      });

      if (!order) {
        logger.warn('Order not found for refund', { reference, ipAddress });
        return { message: 'Order not found', reference };
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: 'refunded',
          paymentMetadata: {
            refunded: true,
            refundedAt: new Date().toISOString(),
            refundAmount: this.fromKobo(data.amount)
          } as any
        }
      });

      await emailQueue.add('refund-confirmation', {
        to: order.customer.email,
        orderNumber: order.orderNumber,
        amount: this.fromKobo(data.amount),
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
      });

      await immutableAuditService.createLog({
        userId: order.customerId,
        action: 'REFUND_PROCESSED',
        entity: 'ORDER',
        entityId: order.id,
        ipAddress,
        metadata: {
          reference,
          amount: this.fromKobo(data.amount)
        }
      });

      return {
        message: 'Refund processed',
        orderId: order.id,
        reference
      };
    });
  }
 
  private async logPaymentMismatch(
    order: any,
    expectedAmountKobo: number,
    paidAmountKobo: number,
    type: 'underpayment' | 'overpayment',
    ipAddress: string
  ): Promise<void> {
    const expected = this.fromKobo(expectedAmountKobo);
    const paid = this.fromKobo(paidAmountKobo);
    const variance = Math.abs(paid - expected);
    const variancePercent = ((variance / expected) * 100).toFixed(2);

    logger.error(`Payment amount mismatch detected: ${type}`, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      expectedAmount: expected,
      paidAmount: paid,
      variance,
      variancePercent: `${variancePercent}%`,
      customerEmail: order.customer.email,
      customerId: order.customerId,
      type,
      ipAddress,
    });

    await emailQueue.add('payment-mismatch-alert', {
      to: process.env.ADMIN_EMAIL || 'admin@jgpnr.com',
      subject: `🚨 Payment Mismatch: ${type.toUpperCase()}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      expectedAmount: expected,
      paidAmount: paid,
      variance,
      variancePercent,
      customerEmail: order.customer.email,
      type,
    });

    await immutableAuditService.createLog({
      userId: order.customerId,
      action: 'PAYMENT_AMOUNT_MISMATCH',
      entity: 'PAYMENT',
      entityId: order.id,
      ipAddress,
      metadata: {
        type,
        orderNumber: order.orderNumber,
        expectedAmount: expected,
        paidAmount: paid,
        variance,
        variancePercent,
      },
      success: false,
    });
  }

  private async sendPaymentConfirmationEmail(order: any, paymentData: any) {
    try {
      await emailQueue.add('payment-confirmation', {
        orderId: order.id,
        customerEmail: order.customer.email,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        orderNumber: order.orderNumber,
        amount: this.fromKobo(paymentData.amount),
        ticketCount: order.tickets.length,
        paymentMethod: paymentData.authorization?.channel,
        paidAt: paymentData.paid_at,
      });
    } catch (error) {
      logger.error('Failed to send payment confirmation email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: order.id,
      });
    }
  }

  private async sendPaymentFailureEmail(order: any, paymentData: any) {
    try {
      await emailQueue.add('payment-failure', {
        orderId: order.id,
        customerEmail: order.customer.email,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        orderNumber: order.orderNumber,
        amount: this.fromKobo(paymentData.amount),
        reason: paymentData.gateway_response,
      });
    } catch (error) {
      logger.error('Failed to send payment failure email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: order.id,
      });
    }
  }

  private async logWebhookFailure(payload: any, ipAddress: string, reason?: string) {
    try {
      await immutableAuditService.createLog({
        action: 'WEBHOOK_REJECTED',
        entity: 'PAYMENT',
        entityId: payload?.data?.reference || 'UNKNOWN',
        ipAddress,
        metadata: {
          event: payload?.event,
          reason,
          payloadPreview: JSON.stringify(payload).substring(0, 500)
        },
        success: false,
      });
    } catch (error) {
      logger.error('Failed to log webhook failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async initializePayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new AppError(400, 'Order already paid');
    }

    if (!this.validateEmail(order.customer.email)) {
      logger.error('Invalid customer email', {
        orderId,
        email: order.customer.email,
      });
      throw new AppError(400, 'Invalid customer email');
    }

    const amountKobo = this.toKobo(parseFloat(order.amount.toString()));

    try {
      const sanitizedMetadata = this.sanitizeMetadata({
        orderId: order.id,
        customerId: order.customerId,
        ticketCount: order.quantity
      });

      const response = await axios.post<PaystackResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email: order.customer.email,
          amount: amountKobo,
          reference: order.orderNumber,
          callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
          metadata: sanitizedMetadata
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.status) {
        logger.error('Payment initialization failed', {
          orderId,
          message: response.data.message,
        });
        throw new AppError(500, 'Payment initialization failed');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentReference: response.data.data.reference,
          paymentStatus: 'pending'
        }
      });

      await immutableAuditService.createLog({
        userId: order.customerId,
        action: 'PAYMENT_INITIALIZED',
        entity: 'ORDER',
        entityId: order.id,
        metadata: {
          reference: response.data.data.reference,
          amount: this.fromKobo(amountKobo),
        }
      });

      logger.info('Payment initialized', {
        orderId,
        reference: response.data.data.reference,
        amount: this.fromKobo(amountKobo),
      });

      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference
      };
    } catch (error) {
      logger.error('Payment initialization error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId,
      });
      throw new AppError(500, this.sanitizeErrorForClient(error));
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await axios.get<PaystackResponse>(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`
          }
        }
      );

      if (!response.data.status) {
        logger.error('Payment verification failed', {
          reference,
          message: response.data.message,
        });
        throw new AppError(500, 'Payment verification failed');
      }

      const data = response.data.data;

      await immutableAuditService.createLog({
        action: 'PAYMENT_VERIFIED',
        entity: 'PAYMENT',
        entityId: reference,
        metadata: {
          status: data.status,
          amount: this.fromKobo(data.amount),
          channel: data.authorization?.channel,
        }
      });

      return {
        success: data.status === 'success',
        status: data.status,
        reference: data.reference,
        amount: this.fromKobo(data.amount),
        paidAt: data.paid_at,
        channel: data.authorization?.channel,
        message: data.gateway_response
      };
    } catch (error) {
      logger.error('Payment verification error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reference,
      });
      throw new AppError(500, this.sanitizeErrorForClient(error));
    }
  }

  async initiateRefund(orderId: string, amount?: number, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer: true,
        tickets: true,
        refunds: true
      }
    });

    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new AppError(400, 'Refund not available for this order');
    }

    if (!order.paymentReference) {
      throw new AppError(400, 'No payment reference found for this order');
    }

    const totalRefunded = order.refunds
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);

    const orderAmount = parseFloat(order.amount.toString());
    
    if (totalRefunded >= orderAmount) {
      throw new AppError(400, 'Order already fully refunded');
    }

    const refundAmount = amount || (orderAmount - totalRefunded);
    
    if (refundAmount > (orderAmount - totalRefunded)) {
      throw new AppError(400, 'Refund amount exceeds refundable balance');
    }

    const amountInKobo = this.toKobo(refundAmount);

    try {
      const response = await axios.post<PaystackResponse>(
        `${this.paystackBaseUrl}/refund`,
        {
          transaction: order.paymentReference,
          amount: amountInKobo,
          currency: 'NGN',
          customer_note: reason || 'Refund processed',
          merchant_note: `Order ${order.orderNumber} refund`
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.status) {
        logger.error('Refund initiation failed', {
          orderId,
          reference: order.paymentReference,
          message: response.data.message,
        });
        throw new AppError(500, 'Refund initiation failed');
      }

      await immutableAuditService.createLog({
        userId: order.customerId,
        action: 'REFUND_INITIATED',
        entity: 'ORDER',
        entityId: orderId,
        metadata: {
          reference: order.paymentReference,
          amount: refundAmount,
          reason: reason || 'Not specified',
          paystackRefundId: response.data.data.id,
        }
      });

      logger.info('Refund initiated successfully', {
        orderId,
        reference: order.paymentReference,
        amount: refundAmount,
        paystackRefundId: response.data.data.id,
      });

      return {
        success: true,
        message: 'Refund initiated successfully',
        refundId: response.data.data.id,
        amount: refundAmount,
        status: response.data.data.status
      };

    } catch (error: any) {
      logger.error('Paystack refund error', {
        orderId,
        error: error.response?.data || error.message
      });

      throw new AppError(
        500, 
        this.sanitizeErrorForClient(error)
      );
    }
  }
}

export const paymentService = new PaymentService();