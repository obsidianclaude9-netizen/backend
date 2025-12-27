import { z } from 'zod';
export declare const createCustomerSchema: z.ZodObject<{
    body: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        whatsapp: z.ZodOptional<z.ZodString>;
        location: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    }, {
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    };
}, {
    body: {
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    };
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    body: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        whatsapp: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "inactive" | undefined;
        location?: string | undefined;
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    }, {
        status?: "active" | "inactive" | undefined;
        location?: string | undefined;
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        whatsapp?: string | undefined;
        notes?: string | undefined;
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
        status?: "active" | "inactive" | undefined;
        location?: string | undefined;
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "active" | "inactive" | undefined;
        location?: string | undefined;
        email?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        phone?: string | undefined;
        whatsapp?: string | undefined;
        notes?: string | undefined;
    };
}>;
export declare const listCustomersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        search: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "inactive"]>>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "active" | "inactive" | undefined;
        page?: number | undefined;
    }, {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "active" | "inactive" | undefined;
        page?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "active" | "inactive" | undefined;
        page?: number | undefined;
    };
}, {
    query: {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "active" | "inactive" | undefined;
        page?: string | undefined;
    };
}>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
export type ListCustomersInput = z.infer<typeof listCustomersSchema>['query'];
//# sourceMappingURL=customer.schema.d.ts.map