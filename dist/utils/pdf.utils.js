"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTicketPDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
/**
 * Generate ticket PDF and save to local storage
 */
const generateTicketPDF = async (ticketData) => {
    return new Promise((resolve, reject) => {
        try {
            // Ensure PDF directory exists
            const pdfDir = process.env.PDF_DIR || './uploads/tickets';
            if (!fs_1.default.existsSync(pdfDir)) {
                fs_1.default.mkdirSync(pdfDir, { recursive: true });
            }
            const filename = `${ticketData.ticketCode}.pdf`;
            const filepath = path_1.default.join(pdfDir, filename);
            const doc = new pdfkit_1.default({
                size: 'A5',
                margin: 50,
            });
            const writeStream = fs_1.default.createWriteStream(filepath);
            doc.pipe(writeStream);
            // Header
            doc
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('JGPNR PAINTBALL', { align: 'center' })
                .moveDown(0.5);
            doc
                .fontSize(14)
                .font('Helvetica')
                .text('ENTRY TICKET', { align: 'center' })
                .moveDown(1.5);
            // Ticket details
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('Ticket Code:', { continued: true })
                .font('Helvetica')
                .text(` ${ticketData.ticketCode}`)
                .moveDown(0.5);
            doc
                .font('Helvetica-Bold')
                .text('Order Number:', { continued: true })
                .font('Helvetica')
                .text(` ${ticketData.orderNumber}`)
                .moveDown(0.5);
            doc
                .font('Helvetica-Bold')
                .text('Customer:', { continued: true })
                .font('Helvetica')
                .text(` ${ticketData.customerName}`)
                .moveDown(0.5);
            doc
                .font('Helvetica-Bold')
                .text('Session:', { continued: true })
                .font('Helvetica')
                .text(` ${ticketData.gameSession}`)
                .moveDown(0.5);
            doc
                .font('Helvetica-Bold')
                .text('Valid Until:', { continued: true })
                .font('Helvetica')
                .text(` ${ticketData.validUntil.toLocaleDateString()}`)
                .moveDown(2);
            // QR Code (from local file system)
            if (ticketData.qrCodePath) {
                try {
                    const qrCodeFullPath = path_1.default.join(process.cwd(), ticketData.qrCodePath);
                    if (fs_1.default.existsSync(qrCodeFullPath)) {
                        doc.text('Scan QR Code at Entry:', { align: 'center' });
                        doc.moveDown(0.5);
                        const qrX = (doc.page.width - 200) / 2;
                        doc.image(qrCodeFullPath, qrX, doc.y, {
                            width: 200,
                            height: 200,
                            align: 'center',
                        });
                        doc.moveDown(10);
                    }
                }
                catch (error) {
                    logger_1.logger.error('Failed to embed QR code in PDF:', error);
                }
            }
            // Footer
            doc
                .fontSize(10)
                .font('Helvetica')
                .text('Terms & Conditions:', { align: 'center' })
                .moveDown(0.3);
            doc
                .fontSize(8)
                .text('• This ticket is valid for 2 scans within 14 days', { align: 'center' })
                .text('• Non-transferable and non-refundable', { align: 'center' })
                .text('• Must be presented at entry', { align: 'center' })
                .moveDown(1);
            doc
                .fontSize(9)
                .text('Contact: info@jgpnr.com | +234-XXX-XXX-XXXX', { align: 'center' });
            doc.end();
            writeStream.on('finish', () => {
                logger_1.logger.info(`PDF generated: ${ticketData.ticketCode}`);
                // Return relative path for database storage
                resolve(`/uploads/tickets/${filename}`);
            });
            writeStream.on('error', (error) => {
                logger_1.logger.error('PDF generation failed:', error);
                reject(error);
            });
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.generateTicketPDF = generateTicketPDF;
//# sourceMappingURL=pdf.utils.js.map