"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkSendEmails = exports.bulkImportCustomers = exports.bulkUpdateSessions = exports.bulkCancelTickets = exports.bulkCreateTickets = void 0;
const batch_service_1 = require("./batch.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const batchService = new batch_service_1.BatchService();
exports.bulkCreateTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await batchService.bulkCreateTickets(req.body);
    res.json(result);
});
exports.bulkCancelTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await batchService.bulkCancelTickets(req.body.ticketIds);
    res.json(result);
});
exports.bulkUpdateSessions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await batchService.bulkUpdateSessions(req.body.ticketIds, req.body.newSession);
    res.json(result);
});
exports.bulkImportCustomers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await batchService.bulkImportCustomers(req.body.customers);
    res.json(result);
});
exports.bulkSendEmails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await batchService.bulkSendEmails(req.body);
    res.json(result);
});
//# sourceMappingURL=batch.controller.js.map