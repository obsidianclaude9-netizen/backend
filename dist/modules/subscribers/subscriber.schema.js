"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSubscribersSchema = exports.updateSubscriberSchema = exports.createSubscriberSchema = void 0;
// src/modules/subscribers/subscriber.schema.ts
const zod_1 = require("zod");
exports.createSubscriberSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email').toLowerCase().trim(),
        name: zod_1.z.string().min(1, 'Name required').max(100).trim(),
        source: zod_1.z.string().max(50).default('manual'),
    }),
});
exports.updateSubscriberSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).trim().optional(),
        status: zod_1.z.enum(['active', 'unsubscribed']).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
exports.listSubscribersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        status: zod_1.z.enum(['active', 'unsubscribed']).optional(),
        search: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=subscriber.schema.js.map