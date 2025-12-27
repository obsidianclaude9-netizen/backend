import { Prisma } from '@prisma/client';
import { CreateCustomerInput, UpdateCustomerInput, ListCustomersInput } from './customer.schema';
export declare class CustomerService {
    /**
     * Create new customer
     */
    createCustomer(data: CreateCustomerInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        createdAt: Date;
        whatsapp: string | null;
        notes: string | null;
        totalOrders: number;
        totalSpent: Prisma.Decimal;
        lastPurchase: Date | null;
        documentPath: string | null;
        documentName: string | null;
    }>;
    uploadDocument(customerId: string, file: Express.Multer.File): Promise<{
        message: string;
        filename: string;
        path: string;
    }>;
    deleteDocument(customerId: string): Promise<{
        message: string;
    }>;
    getDocument(customerId: string): Promise<{
        path: string;
        name: string | null;
    }>;
    /**
     * List customers with filters
     */
    listCustomers(filters: ListCustomersInput): Promise<{
        customers: ({
            _count: {
                orders: number;
            };
        } & {
            status: string;
            id: string;
            updatedAt: Date;
            location: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            createdAt: Date;
            whatsapp: string | null;
            notes: string | null;
            totalOrders: number;
            totalSpent: Prisma.Decimal;
            lastPurchase: Date | null;
            documentPath: string | null;
            documentName: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get customer by ID
     */
    getCustomer(customerId: string): Promise<{
        orders: ({
            tickets: {
                status: import(".prisma/client").$Enums.TicketStatus;
                id: string;
                ticketCode: string;
            }[];
        } & {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            quantity: number;
            orderNumber: string;
            customerId: string;
            amount: Prisma.Decimal;
            purchaseDate: Date;
        })[];
    } & {
        status: string;
        id: string;
        updatedAt: Date;
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        createdAt: Date;
        whatsapp: string | null;
        notes: string | null;
        totalOrders: number;
        totalSpent: Prisma.Decimal;
        lastPurchase: Date | null;
        documentPath: string | null;
        documentName: string | null;
    }>;
    /**
     * Update customer
     */
    updateCustomer(customerId: string, data: UpdateCustomerInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        location: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        createdAt: Date;
        whatsapp: string | null;
        notes: string | null;
        totalOrders: number;
        totalSpent: Prisma.Decimal;
        lastPurchase: Date | null;
        documentPath: string | null;
        documentName: string | null;
    }>;
    /**
     * Delete customer (soft delete)
     */
    deleteCustomer(customerId: string): Promise<{
        message: string;
    }>;
    /**
     * Get customer purchase history
     */
    getCustomerOrders(customerId: string, page?: number, limit?: number): Promise<{
        orders: ({
            tickets: {
                status: import(".prisma/client").$Enums.TicketStatus;
                id: string;
                ticketCode: string;
                scanCount: number;
            }[];
        } & {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            quantity: number;
            orderNumber: string;
            customerId: string;
            amount: Prisma.Decimal;
            purchaseDate: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    /**
     * Get customer statistics
     */
    getCustomerStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withOrders: number;
    }>;
}
//# sourceMappingURL=customer.service.d.ts.map