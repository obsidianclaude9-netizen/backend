// src/middleware/authorization.ts 

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';


export const authorizeResource = (
  resourceType: 'customer' | 'order' | 'ticket' | 'subscription',
  paramName: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const resourceId = req.params[paramName];
      if (!resourceId) {
        throw new AppError(400, `Missing ${paramName} parameter`);
      }

      if (
        req.user.role === UserRole.SUPER_ADMIN ||
        req.user.role === UserRole.ADMIN
      ) {
        return next();
      }

      switch (resourceType) {
        case 'customer': {

          if (req.user.role === UserRole.STAFF) {
            return next();
          }

          const customer = await prisma.customer.findUnique({
            where: { id: resourceId },
            select: { id: true, email: true }
          });

          if (!customer) {
            throw new AppError(404, 'Customer not found');
          }

          const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { email: true }
          });

          if (user?.email !== customer.email) {
            logger.warn('IDOR attempt detected', {
              userId: req.user.userId,
              resourceType,
              resourceId,
              ip: req.ip
            });
            throw new AppError(403, 'Access denied');
          }
          break;
        }

        case 'order': {
          const order = await prisma.order.findUnique({
            where: { id: resourceId },
            select: { customerId: true, customer: { select: { email: true } } }
          });

          if (!order) {
            throw new AppError(404, 'Order not found');
          }

          const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { email: true }
          });

          if (user?.email !== order.customer.email) {
            logger.warn('IDOR attempt detected', {
              userId: req.user.userId,
              resourceType,
              resourceId,
              ip: req.ip
            });
            throw new AppError(403, 'Access denied');
          }
          break;
        }

        case 'ticket': {
          const ticket = await prisma.ticket.findUnique({
            where: { id: resourceId },
            select: {
              order: {
                select: {
                  customer: { select: { email: true } }
                }
              }
            }
          });

          if (!ticket) {
            throw new AppError(404, 'Ticket not found');
          }

          const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { email: true }
          });

          if (user?.email !== ticket.order.customer.email) {
            logger.warn('IDOR attempt detected', {
              userId: req.user.userId,
              resourceType,
              resourceId,
              ip: req.ip
            });
            throw new AppError(403, 'Access denied');
          }
          break;
        }

        default:
          throw new AppError(500, 'Unknown resource type');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const filterUserResources = async (
  req: Request,
  resourceType: 'customers' | 'orders' | 'tickets'
): Promise<any> => {
  if (!req.user) {
    return {};
  }

  if (
    req.user.role === UserRole.SUPER_ADMIN ||
    req.user.role === UserRole.ADMIN ||
    req.user.role === UserRole.STAFF
  ) {
    return {};
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { email: true }
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  switch (resourceType) {
    case 'customers':
      return { email: user.email };
    case 'orders':
      return { customer: { email: user.email } };
    case 'tickets':
      return { order: { customer: { email: user.email } } };
    default:
      return {};
  }
};