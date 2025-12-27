"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const validate_1 = require("./middleware/validate");
const rateLimit_1 = require("./middleware/rateLimit");
const logger_1 = require("./utils/logger");
const monitoring_1 = require("./config/monitoring");
const advancedSettings_routes_1 = __importDefault(require("./modules/settings/advancedSettings.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const ticket_routes_1 = __importDefault(require("./modules/tickets/ticket.routes"));
const order_routes_1 = __importDefault(require("./modules/orders/order.routes"));
const customer_routes_1 = __importDefault(require("./modules/customers/customer.routes"));
const email_routes_1 = __importDefault(require("./modules/email/email.routes"));
const analytics_routes_1 = __importDefault(require("./modules/analytics/analytics.routes"));
const notification_routes_1 = __importDefault(require("./modules/notifications/notification.routes"));
const subscriber_routes_1 = __importDefault(require("./modules/subscribers/subscriber.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
const batch_routes_1 = __importDefault(require("./modules/batch/batch.routes"));
const monitoring_routes_1 = __importDefault(require("./modules/monitoring/monitoring.routes"));
const app = (0, express_1.default)();
(0, monitoring_1.initializeSentry)(app);
const sentryMiddleware = (0, monitoring_1.getSentryMiddleware)();
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);
app.use((req, _res, next) => {
    logger_1.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use(validate_1.sanitizeInput);
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tickets', rateLimit_1.apiLimiter, ticket_routes_1.default);
app.use('/api/orders', rateLimit_1.apiLimiter, order_routes_1.default);
app.use('/api/customers', rateLimit_1.apiLimiter, customer_routes_1.default);
app.use('/api/email', rateLimit_1.apiLimiter, email_routes_1.default);
app.use('/api/analytics', rateLimit_1.apiLimiter, analytics_routes_1.default);
app.use('/api/notifications', rateLimit_1.apiLimiter, notification_routes_1.default);
app.use('/api/subscribers', rateLimit_1.apiLimiter, subscriber_routes_1.default);
app.use('/api/settings', rateLimit_1.apiLimiter, settings_routes_1.default);
app.use('/api/settings/advanced', rateLimit_1.apiLimiter, advancedSettings_routes_1.default);
app.use('/api/batch', rateLimit_1.apiLimiter, batch_routes_1.default);
app.use('/api/monitoring', monitoring_routes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(sentryMiddleware.errorHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map