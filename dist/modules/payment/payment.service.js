"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
// src/modules/payment/payment.service.ts
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
const database_1 = __importDefault(require("../../config/database"));
class PaymentService {
    paystackSecretKey = process.env.PAYSTACK_SECRET_KEY || '';
    baseURL = 'https://api.paystack.co';
    /**
     * Initialize payment
     */
    async initializePayment(orderId) {
        const order = await database_1.default.order.findUnique({
            where: { id: orderId },
            include: { customer: true },
        });
        if (!order) {
            throw new errorHandler_1.AppError(404, 'Order not found');
        }
        if (order.status === 'COMPLETED') {
            throw new errorHandler_1.AppError(400, 'Order already paid');
        }
        // Convert amount to kobo (Paystack requires amount in smallest currency unit)
        const amountInKobo = Number(order.amount) * 100;
        const payload = {
            email: order.customer.email,
            amount: amountInKobo,
            reference: order.orderNumber,
            callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
            metadata: {
                orderId: order.id,
                customerId: order.customerId,
                customerName: `${order.customer.firstName} ${order.customer.lastName}`,
            },
        };
        try {
            const response = await fetch(`${this.baseURL}/transaction/initialize`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.paystackSecretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!data.status) {
                throw new Error(data.message || 'Payment initialization failed');
            }
            logger_1.logger.info(`Payment initialized for order: ${order.orderNumber}`);
            return {
                authorizationUrl: data.data.authorization_url,
                accessCode: data.data.access_code,
                reference: data.data.reference,
            };
        }
        catch (error) {
            logger_1.logger.error('Paystack initialization error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to initialize payment');
        }
    }
    /**
     * Verify payment
     */
    async verifyPayment(reference) {
        try {
            const response = await fetch(`${this.baseURL}/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.paystackSecretKey}`,
                },
            });
            const data = await response.json();
            if (!data.status) {
                throw new Error(data.message || 'Payment verification failed');
            }
            const paymentData = data.data;
            logger_1.logger.info(`Payment verified: ${reference}`);
            return {
                status: paymentData.status,
                reference: paymentData.reference,
                amount: paymentData.amount / 100, // Convert from kobo
                paidAt: paymentData.paid_at,
                channel: paymentData.channel,
                metadata: paymentData.metadata,
            };
        }
        catch (error) {
            logger_1.logger.error('Paystack verification error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to verify payment');
        }
    }
    /**
     * Handle webhook event
     */
    async handleWebhook(payload, signature) {
        // Verify webhook signature
        const hash = crypto_1.default
            .createHmac('sha512', this.paystackSecretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        if (hash !== signature) {
            throw new errorHandler_1.AppError(401, 'Invalid webhook signature');
        }
        const event = payload.event;
        const data = payload.data;
        logger_1.logger.info(`Webhook received: ${event}`);
        switch (event) {
            case 'charge.success':
                await this.handleSuccessfulPayment(data);
                break;
            case 'charge.failed':
                await this.handleFailedPayment(data);
                break;
            default:
                logger_1.logger.info(`Unhandled webhook event: ${event}`);
        }
        return { message: 'Webhook processed' };
    }
    /**
     * Handle successful payment
     */
    async handleSuccessfulPayment(data) {
        const orderId = data.metadata?.orderId;
        if (!orderId) {
            logger_1.logger.error('Order ID not found in webhook metadata');
            return;
        }
        const order = await database_1.default.order.findUnique({
            where: { id: orderId },
            include: { customer: true },
        });
        if (!order) {
            logger_1.logger.error(`Order not found: ${orderId}`);
            return;
        }
        if (order.status === 'COMPLETED') {
            logger_1.logger.info(`Order already completed: ${order.orderNumber}`);
            return;
        }
        // Update order status
        await database_1.default.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'COMPLETED' },
            });
            // Update customer stats
            await tx.customer.update({
                where: { id: order.customerId },
                data: {
                    totalOrders: { increment: 1 },
                    totalSpent: { increment: order.amount },
                    lastPurchase: new Date(),
                },
            });
            // Create notification
            await tx.notification.create({
                data: {
                    userId: order.customerId,
                    title: 'Payment Successful',
                    message: `Payment of ₦${order.amount} for order ${order.orderNumber} was successful`,
                    type: 'SUCCESS',
                },
            });
        });
        logger_1.logger.info(`Payment processed for order: ${order.orderNumber}`);
    }
    /**
     * Handle failed payment
     */
    async handleFailedPayment(data) {
        const orderId = data.metadata?.orderId;
        if (!orderId)
            return;
        const order = await database_1.default.order.findUnique({
            where: { id: orderId },
        });
        if (!order)
            return;
        // Create notification
        await database_1.default.notification.create({
            data: {
                userId: order.customerId,
                title: 'Payment Failed',
                message: `Payment for order ${order.orderNumber} failed. Please try again.`,
                type: 'ERROR',
            },
        });
        logger_1.logger.warn(`Payment failed for order: ${order.orderNumber}`);
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment.service.js.map