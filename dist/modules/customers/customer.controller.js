"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadDocument = exports.deleteDocument = exports.uploadDocument = exports.getCustomerStats = exports.getCustomerOrders = exports.deleteCustomer = exports.updateCustomer = exports.getCustomer = exports.listCustomers = exports.createCustomer = void 0;
const customer_service_1 = require("./customer.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const customerService = new customer_service_1.CustomerService();
exports.createCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    const customer = await customerService.createCustomer(data);
    res.status(201).json(customer);
});
exports.listCustomers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await customerService.listCustomers(filters);
    res.json(result);
});
exports.getCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const customer = await customerService.getCustomer(id);
    res.json(customer);
});
exports.updateCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const customer = await customerService.updateCustomer(id, data);
    res.json(customer);
});
exports.deleteCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await customerService.deleteCustomer(id);
    res.json(result);
});
exports.getCustomerOrders = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await customerService.getCustomerOrders(id, page, limit);
    res.json(result);
});
exports.getCustomerStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await customerService.getCustomerStats();
    res.json(stats);
});
exports.uploadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const result = await customerService.uploadDocument(id, req.file);
    res.json(result);
});
exports.deleteDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await customerService.deleteDocument(id);
    res.json(result);
});
exports.downloadDocument = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const document = await customerService.getDocument(id);
    res.download(document.path, document.name || 'document');
});
//# sourceMappingURL=customer.controller.js.map