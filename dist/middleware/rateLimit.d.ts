import { RateLimitRequestHandler } from 'express-rate-limit';
declare module 'express' {
    interface Request {
        rateLimit?: {
            limit: number;
            current: number;
            remaining: number;
            resetTime: Date;
        };
    }
}
export declare const apiLimiter: RateLimitRequestHandler;
export declare const authLimiter: RateLimitRequestHandler;
export declare const emailLimiter: RateLimitRequestHandler;
export declare const orderLimiter: RateLimitRequestHandler;
export declare const exportLimiter: RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.d.ts.map