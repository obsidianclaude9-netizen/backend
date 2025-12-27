"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeWebSocket = exports.getConnectionStats = exports.broadcastToAll = exports.emitAnalyticsUpdate = exports.emitScanEvent = exports.emitTicketUpdate = exports.emitOrderUpdate = exports.emitToStaff = exports.emitToAdmins = exports.emitNotification = exports.getIO = exports.initializeWebSocket = void 0;
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_1 = require("redis");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
let io;
let pubClient;
let subClient;
const initializeWebSocket = async (httpServer) => {
    pubClient = (0, redis_1.createClient)({
        url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        password: process.env.REDIS_PASSWORD
    });
    subClient = pubClient.duplicate();
    pubClient.on('error', (err) => logger_1.logger.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => logger_1.logger.error('Redis Sub Client Error:', err));
    pubClient.on('connect', () => logger_1.logger.info('Redis Pub Client connected'));
    subClient.on('connect', () => logger_1.logger.info('Redis Sub Client connected'));
    await Promise.all([
        pubClient.connect(),
        subClient.connect()
    ]);
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
            credentials: true,
        },
        adapter: (0, redis_adapter_1.createAdapter)(pubClient, subClient)
    });
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
        logger_1.logger.info(`WebSocket connected: ${userId} (${socket.id})`);
        socket.join(`user:${userId}`);
        socket.join(`role:${userRole}`);
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
            socket.join('admins');
        }
        if (userRole === 'STAFF' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
            socket.join('staff');
        }
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
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
        socket.on('disconnect', (reason) => {
            logger_1.logger.info(`WebSocket disconnected: ${userId} (${socket.id}) - Reason: ${reason}`);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`WebSocket error for ${userId}:`, error);
        });
    });
    logger_1.logger.info('WebSocket server initialized with Redis adapter');
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
const emitNotification = (userId, notification) => {
    if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
        logger_1.logger.debug(`Notification emitted to user ${userId}`);
    }
};
exports.emitNotification = emitNotification;
const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admins').emit(event, data);
        logger_1.logger.debug(`Event ${event} emitted to admins`);
    }
};
exports.emitToAdmins = emitToAdmins;
const emitToStaff = (event, data) => {
    if (io) {
        io.to('staff').emit(event, data);
        logger_1.logger.debug(`Event ${event} emitted to staff`);
    }
};
exports.emitToStaff = emitToStaff;
const emitOrderUpdate = (orderId, data) => {
    if (io) {
        io.to(`order:${orderId}`).emit('order:update', data);
        logger_1.logger.debug(`Order update emitted for ${orderId}`);
    }
};
exports.emitOrderUpdate = emitOrderUpdate;
const emitTicketUpdate = (ticketId, data) => {
    if (io) {
        io.to(`ticket:${ticketId}`).emit('ticket:update', data);
        logger_1.logger.debug(`Ticket update emitted for ${ticketId}`);
    }
};
exports.emitTicketUpdate = emitTicketUpdate;
const emitScanEvent = (scanData) => {
    if (io) {
        io.to('staff').emit('scan:new', scanData);
        logger_1.logger.debug('Scan event emitted to staff');
    }
};
exports.emitScanEvent = emitScanEvent;
const emitAnalyticsUpdate = (metric, data) => {
    if (io) {
        io.to('admins').emit('analytics:update', { metric, data, timestamp: Date.now() });
        logger_1.logger.debug(`Analytics update emitted: ${metric}`);
    }
};
exports.emitAnalyticsUpdate = emitAnalyticsUpdate;
const broadcastToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
        logger_1.logger.debug(`Broadcast event: ${event}`);
    }
};
exports.broadcastToAll = broadcastToAll;
const getConnectionStats = async () => {
    if (!io)
        return { connected: 0, rooms: [] };
    const sockets = await io.fetchSockets();
    const rooms = new Set();
    sockets.forEach(socket => {
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                rooms.add(room);
            }
        });
    });
    return {
        connected: sockets.length,
        rooms: Array.from(rooms),
        serverCount: io.engine.clientsCount
    };
};
exports.getConnectionStats = getConnectionStats;
const closeWebSocket = async () => {
    if (io) {
        io.close();
        logger_1.logger.info('WebSocket server closed');
    }
    if (pubClient) {
        await pubClient.quit();
        logger_1.logger.info('Redis Pub client disconnected');
    }
    if (subClient) {
        await subClient.quit();
        logger_1.logger.info('Redis Sub client disconnected');
    }
};
exports.closeWebSocket = closeWebSocket;
//# sourceMappingURL=websocket.js.map