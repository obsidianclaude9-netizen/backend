export declare const generateTicketCode: () => string;
export declare const encryptTicketData: (data: string) => string;
export declare const decryptTicketData: (encryptedData: string) => string;
/**
 * Generate QR code and save to local storage
 */
export declare const generateQRCode: (ticketCode: string, ticketData: any) => Promise<string>;
export declare const isValidTicketCodeFormat: (code: string) => boolean;
export declare const daysBetween: (date1: Date, date2: Date) => number;
export declare const addDays: (date: Date, days: number) => Date;
export declare const isTicketExpired: (validUntil: Date) => boolean;
//# sourceMappingURL=ticket.utils.d.ts.map