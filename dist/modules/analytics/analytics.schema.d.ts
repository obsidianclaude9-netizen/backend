import { z } from 'zod';
export declare const analyticsQuerySchema: z.ZodObject<{
    query: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        period: z.ZodOptional<z.ZodEnum<["7d", "30d", "90d", "1y"]>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        groupBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["day", "week", "month"]>>>;
    }, "strip", z.ZodTypeAny, {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    }>, {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    }>, {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    }>, {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    }>, {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        groupBy: "week" | "day" | "month";
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
    };
}, {
    query: {
        startDate?: string | undefined;
        endDate?: string | undefined;
        period?: "7d" | "30d" | "90d" | "1y" | undefined;
        groupBy?: "week" | "day" | "month" | undefined;
    };
}>;
export declare const comparisonQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        currentPeriod: z.ZodEnum<["7d", "30d", "90d", "1y"]>;
        previousPeriod: z.ZodOptional<z.ZodEnum<["7d", "30d", "90d", "1y"]>>;
        metric: z.ZodOptional<z.ZodEnum<["revenue", "tickets", "customers", "scans"]>>;
    }, "strip", z.ZodTypeAny, {
        currentPeriod: "7d" | "30d" | "90d" | "1y";
        previousPeriod?: "7d" | "30d" | "90d" | "1y" | undefined;
        metric?: "tickets" | "customers" | "revenue" | "scans" | undefined;
    }, {
        currentPeriod: "7d" | "30d" | "90d" | "1y";
        previousPeriod?: "7d" | "30d" | "90d" | "1y" | undefined;
        metric?: "tickets" | "customers" | "revenue" | "scans" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        currentPeriod: "7d" | "30d" | "90d" | "1y";
        previousPeriod?: "7d" | "30d" | "90d" | "1y" | undefined;
        metric?: "tickets" | "customers" | "revenue" | "scans" | undefined;
    };
}, {
    query: {
        currentPeriod: "7d" | "30d" | "90d" | "1y";
        previousPeriod?: "7d" | "30d" | "90d" | "1y" | undefined;
        metric?: "tickets" | "customers" | "revenue" | "scans" | undefined;
    };
}>;
export declare const exportQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        type: z.ZodEnum<["orders", "tickets", "customers", "scans", "campaigns"]>;
        format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["csv", "excel", "pdf"]>>>;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        format: "csv" | "excel" | "pdf";
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
        format?: "csv" | "excel" | "pdf" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
    params: z.ZodObject<{
        type: z.ZodEnum<["orders", "tickets", "customers", "scans", "campaigns"]>;
    }, "strip", z.ZodTypeAny, {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
    }, {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        format: "csv" | "excel" | "pdf";
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
    params: {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
    };
}, {
    query: {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
        format?: "csv" | "excel" | "pdf" | undefined;
        startDate?: string | undefined;
        endDate?: string | undefined;
    };
    params: {
        type: "tickets" | "orders" | "customers" | "campaigns" | "scans";
    };
}>;
export declare const revenueTargetSchema: z.ZodObject<{
    body: z.ZodObject<{
        month: z.ZodString;
        target: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        target: number;
        month: string;
    }, {
        target: number;
        month: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        target: number;
        month: string;
    };
}, {
    body: {
        target: number;
        month: string;
    };
}>;
export declare const updateRevenueTargetSchema: z.ZodObject<{
    body: z.ZodObject<{
        target: z.ZodOptional<z.ZodNumber>;
        actual: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        target?: number | undefined;
        actual?: number | undefined;
    }, {
        target?: number | undefined;
        actual?: number | undefined;
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
        target?: number | undefined;
        actual?: number | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        target?: number | undefined;
        actual?: number | undefined;
    };
}>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>['query'];
export type ComparisonQueryInput = z.infer<typeof comparisonQuerySchema>['query'];
export type ExportQueryInput = z.infer<typeof exportQuerySchema>['query'];
export type RevenueTargetInput = z.infer<typeof revenueTargetSchema>['body'];
export type UpdateRevenueTargetInput = z.infer<typeof updateRevenueTargetSchema>['body'];
//# sourceMappingURL=analytics.schema.d.ts.map