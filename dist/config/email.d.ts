import nodemailer from 'nodemailer';
export declare const createTransporter: () => Promise<nodemailer.Transporter<any, nodemailer.TransportOptions>>;
export declare const getTransporter: () => Promise<nodemailer.Transporter<any, nodemailer.TransportOptions>>;
export interface EmailOptions {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: Buffer;
    }>;
}
export declare const sendEmail: (options: EmailOptions) => Promise<any>;
//# sourceMappingURL=email.d.ts.map