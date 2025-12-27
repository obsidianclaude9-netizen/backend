"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateUserSchema = exports.createUserSchema = exports.refreshTokenSchema = exports.loginSchema = void 0;
// src/modules/auth/auth.schema.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email format')
            .toLowerCase()
            .trim(),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password too long'),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token required'),
    }),
});
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email format')
            .toLowerCase()
            .trim(),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
        firstName: zod_1.z
            .string()
            .min(1, 'First name required')
            .max(50)
            .trim(),
        lastName: zod_1.z
            .string()
            .min(1, 'Last name required')
            .max(50)
            .trim(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).default(client_1.UserRole.ADMIN),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string()
            .email('Invalid email format')
            .toLowerCase()
            .trim()
            .optional(),
        firstName: zod_1.z.string().min(1).max(50).trim().optional(),
        lastName: zod_1.z.string().min(1).max(50).trim().optional(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid user ID format'),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password required'),
        newPassword: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid user ID format'),
    }),
});
//# sourceMappingURL=auth.schema.js.map