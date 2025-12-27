import { z } from 'zod';
export declare const createNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userId: z.ZodString;
        title: z.ZodString;
        message: z.ZodString;
        type: z.ZodDefault<z.ZodNativeEnum<{
            INFO: "INFO";
            SUCCESS: "SUCCESS";
            WARNING: "WARNING";
            ERROR: "ERROR";
        }>>;
        actionUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        userId: string;
        type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
        title: string;
        actionUrl?: string | undefined;
    }, {
        message: string;
        userId: string;
        title: string;
        type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | undefined;
        actionUrl?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message: string;
        userId: string;
        type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
        title: string;
        actionUrl?: string | undefined;
    };
}, {
    body: {
        message: string;
        userId: string;
        title: string;
        type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | undefined;
        actionUrl?: string | undefined;
    };
}>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>['body'];
//# sourceMappingURL=notification.schema.d.ts.map