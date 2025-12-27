"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
// src/modules/settings/settings.service.ts
const database_1 = __importDefault(require("../../config/database"));
const logger_1 = require("../../utils/logger");
class SettingsService {
    async getSystemSettings() {
        let settings = await database_1.default.systemSettings.findUnique({
            where: { id: 1 },
        });
        if (!settings) {
            settings = await database_1.default.systemSettings.create({
                data: {
                    id: 1,
                    businessName: 'JGPNR Paintball',
                    businessEmail: 'info@jgpnr.com',
                    businessPhone: '+234-XXX-XXX-XXXX',
                    smtpHost: process.env.SMTP_HOST || '',
                    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
                    smtpUser: process.env.SMTP_USER || '',
                    smtpPassword: process.env.SMTP_PASSWORD || '',
                    senderName: process.env.SENDER_NAME || 'JGPNR',
                    senderEmail: process.env.SENDER_EMAIL || 'noreply@jgpnr.com',
                },
            });
        }
        return settings;
    }
    async updateSystemSettings(data) {
        const settings = await database_1.default.systemSettings.upsert({
            where: { id: 1 },
            update: data,
            create: {
                id: 1,
                businessName: data.businessName || 'JGPNR Paintball',
                businessEmail: data.businessEmail || 'info@jgpnr.com',
                businessPhone: data.businessPhone || '+234-XXX',
                smtpHost: data.smtpHost || process.env.SMTP_HOST || '',
                smtpPort: data.smtpPort || parseInt(process.env.SMTP_PORT || '587'),
                smtpUser: data.smtpUser || process.env.SMTP_USER || '',
                smtpPassword: data.smtpPassword || process.env.SMTP_PASSWORD || '',
                senderName: data.senderName || 'JGPNR',
                senderEmail: data.senderEmail || 'noreply@jgpnr.com',
            },
        });
        logger_1.logger.info('System settings updated');
        return settings;
    }
}
exports.SettingsService = SettingsService;
//# sourceMappingURL=settings.service.js.map