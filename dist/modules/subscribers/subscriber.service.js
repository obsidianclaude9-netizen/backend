"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriberService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const json2csv_1 = require("json2csv");
const logger_1 = require("../../utils/logger");
class SubscriberService {
    async createSubscriber(data) {
        const subscriber = await database_1.default.subscriber.create({ data });
        logger_1.logger.info(`Subscriber added: ${subscriber.email}`);
        return subscriber;
    }
    async listSubscribers(filters) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [subscribers, total, activeCount] = await Promise.all([
            database_1.default.subscriber.findMany({
                where,
                skip,
                take: limit,
                orderBy: { subscribedAt: 'desc' },
            }),
            database_1.default.subscriber.count({ where }),
            database_1.default.subscriber.count({ where: { status: 'active' } }),
        ]);
        return {
            subscribers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            activeCount,
        };
    }
    async getSubscriber(subscriberId) {
        const subscriber = await database_1.default.subscriber.findUnique({
            where: { id: subscriberId },
        });
        if (!subscriber) {
            throw new errorHandler_1.AppError(404, 'Subscriber not found');
        }
        return subscriber;
    }
    async updateSubscriber(subscriberId, data) {
        const subscriber = await database_1.default.subscriber.update({
            where: { id: subscriberId },
            data,
        });
        logger_1.logger.info(`Subscriber updated: ${subscriber.email}`);
        return subscriber;
    }
    async deleteSubscriber(subscriberId) {
        await database_1.default.subscriber.delete({
            where: { id: subscriberId },
        });
        logger_1.logger.info(`Subscriber deleted: ${subscriberId}`);
        return { message: 'Subscriber removed' };
    }
    async exportSubscribers(status) {
        const where = {};
        if (status)
            where.status = status;
        const subscribers = await database_1.default.subscriber.findMany({
            where,
            orderBy: { subscribedAt: 'desc' },
        });
        const fields = ['email', 'name', 'source', 'status', 'subscribedAt'];
        const parser = new json2csv_1.Parser({ fields });
        const csv = parser.parse(subscribers);
        logger_1.logger.info(`Exported ${subscribers.length} subscribers`);
        return csv;
    }
    async getSubscriberStats() {
        const [total, active, unsubscribed, recentCount] = await Promise.all([
            database_1.default.subscriber.count(),
            database_1.default.subscriber.count({ where: { status: 'active' } }),
            database_1.default.subscriber.count({ where: { status: 'unsubscribed' } }),
            database_1.default.subscriber.count({
                where: {
                    subscribedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return { total, active, unsubscribed, recentCount };
    }
}
exports.SubscriberService = SubscriberService;
//# sourceMappingURL=subscriber.service.js.map