import { CreateSubscriberInput, UpdateSubscriberInput, ListSubscribersInput } from './subscriber.schema';
export declare class SubscriberService {
    createSubscriber(data: CreateSubscriberInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        email: string;
        createdAt: Date;
        source: string;
        subscribedAt: Date;
    }>;
    listSubscribers(filters: ListSubscribersInput): Promise<{
        subscribers: {
            status: string;
            id: string;
            updatedAt: Date;
            name: string;
            email: string;
            createdAt: Date;
            source: string;
            subscribedAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        activeCount: number;
    }>;
    getSubscriber(subscriberId: string): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        email: string;
        createdAt: Date;
        source: string;
        subscribedAt: Date;
    }>;
    updateSubscriber(subscriberId: string, data: UpdateSubscriberInput): Promise<{
        status: string;
        id: string;
        updatedAt: Date;
        name: string;
        email: string;
        createdAt: Date;
        source: string;
        subscribedAt: Date;
    }>;
    deleteSubscriber(subscriberId: string): Promise<{
        message: string;
    }>;
    exportSubscribers(status?: string): Promise<string>;
    getSubscriberStats(): Promise<{
        total: number;
        active: number;
        unsubscribed: number;
        recentCount: number;
    }>;
}
//# sourceMappingURL=subscriber.service.d.ts.map