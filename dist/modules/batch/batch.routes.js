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
// src/modules/batch/batch.routes.ts
const express_1 = require("express");
const batchController = __importStar(require("./batch.controller"));
const auth_1 = require("../../middleware/auth");
const audit_1 = require("../../middleware/audit");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT, auth_1.requireAdmin);
router.post('/tickets/create', (0, audit_1.auditLog)('BULK_CREATE_TICKETS', 'BATCH'), batchController.bulkCreateTickets);
router.post('/tickets/cancel', (0, audit_1.auditLog)('BULK_CANCEL_TICKETS', 'BATCH'), batchController.bulkCancelTickets);
router.post('/tickets/update-sessions', (0, audit_1.auditLog)('BULK_UPDATE_SESSIONS', 'BATCH'), batchController.bulkUpdateSessions);
router.post('/customers/import', (0, audit_1.auditLog)('BULK_IMPORT_CUSTOMERS', 'BATCH'), batchController.bulkImportCustomers);
router.post('/emails/send', (0, audit_1.auditLog)('BULK_SEND_EMAILS', 'BATCH'), batchController.bulkSendEmails);
exports.default = router;
//# sourceMappingURL=batch.routes.js.map