"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./utils/logger");
const email_1 = require("./config/email");
const websocket_1 = require("./config/websocket");
const monitoring_1 = require("./config/monitoring");
const database_1 = __importDefault(require("./config/database"));
const email_jobs_1 = require("./jobs/email.jobs");
const scheduler_jobs_1 = require("./jobs/scheduler.jobs");
const fs_1 = __importDefault(require("fs"));
const PORT = process.env.PORT || 5000;
// Create required directories
const directories = [
    'logs',
    'uploads',
    'uploads/qrcodes',
    'uploads/tickets',
];
directories.forEach(dir => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
        logger_1.logger.info(`Created directory: ${dir}`);
    }
});
// Validate required environment variables
const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'QR_ENCRYPTION_KEY',
];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    logger_1.logger.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}
// Start server
const startServer = async () => {
    try {
        // Initialize Sentry
        (0, monitoring_1.initializeSentry)(app_1.default);
        logger_1.logger.info('Sentry initialized');
        // Test database connection
        await database_1.default.$connect();
        logger_1.logger.info('Database connected successfully');
        // Initialize email transporter
        await (0, email_1.createTransporter)();
        logger_1.logger.info('SMTP transporter initialized');
        // Initialize scheduler
        await (0, scheduler_jobs_1.initializeScheduler)();
        logger_1.logger.info('Report scheduler initialized');
        // Start queue workers
        logger_1.logger.info('Queue workers started');
        // Create HTTP server
        const httpServer = http_1.default.createServer(app_1.default);
        // Initialize WebSocket
        (0, websocket_1.initializeWebSocket)(httpServer);
        logger_1.logger.info('WebSocket server initialized');
        // Start HTTP server
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running on port ${PORT}`);
            logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.logger.info(`Health check: http://localhost:${PORT}/health`);
            logger_1.logger.info(`WebSocket: ws://localhost:${PORT}`);
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, shutting down gracefully...`);
            httpServer.close(async () => {
                logger_1.logger.info('HTTP server closed');
                // Close database connection
                await database_1.default.$disconnect();
                logger_1.logger.info('Database disconnected');
                // Close queue workers
                await email_jobs_1.emailWorker.close();
                await email_jobs_1.campaignWorker.close();
                await scheduler_jobs_1.reportWorker.close();
                logger_1.logger.info('Queue workers closed');
                process.exit(0);
            });
            // Force shutdown after 10 seconds
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
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
startServer();
//# sourceMappingURL=server.js.map