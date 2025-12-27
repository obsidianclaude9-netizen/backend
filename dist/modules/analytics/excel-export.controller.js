"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAnalyticsExcel = void 0;
const errorHandler_1 = require("../../middleware/errorHandler");
const excel_export_service_1 = require("./excel-export.service");
const logger_1 = require("../../utils/logger");
exports.exportAnalyticsExcel = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const includeCharts = req.query.includeCharts === 'true';
    let dateRange;
    if (req.query.startDate && req.query.endDate) {
        dateRange = {
            start: new Date(req.query.startDate),
            end: new Date(req.query.endDate)
        };
    }
    logger_1.logger.info('Generating Excel analytics report', {
        includeCharts,
        dateRange
    });
    const buffer = await excel_export_service_1.excelExportService.generateAnalyticsReport({
        includeCharts,
        dateRange
    });
    const filename = `JGPNR_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
});
//# sourceMappingURL=excel-export.controller.js.map