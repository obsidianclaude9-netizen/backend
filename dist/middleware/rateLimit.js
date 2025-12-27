"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLimiter = exports.orderLimiter = exports.emailLimiter = exports.authLimiter = exports.apiLimiter = void 0;
// src/middleware/rateLimit.ts
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// General API rate limit
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const resetTime = req.rateLimit?.resetTime || new Date();
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: resetTime,
        });
    },
});
// Strict rate limit for auth endpoints
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
// Email sending rate limit
exports.emailLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: 'Email sending limit reached',
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
});
// Order creation rate limit
exports.orderLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Order creation limit reached',
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
});
// Export rate limit
exports.exportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 1,
    message: 'Please wait before requesting another export',
    keyGenerator: (req) => {
        return req.user?.userId || req.ip || 'unknown';
    },
});
//# sourceMappingURL=rateLimit.js.map