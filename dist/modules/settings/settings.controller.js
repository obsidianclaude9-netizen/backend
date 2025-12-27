"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemSettings = exports.getSystemSettings = void 0;
const settings_service_1 = require("./settings.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const settingsService = new settings_service_1.SettingsService();
exports.getSystemSettings = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const settings = await settingsService.getSystemSettings();
    res.json(settings);
});
exports.updateSystemSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await settingsService.updateSystemSettings(req.body);
    res.json(settings);
});
//# sourceMappingURL=settings.controller.js.map