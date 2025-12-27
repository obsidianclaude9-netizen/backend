"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPreferencesSchema = exports.updateTransactionSettingsSchema = exports.updatePaymentGatewaySchema = exports.updateEmailFooterSchema = exports.updateOperatingHoursSchema = exports.updateRegionalSettingsSchema = void 0;
const zod_1 = require("zod");
exports.updateRegionalSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        currency: zod_1.z.string().length(3).optional(),
        currencySymbol: zod_1.z.string().max(5).optional(),
        timezone: zod_1.z.string().optional(),
        dateFormat: zod_1.z.string().optional(),
        timeFormat: zod_1.z.enum(['12', '24']).optional(),
    }),
});
exports.updateOperatingHoursSchema = zod_1.z.object({
    body: zod_1.z.object({
        operatingDays: zod_1.z.array(zod_1.z.string()).optional(),
        openingTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        closingTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        isOpen24Hours: zod_1.z.boolean().optional(),
    }),
});
exports.updateEmailFooterSchema = zod_1.z.object({
    body: zod_1.z.object({
        emailFooter: zod_1.z.string().max(1000).optional(),
        emailFooterEnabled: zod_1.z.boolean().optional(),
    }),
});
exports.updatePaymentGatewaySchema = zod_1.z.object({
    body: zod_1.z.object({
        paystackEnabled: zod_1.z.boolean().optional(),
        paystackPublicKey: zod_1.z.string().optional(),
        paystackSecretKey: zod_1.z.string().optional(),
        flutterwaveEnabled: zod_1.z.boolean().optional(),
        flutterwavePublicKey: zod_1.z.string().optional(),
        flutterwaveSecretKey: zod_1.z.string().optional(),
        flutterwaveEncKey: zod_1.z.string().optional(),
    }),
});
exports.updateTransactionSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        autoConfirmPayment: zod_1.z.boolean().optional(),
        allowPartialPayment: zod_1.z.boolean().optional(),
        paymentTimeout: zod_1.z.number().int().min(5).max(120).optional(),
        sendPaymentReceipt: zod_1.z.boolean().optional(),
    }),
});
exports.updateNotificationPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        emailNotifications: zod_1.z.boolean().optional(),
        smsNotifications: zod_1.z.boolean().optional(),
        pushNotifications: zod_1.z.boolean().optional(),
        notifyOnNewOrder: zod_1.z.boolean().optional(),
        notifyOnPayment: zod_1.z.boolean().optional(),
        notifyLowInventory: zod_1.z.boolean().optional(),
    }),
});
//# sourceMappingURL=advancedSettings.schema.js.map