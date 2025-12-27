"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTicketExpired = exports.addDays = exports.daysBetween = exports.isValidTicketCodeFormat = exports.generateQRCode = exports.decryptTicketData = exports.encryptTicketData = exports.generateTicketCode = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
const ENCRYPTION_KEY = Buffer.from(process.env.QR_ENCRYPTION_KEY, 'hex');
const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';
const generateTicketCode = () => {
    const year = new Date().getFullYear();
    const random = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `JGPNR-${year}-${random}`;
};
exports.generateTicketCode = generateTicketCode;
const encryptTicketData = (data) => {
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
exports.encryptTicketData = encryptTicketData;
const decryptTicketData = (encryptedData) => {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptTicketData = decryptTicketData;
/**
 * Generate QR code and save to local storage
 */
const generateQRCode = async (ticketCode, ticketData) => {
    try {
        const dataString = JSON.stringify({
            code: ticketCode,
            orderId: ticketData.orderId,
            customerId: ticketData.customerId,
            gameSession: ticketData.gameSession,
            validUntil: ticketData.validUntil,
            timestamp: Date.now(),
        });
        const encrypted = (0, exports.encryptTicketData)(dataString);
        // Ensure QR code directory exists
        const qrDir = process.env.QR_CODE_DIR || './uploads/qrcodes';
        if (!fs_1.default.existsSync(qrDir)) {
            fs_1.default.mkdirSync(qrDir, { recursive: true });
        }
        const filename = `${ticketCode}.png`;
        const filepath = path_1.default.join(qrDir, filename);
        await qrcode_1.default.toFile(filepath, encrypted, {
            errorCorrectionLevel: 'H',
            type: 'png',
            margin: 1,
            width: 400,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        });
        logger_1.logger.info(`QR code generated: ${ticketCode}`);
        // Return relative path for database storage
        return `/uploads/qrcodes/${filename}`;
    }
    catch (error) {
        logger_1.logger.error('QR code generation failed:', error);
        throw error;
    }
};
exports.generateQRCode = generateQRCode;
const isValidTicketCodeFormat = (code) => {
    const regex = /^JGPNR-\d{4}-[A-Z0-9]{6}$/;
    return regex.test(code);
};
exports.isValidTicketCodeFormat = isValidTicketCodeFormat;
const daysBetween = (date1, date2) => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
exports.daysBetween = daysBetween;
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
exports.addDays = addDays;
const isTicketExpired = (validUntil) => {
    return new Date() > validUntil;
};
exports.isTicketExpired = isTicketExpired;
//# sourceMappingURL=ticket.utils.js.map