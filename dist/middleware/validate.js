"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = exports.sanitizeObject = exports.sanitizeString = exports.validate = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                logger_1.logger.warn('Validation error:', { errors, body: req.body });
                res.status(400).json({ error: 'Validation failed', details: errors });
                return;
            }
            logger_1.logger.error('Unexpected validation error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
exports.validate = validate;
// Sanitize string inputs
const sanitizeString = (str) => {
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove inline event handlers
};
exports.sanitizeString = sanitizeString;
// Sanitize object recursively
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return (0, exports.sanitizeString)(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(exports.sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = (0, exports.sanitizeObject)(value);
        }
        return sanitized;
    }
    return obj;
};
exports.sanitizeObject = sanitizeObject;
const sanitizeInput = (req, _res, next) => {
    req.body = (0, exports.sanitizeObject)(req.body);
    req.query = (0, exports.sanitizeObject)(req.query);
    next();
};
exports.sanitizeInput = sanitizeInput;
//# sourceMappingURL=validate.js.map