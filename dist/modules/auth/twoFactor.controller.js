"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateBackupCodes = exports.disableTwoFactor = exports.verifyToken = exports.enableTwoFactor = exports.generateSecret = void 0;
const twoFactor_service_1 = require("./twoFactor.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const twoFactorService = new twoFactor_service_1.TwoFactorService();
exports.generateSecret = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await twoFactorService.generateSecret(req.user.userId);
    res.json(result);
});
exports.enableTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await twoFactorService.enableTwoFactor(req.user.userId, req.body.token);
    res.json(result);
});
exports.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await twoFactorService.verifyToken(req.user.userId, req.body.token, req.body.isBackupCode);
    res.json({ valid: result });
});
exports.disableTwoFactor = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await twoFactorService.disableTwoFactor(req.user.userId, req.body.password);
    res.json(result);
});
exports.regenerateBackupCodes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await twoFactorService.regenerateBackupCodes(req.user.userId, req.body.password);
    res.json(result);
});
//# sourceMappingURL=twoFactor.controller.js.map