"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCustomersSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
// src/modules/customers/customer.schema.ts
const zod_1 = require("zod");
exports.createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1, 'First name required').max(50).trim(),
        lastName: zod_1.z.string().min(1, 'Last name required').max(50).trim(),
        email: zod_1.z.string().email('Invalid email format').toLowerCase().trim(),
        phone: zod_1.z.string().min(1, 'Phone required').max(20).trim(),
        whatsapp: zod_1.z.string().max(20).optional(),
        location: zod_1.z.string().min(1, 'Location required').max(200).trim(),
        notes: zod_1.z.string().max(1000).optional(),
    }),
});
exports.updateCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(50).trim().optional(),
        lastName: zod_1.z.string().min(1).max(50).trim().optional(),
        email: zod_1.z.string().email().toLowerCase().trim().optional(),
        phone: zod_1.z.string().min(1).max(20).trim().optional(),
        whatsapp: zod_1.z.string().max(20).optional(),
        location: zod_1.z.string().min(1).max(200).trim().optional(),
        notes: zod_1.z.string().max(1000).optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid customer ID'),
    }),
});
exports.listCustomersSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        search: zod_1.z.string().optional(),
        status: zod_1.z.enum(['active', 'inactive']).optional(),
    }),
});
//# sourceMappingURL=customer.schema.js.map