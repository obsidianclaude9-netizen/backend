import { Prisma } from '@prisma/client';
import { CreateOrderInput, UpdateOrderInput, ConfirmPaymentInput, ListOrdersInput } from './order.schema';
export declare class OrderService {
    /**
     * Generate unique order number: ORD-YYYYMMDD-XXXX
     */
    private generateOrderNumber;
    /**
     * Create new order with tickets
     */
    createOrder(data: CreateOrderInput): Promise<{
        tickets: {
            status: import(".prisma/client").$Enums.TicketStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            ticketCode: string;
            scanCount: number;
            maxScans: number;
            firstScanAt: Date | null;
            lastScanAt: Date | null;
            scanWindow: number;
            qrCodePath: string | null;
        }[];
        customer: {
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
        };
        status: import(".prisma/client").$Enums.OrderStatus;
        id: string;
        updatedAt: Date;
        createdAt: Date;
        quantity: number;
        orderNumber: string;
        customerId: string;
        amount: Prisma.Decimal;
        purchaseDate: Date;
    }>;
    /**
     * List orders with filters
     */
    listOrders(filters: ListOrdersInput): Promise<{
        orders: ({
            customer: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phone: string;
            };
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
     * Get order by ID
     */
    getOrder(orderId: string): Promise<{
        customer: {
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
        };
        tickets: ({
            scanHistory: {
                id: string;
                location: string | null;
                scannedBy: string;
                scannedAt: Date;
                allowed: boolean;
                reason: string;
                ticketId: string;
            }[];
        } & {
            status: import(".prisma/client").$Enums.TicketStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            ticketCode: string;
            scanCount: number;
            maxScans: number;
            firstScanAt: Date | null;
            lastScanAt: Date | null;
            scanWindow: number;
            qrCodePath: string | null;
        })[];
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
    }>;
    /**
     * Get order by order number
     */
    getOrderByNumber(orderNumber: string): Promise<{
        customer: {
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
        };
        tickets: {
            status: import(".prisma/client").$Enums.TicketStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            ticketCode: string;
            scanCount: number;
            maxScans: number;
            firstScanAt: Date | null;
            lastScanAt: Date | null;
            scanWindow: number;
            qrCodePath: string | null;
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
    }>;
    /**
     * Update order
     */
    updateOrder(orderId: string, data: UpdateOrderInput): Promise<{
        customer: {
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
        };
        tickets: {
            status: import(".prisma/client").$Enums.TicketStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            ticketCode: string;
            scanCount: number;
            maxScans: number;
            firstScanAt: Date | null;
            lastScanAt: Date | null;
            scanWindow: number;
            qrCodePath: string | null;
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
    }>;
    /**
     * Confirm payment and activate tickets
     */
    confirmPayment(orderId: string, data: ConfirmPaymentInput): Promise<{
        customer: {
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
        };
        tickets: {
            status: import(".prisma/client").$Enums.TicketStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            orderId: string;
            gameSession: string;
            validUntil: Date;
            ticketCode: string;
            scanCount: number;
            maxScans: number;
            firstScanAt: Date | null;
            lastScanAt: Date | null;
            scanWindow: number;
            qrCodePath: string | null;
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
    }>;
    /**
     * Cancel order
     */
    cancelOrder(orderId: string): Promise<{
        message: string;
    }>;
    /**
     * Get order statistics
     */
    getOrderStats(startDate?: string, endDate?: string): Promise<{
        total: number;
        pending: number;
        completed: number;
        cancelled: number;
        revenue: number | Prisma.Decimal;
    }>;
    private generateTicketCode;
    private addDays;
    private generateQRForTicket;
}
//# sourceMappingURL=order.service.d.ts.map