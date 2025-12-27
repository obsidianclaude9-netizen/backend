"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCampaignSchema = exports.createCampaignSchema = exports.sendEmailSchema = exports.updateTemplateSchema = exports.createTemplateSchema = void 0;
// src/modules/email/email.schema.ts
const zod_1 = require("zod");
exports.createTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Template name required').max(100),
        subject: zod_1.z.string().min(1, 'Subject required').max(200),
        body: zod_1.z.string().min(1, 'Body required').max(50000),
        category: zod_1.z.string().min(1).max(50),
    }),
});
exports.updateTemplateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(100).optional(),
        subject: zod_1.z.string().min(1).max(200).optional(),
        body: zod_1.z.string().min(1).max(50000).optional(),
        category: zod_1.z.string().min(1).max(50).optional(),
        status: zod_1.z.enum(['draft', 'active', 'archived']).optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
exports.sendEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        to: zod_1.z.string().email('Invalid email'),
        subject: zod_1.z.string().min(1, 'Subject required').max(200),
        body: zod_1.z.string().min(1, 'Body required'),
        templateId: zod_1.z.string().cuid().optional(),
    }),
});
exports.createCampaignSchema = zod_1.z.object({
    body: zod_1.z.object({
        subject: zod_1.z.string().min(1, 'Subject required').max(200),
        body: zod_1.z.string().min(1, 'Body required').max(50000),
        templateId: zod_1.z.string().cuid().optional(),
    }),
});
exports.sendCampaignSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid(),
    }),
});
//# sourceMappingURL=email.schema.js.map