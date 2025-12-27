import { Prisma } from '@prisma/client';
import { CreateCustomerInput, UpdateCustomerInput, ListCustomersInput } from './customer.schema';
export declare class CustomerService {
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
    /**
     * Upload customer document to local storage
     */
    uploadDocument(customerId: string, file: Express.Multer.File): Promise<{
        message: string;
        filename: string;
        path: string;
    }>;
    /**
     * Delete customer document from local storage
     */
    deleteDocument(customerId: string): Promise<{
        message: string;
    }>;
    /**
     * Get customer document (returns file path for local serving)
     */
    getDocument(customerId: string): Promise<{
        path: string;
        name: string | null;
        relativePath: string;
    }>;
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
    deleteCustomer(customerId: string): Promise<{
        message: string;
    }>;
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
    getCustomerStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        withOrders: number;
    }>;
}
//# sourceMappingURL=customer.service.d.ts.map