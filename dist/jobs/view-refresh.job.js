"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleViewRefresh = scheduleViewRefresh;
exports.refreshViewsNow = refreshViewsNow;
const node_cron_1 = __importDefault(require("node-cron"));
const materialized_views_service_1 = require("../utils/materialized-views.service");
const logger_1 = require("../utils/logger");
function scheduleViewRefresh() {
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        logger_1.logger.info('Starting materialized view refresh');
        try {
            await materialized_views_service_1.viewService.refreshAllViews();
            logger_1.logger.info('Materialized view refresh completed');
        }
        catch (error) {
            logger_1.logger.error('Materialized view refresh failed:', error);
        }
    });
    logger_1.logger.info('Materialized view refresh scheduled (every 5 minutes)');
}
async function refreshViewsNow() {
    await materialized_views_service_1.viewService.refreshAllViews();
}
//# sourceMappingURL=view-refresh.job.js.map