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
// src/modules/orders/order.routes.ts
const express_1 = require("express");
const orderController = __importStar(require("./order.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rateLimit_1 = require("../../middleware/rateLimit");
const audit_1 = require("../../middleware/audit");
const order_schema_1 = require("./order.schema");
const router = (0, express_1.Router)();
// All order routes require authentication
router.use(auth_1.authenticateJWT);
// List orders
router.get('/', (0, validate_1.validate)(order_schema_1.listOrdersSchema), orderController.listOrders);
// Get order stats
router.get('/stats', orderController.getOrderStats);
// Get single order
router.get('/:id', orderController.getOrder);
// Get order by order number
router.get('/number/:orderNumber', orderController.getOrderByNumber);
// Create order (Admin+, rate limited)
router.post('/', auth_1.requireAdmin, rateLimit_1.orderLimiter, (0, validate_1.validate)(order_schema_1.createOrderSchema), (0, audit_1.auditLog)('CREATE_ORDER', 'ORDER'), orderController.createOrder);
// Update order (Admin+)
router.patch('/:id', auth_1.requireAdmin, (0, validate_1.validate)(order_schema_1.updateOrderSchema), (0, audit_1.auditLog)('UPDATE_ORDER', 'ORDER'), orderController.updateOrder);
// Confirm payment (Admin+)
router.post('/:id/confirm', auth_1.requireAdmin, (0, validate_1.validate)(order_schema_1.confirmPaymentSchema), (0, audit_1.auditLog)('CONFIRM_PAYMENT', 'ORDER'), orderController.confirmPayment);
// Cancel order (Admin+)
router.delete('/:id', auth_1.requireAdmin, (0, audit_1.auditLog)('CANCEL_ORDER', 'ORDER'), orderController.cancelOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map