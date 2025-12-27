export interface TicketPDFData {
    ticketCode: string;
    orderNumber: string;
    customerName: string;
    gameSession: string;
    validUntil: Date;
    qrCodePath: string;
}
/**
 * Generate ticket PDF and save to local storage
 */
export declare const generateTicketPDF: (ticketData: TicketPDFData) => Promise<string>;
//# sourceMappingURL=pdf.utils.d.ts.map