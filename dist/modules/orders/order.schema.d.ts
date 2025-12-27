import { z } from 'zod';
export declare const createOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        customerId: z.ZodString;
        quantity: z.ZodNumber;
        gameSession: z.ZodString;
        amount: z.ZodNumber;
        purchaseDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        gameSession: string;
        quantity: number;
        customerId: string;
        amount: number;
        purchaseDate?: string | undefined;
    }, {
        gameSession: string;
        quantity: number;
        customerId: string;
        amount: number;
        purchaseDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        gameSession: string;
        quantity: number;
        customerId: string;
        amount: number;
        purchaseDate?: string | undefined;
    };
}, {
    body: {
        gameSession: string;
        quantity: number;
        customerId: string;
        amount: number;
        purchaseDate?: string | undefined;
    };
}>;
export declare const updateOrderSchema: z.ZodObject<{
    body: z.ZodObject<{
        status: z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
        }>>;
        quantity: z.ZodOptional<z.ZodNumber>;
        amount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        quantity?: number | undefined;
        amount?: number | undefined;
    }, {
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        quantity?: number | undefined;
        amount?: number | undefined;
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
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        quantity?: number | undefined;
        amount?: number | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        quantity?: number | undefined;
        amount?: number | undefined;
    };
}>;
export declare const confirmPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentReference: z.ZodString;
        paymentMethod: z.ZodOptional<z.ZodString>;
        paidAmount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        paymentReference: string;
        paymentMethod?: string | undefined;
        paidAmount?: number | undefined;
    }, {
        paymentReference: string;
        paymentMethod?: string | undefined;
        paidAmount?: number | undefined;
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
        paymentReference: string;
        paymentMethod?: string | undefined;
        paidAmount?: number | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        paymentReference: string;
        paymentMethod?: string | undefined;
        paidAmount?: number | undefined;
    };
}>;
export declare const listOrdersSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            COMPLETED: "COMPLETED";
            CANCELLED: "CANCELLED";
        }>>;
        customerId: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        page?: number | undefined;
        customerId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        page?: string | undefined;
        customerId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        page?: number | undefined;
        customerId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
}, {
    query: {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "CANCELLED" | "PENDING" | "COMPLETED" | undefined;
        page?: string | undefined;
        customerId?: string | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
}>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>['body'];
export type ListOrdersInput = z.infer<typeof listOrdersSchema>['query'];
//# sourceMappingURL=order.schema.d.ts.map