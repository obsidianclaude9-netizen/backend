"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRevenueTargetSchema = exports.revenueTargetSchema = exports.exportQuerySchema = exports.comparisonQuerySchema = exports.analyticsQuerySchema = void 0;
// backend/src/modules/analytics/analytics.schema.ts
const zod_1 = require("zod");
exports.analyticsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        period: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional(),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
        groupBy: zod_1.z.enum(['day', 'week', 'month']).optional().default('day'),
    }).refine((data) => {
        // If custom dates provided, both must be present
        if (data.startDate || data.endDate) {
            return data.startDate && data.endDate;
        }
        return true;
    }, {
        message: 'Both startDate and endDate must be provided for custom range',
    }).refine((data) => {
        // Validate date range is logical
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            return start <= end;
        }
        return true;
    }, {
        message: 'startDate must be before or equal to endDate',
    }).refine((data) => {
        // Prevent future dates
        if (data.endDate) {
            const end = new Date(data.endDate);
            return end <= new Date();
        }
        return true;
    }, {
        message: 'endDate cannot be in the future',
    }).refine((data) => {
        // Limit range to 2 years max
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate);
            const end = new Date(data.endDate);
            const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
            return diffYears <= 2;
        }
        return true;
    }, {
        message: 'Date range cannot exceed 2 years',
    }),
});
exports.comparisonQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        currentPeriod: zod_1.z.enum(['7d', '30d', '90d', '1y']),
        previousPeriod: zod_1.z.enum(['7d', '30d', '90d', '1y']).optional(),
        metric: zod_1.z.enum(['revenue', 'tickets', 'customers', 'scans']).optional(),
    }),
});
exports.exportQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.enum(['orders', 'tickets', 'customers', 'scans', 'campaigns']),
        format: zod_1.z.enum(['csv', 'excel', 'pdf']).optional().default('csv'),
        startDate: zod_1.z.string().datetime().optional(),
        endDate: zod_1.z.string().datetime().optional(),
    }),
    params: zod_1.z.object({
        type: zod_1.z.enum(['orders', 'tickets', 'customers', 'scans', 'campaigns']),
    }),
});
exports.revenueTargetSchema = zod_1.z.object({
    body: zod_1.z.object({
        month: zod_1.z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
        target: zod_1.z.number().positive('Target must be positive'),
    }),
});
exports.updateRevenueTargetSchema = zod_1.z.object({
    body: zod_1.z.object({
        target: zod_1.z.number().positive('Target must be positive').optional(),
        actual: zod_1.z.number().nonnegative('Actual must be non-negative').optional(),
    }),
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid target ID'),
    }),
});
//# sourceMappingURL=analytics.schema.js.map