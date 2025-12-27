"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    message;
    isOperational;
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
    logger_1.logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.userId,
    });
    // AppError (operational errors)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
        });
    }
    // Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                error: 'A record with this information already exists',
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                error: 'Record not found',
            });
        }
        return res.status(400).json({
            error: 'Database operation failed',
        });
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return res.status(400).json({
            error: 'Invalid data provided',
        });
    }
    // JWT errors (handled in auth middleware)
    // Default to 500 server error
    return res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
    });
};
exports.notFoundHandler = notFoundHandler;
// Async wrapper to catch errors in async route handlers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map