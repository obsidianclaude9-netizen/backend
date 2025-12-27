export interface TicketPDFData {
    ticketCode: string;
    orderNumber: string;
    customerName: string;
    gameSession: string;
    validUntil: Date;
    qrCodePath: string;
}
export declare const generateTicketPDF: (ticketData: TicketPDFData) => Promise<string>;
//# sourceMappingURL=pdf.utils.d.ts.map