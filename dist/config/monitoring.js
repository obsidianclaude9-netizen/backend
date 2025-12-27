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
exports.getSentryMiddleware = exports.initializeSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const logger_1 = require("../utils/logger");
const initializeSentry = (app) => {
    if (!process.env.SENTRY_DSN) {
        logger_1.logger.warn('Sentry DSN not configured, skipping initialization');
        return;
    }
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app }),
            new profiling_node_1.ProfilingIntegration(),
        ],
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        beforeSend(event, _hint) {
            if (event.request?.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }
            if (event.request?.data) {
                const data = event.request.data;
                if (data.password)
                    data.password = '[REDACTED]';
                if (data.token)
                    data.token = '[REDACTED]';
                if (data.secret)
                    data.secret = '[REDACTED]';
            }
            return event;
        },
    });
    logger_1.logger.info('Sentry initialized');
};
exports.initializeSentry = initializeSentry;
const getSentryMiddleware = () => {
    return {
        requestHandler: Sentry.Handlers.requestHandler(),
        tracingHandler: Sentry.Handlers.tracingHandler(),
        errorHandler: Sentry.Handlers.errorHandler(),
    };
};
exports.getSentryMiddleware = getSentryMiddleware;
//# sourceMappingURL=monitoring.js.map