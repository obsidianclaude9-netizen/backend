import { CreateTemplateInput, UpdateTemplateInput, SendEmailInput, CreateCampaignInput } from './email.schema';
export declare class EmailService {
    private sanitizeHTML;
    /**
     * Create email template
     */
    createTemplate(data: CreateTemplateInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        body: string;
        subject: string;
        category: string;
    }>;
    /**
     * List templates
     */
    listTemplates(page?: number, limit?: number): Promise<{
        templates: {
            status: string;
            id: string;
            updatedAt: Date;
            name: string;
            createdAt: Date;
            body: string;
            subject: string;
            category: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get template
     */
    getTemplate(templateId: string): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        body: string;
        subject: string;
        category: string;
    }>;
    /**
     * Update template
     */
    updateTemplate(templateId: string, data: UpdateTemplateInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        createdAt: Date;
        body: string;
        subject: string;
        category: string;
    }>;
    /**
     * Delete template
     */
    deleteTemplate(templateId: string): Promise<{
        message: string;
    }>;
    /**
     * Send individual email
     */
    sendSingleEmail(data: SendEmailInput): Promise<{
        message: string;
    }>;
    /**
     * Create campaign
     */
    createCampaign(data: CreateCampaignInput): Promise<{
        status: import(".prisma/client").$Enums.CampaignStatus;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        body: string;
        subject: string;
        templateId: string | null;
        sentTo: number;
        openedCount: number;
        clickedCount: number;
        sentAt: Date | null;
    }>;
    /**
     * Send campaign
     */
    sendCampaign(campaignId: string): Promise<{
        message: string;
    }>;
    /**
     * List campaigns
     */
    listCampaigns(page?: number, limit?: number): Promise<{
        campaigns: ({
            template: {
                name: string;
            } | null;
        } & {
            status: import(".prisma/client").$Enums.CampaignStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            body: string;
            subject: string;
            templateId: string | null;
            sentTo: number;
            openedCount: number;
            clickedCount: number;
            sentAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Test SMTP configuration
     */
    testSMTP(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=email.service.d.ts.map