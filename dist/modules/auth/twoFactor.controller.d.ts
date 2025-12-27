import { Request, Response } from 'express';
export declare const generateSecret: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const enableTwoFactor: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const verifyToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const disableTwoFactor: (req: Request, res: Response, next: import("express").NextFunction) => void;
export declare const regenerateBackupCodes: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=twoFactor.controller.d.ts.map