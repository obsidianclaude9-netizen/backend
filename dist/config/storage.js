"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTempFiles = exports.getFileSize = exports.fileExists = exports.deleteFile = exports.getFileUrl = exports.initializeStorage = exports.STORAGE_CONFIG = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * Storage configuration for local file system
 */
exports.STORAGE_CONFIG = {
    uploads: process.env.UPLOADS_DIR || './uploads',
    qrcodes: process.env.QR_CODE_DIR || './uploads/qrcodes',
    tickets: process.env.PDF_DIR || './uploads/tickets',
    customerDocuments: './uploads/customer-documents',
    temp: './uploads/temp',
};
/**
 * Initialize storage directories
 */
const initializeStorage = () => {
    Object.entries(exports.STORAGE_CONFIG).forEach(([key, directory]) => {
        if (!fs_1.default.existsSync(directory)) {
            fs_1.default.mkdirSync(directory, { recursive: true });
            logger_1.logger.info(`Created storage directory: ${directory} (${key})`);
        }
    });
    logger_1.logger.info('Local file storage initialized');
};
exports.initializeStorage = initializeStorage;
/**
 * Get public URL for uploaded file
 */
const getFileUrl = (relativePath) => {
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${baseUrl}${relativePath}`;
};
exports.getFileUrl = getFileUrl;
/**
 * Delete file from local storage
 */
const deleteFile = (relativePath) => {
    try {
        const fullPath = path_1.default.join(process.cwd(), relativePath);
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
            logger_1.logger.info(`File deleted: ${relativePath}`);
            return true;
        }
        return false;
    }
    catch (error) {
        logger_1.logger.error(`Failed to delete file: ${relativePath}`, error);
        return false;
    }
};
exports.deleteFile = deleteFile;
/**
 * Check if file exists
 */
const fileExists = (relativePath) => {
    const fullPath = path_1.default.join(process.cwd(), relativePath);
    return fs_1.default.existsSync(fullPath);
};
exports.fileExists = fileExists;
/**
 * Get file size in bytes
 */
const getFileSize = (relativePath) => {
    try {
        const fullPath = path_1.default.join(process.cwd(), relativePath);
        const stats = fs_1.default.statSync(fullPath);
        return stats.size;
    }
    catch (error) {
        logger_1.logger.error(`Failed to get file size: ${relativePath}`, error);
        return 0;
    }
};
exports.getFileSize = getFileSize;
/**
 * Clean up old temporary files (older than 24 hours)
 */
const cleanupTempFiles = () => {
    try {
        const tempDir = exports.STORAGE_CONFIG.temp;
        if (!fs_1.default.existsSync(tempDir))
            return;
        const files = fs_1.default.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        files.forEach(file => {
            const filePath = path_1.default.join(tempDir, file);
            const stats = fs_1.default.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs_1.default.unlinkSync(filePath);
                logger_1.logger.info(`Cleaned up temp file: ${file}`);
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to clean up temp files:', error);
    }
};
exports.cleanupTempFiles = cleanupTempFiles;
//# sourceMappingURL=storage.js.map