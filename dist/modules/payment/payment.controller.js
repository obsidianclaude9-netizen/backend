"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.verifyPayment = exports.initializePayment = void 0;
const payment_service_1 = require("./payment.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const paymentService = new payment_service_1.PaymentService();
exports.initializePayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await paymentService.initializePayment(req.params.orderId);
    res.json(result);
});
exports.verifyPayment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await paymentService.verifyPayment(req.params.reference);
    res.json(result);
});
exports.handleWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json(result);
});
//# sourceMappingURL=payment.controller.js.map