"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = exports.cleanupQueue = exports.campaignQueue = exports.emailQueue = void 0;
// src/config/queue.ts
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const connection = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
});
exports.connection = connection;
connection.on('error', (err) => {
    logger_1.logger.error('Redis connection error:', err);
});
connection.on('connect', () => {
    logger_1.logger.info('Redis connected successfully');
});
// Email Queue
exports.emailQueue = new bullmq_1.Queue('email', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            age: 86400, // 24 hours
            count: 1000,
        },
        removeOnFail: {
            age: 604800, // 7 days
        },
    },
});
// Campaign Queue
exports.campaignQueue = new bullmq_1.Queue('campaign', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    },
});
// Cleanup Queue (cron jobs)
exports.cleanupQueue = new bullmq_1.Queue('cleanup', {
    connection,
    defaultJobOptions: {
        attempts: 2,
    },
});
// Queue Events
const emailQueueEvents = new bullmq_1.QueueEvents('email', { connection });
const campaignQueueEvents = new bullmq_1.QueueEvents('campaign', { connection });
emailQueueEvents.on('completed', ({ jobId }) => {
    logger_1.logger.info(`Email job ${jobId} completed`);
});
emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger_1.logger.error(`Email job ${jobId} failed:`, failedReason);
});
campaignQueueEvents.on('completed', ({ jobId }) => {
    logger_1.logger.info(`Campaign job ${jobId} completed`);
});
campaignQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logger_1.logger.error(`Campaign job ${jobId} failed:`, failedReason);
});
//# sourceMappingURL=queue.js.map