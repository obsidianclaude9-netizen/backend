"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const email_1 = require("./config/email");
const websocket_1 = require("./config/websocket");
const monitoring_1 = require("./config/monitoring");
const storage_1 = require("./config/storage");
const database_1 = __importDefault(require("./config/database"));
const email_jobs_1 = require("./jobs/email.jobs");
const scheduler_jobs_1 = require("./jobs/scheduler.jobs");
const analytics_jobs_1 = require("./jobs/analytics.jobs");
const view_refresh_job_1 = require("./jobs/view-refresh.job");
const node_cron_1 = __importDefault(require("node-cron"));
const PORT = process.env.PORT || 5000;
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'QR_ENCRYPTION_KEY',
    'REDIS_HOST',
    'REDIS_PORT',
    'PAYSTACK_SECRET_KEY', // Primary payment gateway
];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    logger_1.logger.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}
const startServer = async () => {
    try {
        (0, monitoring_1.initializeSentry)(app_1.default);
        logger_1.logger.info('Sentry initialized');
        // Initialize local file storage
        (0, storage_1.initializeStorage)();
        await database_1.default.$connect();
        logger_1.logger.info('Database connected successfully');
        await (0, email_1.createTransporter)();
        logger_1.logger.info('SMTP transporter initialized');
        await (0, scheduler_jobs_1.initializeScheduler)();
        logger_1.logger.info('Report scheduler initialized');
        await (0, analytics_jobs_1.initializeAnalyticsJobs)();
        logger_1.logger.info('Analytics jobs initialized');
        (0, view_refresh_job_1.scheduleViewRefresh)();
        logger_1.logger.info('Materialized view refresh scheduled');
        // Schedule temp file cleanup (daily at 2 AM)
        node_cron_1.default.schedule('0 2 * * *', () => {
            logger_1.logger.info('Running temp file cleanup...');
            (0, storage_1.cleanupTempFiles)();
        });
        logger_1.logger.info('Queue workers started');
        const httpServer = http_1.default.createServer(app_1.default);
        await (0, websocket_1.initializeWebSocket)(httpServer);
        logger_1.logger.info('WebSocket server initialized with Redis adapter');
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`WebSocket: ws://localhost:${PORT}`);
            logger_1.logger.info(`Analytics: http://localhost:${PORT}/api/analytics`);
            logger_1.logger.info(`File uploads: ${process.env.UPLOADS_DIR || './uploads'}`);
            logger_1.logger.info(`Payment: Paystack (Primary)${process.env.FLUTTERWAVE_SECRET_KEY ? ' + Flutterwave (Optional)' : ''}`);
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, shutting down gracefully...`);
            httpServer.close(async () => {
                logger_1.logger.info('HTTP server closed');
                await (0, websocket_1.closeWebSocket)();
                await database_1.default.$disconnect();
                logger_1.logger.info('Database disconnected');
                await email_jobs_1.emailWorker.close();
                await email_jobs_1.campaignWorker.close();
                await scheduler_jobs_1.reportWorker.close();
                await analytics_jobs_1.analyticsWorker.close();
                logger_1.logger.info('Queue workers closed');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map