"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController = __importStar(require("./advancedSettings.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const audit_1 = require("../../middleware/audit");
const advancedSettings_schema_1 = require("./advancedSettings.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT, auth_1.requireSuperAdmin);
// Get all settings
router.get('/all', settingsController.getAllSettings);
// Regional settings
router.patch('/regional', (0, validate_1.validate)(advancedSettings_schema_1.updateRegionalSettingsSchema), (0, audit_1.auditLog)('UPDATE_REGIONAL_SETTINGS', 'SETTINGS'), settingsController.updateRegionalSettings);
// Operating hours
router.patch('/operating-hours', (0, validate_1.validate)(advancedSettings_schema_1.updateOperatingHoursSchema), (0, audit_1.auditLog)('UPDATE_OPERATING_HOURS', 'SETTINGS'), settingsController.updateOperatingHours);
// Email footer
router.patch('/email-footer', (0, validate_1.validate)(advancedSettings_schema_1.updateEmailFooterSchema), (0, audit_1.auditLog)('UPDATE_EMAIL_FOOTER', 'SETTINGS'), settingsController.updateEmailFooter);
// Payment gateway
router.patch('/payment-gateway', (0, validate_1.validate)(advancedSettings_schema_1.updatePaymentGatewaySchema), (0, audit_1.auditLog)('UPDATE_PAYMENT_GATEWAY', 'SETTINGS'), settingsController.updatePaymentGateway);
// Transaction settings
router.patch('/transaction', (0, validate_1.validate)(advancedSettings_schema_1.updateTransactionSettingsSchema), (0, audit_1.auditLog)('UPDATE_TRANSACTION_SETTINGS', 'SETTINGS'), settingsController.updateTransactionSettings);
// Notification preferences
router.patch('/notifications', (0, validate_1.validate)(advancedSettings_schema_1.updateNotificationPreferencesSchema), (0, audit_1.auditLog)('UPDATE_NOTIFICATION_PREFERENCES', 'SETTINGS'), settingsController.updateNotificationPreferences);
// Login activity & sessions
router.get('/login-activity', settingsController.getLoginActivities);
router.get('/sessions', settingsController.getActiveSessions);
router.delete('/sessions/:sessionId', settingsController.terminateSession);
router.delete('/sessions', settingsController.terminateAllSessions);
exports.default = router;
//# sourceMappingURL=advancedSettings.routes.js.map