export declare class AdvancedSettingsService {
    getAllSettings(): Promise<{
        smtpPassword: string;
        paystackSecretKey: string;
        flutterwaveSecretKey: string;
        flutterwaveEncKey: string;
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    updateRegionalSettings(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    updateOperatingHours(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    updateEmailFooter(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    updatePaymentGateway(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    updateTransactionSettings(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    /**
     * Update notification preferences
     */
    updateNotificationPreferences(data: any): Promise<{
        id: number;
        businessName: string;
        businessEmail: string;
        businessPhone: string;
        businessAddress: string | null;
        businessLogo: string | null;
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        senderName: string;
        senderEmail: string;
        currency: string;
        currencySymbol: string;
        timezone: string;
        dateFormat: string;
        timeFormat: string;
        operatingDays: import("@prisma/client/runtime/library").JsonValue;
        openingTime: string;
        closingTime: string;
        isOpen24Hours: boolean;
        emailFooter: string;
        emailFooterEnabled: boolean;
        paystackEnabled: boolean;
        paystackPublicKey: string | null;
        paystackSecretKey: string | null;
        flutterwaveEnabled: boolean;
        flutterwavePublicKey: string | null;
        flutterwaveSecretKey: string | null;
        flutterwaveEncKey: string | null;
        autoConfirmPayment: boolean;
        allowPartialPayment: boolean;
        paymentTimeout: number;
        sendPaymentReceipt: boolean;
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        notifyOnNewOrder: boolean;
        notifyOnPayment: boolean;
        notifyLowInventory: boolean;
        updatedAt: Date;
    }>;
    /**
     * Get login activities
     */
    getLoginActivities(userId?: string, limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        timestamp: Date;
        status: string;
        userAgent: string;
        ipAddress: string;
        id: string;
        userId: string;
        device: string | null;
        location: string | null;
    })[]>;
    /**
     * Get active sessions
     */
    getActiveSessions(userId?: string): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        userAgent: string;
        ipAddress: string;
        id: string;
        userId: string;
        device: string | null;
        location: string | null;
        createdAt: Date;
        token: string;
        lastActive: Date;
        expiresAt: Date;
    })[]>;
    /**
     * Terminate session
     */
    terminateSession(sessionId: string, userId: string): Promise<{
        message: string;
    }>;
    /**
     * Terminate all sessions except current
     */
    terminateAllSessions(userId: string, exceptSessionId?: string): Promise<{
        message: string;
    }>;
    /**
     * Helper: Get default settings
     */
    private getDefaultSettings;
    /**
     * Helper: Create default settings
     */
    private createDefaultSettings;
}
//# sourceMappingURL=advancedSettings.service.d.ts.map