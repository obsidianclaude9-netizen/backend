import { z } from 'zod';
export declare const updateRegionalSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        currency: z.ZodOptional<z.ZodString>;
        currencySymbol: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
        dateFormat: z.ZodOptional<z.ZodString>;
        timeFormat: z.ZodOptional<z.ZodEnum<["12", "24"]>>;
    }, "strip", z.ZodTypeAny, {
        currency?: string | undefined;
        currencySymbol?: string | undefined;
        timezone?: string | undefined;
        dateFormat?: string | undefined;
        timeFormat?: "12" | "24" | undefined;
    }, {
        currency?: string | undefined;
        currencySymbol?: string | undefined;
        timezone?: string | undefined;
        dateFormat?: string | undefined;
        timeFormat?: "12" | "24" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        currency?: string | undefined;
        currencySymbol?: string | undefined;
        timezone?: string | undefined;
        dateFormat?: string | undefined;
        timeFormat?: "12" | "24" | undefined;
    };
}, {
    body: {
        currency?: string | undefined;
        currencySymbol?: string | undefined;
        timezone?: string | undefined;
        dateFormat?: string | undefined;
        timeFormat?: "12" | "24" | undefined;
    };
}>;
export declare const updateOperatingHoursSchema: z.ZodObject<{
    body: z.ZodObject<{
        operatingDays: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        openingTime: z.ZodOptional<z.ZodString>;
        closingTime: z.ZodOptional<z.ZodString>;
        isOpen24Hours: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        operatingDays?: string[] | undefined;
        openingTime?: string | undefined;
        closingTime?: string | undefined;
        isOpen24Hours?: boolean | undefined;
    }, {
        operatingDays?: string[] | undefined;
        openingTime?: string | undefined;
        closingTime?: string | undefined;
        isOpen24Hours?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        operatingDays?: string[] | undefined;
        openingTime?: string | undefined;
        closingTime?: string | undefined;
        isOpen24Hours?: boolean | undefined;
    };
}, {
    body: {
        operatingDays?: string[] | undefined;
        openingTime?: string | undefined;
        closingTime?: string | undefined;
        isOpen24Hours?: boolean | undefined;
    };
}>;
export declare const updateEmailFooterSchema: z.ZodObject<{
    body: z.ZodObject<{
        emailFooter: z.ZodOptional<z.ZodString>;
        emailFooterEnabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        emailFooter?: string | undefined;
        emailFooterEnabled?: boolean | undefined;
    }, {
        emailFooter?: string | undefined;
        emailFooterEnabled?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        emailFooter?: string | undefined;
        emailFooterEnabled?: boolean | undefined;
    };
}, {
    body: {
        emailFooter?: string | undefined;
        emailFooterEnabled?: boolean | undefined;
    };
}>;
export declare const updatePaymentGatewaySchema: z.ZodObject<{
    body: z.ZodObject<{
        paystackEnabled: z.ZodOptional<z.ZodBoolean>;
        paystackPublicKey: z.ZodOptional<z.ZodString>;
        paystackSecretKey: z.ZodOptional<z.ZodString>;
        flutterwaveEnabled: z.ZodOptional<z.ZodBoolean>;
        flutterwavePublicKey: z.ZodOptional<z.ZodString>;
        flutterwaveSecretKey: z.ZodOptional<z.ZodString>;
        flutterwaveEncKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        paystackEnabled?: boolean | undefined;
        paystackPublicKey?: string | undefined;
        paystackSecretKey?: string | undefined;
        flutterwaveEnabled?: boolean | undefined;
        flutterwavePublicKey?: string | undefined;
        flutterwaveSecretKey?: string | undefined;
        flutterwaveEncKey?: string | undefined;
    }, {
        paystackEnabled?: boolean | undefined;
        paystackPublicKey?: string | undefined;
        paystackSecretKey?: string | undefined;
        flutterwaveEnabled?: boolean | undefined;
        flutterwavePublicKey?: string | undefined;
        flutterwaveSecretKey?: string | undefined;
        flutterwaveEncKey?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        paystackEnabled?: boolean | undefined;
        paystackPublicKey?: string | undefined;
        paystackSecretKey?: string | undefined;
        flutterwaveEnabled?: boolean | undefined;
        flutterwavePublicKey?: string | undefined;
        flutterwaveSecretKey?: string | undefined;
        flutterwaveEncKey?: string | undefined;
    };
}, {
    body: {
        paystackEnabled?: boolean | undefined;
        paystackPublicKey?: string | undefined;
        paystackSecretKey?: string | undefined;
        flutterwaveEnabled?: boolean | undefined;
        flutterwavePublicKey?: string | undefined;
        flutterwaveSecretKey?: string | undefined;
        flutterwaveEncKey?: string | undefined;
    };
}>;
export declare const updateTransactionSettingsSchema: z.ZodObject<{
    body: z.ZodObject<{
        autoConfirmPayment: z.ZodOptional<z.ZodBoolean>;
        allowPartialPayment: z.ZodOptional<z.ZodBoolean>;
        paymentTimeout: z.ZodOptional<z.ZodNumber>;
        sendPaymentReceipt: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        autoConfirmPayment?: boolean | undefined;
        allowPartialPayment?: boolean | undefined;
        paymentTimeout?: number | undefined;
        sendPaymentReceipt?: boolean | undefined;
    }, {
        autoConfirmPayment?: boolean | undefined;
        allowPartialPayment?: boolean | undefined;
        paymentTimeout?: number | undefined;
        sendPaymentReceipt?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        autoConfirmPayment?: boolean | undefined;
        allowPartialPayment?: boolean | undefined;
        paymentTimeout?: number | undefined;
        sendPaymentReceipt?: boolean | undefined;
    };
}, {
    body: {
        autoConfirmPayment?: boolean | undefined;
        allowPartialPayment?: boolean | undefined;
        paymentTimeout?: number | undefined;
        sendPaymentReceipt?: boolean | undefined;
    };
}>;
export declare const updateNotificationPreferencesSchema: z.ZodObject<{
    body: z.ZodObject<{
        emailNotifications: z.ZodOptional<z.ZodBoolean>;
        smsNotifications: z.ZodOptional<z.ZodBoolean>;
        pushNotifications: z.ZodOptional<z.ZodBoolean>;
        notifyOnNewOrder: z.ZodOptional<z.ZodBoolean>;
        notifyOnPayment: z.ZodOptional<z.ZodBoolean>;
        notifyLowInventory: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        emailNotifications?: boolean | undefined;
        smsNotifications?: boolean | undefined;
        pushNotifications?: boolean | undefined;
        notifyOnNewOrder?: boolean | undefined;
        notifyOnPayment?: boolean | undefined;
        notifyLowInventory?: boolean | undefined;
    }, {
        emailNotifications?: boolean | undefined;
        smsNotifications?: boolean | undefined;
        pushNotifications?: boolean | undefined;
        notifyOnNewOrder?: boolean | undefined;
        notifyOnPayment?: boolean | undefined;
        notifyLowInventory?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        emailNotifications?: boolean | undefined;
        smsNotifications?: boolean | undefined;
        pushNotifications?: boolean | undefined;
        notifyOnNewOrder?: boolean | undefined;
        notifyOnPayment?: boolean | undefined;
        notifyLowInventory?: boolean | undefined;
    };
}, {
    body: {
        emailNotifications?: boolean | undefined;
        smsNotifications?: boolean | undefined;
        pushNotifications?: boolean | undefined;
        notifyOnNewOrder?: boolean | undefined;
        notifyOnPayment?: boolean | undefined;
        notifyLowInventory?: boolean | undefined;
    };
}>;
//# sourceMappingURL=advancedSettings.schema.d.ts.map