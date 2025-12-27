"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderStats = exports.cancelOrder = exports.confirmPayment = exports.updateOrder = exports.getOrderByNumber = exports.getOrder = exports.listOrders = exports.createOrder = void 0;
const order_service_1 = require("./order.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const orderService = new order_service_1.OrderService();
exports.createOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await orderService.createOrder(req.body);
    res.status(201).json(order);
});
exports.listOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await orderService.listOrders(req.query);
    res.json(result);
});
exports.getOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await orderService.getOrder(req.params.id);
    res.json(order);
});
exports.getOrderByNumber = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);
    res.json(order);
});
exports.updateOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await orderService.updateOrder(req.params.id, req.body);
    res.json(order);
});
exports.confirmPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const order = await orderService.confirmPayment(req.params.id, req.body);
    res.json(order);
});
exports.cancelOrder = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await orderService.cancelOrder(req.params.id);
    res.json(result);
});
exports.getOrderStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const stats = await orderService.getOrderStats(req.query.startDate, req.query.endDate);
    res.json(stats);
});
//# sourceMappingURL=order.controller.js.map