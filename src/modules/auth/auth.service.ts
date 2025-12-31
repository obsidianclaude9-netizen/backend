import * as jwt from 'jsonwebtoken';
import { accountLockout } from '../../middleware/rateLimit';
import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { LoginInput, CreateUserInput, UpdateUserInput, ChangePasswordInput } from './auth.schema';
import { Prisma, UserRole } from '@prisma/client';
import { logger } from '../../utils/logger';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import crypto from 'crypto';
import { blacklistToken } from '../../middleware/auth';
import { emailQueue } from '../../config/queue';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion?: number;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    twoFactorEnabled?: boolean;
  };
  accessToken: string;
  refreshToken: string;
  requiresTwoFactor?: boolean;
  tempToken?: string;
}

const getSaltRounds = (): number => {
  const envRounds = parseInt(process.env.BCRYPT_ROUNDS || '14');
  if (envRounds < 14 || envRounds > 18) { 
    logger.warn(`Invalid BCRYPT_ROUNDS (${envRounds}), using default 14`);
    return 14;
  }
  return envRounds;
};

const SALT_ROUNDS = getSaltRounds();
const MAX_CONCURRENT_SESSIONS = 5;

export class AuthService {
  async login(data: LoginInput, ipAddress?: string, userAgent?: string, twoFactorCode?: string): Promise<LoginResponse> {
    const lockoutStatus = await accountLockout(data.email, false);
  
    if (lockoutStatus.locked) {
      logger.warn('Login attempted on locked account', { 
        email: data.email, 
        ipAddress,
        unlockAt: lockoutStatus.unlockAt 
      });
      throw new AppError(429, `Account temporarily locked. Try again after ${lockoutStatus.unlockAt?.toLocaleTimeString()}`);
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      await accountLockout(data.email, false);
      logger.warn('Login attempt failed - invalid user', { 
        email: data.email, 
        ipAddress 
      });
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
  
    if (!isValidPassword) {
      await accountLockout(data.email, false);
      logger.warn('Login attempt failed - invalid password', { 
        email: data.email, 
        ipAddress 
      });
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        const tempToken = jwt.sign(
          { userId: user.id, temp: true },
          process.env.JWT_SECRET as string,
          { expiresIn: '5m' } as jwt.SignOptions
        );

        logger.info('2FA required for login', { 
          userId: user.id, 
          email: user.email 
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            twoFactorEnabled: true,
          },
          accessToken: '',
          refreshToken: '',
          requiresTwoFactor: true,
          tempToken,
        };
      }

      const isValid2FA = await this.verify2FACode(user.id, twoFactorCode);
      if (!isValid2FA) {
        await accountLockout(data.email, false);
        logger.warn('2FA verification failed', { 
          userId: user.id, 
          email: user.email, 
          ipAddress 
        });
        throw new AppError(401, 'Invalid 2FA code');
      }
    }

    await accountLockout(data.email, true);

    const sessionId = crypto.randomBytes(32).toString('hex');
    let sessionCount = 0;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      await tx.activeSession.deleteMany({
        where: { 
          userId: user.id,
          expiresAt: { lt: new Date() }
        }
      });

      const existingSessions = await tx.activeSession.count({
        where: { userId: user.id }
      });

      sessionCount = existingSessions;

      if (existingSessions >= MAX_CONCURRENT_SESSIONS) {
        const oldestSession = await tx.activeSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' }
        });

        if (oldestSession) {
          await tx.activeSession.delete({
            where: { id: oldestSession.id }
          });
          logger.info('Oldest session removed due to limit', { 
            userId: user.id, 
            removedSessionId: oldestSession.id 
          });
        }
      }

      await tx.activeSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: sessionId,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }
      });

      await tx.loginActivity.create({
        data: {
          userId: user.id,
          ipAddress: ipAddress || 'unknown',
          userAgent: userAgent || 'unknown',
          status: 'success',
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      sessionId,
    };

    const accessToken = jwt.sign(
      payload, 
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        tokenVersion: user.tokenVersion,
        sessionId 
      }, 
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' } as jwt.SignOptions
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email,
      sessionId,
      ipAddress,
      userAgent,
      twoFactorUsed: user.twoFactorEnabled,
      activeSessions: sessionCount + 1
    });

    return { 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken, 
      refreshToken 
    };
  }

  async refreshToken(token: string, ipAddress?: string) {
    let decoded: { userId: string; tokenVersion?: number; sessionId?: string };
    
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as typeof decoded;
    } catch (error) {
      logger.warn('Invalid refresh token', { error: (error as Error).message });
      throw new AppError(401, 'Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId },
      include: {
        activeSessions: {
          where: {
            id: decoded.sessionId,
            expiresAt: { gt: new Date() }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      logger.warn('Refresh token for invalid/inactive user', { userId: decoded.userId });
      throw new AppError(401, 'Invalid refresh token');
    }

    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion) {
      logger.warn('Token version mismatch - possible token reuse', {
        userId: user.id,
        expectedVersion: user.tokenVersion,
        receivedVersion: decoded.tokenVersion
      });
      throw new AppError(401, 'Token has been revoked');
    }

    if (decoded.sessionId && user.activeSessions.length === 0) {
      logger.warn('Session not found or expired', {
        userId: user.id,
        sessionId: decoded.sessionId
      });
      throw new AppError(401, 'Session expired');
    }

    const tokenExp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    await blacklistToken(token, tokenExp - Math.floor(Date.now() / 1000));

    const sessionId = decoded.sessionId || crypto.randomBytes(32).toString('hex');

    if (decoded.sessionId) {
      await prisma.activeSession.update({
        where: { id: decoded.sessionId },
        data: {
          lastActive: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          ipAddress: ipAddress || 'unknown'
        }
      });
    }

    const newRefreshToken = jwt.sign(
      { 
        userId: user.id,
        tokenVersion: user.tokenVersion,
        sessionId
      }, 
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' } as jwt.SignOptions
    );

    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        tokenVersion: user.tokenVersion,
        sessionId 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' } as jwt.SignOptions
    );

    logger.info('Token refreshed', { 
      userId: user.id, 
      sessionId,
      ipAddress 
    });
    
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await prisma.activeSession.deleteMany({
        where: { userId, id: sessionId }
      });
      logger.info('User logged out from session', { userId, sessionId });
    } else {
      await prisma.activeSession.deleteMany({
        where: { userId }
      });
      logger.info('User logged out from all sessions', { userId });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });

    return { message: 'Logged out successfully' };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      logger.warn('Attempt to create duplicate user', { email: data.email });
      throw new AppError(400, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.info('User created', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.info('User updated', { userId: user.id, email: user.email });

    return user;
  }

  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isValidPassword) {
      logger.warn('Password change attempt with invalid current password', { userId });
      throw new AppError(401, 'Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { 
          password: hashedPassword,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.activeSession.deleteMany({
        where: { userId }
      });
    });

    logger.info('Password changed', { userId, email: user.email });

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async listUsers(filters: ListUsersInput) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.role = filters.role as UserRole;
    }

    if (filters.status) {
      where.isActive = filters.status === 'active';
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deactivateUser(userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          tokenVersion: { increment: 1 }
        },
      });

      await tx.activeSession.deleteMany({
        where: { userId }
      });
    });

    logger.info('User deactivated', { userId });

    return { message: 'User deactivated successfully' };
  }

  async reactivateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.isActive) {
      throw new AppError(400, 'User is already active');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    logger.info('User reactivated', { userId: updated.id, email: updated.email });
    return updated;
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      logger.warn('Attempt to delete super admin', { userId });
      throw new AppError(403, 'Cannot delete super admin');
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted', { userId, email: user.email });
    return { message: 'User deleted successfully' };
  }

  async getUserActivity(userId: string, limit = 10) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const [activity, sessions, loginHistory] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          action: true,
          entity: true,
          details: true,
          createdAt: true,
          ipAddress: true,
        },
      }),
      prisma.activeSession.findMany({
        where: { userId },
        orderBy: { lastActive: 'desc' },
        select: {
          id: true,
          ipAddress: true,
          userAgent: true,
          lastActive: true,
          createdAt: true,
        }
      }),
      prisma.loginActivity.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          ipAddress: true,
          userAgent: true,
          status: true,
          timestamp: true,
        }
      })
    ]);

    return {
      userId: user.id,
      email: user.email,
      lastLoginAt: user.lastLoginAt,
      activity,
      activeSessions: sessions,
      recentLogins: loginHistory,
    };
  }

  private async generateBackupCodes(): Promise<{ codes: string[], hashed: string[] }> {
    const codes: string[] = [];
    const hashed: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      hashed.push(await bcrypt.hash(code, 12));
    }
    
    return { codes, hashed };
  }

  async enable2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.twoFactorEnabled) {
      throw new AppError(400, '2FA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `JGPNR (${user.email})`,
      issuer: 'JGPNR Admin',
    });
    
    const { codes, hashed } = await this.generateBackupCodes();

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: JSON.stringify(hashed),
        twoFactorEnabled: false,
      },
    });
    
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    logger.info('2FA setup initiated', { userId, email: user.email });

    return {
      secret: secret.base32,
      qrCode,
      backupCodes: codes,
      message: 'Scan QR code with authenticator app and verify with a code to enable 2FA',
    };
  }

  private async verify2FACode(userId: string, code: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (verified) {
      return true;
    }

    if (user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
      
      for (let i = 0; i < backupCodes.length; i++) {
        const isMatch = await bcrypt.compare(code, backupCodes[i]);
        if (isMatch) {
          backupCodes.splice(i, 1);
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              twoFactorBackupCodes: JSON.stringify(backupCodes)
            }
          });

          logger.info('Backup code used for 2FA', { userId });
          return true;
        }
      }
    }

    return false;
  }

  async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new AppError(400, '2FA not set up');
    }

    const verified = await this.verify2FACode(userId, code);

    if (!verified) {
      logger.warn('2FA verification failed', { userId });
      throw new AppError(400, 'Invalid verification code');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    logger.info('2FA enabled', { userId, email: user.email });

    return {
      message: '2FA successfully enabled',
      enabled: true,
    };
  }

  async disable2FA(userId: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new AppError(400, '2FA is not enabled');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn('2FA disable attempt with invalid password', { userId });
      throw new AppError(401, 'Invalid password');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    logger.info('2FA disabled', { userId, email: user.email });

    return {
      message: '2FA successfully disabled',
      enabled: false,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    const delay = 50 + Math.floor(Math.random() * 50);
    await new Promise(resolve => setTimeout(resolve, delay));

    if (!user) {
      logger.warn('Password reset with invalid/expired token');
      throw new AppError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
          tokenVersion: { increment: 1 }
        }
      });

      await tx.activeSession.deleteMany({
        where: { userId: user.id }
      });
    });

    logger.info('Password reset completed', { userId: user.id, email: user.email });

    return { message: 'Password reset successful' };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { message: 'If account exists, reset email sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      }
    });

    await emailQueue.add('password-reset', {
      email: user.email,
      resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
    });

    logger.info('Password reset requested', { userId: user.id, email });

    return { message: 'If account exists, reset email sent' };
  }
}