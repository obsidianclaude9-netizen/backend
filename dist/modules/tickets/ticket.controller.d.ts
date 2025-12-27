import { Request, Response } from 'express';
export declare const createTickets: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const listTickets: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTicket: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTicketByCode: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateTicket: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const cancelTicket: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const validateTicket: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const scanTicket: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getScanHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getTicketStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const getSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const updateSettings: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=ticket.controller.d.ts.map