"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// src/modules/email/email.service.ts
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const email_1 = require("../../config/email");
const queue_1 = require("../../config/queue");
const logger_1 = require("../../utils/logger");
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
class EmailService {
    sanitizeHTML(html) {
        return purify.sanitize(html, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'span', 'div'],
            ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
        });
    }
    /**
     * Create email template
     */
    async createTemplate(data) {
        const sanitizedBody = this.sanitizeHTML(data.body);
        const template = await database_1.default.emailTemplate.create({
            data: {
                ...data,
                body: sanitizedBody,
            },
        });
        logger_1.logger.info(`Email template created: ${template.name}`);
        return template;
    }
    /**
     * List templates
     */
    async listTemplates(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [templates, total] = await Promise.all([
            database_1.default.emailTemplate.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.emailTemplate.count(),
        ]);
        return {
            templates,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    /**
     * Get template
     */
    async getTemplate(templateId) {
        const template = await database_1.default.emailTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new errorHandler_1.AppError(404, 'Template not found');
        }
        return template;
    }
    /**
     * Update template
     */
    async updateTemplate(templateId, data) {
        if (data.body) {
            data.body = this.sanitizeHTML(data.body);
        }
        const template = await database_1.default.emailTemplate.update({
            where: { id: templateId },
            data,
        });
        logger_1.logger.info(`Template updated: ${template.name}`);
        return template;
    }
    /**
     * Delete template
     */
    async deleteTemplate(templateId) {
        await database_1.default.emailTemplate.delete({
            where: { id: templateId },
        });
        logger_1.logger.info(`Template deleted: ${templateId}`);
        return { message: 'Template deleted successfully' };
    }
    /**
     * Send individual email
     */
    async sendSingleEmail(data) {
        let emailBody = data.body;
        let emailSubject = data.subject;
        // Use template if provided
        if (data.templateId) {
            const template = await this.getTemplate(data.templateId);
            emailBody = template.body;
            emailSubject = template.subject;
        }
        // Sanitize
        emailBody = this.sanitizeHTML(emailBody);
        // Queue email
        await queue_1.emailQueue.add('single-email', {
            to: data.to,
            subject: emailSubject,
            html: emailBody,
        });
        logger_1.logger.info(`Email queued to: ${data.to}`);
        return { message: 'Email queued successfully' };
    }
    /**
     * Create campaign
     */
    async createCampaign(data) {
        let body = data.body;
        if (data.templateId) {
            const template = await this.getTemplate(data.templateId);
            body = template.body;
        }
        const campaign = await database_1.default.campaign.create({
            data: {
                subject: data.subject,
                body: this.sanitizeHTML(body),
                templateId: data.templateId,
                status: client_1.CampaignStatus.DRAFT,
            },
        });
        logger_1.logger.info(`Campaign created: ${campaign.id}`);
        return campaign;
    }
    /**
     * Send campaign
     */
    async sendCampaign(campaignId) {
        const campaign = await database_1.default.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new errorHandler_1.AppError(404, 'Campaign not found');
        }
        if (campaign.status === client_1.CampaignStatus.SENT) {
            throw new errorHandler_1.AppError(400, 'Campaign already sent');
        }
        // Get active subscribers
        const subscribers = await database_1.default.subscriber.findMany({
            where: { status: 'active' },
        });
        if (subscribers.length === 0) {
            throw new errorHandler_1.AppError(400, 'No active subscribers');
        }
        // Queue campaign
        await queue_1.campaignQueue.add('send-campaign', {
            campaignId,
            subscribers: subscribers.map(s => ({ email: s.email, name: s.name })),
        });
        // Update status
        await database_1.default.campaign.update({
            where: { id: campaignId },
            data: {
                status: client_1.CampaignStatus.SENT,
                sentAt: new Date(),
                sentTo: subscribers.length,
            },
        });
        logger_1.logger.info(`Campaign queued: ${campaignId} to ${subscribers.length} subscribers`);
        return { message: `Campaign queued to ${subscribers.length} subscribers` };
    }
    /**
     * List campaigns
     */
    async listCampaigns(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [campaigns, total] = await Promise.all([
            database_1.default.campaign.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    template: { select: { name: true } },
                },
            }),
            database_1.default.campaign.count(),
        ]);
        return {
            campaigns,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    /**
     * Test SMTP configuration
     */
    async testSMTP(email) {
        try {
            await (0, email_1.sendEmail)({
                to: email,
                subject: 'JGPNR - SMTP Test',
                html: '<p>This is a test email. Your SMTP configuration is working correctly.</p>',
            });
            return { success: true, message: 'Test email sent successfully' };
        }
        catch (error) {
            logger_1.logger.error('SMTP test failed:', error);
            throw new errorHandler_1.AppError(500, 'SMTP test failed');
        }
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=email.service.js.map