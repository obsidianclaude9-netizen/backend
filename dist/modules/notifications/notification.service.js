"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
// src/modules/notifications/notification.service.ts
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const websocket_1 = require("../../config/websocket");
class NotificationService {
    async createNotification(data) {
        const notification = await database_1.default.notification.create({ data });
        (0, websocket_1.emitNotification)(data.userId, notification);
        return notification;
    }
    async listNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            database_1.default.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.notification.count({ where: { userId } }),
            database_1.default.notification.count({ where: { userId, read: false } }),
        ]);
        return {
            notifications,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            unreadCount,
        };
    }
    async markAsRead(notificationId, userId) {
        const notification = await database_1.default.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new errorHandler_1.AppError(404, 'Notification not found');
        }
        return await database_1.default.notification.update({
            where: { id: notificationId },
            data: { read: true },
        });
    }
    async markAllAsRead(userId) {
        await database_1.default.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
        return { message: 'All notifications marked as read' };
    }
    async deleteNotification(notificationId, userId) {
        const notification = await database_1.default.notification.findFirst({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new errorHandler_1.AppError(404, 'Notification not found');
        }
        await database_1.default.notification.delete({ where: { id: notificationId } });
        return { message: 'Notification deleted' };
    }
    async clearAll(userId) {
        await database_1.default.notification.deleteMany({ where: { userId } });
        return { message: 'All notifications cleared' };
    }
    async getUnreadCount(userId) {
        const count = await database_1.default.notification.count({
            where: { userId, read: false },
        });
        return { count };
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map