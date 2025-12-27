export declare class PaymentService {
    private readonly paystackSecretKey;
    private readonly baseURL;
    /**
     * Initialize payment
     */
    initializePayment(orderId: string): Promise<{
        authorizationUrl: any;
        accessCode: any;
        reference: any;
    }>;
    /**
     * Verify payment
     */
    verifyPayment(reference: string): Promise<{
        status: any;
        reference: any;
        amount: number;
        paidAt: any;
        channel: any;
        metadata: any;
    }>;
    /**
     * Handle webhook event
     */
    handleWebhook(payload: any, signature: string): Promise<{
        message: string;
    }>;
    /**
     * Handle successful payment
     */
    private handleSuccessfulPayment;
    /**
     * Handle failed payment
     */
    private handleFailedPayment;
}
//# sourceMappingURL=payment.service.d.ts.map