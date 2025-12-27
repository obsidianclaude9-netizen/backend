import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export declare const initializeWebSocket: (httpServer: HTTPServer) => Promise<SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>>;
export declare const getIO: () => SocketIOServer;
export declare const emitNotification: (userId: string, notification: any) => void;
export declare const emitToAdmins: (event: string, data: any) => void;
export declare const emitToStaff: (event: string, data: any) => void;
export declare const emitOrderUpdate: (orderId: string, data: any) => void;
export declare const emitTicketUpdate: (ticketId: string, data: any) => void;
export declare const emitScanEvent: (scanData: any) => void;
export declare const emitAnalyticsUpdate: (metric: string, data: any) => void;
export declare const broadcastToAll: (event: string, data: any) => void;
export declare const getConnectionStats: () => Promise<{
    connected: number;
    rooms: never[];
    serverCount?: undefined;
} | {
    connected: number;
    rooms: string[];
    serverCount: number;
}>;
export declare const closeWebSocket: () => Promise<void>;
//# sourceMappingURL=websocket.d.ts.map