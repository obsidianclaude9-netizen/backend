"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadMultiple = exports.uploadOrderDoc = exports.uploadCustomerDoc = exports.uploadAvatar = exports.uploadSingle = exports.upload = void 0;
// src/middleware/upload.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const ensureDir = (dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
};
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        let uploadPath = 'uploads/documents';
        if (file.fieldname === 'avatar')
            uploadPath = 'uploads/avatars';
        else if (file.fieldname === 'customerDoc')
            uploadPath = 'uploads/customer-documents';
        else if (file.fieldname === 'orderDoc')
            uploadPath = 'uploads/order-documents';
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = crypto_1.default.randomBytes(16).toString('hex');
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowedMimes = {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        document: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    };
    const allAllowed = [...allowedMimes.image, ...allowedMimes.document];
    if (allAllowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
    }
};
// Multer instance
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
});
// Upload configurations
exports.uploadSingle = exports.upload.single('file');
exports.uploadAvatar = exports.upload.single('avatar');
exports.uploadCustomerDoc = exports.upload.single('customerDoc');
exports.uploadOrderDoc = exports.upload.single('orderDoc');
exports.uploadMultiple = exports.upload.array('files', 5);
// Delete file helper
const deleteFile = (filepath) => {
    try {
        if (fs_1.default.existsSync(filepath)) {
            fs_1.default.unlinkSync(filepath);
        }
    }
    catch (error) {
        console.error('Error deleting file:', error);
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=upload.js.map