"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignWorker = exports.emailWorker = void 0;
// src/jobs/email.jobs.ts
const bullmq_1 = require("bullmq");
const queue_1 = require("../config/queue");
const email_1 = require("../config/email");
const database_1 = __importDefault(require("../config/database"));
const logger_1 = require("../utils/logger");
/**
 * Single email worker
 */
exports.emailWorker = new bullmq_1.Worker('email', async (job) => {
    const { to, subject, html, text, attachments } = job.data;
    try {
        await (0, email_1.sendEmail)({
            to,
            subject,
            html,
            text,
            attachments,
        });
        logger_1.logger.info(`Email sent successfully to ${to}`);
        return { success: true, to };
    }
    catch (error) {
        logger_1.logger.error(`Email failed to ${to}:`, error);
        throw error; // Will trigger retry
    }
}, {
    connection: queue_1.connection,
    concurrency: 5,
    limiter: {
        max: 10,
        duration: 60000, // 10 emails per minute
    },
});
/**
 * Campaign worker
 */
exports.campaignWorker = new bullmq_1.Worker('campaign', async (job) => {
    const { campaignId, subscribers } = job.data;
    try {
        const campaign = await database_1.default.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        const batchSize = 100;
        let sentCount = 0;
        // Process in batches
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            for (const subscriber of batch) {
                try {
                    // Replace variables
                    const personalizedBody = campaign.body
                        .replace(/{name}/g, subscriber.name)
                        .replace(/{email}/g, subscriber.email);
                    await (0, email_1.sendEmail)({
                        to: subscriber.email,
                        subject: campaign.subject,
                        html: personalizedBody,
                    });
                    sentCount++;
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                catch (error) {
                    logger_1.logger.error(`Failed to send campaign to ${subscriber.email}:`, error);
                }
            }
            // Update progress
            job.updateProgress((sentCount / subscribers.length) * 100);
        }
        // Update campaign stats
        await database_1.default.campaign.update({
            where: { id: campaignId },
            data: {
                sentTo: sentCount,
            },
        });
        logger_1.logger.info(`Campaign ${campaignId} sent to ${sentCount}/${subscribers.length} subscribers`);
        return { success: true, sent: sentCount, total: subscribers.length };
    }
    catch (error) {
        logger_1.logger.error(`Campaign ${campaignId} failed:`, error);
        throw error;
    }
}, {
    connection: queue_1.connection,
    concurrency: 1, // Process one campaign at a time
});
/**
 * Order confirmation email
 */
exports.emailWorker.on('completed', (job) => {
    logger_1.logger.info(`Email job ${job.id} completed`);
});
exports.emailWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Email job ${job?.id} failed:`, err);
});
exports.campaignWorker.on('completed', (job) => {
    logger_1.logger.info(`Campaign job ${job.id} completed`);
});
exports.campaignWorker.on('failed', (job, err) => {
    logger_1.logger.error(`Campaign job ${job?.id} failed:`, err);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    await exports.emailWorker.close();
    await exports.campaignWorker.close();
    logger_1.logger.info('Email workers shut down');
});
//# sourceMappingURL=email.jobs.js.map