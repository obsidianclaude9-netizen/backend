import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const sanitizeString: (str: string) => string;
export declare const sanitizeObject: (obj: any) => any;
export declare const sanitizeInput: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map