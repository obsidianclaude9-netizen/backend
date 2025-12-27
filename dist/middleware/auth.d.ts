import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
export declare const authenticateJWT: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireStaff: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map