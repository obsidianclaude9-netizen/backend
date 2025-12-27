import { z } from 'zod';
export declare const createSubscriberSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        name: z.ZodString;
        source: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        source: string;
    }, {
        name: string;
        email: string;
        source?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        email: string;
        source: string;
    };
}, {
    body: {
        name: string;
        email: string;
        source?: string | undefined;
    };
}>;
export declare const updateSubscriberSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["active", "unsubscribed"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "unsubscribed" | undefined;
        name?: string | undefined;
    }, {
        status?: "active" | "unsubscribed" | undefined;
        name?: string | undefined;
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
        status?: "active" | "unsubscribed" | undefined;
        name?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "active" | "unsubscribed" | undefined;
        name?: string | undefined;
    };
}>;
export declare const listSubscribersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        status: z.ZodOptional<z.ZodEnum<["active", "unsubscribed"]>>;
        search: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "active" | "unsubscribed" | undefined;
        page?: number | undefined;
    }, {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "active" | "unsubscribed" | undefined;
        page?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "active" | "unsubscribed" | undefined;
        page?: number | undefined;
    };
}, {
    query: {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "active" | "unsubscribed" | undefined;
        page?: string | undefined;
    };
}>;
export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>['body'];
export type UpdateSubscriberInput = z.infer<typeof updateSubscriberSchema>['body'];
export type ListSubscribersInput = z.infer<typeof listSubscribersSchema>['query'];
//# sourceMappingURL=subscriber.schema.d.ts.map