import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export declare const initializeWebSocket: (httpServer: HTTPServer) => SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export declare const getIO: () => SocketIOServer;
export declare const emitNotification: (userId: string, notification: any) => void;
export declare const emitToAdmins: (event: string, data: any) => void;
export declare const emitOrderUpdate: (orderId: string, data: any) => void;
export declare const emitTicketUpdate: (ticketId: string, data: any) => void;
export declare const emitScanEvent: (scanData: any) => void;
//# sourceMappingURL=websocket.d.ts.map