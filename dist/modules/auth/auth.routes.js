"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/auth/auth.routes.ts
const express_1 = require("express");
const authController = __importStar(require("./auth.controller"));
const twoFactorController = __importStar(require("./twoFactor.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rateLimit_1 = require("../../middleware/rateLimit");
const audit_1 = require("../../middleware/audit");
const auth_schema_1 = require("./auth.schema");
const router = (0, express_1.Router)();
// Public routes
router.post('/login', rateLimit_1.authLimiter, (0, validate_1.validate)(auth_schema_1.loginSchema), authController.login);
router.post('/refresh', (0, validate_1.validate)(auth_schema_1.refreshTokenSchema), authController.refreshToken);
// Protected routes
router.use(auth_1.authenticateJWT);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
// 2FA routes
router.post('/2fa/generate', twoFactorController.generateSecret);
router.post('/2fa/enable', twoFactorController.enableTwoFactor);
router.post('/2fa/verify', twoFactorController.verifyToken);
router.post('/2fa/disable', twoFactorController.disableTwoFactor);
router.post('/2fa/regenerate-codes', twoFactorController.regenerateBackupCodes);
// User management (Super Admin only)
router.get('/users', auth_1.requireSuperAdmin, authController.listUsers);
router.get('/users/:id', auth_1.requireSuperAdmin, authController.getUser);
router.post('/users', auth_1.requireSuperAdmin, (0, validate_1.validate)(auth_schema_1.createUserSchema), (0, audit_1.auditLog)('CREATE_USER', 'USER'), authController.createUser);
router.patch('/users/:id', auth_1.requireSuperAdmin, (0, validate_1.validate)(auth_schema_1.updateUserSchema), (0, audit_1.auditLog)('UPDATE_USER', 'USER'), authController.updateUser);
router.patch('/users/:id/password', auth_1.authenticateJWT, (0, validate_1.validate)(auth_schema_1.changePasswordSchema), (0, audit_1.auditLog)('CHANGE_PASSWORD', 'USER'), authController.changePassword);
router.delete('/users/:id', auth_1.requireSuperAdmin, (0, audit_1.auditLog)('DEACTIVATE_USER', 'USER'), authController.deactivateUser);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map