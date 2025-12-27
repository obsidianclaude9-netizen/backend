import { z } from 'zod';
export declare const createTicketSchema: z.ZodObject<{
    body: z.ZodObject<{
        orderId: z.ZodString;
        gameSession: z.ZodString;
        quantity: z.ZodDefault<z.ZodNumber>;
        validityDays: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        orderId: string;
        gameSession: string;
        quantity: number;
        validityDays?: number | undefined;
    }, {
        orderId: string;
        gameSession: string;
        quantity?: number | undefined;
        validityDays?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        orderId: string;
        gameSession: string;
        quantity: number;
        validityDays?: number | undefined;
    };
}, {
    body: {
        orderId: string;
        gameSession: string;
        quantity?: number | undefined;
        validityDays?: number | undefined;
    };
}>;
export declare const updateTicketSchema: z.ZodObject<{
    body: z.ZodObject<{
        gameSession: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            SCANNED: "SCANNED";
            CANCELLED: "CANCELLED";
            EXPIRED: "EXPIRED";
        }>>;
        validUntil: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        gameSession?: string | undefined;
        validUntil?: string | undefined;
    }, {
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        gameSession?: string | undefined;
        validUntil?: string | undefined;
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
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        gameSession?: string | undefined;
        validUntil?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        gameSession?: string | undefined;
        validUntil?: string | undefined;
    };
}>;
export declare const scanTicketSchema: z.ZodObject<{
    body: z.ZodObject<{
        ticketCode: z.ZodString;
        scannedBy: z.ZodString;
        location: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ticketCode: string;
        scannedBy: string;
        location?: string | undefined;
    }, {
        ticketCode: string;
        scannedBy: string;
        location?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        ticketCode: string;
        scannedBy: string;
        location?: string | undefined;
    };
}, {
    body: {
        ticketCode: string;
        scannedBy: string;
        location?: string | undefined;
    };
}>;
export declare const validateTicketSchema: z.ZodObject<{
    body: z.ZodObject<{
        ticketCode: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        ticketCode: string;
    }, {
        ticketCode: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        ticketCode: string;
    };
}, {
    body: {
        ticketCode: string;
    };
}>;
export declare const listTicketsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        limit: z.ZodOptional<z.ZodEffects<z.ZodString, number, string>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            SCANNED: "SCANNED";
            CANCELLED: "CANCELLED";
            EXPIRED: "EXPIRED";
        }>>;
        gameSession: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        orderId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        page?: number | undefined;
        orderId?: string | undefined;
        gameSession?: string | undefined;
    }, {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        page?: string | undefined;
        orderId?: string | undefined;
        gameSession?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        page?: number | undefined;
        orderId?: string | undefined;
        gameSession?: string | undefined;
    };
}, {
    query: {
        limit?: string | undefined;
        search?: string | undefined;
        status?: "ACTIVE" | "SCANNED" | "CANCELLED" | "EXPIRED" | undefined;
        page?: string | undefined;
        orderId?: string | undefined;
        gameSession?: string | undefined;
    };
}>;
export declare const updateSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        maxScanCount: z.ZodOptional<z.ZodNumber>;
        scanWindowDays: z.ZodOptional<z.ZodNumber>;
        validityDays: z.ZodOptional<z.ZodNumber>;
        basePrice: z.ZodOptional<z.ZodNumber>;
        allowRefunds: z.ZodOptional<z.ZodBoolean>;
        allowTransfers: z.ZodOptional<z.ZodBoolean>;
        enableCategories: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        validityDays?: number | undefined;
        maxScanCount?: number | undefined;
        scanWindowDays?: number | undefined;
        basePrice?: number | undefined;
        allowRefunds?: boolean | undefined;
        allowTransfers?: boolean | undefined;
        enableCategories?: boolean | undefined;
    }, {
        validityDays?: number | undefined;
        maxScanCount?: number | undefined;
        scanWindowDays?: number | undefined;
        basePrice?: number | undefined;
        allowRefunds?: boolean | undefined;
        allowTransfers?: boolean | undefined;
        enableCategories?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        validityDays?: number | undefined;
        maxScanCount?: number | undefined;
        scanWindowDays?: number | undefined;
        basePrice?: number | undefined;
        allowRefunds?: boolean | undefined;
        allowTransfers?: boolean | undefined;
        enableCategories?: boolean | undefined;
    };
}, {
    body: {
        validityDays?: number | undefined;
        maxScanCount?: number | undefined;
        scanWindowDays?: number | undefined;
        basePrice?: number | undefined;
        allowRefunds?: boolean | undefined;
        allowTransfers?: boolean | undefined;
        enableCategories?: boolean | undefined;
    };
}>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>['body'];
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>['body'];
export type ScanTicketInput = z.infer<typeof scanTicketSchema>['body'];
export type ValidateTicketInput = z.infer<typeof validateTicketSchema>['body'];
export type ListTicketsInput = z.infer<typeof listTicketsSchema>['query'];
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
//# sourceMappingURL=ticket.schema.d.ts.map