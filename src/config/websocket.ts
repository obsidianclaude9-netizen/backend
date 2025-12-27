import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { JWTPayload } from '../middleware/auth';

let io: SocketIOServer;
let pubClient: ReturnType<typeof createClient>;
let subClient: ReturnType<typeof createClient>;

export const initializeWebSocket = async (httpServer: HTTPServer) => {
  pubClient = createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD
  });

  subClient = pubClient.duplicate();

  pubClient.on('error', (err: Error) => logger.error('Redis Pub Client Error:', err));
  subClient.on('error', (err: Error) => logger.error('Redis Sub Client Error:', err));

  pubClient.on('connect', () => logger.info('Redis Pub Client connected'));
  subClient.on('connect', () => logger.info('Redis Sub Client connected'));

  await Promise.all([
    pubClient.connect(),
    subClient.connect()
  ]);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient)
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    const userRole = socket.data.user.role;

    logger.info(`WebSocket connected: ${userId} (${socket.id})`);

    socket.join(`user:${userId}`);
    socket.join(`role:${userRole}`);

    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
      socket.join('admins');
    }

    if (userRole === 'STAFF' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      socket.join('staff');
    }

    socket.on('subscribe:order', (orderId: string) => {
      socket.join(`order:${orderId}`);
      logger.debug(`User ${userId} subscribed to order ${orderId}`);
    });

    socket.on('subscribe:ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
      logger.debug(`User ${userId} subscribed to ticket ${ticketId}`);
    });

    socket.on('unsubscribe:order', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('unsubscribe:ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${userId} (${socket.id}) - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${userId}:`, error);
    });
  });

  logger.info('WebSocket server initialized with Redis adapter');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

export const emitNotification = (userId: string, notification: any) => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
    logger.debug(`Notification emitted to user ${userId}`);
  }
};

export const emitToAdmins = (event: string, data: any) => {
  if (io) {
    io.to('admins').emit(event, data);
    logger.debug(`Event ${event} emitted to admins`);
  }
};

export const emitToStaff = (event: string, data: any) => {
  if (io) {
    io.to('staff').emit(event, data);
    logger.debug(`Event ${event} emitted to staff`);
  }
};

export const emitOrderUpdate = (orderId: string, data: any) => {
  if (io) {
    io.to(`order:${orderId}`).emit('order:update', data);
    logger.debug(`Order update emitted for ${orderId}`);
  }
};

export const emitTicketUpdate = (ticketId: string, data: any) => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit('ticket:update', data);
    logger.debug(`Ticket update emitted for ${ticketId}`);
  }
};

export const emitScanEvent = (scanData: any) => {
  if (io) {
    io.to('staff').emit('scan:new', scanData);
    logger.debug('Scan event emitted to staff');
  }
};

export const emitAnalyticsUpdate = (metric: string, data: any) => {
  if (io) {
    io.to('admins').emit('analytics:update', { metric, data, timestamp: Date.now() });
    logger.debug(`Analytics update emitted: ${metric}`);
  }
};

export const broadcastToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
    logger.debug(`Broadcast event: ${event}`);
  }
};

export const getConnectionStats = async () => {
  if (!io) return { connected: 0, rooms: [] };

  const sockets = await io.fetchSockets();
  const rooms = new Set<string>();

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

export const closeWebSocket = async () => {
  if (io) {
    io.close();
    logger.info('WebSocket server closed');
  }

  if (pubClient) {
    await pubClient.quit();
    logger.info('Redis Pub client disconnected');
  }

  if (subClient) {
    await subClient.quit();
    logger.info('Redis Sub client disconnected');
  }
};