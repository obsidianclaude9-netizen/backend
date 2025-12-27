"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationSchema = void 0;
// src/modules/notifications/notification.schema.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string().cuid(),
        title: zod_1.z.string().min(1).max(200),
        message: zod_1.z.string().min(1).max(1000),
        type: zod_1.z.nativeEnum(client_1.NotificationType).default(client_1.NotificationType.INFO),
        actionUrl: zod_1.z.string().url().optional(),
    }),
});
//# sourceMappingURL=notification.schema.js.map