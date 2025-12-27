"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSettingsService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
class AdvancedSettingsService {
    async getAllSettings() {
        let settings = await database_1.default.systemSettings.findUnique({
            where: { id: 1 },
        });
        if (!settings) {
            settings = await this.createDefaultSettings();
        }
        return {
            ...settings,
            smtpPassword: settings.smtpPassword ? '********' : '',
            paystackSecretKey: settings.paystackSecretKey ? '********' : '',
            flutterwaveSecretKey: settings.flutterwaveSecretKey ? '********' : '',
            flutterwaveEncKey: settings.flutterwaveEncKey ? '********' : '',
        };
    }
    async updateRegionalSettings(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Regional settings updated');
        return settings;
    }
    async updateOperatingHours(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Operating hours updated');
        return settings;
    }
    async updateEmailFooter(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Email footer updated');
        return settings;
    }
    async updatePaymentGateway(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Payment gateway settings updated');
        return settings;
    }
    async updateTransactionSettings(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Transaction settings updated');
        return settings;
    }
    /**
     * Update notification preferences
     */
    async updateNotificationPreferences(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...await this.getDefaultSettings(), ...data },
        });
        logger_1.logger.info('Notification preferences updated');
        return settings;
    }
    /**
     * Get login activities
     */
    async getLoginActivities(userId, limit = 50) {
        const where = {};
        if (userId)
            where.userId = userId;
        const activities = await database_1.default.loginActivity.findMany({
            where,
            take: limit,
            orderBy: { timestamp: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return activities;
    }
    /**
     * Get active sessions
     */
    async getActiveSessions(userId) {
        const where = { expiresAt: { gt: new Date() } };
        if (userId)
            where.userId = userId;
        const sessions = await database_1.default.activeSession.findMany({
            where,
            orderBy: { lastActive: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        return sessions;
    }
    /**
     * Terminate session
     */
    async terminateSession(sessionId, userId) {
        const session = await database_1.default.activeSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new errorHandler_1.AppError(404, 'Session not found');
        }
        await database_1.default.activeSession.delete({
            where: { id: sessionId },
        });
        logger_1.logger.info(`Session terminated: ${sessionId}`);
        return { message: 'Session terminated successfully' };
    }
    /**
     * Terminate all sessions except current
     */
    async terminateAllSessions(userId, exceptSessionId) {
        const where = { userId };
        if (exceptSessionId) {
            where.NOT = { id: exceptSessionId };
        }
        const result = await database_1.default.activeSession.deleteMany({ where });
        logger_1.logger.info(`Terminated ${result.count} sessions for user ${userId}`);
        return { message: `${result.count} sessions terminated` };
    }
    /**
     * Helper: Get default settings
     */
    async getDefaultSettings() {
        return {
            businessName: 'JGPNR Paintball',
            businessEmail: process.env.BUSINESS_EMAIL || 'info@jgpnr.com',
            businessPhone: process.env.BUSINESS_PHONE || '+234-XXX',
            smtpHost: process.env.SMTP_HOST || '',
            smtpPort: parseInt(process.env.SMTP_PORT || '587'),
            smtpUser: process.env.SMTP_USER || '',
            smtpPassword: process.env.SMTP_PASSWORD || '',
            senderName: process.env.SENDER_NAME || 'JGPNR',
            senderEmail: process.env.SENDER_EMAIL || 'noreply@jgpnr.com',
        };
    }
    /**
     * Helper: Create default settings
     */
    async createDefaultSettings() {
        return await database_1.default.systemSettings.create({
            data: {
                id: 1,
                ...await this.getDefaultSettings(),
            },
        });
    }
}
exports.AdvancedSettingsService = AdvancedSettingsService;
//# sourceMappingURL=advancedSettings.service.js.map