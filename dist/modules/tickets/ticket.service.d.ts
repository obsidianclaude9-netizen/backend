import { CreateTicketInput, UpdateTicketInput, ScanTicketInput, ValidateTicketInput, ListTicketsInput, UpdateSettingsInput } from './ticket.schema';
export declare class TicketService {
    createTickets(data: CreateTicketInput): Promise<{
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
    }[]>;
    listTickets(filters: ListTicketsInput): Promise<{
        tickets: ({
            order: {
                customer: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                status: import(".prisma/client").$Enums.OrderStatus;
                id: string;
                updatedAt: Date;
                createdAt: Date;
                quantity: number;
                orderNumber: string;
                customerId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                purchaseDate: Date;
            };
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
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getTicket(ticketId: string): Promise<{
        order: {
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
                totalSpent: import("@prisma/client/runtime/library").Decimal;
                lastPurchase: Date | null;
                documentPath: string | null;
                documentName: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            quantity: number;
            orderNumber: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            purchaseDate: Date;
        };
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
    }>;
    getTicketByCode(ticketCode: string): Promise<{
        order: {
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
                totalSpent: import("@prisma/client/runtime/library").Decimal;
                lastPurchase: Date | null;
                documentPath: string | null;
                documentName: string | null;
            };
        } & {
            status: import(".prisma/client").$Enums.OrderStatus;
            id: string;
            updatedAt: Date;
            createdAt: Date;
            quantity: number;
            orderNumber: string;
            customerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            purchaseDate: Date;
        };
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
    }>;
    updateTicket(ticketId: string, data: UpdateTicketInput): Promise<{
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
    }>;
    cancelTicket(ticketId: string): Promise<{
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
    }>;
    validateTicket(data: ValidateTicketInput): Promise<{
        valid: boolean;
        reason: string;
        ticket: null;
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays: number;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays?: undefined;
    }>;
    scanTicket(data: ScanTicketInput): Promise<{
        valid: boolean;
        reason: string;
        ticket: null;
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays: number;
    } | {
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays?: undefined;
    } | {
        scanId: string;
        scannedAt: Date;
        valid: boolean;
        reason: string;
        ticket: null;
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        scanId: string;
        scannedAt: Date;
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans?: undefined;
        remainingDays?: undefined;
    } | {
        scanId: string;
        scannedAt: Date;
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays: number;
    } | {
        scanId: string;
        scannedAt: Date;
        valid: boolean;
        reason: string;
        ticket: {
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
        };
        remainingScans: number;
        remainingDays?: undefined;
    }>;
    getScanHistory(_filters: {
        ticketId?: string;
        limit?: number;
    }): Promise<({
        ticket: {
            gameSession: string;
            ticketCode: string;
        };
    } & {
        id: string;
        location: string | null;
        scannedBy: string;
        scannedAt: Date;
        allowed: boolean;
        reason: string;
        ticketId: string;
    })[]>;
    getTicketStats(): Promise<{
        total: number;
        active: number;
        scanned: number;
        cancelled: number;
        expired: number;
        scanRate: number;
    }>;
    getSettings(): Promise<{
        id: number;
        updatedAt: Date;
        validityDays: number;
        maxScanCount: number;
        scanWindowDays: number;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        allowRefunds: boolean;
        allowTransfers: boolean;
        enableCategories: boolean;
    }>;
    updateSettings(data: UpdateSettingsInput): Promise<{
        id: number;
        updatedAt: Date;
        validityDays: number;
        maxScanCount: number;
        scanWindowDays: number;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        allowRefunds: boolean;
        allowTransfers: boolean;
        enableCategories: boolean;
    }>;
}
//# sourceMappingURL=ticket.service.d.ts.map