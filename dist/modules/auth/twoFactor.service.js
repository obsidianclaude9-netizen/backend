"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
// src/modules/auth/twoFactor.service.ts
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
class TwoFactorService {
    /**
     * Generate 2FA secret for user
     */
    async generateSecret(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, twoFactorEnabled: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        if (user.twoFactorEnabled) {
            throw new errorHandler_1.AppError(400, '2FA already enabled');
        }
        // Generate secret
        const secret = speakeasy_1.default.generateSecret({
            name: `JGPNR (${user.email})`,
            issuer: 'JGPNR Paintball',
            length: 32,
        });
        // Generate QR code
        const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
        // Store secret temporarily (unverified)
        await database_1.default.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret.base32 },
        });
        logger_1.logger.info(`2FA secret generated for user: ${user.email}`);
        return {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntry: secret.base32,
        };
    }
    /**
     * Enable 2FA after verification
     */
    async enableTwoFactor(userId, token) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, twoFactorSecret: true, twoFactorEnabled: true },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        if (user.twoFactorEnabled) {
            throw new errorHandler_1.AppError(400, '2FA already enabled');
        }
        if (!user.twoFactorSecret) {
            throw new errorHandler_1.AppError(400, 'No 2FA secret found. Generate one first.');
        }
        // Verify token
        const isValid = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!isValid) {
            throw new errorHandler_1.AppError(400, 'Invalid verification code');
        }
        // Generate backup codes
        const backupCodes = this.generateBackupCodes();
        // Enable 2FA
        await database_1.default.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorBackupCodes: JSON.stringify(backupCodes),
            },
        });
        logger_1.logger.info(`2FA enabled for user: ${user.email}`);
        return {
            message: '2FA enabled successfully',
            backupCodes,
        };
    }
    /**
     * Verify 2FA token
     */
    async verifyToken(userId, token, isBackupCode = false) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                twoFactorSecret: true,
                twoFactorEnabled: true,
                twoFactorBackupCodes: true,
            },
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new errorHandler_1.AppError(400, '2FA not enabled');
        }
        // Check backup code first
        if (isBackupCode) {
            const backupCodes = JSON.parse(user.twoFactorBackupCodes || '[]');
            const codeIndex = backupCodes.indexOf(token);
            if (codeIndex === -1) {
                throw new errorHandler_1.AppError(400, 'Invalid backup code');
            }
            // Remove used backup code
            backupCodes.splice(codeIndex, 1);
            await database_1.default.user.update({
                where: { id: userId },
                data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
            });
            logger_1.logger.info(`Backup code used for user: ${user.email}`);
            return true;
        }
        // Verify TOTP token
        const isValid = speakeasy_1.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after
        });
        if (!isValid) {
            throw new errorHandler_1.AppError(400, 'Invalid 2FA code');
        }
        return true;
    }
    /**
     * Disable 2FA
     */
    async disableTwoFactor(userId, password) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        // Verify password
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError(401, 'Invalid password');
        }
        // Disable 2FA
        await database_1.default.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null,
            },
        });
        logger_1.logger.info(`2FA disabled for user: ${user.email}`);
        return { message: '2FA disabled successfully' };
    }
    /**
     * Generate backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId, password) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.twoFactorEnabled) {
            throw new errorHandler_1.AppError(400, '2FA not enabled');
        }
        // Verify password
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError(401, 'Invalid password');
        }
        const backupCodes = this.generateBackupCodes();
        await database_1.default.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
        });
        logger_1.logger.info(`Backup codes regenerated for user: ${user.email}`);
        return { backupCodes };
    }
}
exports.TwoFactorService = TwoFactorService;
//# sourceMappingURL=twoFactor.service.js.map