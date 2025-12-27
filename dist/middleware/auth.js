"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStaff = exports.requireAdmin = exports.requireSuperAdmin = exports.requireRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const authenticateJWT = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        logger_1.logger.error('JWT verification error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authenticateJWT = authenticateJWT;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: roles,
                current: req.user.role
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireSuperAdmin = (0, exports.requireRole)(client_1.UserRole.SUPER_ADMIN);
exports.requireAdmin = (0, exports.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN);
exports.requireStaff = (0, exports.requireRole)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.STAFF);
//# sourceMappingURL=auth.js.map