"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
const auditLog = (action, entity) => {
    return async (req, res, next) => {
        // Store original send
        const originalSend = res.send;
        res.send = function (data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const entityId = req.params.id || req.body?.id || null;
                database_1.default.auditLog
                    .create({
                    data: {
                        userId: req.user.userId,
                        action,
                        entity,
                        entityId,
                        details: {
                            method: req.method,
                            path: req.path,
                            body: sanitizeAuditData(req.body),
                            query: req.query,
                        },
                        ipAddress: req.ip || req.socket.remoteAddress || null,
                        userAgent: req.get('user-agent') || null,
                    },
                })
                    .catch((err) => {
                    logger_1.logger.error('Audit log failed:', err);
                });
            }
            return originalSend.call(this, data);
        };
        next();
    };
};
exports.auditLog = auditLog;
// Remove sensitive data from audit logs
const sanitizeAuditData = (data) => {
    if (!data || typeof data !== 'object')
        return data;
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }
    return sanitized;
};
//# sourceMappingURL=audit.js.map