import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken: string;
    };
}, {
    body: {
        refreshToken: string;
    };
}>;
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodDefault<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            STAFF: "STAFF";
        }>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
        phone?: string | undefined;
    }, {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "STAFF";
        phone?: string | undefined;
    };
}, {
    body: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
    };
}>;
export declare const updateUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodOptional<z.ZodString>;
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            STAFF: "STAFF";
        }>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
        isActive?: boolean | undefined;
    }, {
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
        isActive?: boolean | undefined;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
        isActive?: boolean | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "STAFF" | undefined;
        isActive?: boolean | undefined;
    };
}>;
export declare const changePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentPassword: string;
        newPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        currentPassword: string;
        newPassword: string;
    };
}, {
    params: {
        id: string;
    };
    body: {
        currentPassword: string;
        newPassword: string;
    };
}>;
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
//# sourceMappingURL=auth.schema.d.ts.map