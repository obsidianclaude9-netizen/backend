// src/config/websocket.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import prisma from './database';
import { RateLimiterMemory } from 'rate-limiter-flexible'
let io: Server;

interface SocketUser {
  userId: string;   
  id: string;
  email: string;
  role: string;
}

interface AuthSocket extends Socket {
  user?: SocketUser;
}
const scanRateLimiter = new RateLimiterMemory({
  points: 30,          // 30 scans
  duration: 60,        // per 60 seconds
  blockDuration: 120,  // Block for 2 minutes if exceeded
});

const orderRateLimiter = new RateLimiterMemory({
  points: 10,          // 10 order updates
  duration: 60,        // per 60 seconds
  blockDuration: 300,  // Block for 5 minutes
});

const analyticsRateLimiter = new RateLimiterMemory({
  points: 5,           // 5 analytics subscriptions
  duration: 60,
  blockDuration: 600,  // Block for 10 minutes
});
const checkRateLimit = async (
  limiter: RateLimiterMemory,
  key: string,
  socket: AuthSocket,
  eventName: string
): Promise<boolean> => {
  try {
    await limiter.consume(key);
    return true;
  } catch (rejRes: any) {
    logger.warn(`WebSocket rate limit exceeded`, {
      userId: socket.user?.userId,
      event: eventName,
      ip: socket.handshake.address,
      retryAfter: rejRes.msBeforeNext || 0
    });

    socket.emit('rate_limit_exceeded', {
      event: eventName,
      retryAfter: Math.ceil((rejRes.msBeforeNext || 0) / 1000),
      message: 'Rate limit exceeded. Please slow down.'
    });

    return false;
  }
};

export const initializeWebSocket = async (server: HTTPServer): Promise<void> => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, jwtSecret) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error: any) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    logger.info(`Client connected: ${socket.id} (User: ${socket.user?.email})`);

    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      
      if (socket.user.role === 'ADMIN' || socket.user.role === 'SUPER_ADMIN') {
        socket.join('admins');
      }
    }

    socket.on('scan:ticket', async (data) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }
        const allowed = await checkRateLimit(
          scanRateLimiter,
          socket.user.userId,
          socket,
          'scan:ticket'
        );
        if (!allowed) return;

        logger.info(`Ticket scan event from ${socket.user.email}:`, data);
        
        io.to('admins').emit('scan:new', {
          ticketCode: data.ticketCode,
          scannedBy: socket.user.email,
          timestamp: new Date(),
        });
      } catch (error: any) {
        logger.error('Ticket scan event error:', error);
        socket.emit('error', { message: 'Failed to process scan event' });
      }
    });

    socket.on('order:update', async (data) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }
         const allowed = await checkRateLimit(
          orderRateLimiter,
          socket.user.userId,
          socket,
          'order:update'
        );

        if (!allowed) return;

        logger.info(`Order update event from ${socket.user.email}:`, data);
        
        if (data.customerId) {
          io.to(`user:${data.customerId}`).emit('order:updated', data);
        }
        io.to('admins').emit('order:updated', data);
      } catch (error: any) {
        logger.error('Order update event error:', error);
        socket.emit('error', { message: 'Failed to process order update' });
      }
    });

    socket.on('analytics:subscribe', async () => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        if (socket.user.role !== 'ADMIN' && socket.user.role !== 'SUPER_ADMIN') {
          socket.emit('error', { message: 'Insufficient permissions' });
          return;
        }
         const allowed = await checkRateLimit(
          analyticsRateLimiter,
          socket.user.userId,
          socket,
          'analytics:subscribe'
        );

        if (!allowed) return;
        socket.join('analytics');
        logger.info(`User ${socket.user.email} subscribed to analytics`);
      } catch (error: any) {
        logger.error('Analytics subscribe error:', error);
        socket.emit('error', { message: 'Failed to subscribe to analytics' });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('WebSocket server initialized');
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot emit to user');
      return;
    }
    io.to(`user:${userId}`).emit(event, data);
  } catch (error) {
    logger.error('Error emitting to user:', error);
  }
};

export const emitToAdmins = (event: string, data: any): void => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot emit to admins');
      return;
    }
    io.to('admins').emit(event, data);
  } catch (error) {
    logger.error('Error emitting to admins:', error);
  }
};

export const emitToAll = (event: string, data: any): void => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot emit to all');
      return;
    }
    io.emit(event, data);
  } catch (error) {
    logger.error('Error emitting to all:', error);
  }
};

export const emitNotification = (userId: string, notification: any): void => {
  emitToUser(userId, 'notification:new', notification);
};

export const getConnectionStats = async (): Promise<{
  totalConnections: number;
  adminConnections: number;
  rooms: string[];
}> => {
  if (!io) {
    return { totalConnections: 0, adminConnections: 0, rooms: [] };
  }

  const sockets = await io.fetchSockets();
  const adminSockets = sockets.filter(s => s.rooms.has('admins'));
  const rooms = Array.from(io.sockets.adapter.rooms.keys());

  return {
    totalConnections: sockets.length,
    adminConnections: adminSockets.length,
    rooms,
  };
};

export const closeWebSocket = async (): Promise<void> => {
  if (io) {
    io.close();
    logger.info('WebSocket server closed');
  }
};