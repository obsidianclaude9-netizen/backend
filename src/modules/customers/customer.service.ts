import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersInput,
} from './customer.schema';
import { logger } from '../../utils/logger';
import path from 'path';
import fs from 'fs';

export class CustomerService {
  async createCustomer(data: CreateCustomerInput) {
    const customer = await prisma.customer.create({
      data,
    });

    logger.info(`Customer created: ${customer.email}`);
    return customer;
  }

  /**
   * Upload customer document to local storage
   */
  async uploadDocument(customerId: string, file: Express.Multer.File) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    // Delete old document if exists
    if (customer.documentPath) {
      try {
        const oldPath = path.join(process.cwd(), customer.documentPath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
          logger.info(`Old document deleted for customer: ${customerId}`);
        }
      } catch (error) {
        logger.warn('Failed to delete old document:', error);
      }
    }

    // Ensure customer documents directory exists
    const customerDocsDir = './uploads/customer-documents';
    const customerSpecificDir = path.join(customerDocsDir, customerId);
    
    if (!fs.existsSync(customerSpecificDir)) {
      fs.mkdirSync(customerSpecificDir, { recursive: true });
    }

    // Save new document
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(customerSpecificDir, filename);
    
    fs.writeFileSync(filepath, file.buffer);

    const relativePath = `/uploads/customer-documents/${customerId}/${filename}`;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        documentPath: relativePath,
        documentName: file.originalname,
      },
    });

    logger.info(`Document uploaded for customer: ${customerId}`);

    return {
      message: 'Document uploaded successfully',
      filename: file.originalname,
      path: relativePath
    };
  }

  /**
   * Delete customer document from local storage
   */
  async deleteDocument(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new AppError(404, 'Customer not found');
    }

    if (customer.documentPath) {
      try {
        const fullPath = path.join(process.cwd(), customer.documentPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          logger.info(`Document file deleted: ${fullPath}`);
        }
      } catch (error) {
        logger.error('Failed to delete document file:', error);
      }
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        documentPath: null,
        documentName: null,
      },
    });

    logger.info(`Document deleted for customer: ${customerId}`);

    return { message: 'Document deleted successfully' };
  }

  /**
   * Get customer document (returns file path for local serving)
   */
  async getDocument(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { documentPath: true, documentName: true },
    });

    if (!customer || !customer.documentPath) {
      throw new AppError(404, 'Document not found');
    }

    const fullPath = path.join(process.cwd(), customer.documentPath);

    if (!fs.existsSync(fullPath)) {
      throw new AppError(404, 'Document file not found on server');
    }

    return {
      path: fullPath,
      name: customer.documentName,
      relativePath: customer.documentPath
    };
  }

  async listCustomers(filters: ListCustomersInput) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

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
      prisma.customer.findMany({
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
      prisma.customer.count({ where }),
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

  async getCustomer(customerId: string) {
    const customer = await prisma.customer.findUnique({
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
      throw new AppError(404, 'Customer not found');
    }

    return customer;
  }

  async updateCustomer(customerId: string, data: UpdateCustomerInput) {
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data,
    });

    logger.info(`Customer updated: ${customer.email}`);
    return customer;
  }

  async deleteCustomer(customerId: string) {
    const orderCount = await prisma.order.count({
      where: { customerId },
    });

    if (orderCount > 0) {
      await prisma.customer.update({
        where: { id: customerId },
        data: { status: 'inactive' },
      });

      logger.info(`Customer soft deleted: ${customerId}`);
      return { message: 'Customer deactivated (has existing orders)' };
    }

    // Delete associated document if exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { documentPath: true }
    });

    if (customer?.documentPath) {
      try {
        const fullPath = path.join(process.cwd(), customer.documentPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error) {
        logger.warn('Failed to delete customer document:', error);
      }
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    logger.info(`Customer deleted: ${customerId}`);
    return { message: 'Customer deleted successfully' };
  }

  async getCustomerOrders(customerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count({ where: { customerId } }),
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
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.customer.count({ where: { status: 'inactive' } }),
      prisma.customer.count({ where: { totalOrders: { gt: 0 } } }),
    ]);

    return {
      total,
      active,
      inactive,
      withOrders,
    };
  }
}