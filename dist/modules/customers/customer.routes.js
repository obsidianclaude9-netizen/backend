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
// src/modules/customers/customer.routes.ts
const express_1 = require("express");
const customerController = __importStar(require("./customer.controller"));
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const audit_1 = require("../../middleware/audit");
const customer_schema_1 = require("./customer.schema");
const upload_1 = require("../../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.get('/', (0, validate_1.validate)(customer_schema_1.listCustomersSchema), customerController.listCustomers);
router.get('/stats', customerController.getCustomerStats);
router.get('/:id', customerController.getCustomer);
router.get('/:id/orders', customerController.getCustomerOrders);
router.post('/', auth_1.requireAdmin, (0, validate_1.validate)(customer_schema_1.createCustomerSchema), (0, audit_1.auditLog)('CREATE_CUSTOMER', 'CUSTOMER'), customerController.createCustomer);
router.patch('/:id', auth_1.requireAdmin, (0, validate_1.validate)(customer_schema_1.updateCustomerSchema), (0, audit_1.auditLog)('UPDATE_CUSTOMER', 'CUSTOMER'), customerController.updateCustomer);
router.delete('/:id', auth_1.requireAdmin, (0, audit_1.auditLog)('DELETE_CUSTOMER', 'CUSTOMER'), customerController.deleteCustomer);
router.post('/:id/document', auth_1.requireAdmin, upload_1.uploadCustomerDoc, (0, audit_1.auditLog)('UPLOAD_DOCUMENT', 'CUSTOMER'), customerController.uploadDocument);
router.delete('/:id/document', auth_1.requireAdmin, (0, audit_1.auditLog)('DELETE_DOCUMENT', 'CUSTOMER'), customerController.deleteDocument);
router.get('/:id/document', customerController.downloadDocument);
exports.default = router;
//# sourceMappingURL=customer.routes.js.map