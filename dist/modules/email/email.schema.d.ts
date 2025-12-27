import { z } from 'zod';
export declare const createTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        subject: z.ZodString;
        body: z.ZodString;
        category: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        body: string;
        subject: string;
        category: string;
    }, {
        name: string;
        body: string;
        subject: string;
        category: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        body: string;
        subject: string;
        category: string;
    };
}, {
    body: {
        name: string;
        body: string;
        subject: string;
        category: string;
    };
}>;
export declare const updateTemplateSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        subject: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["draft", "active", "archived"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "active" | "draft" | "archived" | undefined;
        name?: string | undefined;
        body?: string | undefined;
        subject?: string | undefined;
        category?: string | undefined;
    }, {
        status?: "active" | "draft" | "archived" | undefined;
        name?: string | undefined;
        body?: string | undefined;
        subject?: string | undefined;
        category?: string | undefined;
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
        status?: "active" | "draft" | "archived" | undefined;
        name?: string | undefined;
        body?: string | undefined;
        subject?: string | undefined;
        category?: string | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "active" | "draft" | "archived" | undefined;
        name?: string | undefined;
        body?: string | undefined;
        subject?: string | undefined;
        category?: string | undefined;
    };
}>;
export declare const sendEmailSchema: z.ZodObject<{
    body: z.ZodObject<{
        to: z.ZodString;
        subject: z.ZodString;
        body: z.ZodString;
        templateId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        body: string;
        to: string;
        subject: string;
        templateId?: string | undefined;
    }, {
        body: string;
        to: string;
        subject: string;
        templateId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        body: string;
        to: string;
        subject: string;
        templateId?: string | undefined;
    };
}, {
    body: {
        body: string;
        to: string;
        subject: string;
        templateId?: string | undefined;
    };
}>;
export declare const createCampaignSchema: z.ZodObject<{
    body: z.ZodObject<{
        subject: z.ZodString;
        body: z.ZodString;
        templateId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        body: string;
        subject: string;
        templateId?: string | undefined;
    }, {
        body: string;
        subject: string;
        templateId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        body: string;
        subject: string;
        templateId?: string | undefined;
    };
}, {
    body: {
        body: string;
        subject: string;
        templateId?: string | undefined;
    };
}>;
export declare const sendCampaignSchema: z.ZodObject<{
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
}, {
    params: {
        id: string;
    };
}>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>['body'];
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>['body'];
export type SendEmailInput = z.infer<typeof sendEmailSchema>['body'];
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>['body'];
//# sourceMappingURL=email.schema.d.ts.map