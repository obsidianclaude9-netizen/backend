export interface ExportOptions {
    includeCharts?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export declare class ExcelExportService {
    generateAnalyticsReport(options?: ExportOptions): Promise<Buffer>;
    private addRevenueSheet;
    private addTicketsSheet;
    private addCustomersSheet;
    private addSessionsSheet;
    private addScansSheet;
    private formatSegmentName;
}
export declare const excelExportService: ExcelExportService;
//# sourceMappingURL=excel-export.service.d.ts.map