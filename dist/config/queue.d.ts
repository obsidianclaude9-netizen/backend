import { Queue } from 'bullmq';
import IORedis from 'ioredis';
declare const connection: IORedis;
export declare const emailQueue: Queue<any, any, string>;
export declare const campaignQueue: Queue<any, any, string>;
export declare const cleanupQueue: Queue<any, any, string>;
export { connection };
//# sourceMappingURL=queue.d.ts.map