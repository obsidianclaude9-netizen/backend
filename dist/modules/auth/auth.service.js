"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/modules/auth/auth.service.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SALT_ROUNDS = 12;
class AuthService {
    async login(data) {
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user || !user.isActive) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        const isValidPassword = await bcrypt_1.default.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        // Update last login
        await database_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' });
        logger_1.logger.info(`User logged in: ${user.email}`);
        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }
    async refreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
            const user = await database_1.default.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user || !user.isActive) {
                throw new errorHandler_1.AppError(401, 'Invalid refresh token');
            }
            const payload = {
                userId: user.id,
                email: user.email,
                role: user.role,
            };
            const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' });
            return { accessToken };
        }
        catch (error) {
            throw new errorHandler_1.AppError(401, 'Invalid refresh token');
        }
    }
    async getCurrentUser(userId) {
        const user = await database_1.default.user.findUnique({
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
                createdAt: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        return user;
    }
    async createUser(data) {
        const hashedPassword = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const user = await database_1.default.user.create({
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
        logger_1.logger.info(`User created: ${user.email}`);
        return user;
    }
    async updateUser(userId, data) {
        const user = await database_1.default.user.update({
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
        logger_1.logger.info(`User updated: ${user.email}`);
        return user;
    }
    async changePassword(userId, data) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new errorHandler_1.AppError(404, 'User not found');
        }
        const isValidPassword = await bcrypt_1.default.compare(data.currentPassword, user.password);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError(401, 'Current password is incorrect');
        }
        const hashedPassword = await bcrypt_1.default.hash(data.newPassword, SALT_ROUNDS);
        await database_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        logger_1.logger.info(`Password changed for user: ${user.email}`);
        return { message: 'Password changed successfully' };
    }
    async listUsers(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            database_1.default.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
            }),
            database_1.default.user.count(),
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
    async deactivateUser(userId) {
        await database_1.default.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
        logger_1.logger.info(`User deactivated: ${userId}`);
        return { message: 'User deactivated successfully' };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map