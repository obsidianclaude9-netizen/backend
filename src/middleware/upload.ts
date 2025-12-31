// src/middleware/upload.ts 
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { logger } from '../utils/logger';
import { promises as fsPromises } from 'fs';
import { Response, NextFunction } from 'express';
import clamscan from 'clamscan';


const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];


const MAX_FILES = 5;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;


const uploadsDir = process.env.UPLOADS_DIR || './uploads/documents';

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file extension'),'');
    }
    const randomName = crypto.randomBytes(16).toString('hex');
    const safeFilename = `${Date.now()}-${randomName}${ext}`;
    
    if (safeFilename !== path.basename(safeFilename)) {
      return cb(new Error('Invalid filename detected'),'');
    }
    
    cb(null, safeFilename);
  }
});

const clamScanner = new clamscan({
  clamdscan: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: process.env.CLAMAV_PORT || 3310,
  },
  preference: 'clamdscan', 
});

export const postUploadValidation = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.file) return next();
  
  // Validate BEFORE writing to disk
  const isValid = await validateUploadedBuffer(req.file.buffer);
  
  if (!isValid) {
    return res.status(400).json({ error: 'File validation failed' });
  }

  const finalPath = path.join(uploadsDir, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`);
  await fsPromises.writeFile(finalPath, req.file.buffer);
  req.file.path = finalPath;
  
  next();
};
async function validateUploadedBuffer(buffer: Buffer): Promise<boolean> {
  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType) return false;

  const allowedTypes = ['jpg', 'png', 'gif', 'webp', 'pdf', 'docx', 'xlsx'];
  if (!allowedTypes.includes(fileType.ext)) return false;

  const content = buffer.toString('utf8', 0, 1024);
  const dangerousPatterns = [/<script/i, /<\?php/i, /<%/, /#!/];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) return false;
  }

  return true;
}

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  try {
    if (file.originalname.includes('..')) {
      return cb(new Error('Path traversal detected'));
    }
    
    if (file.originalname.includes('/') || file.originalname.includes('\\')) {
      return cb(new Error('Directory separators not allowed'));
    }
    
    if (file.originalname.includes('\0')) {
      return cb(new Error('Null bytes not allowed'));
    }
    
    const normalized = path.normalize(file.originalname);
    const basename = path.basename(normalized);
    
    if (normalized !== basename) {
      return cb(new Error('Invalid filename structure'));
    }
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File extension ${ext} not allowed`));
    }
    
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`MIME type ${file.mimetype} not allowed`));
    }

    const parts = file.originalname.split('.');
    if (parts.length > 2) {
      return cb(new Error('Multiple file extensions not allowed'));
    }
    if (file.originalname.length > 255) {
      return cb(new Error('Filename too long (max 255 chars)'));
    }

    cb(null, true);
  } catch (error) {
    cb(new Error('File validation failed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: MAX_FILES,
  },
});
export const scanFileForViruses = async (filepath: string): Promise<boolean> => {
  try {
    const { isInfected, viruses } = await clamScanner.scanFile(filepath);
    
    if (isInfected) {
      logger.error('Virus detected in uploaded file', {
        filepath,
        viruses,
      });
      
      await fsPromises.unlink(filepath);
      
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Virus scan failed', { filepath, error });
    
    return false;
  }
};

export const validateUploadedFile = async (filepath: string): Promise<boolean> => {
  try {
    const buffer = await fsPromises.readFile(filepath);

    
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) {
      logger.warn('Could not determine file type from magic bytes', { filepath });
      await fsPromises.unlink(filepath);
      throw new Error('INVALID_FILE_TYPE'); 
    }

    const allowedTypes = ['jpg', 'png', 'gif', 'webp', 'pdf', 'docx', 'xlsx'];
    if (!allowedTypes.includes(fileType.ext)) {
      logger.warn('File type mismatch', {
        filepath,
        claimedType: path.extname(filepath),
        actualType: fileType.ext,
      });
      await fsPromises.unlink(filepath);
      throw new Error('DISALLOWED_FILE_TYPE'); 
    }

    // Malicious content detection
    const content = buffer.toString('utf8', 0, 1024);
    const dangerousPatterns = [
      /<script/i, /<\?php/i, /<%/, /#!/, /__import__/i, /eval\(/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        logger.error('Malicious content detected in upload', { filepath }); 
        await fsPromises.unlink(filepath);
        throw new Error('MALICIOUS_CONTENT_DETECTED'); 
      }
    }

    try {
      const isClean = await scanFileForViruses(filepath);
      if (!isClean) {
        throw new Error('VIRUS_DETECTED');
      }
    } catch (scanError) {
      
      logger.error('Virus scan failed or unavailable - REJECTING upload', { 
        filepath, 
        error: scanError 
      });
      await fsPromises.unlink(filepath);
      throw new Error('VIRUS_SCAN_UNAVAILABLE'); 
    }

    return true;
  } catch (error) {
    logger.error('File validation error:', error);
    
    try {
      await fsPromises.unlink(filepath);
    } catch {}
    throw error; 
  }
};

export const checkClamAVHealth = async (): Promise<boolean> => {
  try {
    const testFile = path.join(process.cwd(), 'uploads/temp/clamav-test.txt');
    await fsPromises.writeFile(testFile, 'EICAR-STANDARD-ANTIVIRUS-TEST-FILE');
    
    const { isInfected } = await clamScanner.scanFile(testFile);
    await fsPromises.unlink(testFile);
    
    // Should detect EICAR test file
    return isInfected === true;
  } catch (error) {
    logger.error('ClamAV health check failed', { error });
    return false;
  }
};
export const uploadSingle = upload.single('file');
export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE },
});
export const uploadCustomerDoc = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE },
});
export const uploadOrderDoc = upload.single('orderDoc');
export const uploadMultiple = upload.array('files', MAX_FILES);

export const deleteFile = (filepath: string): boolean => {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
};
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE }
});