"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateUser = exports.getUser = exports.listUsers = exports.changePassword = exports.updateUser = exports.createUser = exports.logout = exports.getCurrentUser = exports.refreshToken = exports.login = void 0;
const auth_service_1 = require("./auth.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const authService = new auth_service_1.AuthService();
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.refreshToken(req.body.refreshToken);
    res.json(result);
});
exports.getCurrentUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.getCurrentUser(req.user.userId);
    res.json(user);
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.json({ message: 'Logged out successfully' });
});
exports.createUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.createUser(req.body);
    res.status(201).json(user);
});
exports.updateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.updateUser(req.params.id, req.body);
    res.json(user);
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.changePassword(req.params.id, req.body);
    res.json(result);
});
exports.listUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await authService.listUsers(page, limit);
    res.json(result);
});
exports.getUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const user = await authService.getCurrentUser(req.params.id);
    res.json(user);
});
exports.deactivateUser = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.deactivateUser(req.params.id);
    res.json(result);
});
//# sourceMappingURL=auth.controller.js.map