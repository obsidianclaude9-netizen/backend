import { Request, Response, NextFunction } from 'express';
export declare const auditLog: (action: string, entity: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.d.ts.map