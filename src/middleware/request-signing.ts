// src/middleware/request-signing.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { RateLimiterMemory } from 'rate-limiter-flexible';

class NonceStore {
  private store: Map<string, number> = new Map();
  private readonly TTL = 6 * 60 * 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  async has(nonce: string): Promise<boolean> {
    return this.store.has(nonce);
  }

  async add(nonce: string): Promise<void> {
    this.store.set(nonce, Date.now());
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [nonce, timestamp] of this.store.entries()) {
      if (now - timestamp > this.TTL) {
        this.store.delete(nonce);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const nonceStore = new NonceStore();

const signatureFailureLimiter = new RateLimiterMemory({
  points: 5,
  duration: 300,
  blockDuration: 900,
});

interface SigningConfig {
  maxAge?: number;
  includeQuery?: boolean;
  requiredHeaders?: string[];
}

const DEFAULT_CONFIG: SigningConfig = {
  maxAge: 5 * 60 * 1000,
  includeQuery: true,
  requiredHeaders: [],
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    
    if (bufA.length !== bufB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufA, bufB);
  } catch (error) {
    return false;
  }
}

function isValidNonce(nonce: string): boolean {
  return /^[a-f0-9]{32,64}$/i.test(nonce);
}

function isValidSignature(signature: string): boolean {
  return /^[a-f0-9]{64}$/i.test(signature);
}

function isValidTimestamp(timestamp: string): boolean {
  const parsed = parseInt(timestamp, 10);
  
  if (isNaN(parsed)) {
    return false;
  }
  
  const minTimestamp = 1577836800000;
  const maxTimestamp = 4102444800000;
  
  return parsed >= minTimestamp && parsed <= maxTimestamp;
}

function createCanonicalPayload(
  method: string,
  path: string,
  query: string,
  body: any,
  timestamp: string,
  nonce: string,
  headers: Record<string, string> = {}
): string {
  const parts = [
    `METHOD:${method}`,
    `PATH:${path}`,
    `QUERY:${query}`,
    `BODY:${JSON.stringify(body || {})}`,
    `TIMESTAMP:${timestamp}`,
    `NONCE:${nonce}`,
  ];

  const headerKeys = Object.keys(headers).sort();
  for (const key of headerKeys) {
    parts.push(`HEADER:${key}:${headers[key]}`);
  }

  return parts.join('|');
}

export const validateRequestSignature = (config: SigningConfig = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const clientIP = req.ip || 'unknown';

    try {
      const signingSecret = process.env.REQUEST_SIGNING_SECRET;
      if (!signingSecret || signingSecret.length < 32) {
        logger.error('REQUEST_SIGNING_SECRET not configured or too short');
        return res.status(500).json({ 
          error: 'Server configuration error' 
        });
      }

      const signature = req.headers['x-request-signature'] as string;
      const timestamp = req.headers['x-request-timestamp'] as string;
      const nonce = req.headers['x-request-nonce'] as string;
      const algorithm = req.headers['x-signature-algorithm'] as string;

      if (!signature || !timestamp || !nonce) {
        logger.warn('Missing request signature headers', {
          path: req.path,
          method: req.method,
          ip: clientIP,
          hasSignature: !!signature,
          hasTimestamp: !!timestamp,
          hasNonce: !!nonce
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      if (algorithm && algorithm !== 'hmac-sha256') {
        logger.warn('Invalid signature algorithm', {
          algorithm,
          ip: clientIP
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      if (!isValidTimestamp(timestamp)) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        logger.warn('Invalid timestamp format', {
          timestamp,
          ip: clientIP
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      const requestTime = parseInt(timestamp, 10);
      const now = Date.now();
      const age = Math.abs(now - requestTime);

      if (age > finalConfig.maxAge!) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        logger.warn('Request signature expired or from future', {
          path: req.path,
          method: req.method,
          ip: clientIP,
          requestTime,
          now,
          age,
          maxAge: finalConfig.maxAge
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      if (!isValidNonce(nonce)) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        logger.warn('Invalid nonce format', {
          nonce,
          ip: clientIP
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      if (!isValidSignature(signature)) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        logger.warn('Invalid signature format', {
          ip: clientIP
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      if (await nonceStore.has(nonce)) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        logger.error('Nonce replay attack detected', {
          path: req.path,
          method: req.method,
          ip: clientIP,
          nonce
        });
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      const queryString = finalConfig.includeQuery 
        ? new URLSearchParams(req.query as any).toString()
        : '';

      const additionalHeaders: Record<string, string> = {};
      if (finalConfig.requiredHeaders) {
        for (const header of finalConfig.requiredHeaders) {
          const value = req.headers[header.toLowerCase()];
          if (value) {
            additionalHeaders[header] = Array.isArray(value) ? value[0] : value;
          }
        }
      }

      const payload = createCanonicalPayload(
        req.method,
        req.path,
        queryString,
        req.body,
        timestamp,
        nonce,
        additionalHeaders
      );

      const expectedSignature = crypto
        .createHmac('sha256', signingSecret)
        .update(payload)
        .digest('hex');

      if (!timingSafeEqual(signature, expectedSignature)) {
        await signatureFailureLimiter.consume(clientIP).catch(() => {});
        
        logger.error('Request signature validation failed', {
          path: req.path,
          method: req.method,
          ip: clientIP,
          userId: (req as any).user?.id
        });

        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      await nonceStore.add(nonce);

      logger.debug('Request signature validated', {
        path: req.path,
        method: req.method,
        ip: clientIP
      });

      next();

    } catch (error: any) {
      await signatureFailureLimiter.consume(clientIP).catch(() => {});

      logger.error('Request signature validation error', {
        error: error.message,
        path: req.path,
        method: req.method,
        ip: clientIP,
        stack: error.stack
      });

      return res.status(500).json({ 
        error: 'Authentication error' 
      });
    }
  };
};

export function generateRequestSignature(
  method: string,
  path: string,
  query: Record<string, any>,
  body: any,
  secret: string,
  includeQuery: boolean = true
): {
  signature: string;
  timestamp: string;
  nonce: string;
} {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(32).toString('hex');
  
  const queryString = includeQuery 
    ? new URLSearchParams(query).toString()
    : '';

  const payload = createCanonicalPayload(
    method,
    path,
    queryString,
    body,
    timestamp,
    nonce
  );

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return { signature, timestamp, nonce };
}

export function destroyNonceStore(): void {
  nonceStore.destroy();
}

export { NonceStore, timingSafeEqual, isValidNonce, isValidSignature, isValidTimestamp, createCanonicalPayload };