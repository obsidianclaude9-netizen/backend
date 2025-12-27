"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitScanEvent = exports.emitTicketUpdate = exports.emitOrderUpdate = exports.emitToAdmins = exports.emitNotification = exports.getIO = exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
let io;
const initializeWebSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
            credentials: true,
        },
    });
    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.user.userId;
        const userRole = socket.data.user.role;
        logger_1.logger.info(`WebSocket connected: ${userId}`);
        // Join user-specific room
        socket.join(`user:${userId}`);
        // Join role-specific rooms
        socket.join(`role:${userRole}`);
        // Admin joins admin room
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
            socket.join('admins');
        }
        // Handle client events
        socket.on('subscribe:order', (orderId) => {
            socket.join(`order:${orderId}`);
            logger_1.logger.debug(`User ${userId} subscribed to order ${orderId}`);
        });
        socket.on('subscribe:ticket', (ticketId) => {
            socket.join(`ticket:${ticketId}`);
            logger_1.logger.debug(`User ${userId} subscribed to ticket ${ticketId}`);
        });
        socket.on('unsubscribe:order', (orderId) => {
            socket.leave(`order:${orderId}`);
        });
        socket.on('unsubscribe:ticket', (ticketId) => {
            socket.leave(`ticket:${ticketId}`);
        });
        socket.on('disconnect', () => {
            logger_1.logger.info(`WebSocket disconnected: ${userId}`);
        });
    });
    logger_1.logger.info('WebSocket server initialized');
    return io;
};
exports.initializeWebSocket = initializeWebSocket;
const getIO = () => {
    if (!io) {
        throw new Error('WebSocket not initialized');
    }
    return io;
};
exports.getIO = getIO;
// Notification emitters
const emitNotification = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
    }
};
exports.emitNotification = emitNotification;
const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admins').emit(event, data);
    }
};
exports.emitToAdmins = emitToAdmins;
const emitOrderUpdate = (orderId, data) => {
    if (io) {
        io.to(`order:${orderId}`).emit('order:update', data);
    }
};
exports.emitOrderUpdate = emitOrderUpdate;
const emitTicketUpdate = (ticketId, data) => {
    if (io) {
        io.to(`ticket:${ticketId}`).emit('ticket:update', data);
    }
};
exports.emitTicketUpdate = emitTicketUpdate;
const emitScanEvent = (scanData) => {
    if (io) {
        io.to('admins').emit('scan:new', scanData);
    }
};
exports.emitScanEvent = emitScanEvent;
//# sourceMappingURL=websocket.js.map