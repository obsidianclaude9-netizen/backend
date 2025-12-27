"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.terminateAllSessions = exports.terminateSession = exports.getActiveSessions = exports.getLoginActivities = exports.updateNotificationPreferences = exports.updateTransactionSettings = exports.updatePaymentGateway = exports.updateEmailFooter = exports.updateOperatingHours = exports.updateRegionalSettings = exports.getAllSettings = void 0;
const advancedSettings_service_1 = require("./advancedSettings.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const settingsService = new advancedSettings_service_1.AdvancedSettingsService();
exports.getAllSettings = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
});
exports.updateRegionalSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateRegionalSettings(req.body);
    res.json(settings);
});
exports.updateOperatingHours = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateOperatingHours(req.body);
    res.json(settings);
});
exports.updateEmailFooter = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateEmailFooter(req.body);
    res.json(settings);
});
exports.updatePaymentGateway = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updatePaymentGateway(req.body);
    res.json(settings);
});
exports.updateTransactionSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateTransactionSettings(req.body);
    res.json(settings);
});
exports.updateNotificationPreferences = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateNotificationPreferences(req.body);
    res.json(settings);
});
exports.getLoginActivities = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 50;
    const activities = await settingsService.getLoginActivities(userId, limit);
    res.json(activities);
});
exports.getActiveSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.query.userId;
    const sessions = await settingsService.getActiveSessions(userId);
    res.json(sessions);
});
exports.terminateSession = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await settingsService.terminateSession(req.params.sessionId, req.user.userId);
    res.json(result);
});
exports.terminateAllSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const exceptCurrent = req.query.exceptCurrent === 'true';
    const currentSessionId = req.body.currentSessionId;
    const result = await settingsService.terminateAllSessions(req.user.userId, exceptCurrent ? currentSessionId : undefined);
    res.json(result);
});
//# sourceMappingURL=advancedSettings.controller.js.map