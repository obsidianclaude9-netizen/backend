// src/config/websocket.ts
import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import prisma from './database';
import { RateLimiterMemory } from 'rate-limiter-flexible';

let io: Server;

interface SocketUser {
  id: string;
  email: string;
  role: string;
}

interface AuthSocket extends Socket {
  user?: SocketUser;
}

const connectionRateLimiter = new RateLimiterMemory({
  points: 5,           // 5 connections
  duration: 60,        // per 60 seconds
  blockDuration: 300,  // Block for 5 minutes if exceeded
});

const authFailureRateLimiter = new RateLimiterMemory({
  points: 3,           // 3 failed attempts
  duration: 300,       // per 5 minutes
  blockDuration: 900,  // Block for 15 minutes
});

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

const getClientIP = (socket: Socket): string => {
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) 
      ? forwarded[0].split(',')[0].trim()
      : forwarded.split(',')[0].trim();
  }
  
  const realIP = socket.handshake.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }
  
  return socket.handshake.address;
};

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
      userId: socket.user?.id,
      event: eventName,
      ip: getClientIP(socket),
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
    maxHttpBufferSize: 1e6, 
    connectTimeout: 45000,  
    allowEIO3: false, 
    transports: ['websocket', 'polling'], 
  });

  io.use(async (socket: AuthSocket, next) => {
    const clientIP = getClientIP(socket);

    try {
      
      await connectionRateLimiter.consume(clientIP);
    } catch (rejRes: any) {
      logger.warn('WebSocket connection rate limit exceeded', {
        ip: clientIP,
        retryAfter: rejRes.msBeforeNext || 0,
        socketId: socket.id
      });
      
      return next(new Error('Too many connection attempts. Please try again later.'));
    }

    next();
  });

  io.use(async (socket: AuthSocket, next) => {
    const clientIP = getClientIP(socket);
    
    try {
      // Extract token from auth or headers
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        // Track failed auth attempt
        await authFailureRateLimiter.consume(clientIP).catch(() => {
          logger.warn('Auth failure rate limit exceeded', { ip: clientIP });
        });
        
        return next(new Error('Authentication token required'));
      }

      // Validate JWT_SECRET is configured
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET not configured');
        return next(new Error('Server configuration error'));
      }

      // Verify JWT token
      let decoded: { userId: string };
      try {
        decoded = jwt.verify(token, jwtSecret) as { userId: string };
      } catch (error: any) {
        // Track failed auth attempt
        await authFailureRateLimiter.consume(clientIP).catch(() => {
          logger.warn('Auth failure rate limit exceeded', { ip: clientIP });
        });
        
        logger.warn('Invalid JWT token', { 
          ip: clientIP, 
          error: error.message 
        });
        return next(new Error('Invalid authentication token'));
      }

      // Validate user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user) {
        await authFailureRateLimiter.consume(clientIP).catch(() => {
          logger.warn('Auth failure rate limit exceeded', { ip: clientIP });
        });
        
        logger.warn('WebSocket auth failed - user not found', { 
          userId: decoded.userId, 
          ip: clientIP 
        });
        return next(new Error('User not found'));
      }

      if (!user.isActive) {
        logger.warn('Inactive user attempted WebSocket connection', {
          userId: user.id,
          email: user.email,
          ip: clientIP
        });
        return next(new Error('Account is not active'));
      }

      // Set authenticated user on socket
      socket.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error: any) {
      logger.error('WebSocket authentication error:', {
        error: error.message,
        ip: clientIP,
        stack: error.stack
      });
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    const clientIP = getClientIP(socket);
    
    logger.info(`Client connected`, {
      socketId: socket.id,
      userId: socket.user?.id,
      email: socket.user?.email,
      role: socket.user?.role,
      ip: clientIP
    });

    // Join user-specific room
    if (socket.user) {
      socket.join(`user:${socket.user.id}`);
      
      // Join admin room if applicable
      if (socket.user.role === 'ADMIN' || socket.user.role === 'SUPER_ADMIN') {
        socket.join('admins');
        logger.info(`Admin joined admins room`, {
          userId: socket.user.id,
          email: socket.user.email
        });
      }
    }

    socket.on('scan:ticket', async (data) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Check rate limit
        const allowed = await checkRateLimit(
          scanRateLimiter,
          socket.user.id,
          socket,
          'scan:ticket'
        );
        if (!allowed) return;

        // Validate data
        if (!data || !data.ticketCode) {
          socket.emit('error', { message: 'Invalid scan data' });
          return;
        }

        logger.info(`Ticket scan event`, {
          userId: socket.user.id,
          email: socket.user.email,
          ticketCode: data.ticketCode
        });
        
        // Broadcast to admins
        io.to('admins').emit('scan:new', {
          ticketCode: data.ticketCode,
          scannedBy: socket.user.email,
          scannedById: socket.user.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        logger.error('Ticket scan event error:', {
          error: error.message,
          userId: socket.user?.id
        });
        socket.emit('error', { message: 'Failed to process scan event' });
      }
    });

    socket.on('order:update', async (data) => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Check rate limit
        const allowed = await checkRateLimit(
          orderRateLimiter,
          socket.user.id,
          socket,
          'order:update'
        );
        if (!allowed) return;

        // Validate data
        if (!data || !data.orderId) {
          socket.emit('error', { message: 'Invalid order data' });
          return;
        }

        logger.info(`Order update event`, {
          userId: socket.user.id,
          email: socket.user.email,
          orderId: data.orderId
        });
        
        // Emit to customer if customerId is provided
        if (data.customerId) {
          io.to(`user:${data.customerId}`).emit('order:updated', {
            ...data,
            timestamp: new Date().toISOString()
          });
        }
        
        // Always emit to admins
        io.to('admins').emit('order:updated', {
          ...data,
          timestamp: new Date().toISOString()
        });
      } catch (error: any) {
        logger.error('Order update event error:', {
          error: error.message,
          userId: socket.user?.id
        });
        socket.emit('error', { message: 'Failed to process order update' });
      }
    });

    socket.on('analytics:subscribe', async () => {
      try {
        if (!socket.user) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Check permissions
        if (socket.user.role !== 'ADMIN' && socket.user.role !== 'SUPER_ADMIN') {
          logger.warn('Non-admin attempted analytics subscription', {
            userId: socket.user.id,
            role: socket.user.role
          });
          socket.emit('error', { message: 'Insufficient permissions' });
          return;
        }

        // Check rate limit
        const allowed = await checkRateLimit(
          analyticsRateLimiter,
          socket.user.id,
          socket,
          'analytics:subscribe'
        );
        if (!allowed) return;

        // Subscribe to analytics room
        socket.join('analytics');
        socket.emit('analytics:subscribed', { 
          success: true,
          message: 'Successfully subscribed to analytics updates'
        });
        
        logger.info(`Analytics subscription`, {
          userId: socket.user.id,
          email: socket.user.email
        });
      } catch (error: any) {
        logger.error('Analytics subscribe error:', {
          error: error.message,
          userId: socket.user?.id
        });
        socket.emit('error', { message: 'Failed to subscribe to analytics' });
      }
    });

    socket.on('analytics:unsubscribe', () => {
      try {
        if (!socket.user) return;
        
        socket.leave('analytics');
        socket.emit('analytics:unsubscribed', { 
          success: true,
          message: 'Successfully unsubscribed from analytics updates'
        });
        
        logger.info(`Analytics unsubscription`, {
          userId: socket.user.id,
          email: socket.user.email
        });
      } catch (error: any) {
        logger.error('Analytics unsubscribe error:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected`, {
        socketId: socket.id,
        userId: socket.user?.id,
        email: socket.user?.email,
        reason,
        ip: clientIP
      });
    });

    socket.on('error', (error) => {
      logger.error('Socket error:', {
        error: error.message || error,
        socketId: socket.id,
        userId: socket.user?.id,
        ip: clientIP
      });
    });
  });

  logger.info('WebSocket server initialized successfully');
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
    logger.debug('Emitted to user', { userId, event });
  } catch (error: any) {
    logger.error('Error emitting to user:', {
      error: error.message,
      userId,
      event
    });
  }
};

export const emitToAdmins = (event: string, data: any): void => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot emit to admins');
      return;
    }
    io.to('admins').emit(event, data);
    logger.debug('Emitted to admins', { event });
  } catch (error: any) {
    logger.error('Error emitting to admins:', {
      error: error.message,
      event
    });
  }
};

export const emitToAll = (event: string, data: any): void => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot emit to all');
      return;
    }
    io.emit(event, data);
    logger.debug('Emitted to all', { event });
  } catch (error: any) {
    logger.error('Error emitting to all:', {
      error: error.message,
      event
    });
  }
};

export const emitNotification = (userId: string, notification: any): void => {
  emitToUser(userId, 'notification:new', {
    ...notification,
    timestamp: notification.timestamp || new Date().toISOString()
  });
};

export const getConnectionStats = async (): Promise<{
  totalConnections: number;
  adminConnections: number;
  userConnections: number;
  rooms: string[];
}> => {
  if (!io) {
    return { 
      totalConnections: 0, 
      adminConnections: 0,
      userConnections: 0,
      rooms: [] 
    };
  }

  try {
    const sockets = await io.fetchSockets();
    const adminSockets = sockets.filter(s => s.rooms.has('admins'));
    const userSockets = sockets.filter(s => 
      Array.from(s.rooms).some(room => room.startsWith('user:'))
    );
    const rooms = Array.from(io.sockets.adapter.rooms.keys());

    return {
      totalConnections: sockets.length,
      adminConnections: adminSockets.length,
      userConnections: userSockets.length,
      rooms,
    };
  } catch (error: any) {
    logger.error('Error getting connection stats:', error);
    return { 
      totalConnections: 0, 
      adminConnections: 0,
      userConnections: 0,
      rooms: [] 
    };
  }
};

export const disconnectUser = async (userId: string, reason?: string): Promise<void> => {
  try {
    if (!io) {
      logger.warn('WebSocket not initialized, cannot disconnect user');
      return;
    }

    const sockets = await io.in(`user:${userId}`).fetchSockets();
    
    for (const socket of sockets) {
      socket.disconnect(true);
      logger.info('User disconnected administratively', {
        userId,
        socketId: socket.id,
        reason
      });
    }
  } catch (error: any) {
    logger.error('Error disconnecting user:', {
      error: error.message,
      userId
    });
  }
};

export const closeWebSocket = async (): Promise<void> => {
  if (io) {
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }
    
    io.close();
    logger.info('WebSocket server closed');
  }
};