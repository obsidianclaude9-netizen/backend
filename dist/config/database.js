"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/config/database.ts
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
        ],
    });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
// Log queries in development
if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
        logger_1.logger.debug('Query: ' + e.query);
        logger_1.logger.debug('Params: ' + e.params);
        logger_1.logger.debug('Duration: ' + e.duration + 'ms');
    });
}
// Log errors
prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma Error:', e);
});
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger_1.logger.info('Database connection closed');
});
exports.default = prisma;
//# sourceMappingURL=database.js.map