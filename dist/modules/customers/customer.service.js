"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const logger_1 = require("../../utils/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class CustomerService {
    async createCustomer(data) {
        const customer = await database_1.default.customer.create({
            data,
        });
        logger_1.logger.info(`Customer created: ${customer.email}`);
        return customer;
    }
    /**
     * Upload customer document to local storage
     */
    async uploadDocument(customerId, file) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new errorHandler_1.AppError(404, 'Customer not found');
        }
        // Delete old document if exists
        if (customer.documentPath) {
            try {
                const oldPath = path_1.default.join(process.cwd(), customer.documentPath);
                if (fs_1.default.existsSync(oldPath)) {
                    fs_1.default.unlinkSync(oldPath);
                    logger_1.logger.info(`Old document deleted for customer: ${customerId}`);
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to delete old document:', error);
            }
        }
        // Ensure customer documents directory exists
        const customerDocsDir = './uploads/customer-documents';
        const customerSpecificDir = path_1.default.join(customerDocsDir, customerId);
        if (!fs_1.default.existsSync(customerSpecificDir)) {
            fs_1.default.mkdirSync(customerSpecificDir, { recursive: true });
        }
        // Save new document
        const filename = `${Date.now()}-${file.originalname}`;
        const filepath = path_1.default.join(customerSpecificDir, filename);
        fs_1.default.writeFileSync(filepath, file.buffer);
        const relativePath = `/uploads/customer-documents/${customerId}/${filename}`;
        await database_1.default.customer.update({
            where: { id: customerId },
            data: {
                documentPath: relativePath,
                documentName: file.originalname,
            },
        });
        logger_1.logger.info(`Document uploaded for customer: ${customerId}`);
        return {
            message: 'Document uploaded successfully',
            filename: file.originalname,
            path: relativePath
        };
    }
    /**
     * Delete customer document from local storage
     */
    async deleteDocument(customerId) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new errorHandler_1.AppError(404, 'Customer not found');
        }
        if (customer.documentPath) {
            try {
                const fullPath = path_1.default.join(process.cwd(), customer.documentPath);
                if (fs_1.default.existsSync(fullPath)) {
                    fs_1.default.unlinkSync(fullPath);
                    logger_1.logger.info(`Document file deleted: ${fullPath}`);
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to delete document file:', error);
            }
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
    /**
     * Get customer document (returns file path for local serving)
     */
    async getDocument(customerId) {
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
            select: { documentPath: true, documentName: true },
        });
        if (!customer || !customer.documentPath) {
            throw new errorHandler_1.AppError(404, 'Document not found');
        }
        const fullPath = path_1.default.join(process.cwd(), customer.documentPath);
        if (!fs_1.default.existsSync(fullPath)) {
            throw new errorHandler_1.AppError(404, 'Document file not found on server');
        }
        return {
            path: fullPath,
            name: customer.documentName,
            relativePath: customer.documentPath
        };
    }
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
    async updateCustomer(customerId, data) {
        const customer = await database_1.default.customer.update({
            where: { id: customerId },
            data,
        });
        logger_1.logger.info(`Customer updated: ${customer.email}`);
        return customer;
    }
    async deleteCustomer(customerId) {
        const orderCount = await database_1.default.order.count({
            where: { customerId },
        });
        if (orderCount > 0) {
            await database_1.default.customer.update({
                where: { id: customerId },
                data: { status: 'inactive' },
            });
            logger_1.logger.info(`Customer soft deleted: ${customerId}`);
            return { message: 'Customer deactivated (has existing orders)' };
        }
        // Delete associated document if exists
        const customer = await database_1.default.customer.findUnique({
            where: { id: customerId },
            select: { documentPath: true }
        });
        if (customer?.documentPath) {
            try {
                const fullPath = path_1.default.join(process.cwd(), customer.documentPath);
                if (fs_1.default.existsSync(fullPath)) {
                    fs_1.default.unlinkSync(fullPath);
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to delete customer document:', error);
            }
        }
        await database_1.default.customer.delete({
            where: { id: customerId },
        });
        logger_1.logger.info(`Customer deleted: ${customerId}`);
        return { message: 'Customer deleted successfully' };
    }
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