/**
 * Generate unique ticket code: JGPNR-YYYY-XXXXXX
 */
export declare const generateTicketCode: () => string;
/**
 * Encrypt ticket data for QR code
 */
export declare const encryptTicketData: (data: string) => string;
/**
 * Decrypt ticket data from QR code
 */
export declare const decryptTicketData: (encryptedData: string) => string;
/**
 * Generate QR code and save to file
 */
export declare const generateQRCode: (ticketCode: string, ticketData: any) => Promise<string>;
/**
 * Validate ticket code format
 */
export declare const isValidTicketCodeFormat: (code: string) => boolean;
/**
 * Calculate days between two dates
 */
export declare const daysBetween: (date1: Date, date2: Date) => number;
/**
 * Add days to date
 */
export declare const addDays: (date: Date, days: number) => Date;
/**
 * Check if ticket is expired
 */
export declare const isTicketExpired: (validUntil: Date) => boolean;
//# sourceMappingURL=ticket.utils.d.ts.map