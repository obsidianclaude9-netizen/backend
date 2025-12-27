"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrdersSchema = exports.confirmPaymentSchema = exports.updateOrderSchema = exports.createOrderSchema = void 0;
// src/modules/orders/order.schema.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.string().cuid('Invalid customer ID'),
        quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Maximum 50 tickets per order'),
        gameSession: zod_1.z.string().min(1, 'Game session required').max(100),
        amount: zod_1.z.number().positive('Amount must be positive'),
        purchaseDate: zod_1.z.string().datetime().optional(),
    }),
});
exports.updateOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
        quantity: zod_1.z.number().int().min(1).max(50).optional(),
        amount: zod_1.z.number().positive().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid order ID'),
    }),
});
exports.confirmPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentReference: zod_1.z.string().min(1, 'Payment reference required'),
        paymentMethod: zod_1.z.string().optional(),
        paidAmount: zod_1.z.number().positive().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid order ID'),
    }),
});
exports.listOrdersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        status: zod_1.z.nativeEnum(client_1.OrderStatus).optional(),
        customerId: zod_1.z.string().cuid().optional(),
        search: zod_1.z.string().optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
});
//# sourceMappingURL=order.schema.js.map