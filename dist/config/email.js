"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.getTransporter = exports.createTransporter = void 0;
// src/config/email.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../utils/logger");
let transporter = null;
const createTransporter = async () => {
    try {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
        });
        // Verify connection
        await transporter.verify();
        logger_1.logger.info('SMTP connection established');
        return transporter;
    }
    catch (error) {
        logger_1.logger.error('SMTP connection failed:', error);
        throw error;
    }
};
exports.createTransporter = createTransporter;
const getTransporter = async () => {
    if (!transporter) {
        return await (0, exports.createTransporter)();
    }
    return transporter;
};
exports.getTransporter = getTransporter;
const sendEmail = async (options) => {
    try {
        const transport = await (0, exports.getTransporter)();
        const mailOptions = {
            from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            attachments: options.attachments,
        };
        const info = await transport.sendMail(mailOptions);
        logger_1.logger.info(`Email sent to ${options.to}: ${info.messageId}`);
        return info;
    }
    catch (error) {
        logger_1.logger.error('Email send failed:', error);
        throw error;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=email.js.map