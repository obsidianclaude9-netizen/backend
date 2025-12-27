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
// src/modules/email/email.routes.ts
const express_1 = require("express");
const emailController = __importStar(require("./email.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const rateLimit_1 = require("../../middleware/rateLimit");
const audit_1 = require("../../middleware/audit");
const email_schema_1 = require("./email.schema");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT, auth_1.requireAdmin);
// Templates
router.get('/templates', emailController.listTemplates);
router.get('/templates/:id', emailController.getTemplate);
router.post('/templates', (0, validate_1.validate)(email_schema_1.createTemplateSchema), (0, audit_1.auditLog)('CREATE_TEMPLATE', 'EMAIL'), emailController.createTemplate);
router.patch('/templates/:id', (0, validate_1.validate)(email_schema_1.updateTemplateSchema), (0, audit_1.auditLog)('UPDATE_TEMPLATE', 'EMAIL'), emailController.updateTemplate);
router.delete('/templates/:id', (0, audit_1.auditLog)('DELETE_TEMPLATE', 'EMAIL'), emailController.deleteTemplate);
// Send email
router.post('/send', rateLimit_1.emailLimiter, (0, validate_1.validate)(email_schema_1.sendEmailSchema), (0, audit_1.auditLog)('SEND_EMAIL', 'EMAIL'), emailController.sendEmail);
router.post('/test', emailController.testSMTP);
// Campaigns
router.get('/campaigns', emailController.listCampaigns);
router.post('/campaigns', (0, validate_1.validate)(email_schema_1.createCampaignSchema), (0, audit_1.auditLog)('CREATE_CAMPAIGN', 'CAMPAIGN'), emailController.createCampaign);
router.post('/campaigns/:id/send', (0, validate_1.validate)(email_schema_1.sendCampaignSchema), (0, audit_1.auditLog)('SEND_CAMPAIGN', 'CAMPAIGN'), emailController.sendCampaign);
exports.default = router;
//# sourceMappingURL=email.routes.js.map