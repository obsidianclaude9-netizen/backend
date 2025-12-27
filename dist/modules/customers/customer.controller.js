"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStats = exports.getCustomerOrders = exports.deleteCustomer = exports.updateCustomer = exports.getCustomer = exports.listCustomers = exports.createCustomer = exports.downloadDocument = exports.deleteDocument = exports.uploadDocument = void 0;
const customer_service_1 = require("./customer.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const customerService = new customer_service_1.CustomerService();
exports.uploadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        throw new errorHandler_1.AppError(400, 'No file uploaded');
    }
    const result = await customerService.uploadDocument(req.params.id, req.file);
    res.json(result);
});
exports.deleteDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await customerService.deleteDocument(req.params.id);
    res.json(result);
});
exports.downloadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const doc = await customerService.getDocument(req.params.id);
    res.download(doc.path, doc.name || 'document');
});
exports.createCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json(customer);
});
exports.listCustomers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await customerService.listCustomers(req.query);
    res.json(result);
});
exports.getCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customer = await customerService.getCustomer(req.params.id);
    res.json(customer);
});
exports.updateCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    res.json(customer);
});
exports.deleteCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await customerService.deleteCustomer(req.params.id);
    res.json(result);
});
exports.getCustomerOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await customerService.getCustomerOrders(req.params.id, page, limit);
    res.json(result);
});
exports.getCustomerStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await customerService.getCustomerStats();
    res.json(stats);
});
//# sourceMappingURL=customer.controller.js.map