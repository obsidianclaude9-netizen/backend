"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriberStats = exports.exportSubscribers = exports.deleteSubscriber = exports.updateSubscriber = exports.getSubscriber = exports.listSubscribers = exports.createSubscriber = void 0;
const subscriber_service_1 = require("./subscriber.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const subscriberService = new subscriber_service_1.SubscriberService();
exports.createSubscriber = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subscriber = await subscriberService.createSubscriber(req.body);
    res.status(201).json(subscriber);
});
exports.listSubscribers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await subscriberService.listSubscribers(req.query);
    res.json(result);
});
exports.getSubscriber = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subscriber = await subscriberService.getSubscriber(req.params.id);
    res.json(subscriber);
});
exports.updateSubscriber = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const subscriber = await subscriberService.updateSubscriber(req.params.id, req.body);
    res.json(subscriber);
});
exports.deleteSubscriber = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await subscriberService.deleteSubscriber(req.params.id);
    res.json(result);
});
exports.exportSubscribers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const csv = await subscriberService.exportSubscribers(req.query.status);
    const filename = `subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
});
exports.getSubscriberStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await subscriberService.getSubscriberStats();
    res.json(stats);
});
//# sourceMappingURL=subscriber.controller.js.map