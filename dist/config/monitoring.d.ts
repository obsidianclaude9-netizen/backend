import { Express, RequestHandler, ErrorRequestHandler } from 'express';
export declare const initializeSentry: (app: Express) => void;
export declare const getSentryMiddleware: () => {
    requestHandler: RequestHandler;
    tracingHandler: RequestHandler;
    errorHandler: ErrorRequestHandler;
};
//# sourceMappingURL=monitoring.d.ts.map