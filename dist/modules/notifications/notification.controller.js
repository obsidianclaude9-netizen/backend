"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.clearAll = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.listNotifications = void 0;
const notification_service_1 = require("./notification.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const notificationService = new notification_service_1.NotificationService();
exports.listNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await notificationService.listNotifications(req.user.userId, page, limit);
    res.json(result);
});
exports.markAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.userId);
    res.json(notification);
});
exports.markAllAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.userId);
    res.json(result);
});
exports.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await notificationService.deleteNotification(req.params.id, req.user.userId);
    res.json(result);
});
exports.clearAll = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await notificationService.clearAll(req.user.userId);
    res.json(result);
});
exports.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await notificationService.getUnreadCount(req.user.userId);
    res.json(result);
});
//# sourceMappingURL=notification.controller.js.map