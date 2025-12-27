"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCampaign = exports.listCampaigns = exports.createCampaign = exports.testSMTP = exports.sendEmail = exports.deleteTemplate = exports.updateTemplate = exports.getTemplate = exports.listTemplates = exports.createTemplate = void 0;
const email_service_1 = require("./email.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const emailService = new email_service_1.EmailService();
// Templates
exports.createTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const template = await emailService.createTemplate(req.body);
    res.status(201).json(template);
});
exports.listTemplates = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await emailService.listTemplates(page, limit);
    res.json(result);
});
exports.getTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const template = await emailService.getTemplate(req.params.id);
    res.json(template);
});
exports.updateTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const template = await emailService.updateTemplate(req.params.id, req.body);
    res.json(template);
});
exports.deleteTemplate = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await emailService.deleteTemplate(req.params.id);
    res.json(result);
});
// Email sending
exports.sendEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await emailService.sendSingleEmail(req.body);
    res.json(result);
});
exports.testSMTP = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await emailService.testSMTP(req.body.email);
    res.json(result);
});
// Campaigns
exports.createCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const campaign = await emailService.createCampaign(req.body);
    res.status(201).json(campaign);
});
exports.listCampaigns = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await emailService.listCampaigns(page, limit);
    res.json(result);
});
exports.sendCampaign = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await emailService.sendCampaign(req.params.id);
    res.json(result);
});
//# sourceMappingURL=email.controller.js.map