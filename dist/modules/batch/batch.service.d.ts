export declare class BatchService {
    /**
     * Bulk create tickets
     */
    bulkCreateTickets(data: {
        orderId: string;
        gameSession: string;
        quantity: number;
        validityDays?: number;
    }): Promise<{
        created: number;
        tickets: {
            ticketCode: string;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            maxScans: number;
            scanWindow: number;
            status: "ACTIVE";
        }[];
    }>;
    /**
     * Bulk cancel tickets
     */
    bulkCancelTickets(ticketIds: string[]): Promise<{
        cancelled: number;
        requested: number;
    }>;
    /**
     * Bulk update ticket sessions
     */
    bulkUpdateSessions(ticketIds: string[], newSession: string): Promise<{
        updated: number;
        newSession: string;
    }>;
    /**
     * Bulk import customers from CSV
     */
    bulkImportCustomers(customers: Array<{
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        location: string;
    }>): Promise<{
        created: number;
        updated: number;
        failed: number;
        errors: Array<{
            email: string;
            error: string;
        }>;
    }>;
    /**
     * Bulk send emails
     */
    bulkSendEmails(data: {
        customerIds: string[];
        subject: string;
        body: string;
    }): Promise<{
        queued: number;
        requested: number;
    }>;
    /**
     * Get batch operation status
     */
    getBatchStatus(batchId: string): Promise<any>;
}
//# sourceMappingURL=batch.service.d.ts.map