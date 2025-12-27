"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = exports.getTicketStats = exports.getScanHistory = exports.scanTicket = exports.validateTicket = exports.cancelTicket = exports.updateTicket = exports.getTicketByCode = exports.getTicket = exports.listTickets = exports.createTickets = void 0;
const ticket_service_1 = require("./ticket.service");
const errorHandler_1 = require("../../middleware/errorHandler");
const ticketService = new ticket_service_1.TicketService();
exports.createTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const tickets = await ticketService.createTickets(req.body);
    res.status(201).json({ tickets, count: tickets.length });
});
exports.listTickets = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await ticketService.listTickets(req.query);
    res.json(result);
});
exports.getTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ticket = await ticketService.getTicket(req.params.id);
    res.json(ticket);
});
exports.getTicketByCode = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ticket = await ticketService.getTicketByCode(req.params.code);
    res.json(ticket);
});
exports.updateTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ticket = await ticketService.updateTicket(req.params.id, req.body);
    res.json(ticket);
});
exports.cancelTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const ticket = await ticketService.cancelTicket(req.params.id);
    res.json(ticket);
});
exports.validateTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await ticketService.validateTicket(req.body);
    res.json(result);
});
exports.scanTicket = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await ticketService.scanTicket(req.body);
    res.json(result);
});
exports.getScanHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const scans = await ticketService.getScanHistory({
        ticketId: req.query.ticketId,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    });
    res.json(scans);
});
exports.getTicketStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await ticketService.getTicketStats();
    res.json(stats);
});
exports.getSettings = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const settings = await ticketService.getSettings();
    res.json(settings);
});
exports.updateSettings = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const settings = await ticketService.updateSettings(req.body);
    res.json(settings);
});
//# sourceMappingURL=ticket.controller.js.map