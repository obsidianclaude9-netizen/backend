"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/cache.ts
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: 1, // Use DB 1 for caching (DB 0 for queues)
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});
redis.on('connect', () => {
    logger_1.logger.info('Cache Redis connected');
});
redis.on('error', (err) => {
    logger_1.logger.error('Cache Redis error:', err);
});
exports.default = redis;
//# sourceMappingURL=cache.js.map