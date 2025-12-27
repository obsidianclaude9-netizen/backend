"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../../utils/logger");
const upload_1 = require("../../middleware/upload");
class CustomerService {
    /**
     * Create new customer
     */
    async createCustomer(data) {
        const customer = await database_1.default.customer.create({
            data,
        });
        logger_1.logger.info(`Customer created: ${customer.email}`);
        return customer;
    }
    async uploadDocument(customerId, file) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            (0, upload_1.deleteFile)(file.path);
            throw new errorHandler_1.AppError(404, 'Customer not found');
        }
        if (customer.documentPath) {
            (0, upload_1.deleteFile)(customer.documentPath);
        }
        await database_1.default.customer.update({
            where: { id: customerId },
            data: {
                documentPath: file.path,
                documentName: file.originalname,
            },
        });
        logger_1.logger.info(`Document uploaded for customer: ${customerId}`);
        return {
            message: 'Document uploaded successfully',
            filename: file.filename,
            path: file.path,
        };
    }
    async deleteDocument(customerId) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new errorHandler_1.AppError(404, 'Customer not found');
        }
        if (customer.documentPath) {
            (0, upload_1.deleteFile)(customer.documentPath);
        }
        await database_1.default.customer.update({
            where: { id: customerId },
            data: {
                documentPath: null,
                documentName: null,
            },
        });
        logger_1.logger.info(`Document deleted for customer: ${customerId}`);
        return { message: 'Document deleted successfully' };
    }
    async getDocument(customerId) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
            select: { documentPath: true, documentName: true },
        });
        if (!customer || !customer.documentPath) {
            throw new errorHandler_1.AppError(404, 'Document not found');
        }
        if (!fs_1.default.existsSync(customer.documentPath)) {
            throw new errorHandler_1.AppError(404, 'Document file not found');
        }
        return {
            path: customer.documentPath,
            name: customer.documentName,
        };
    }
    /**
     * List customers with filters
     */
    async listCustomers(filters) {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = {};
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            database_1.default.customer.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { orders: true },
                    },
                },
            }),
            database_1.default.customer.count({ where }),
        ]);
        return {
            customers,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get customer by ID
     */
    async getCustomer(customerId) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
            include: {
                orders: {
                    orderBy: { purchaseDate: 'desc' },
                    take: 10,
                    include: {
                        tickets: {
                            select: {
                                id: true,
                                ticketCode: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });
        if (!customer) {
            throw new errorHandler_1.AppError(404, 'Customer not found');
        }
        return customer;
    }
    /**
     * Update customer
     */
    async updateCustomer(customerId, data) {
        const customer = await database_1.default.customer.update({
            where: { id: customerId },
            data,
        });
        logger_1.logger.info(`Customer updated: ${customer.email}`);
        return customer;
    }
    /**
     * Delete customer (soft delete)
     */
    async deleteCustomer(customerId) {
        // Check if customer has orders
        const orderCount = await database_1.default.order.count({
            where: { customerId },
        });
        if (orderCount > 0) {
            // Soft delete - mark as inactive
            await database_1.default.customer.update({
                where: { id: customerId },
                data: { status: 'inactive' },
            });
            logger_1.logger.info(`Customer soft deleted: ${customerId}`);
            return { message: 'Customer deactivated (has existing orders)' };
        }
        // Hard delete if no orders
        await database_1.default.customer.delete({
            where: { id: customerId },
        });
        logger_1.logger.info(`Customer deleted: ${customerId}`);
        return { message: 'Customer deleted successfully' };
    }
    /**
     * Get customer purchase history
     */
    async getCustomerOrders(customerId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            database_1.default.order.findMany({
                where: { customerId },
                skip,
                take: limit,
                orderBy: { purchaseDate: 'desc' },
                include: {
                    tickets: {
                        select: {
                            id: true,
                            ticketCode: true,
                            status: true,
                            scanCount: true,
                        },
                    },
                },
            }),
            database_1.default.order.count({ where: { customerId } }),
        ]);
        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get customer statistics
     */
    async getCustomerStats() {
        const [total, active, inactive, withOrders] = await Promise.all([
            database_1.default.customer.count(),
            database_1.default.customer.count({ where: { status: 'active' } }),
            database_1.default.customer.count({ where: { status: 'inactive' } }),
            database_1.default.customer.count({ where: { totalOrders: { gt: 0 } } }),
        ]);
        return {
            total,
            active,
            inactive,
            withOrders,
        };
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map