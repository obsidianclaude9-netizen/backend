import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    isOperational: boolean;
    constructor(statusCode: number, message: string, isOperational?: boolean);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
export declare const notFoundHandler: (req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map