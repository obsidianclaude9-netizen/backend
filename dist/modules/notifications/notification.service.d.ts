import { CreateNotificationInput } from './notification.schema';
export declare class NotificationService {
    createNotification(data: CreateNotificationInput): Promise<{
        message: string;
        id: string;
        userId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        read: boolean;
        actionUrl: string | null;
    }>;
    listNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: {
            message: string;
            id: string;
            userId: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.NotificationType;
            title: string;
            read: boolean;
            actionUrl: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        unreadCount: number;
    }>;
    markAsRead(notificationId: string, userId: string): Promise<{
        message: string;
        id: string;
        userId: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        read: boolean;
        actionUrl: string | null;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
    deleteNotification(notificationId: string, userId: string): Promise<{
        message: string;
    }>;
    clearAll(userId: string): Promise<{
        message: string;
    }>;
    getUnreadCount(userId: string): Promise<{
        count: number;
    }>;
}
//# sourceMappingURL=notification.service.d.ts.map