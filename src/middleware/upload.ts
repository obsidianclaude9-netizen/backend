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
import redis from '../config/cache';
import { immutableAuditService } from '../services/immutableAudit.service';

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

const MAGIC_BYTE_SIGNATURES: Record<string, string[]> = {
  'jpg': ['ffd8ff'],
  'png': ['89504e47'],
  'gif': ['474946'],
  'pdf': ['25504446'],
  'docx': ['504b0304'],
  'xlsx': ['504b0304'],
};

const MAX_FILES = 5;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const UPLOAD_RATE_LIMIT_WINDOW = 60;
const UPLOAD_RATE_LIMIT_MAX = 20;
const DEEP_SCAN_SIZE = 10 * 1024;

const uploadsDir = process.env.UPLOADS_DIR || './uploads/documents';
const quarantineDir = process.env.QUARANTINE_DIR || './uploads/quarantine';
const tempDir = process.env.TEMP_UPLOADS_DIR || './uploads/temp';

[uploadsDir, quarantineDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
});

const isDevelopment = process.env.NODE_ENV === 'development';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file extension'), '');
    }
    const randomName = crypto.randomBytes(16).toString('hex');
    const safeFilename = `${Date.now()}-${randomName}${ext}`;
    
    if (safeFilename !== path.basename(safeFilename)) {
      return cb(new Error('Invalid filename detected'), '');
    }
    
    cb(null, safeFilename);
  }
});

const clamScanner = new clamscan({
  clamdscan: {
    host: process.env.CLAMAV_HOST || 'localhost',
    port: parseInt(process.env.CLAMAV_PORT || '3310'),
  },
  preference: 'clamdscan',
});

async function checkUploadRateLimit(userId: string, ipAddress: string): Promise<boolean> {
  const rateLimitKey = `upload:ratelimit:${userId || ipAddress}`;
  
  try {
    const current = await redis.incr(rateLimitKey);
    
    if (current === 1) {
      await redis.expire(rateLimitKey, UPLOAD_RATE_LIMIT_WINDOW);
    }

    if (current > UPLOAD_RATE_LIMIT_MAX) {
      logger.warn('Upload rate limit exceeded', {
        userId,
        ipAddress,
        requests: current,
        limit: UPLOAD_RATE_LIMIT_MAX,
      });

      await immutableAuditService.createLog({
        userId: userId || 'ANONYMOUS',
        action: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        entity: 'FILE_UPLOAD',
        entityId: rateLimitKey,
        ipAddress,
        metadata: {
          requests: current,
          limit: UPLOAD_RATE_LIMIT_MAX,
        },
        success: false,
      });

      return false;
    }

    return true;
  } catch (error) {
    logger.error('Rate limit check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      ipAddress,
    });
    return true;
  }
}

async function validateMagicBytes(buffer: Buffer, expectedType: string): Promise<boolean> {
  const hexHeader = buffer.slice(0, 8).toString('hex');
  const signatures = MAGIC_BYTE_SIGNATURES[expectedType];
  
  if (!signatures) {
    return true;
  }

  return signatures.some(sig => hexHeader.startsWith(sig));
}

async function deepContentScan(buffer: Buffer, fileType: string): Promise<{ safe: boolean; reason?: string }> {
  const scanSize = Math.min(buffer.length, DEEP_SCAN_SIZE);
  const content = buffer.subarray(0, scanSize).toString('utf8');
  const binaryContent = buffer.subarray(0, scanSize).toString('binary');

  const dangerousPatterns = [
    { pattern: /<script[^>]*>/i, description: 'JavaScript tag' },
    { pattern: /<iframe[^>]*>/i, description: 'iframe tag' },
    { pattern: /<embed[^>]*>/i, description: 'embed tag' },
    { pattern: /<object[^>]*>/i, description: 'object tag' },
    { pattern: /<\?php/i, description: 'PHP code' },
    { pattern: /<%[\s\S]*?%>/i, description: 'ASP/JSP code' },
    { pattern: /#!/, description: 'Shebang' },
    { pattern: /__import__\s*\(/i, description: 'Python import' },
    { pattern: /eval\s*\(/i, description: 'eval function' },
    { pattern: /exec\s*\(/i, description: 'exec function' },
    { pattern: /system\s*\(/i, description: 'system function' },
    { pattern: /passthru\s*\(/i, description: 'passthru function' },
    { pattern: /shell_exec/i, description: 'shell_exec function' },
    { pattern: /document\.write/i, description: 'document.write' },
    { pattern: /window\.location/i, description: 'window.location redirect' },
    { pattern: /onerror\s*=/i, description: 'onerror handler' },
    { pattern: /onload\s*=/i, description: 'onload handler' },
    { pattern: /onclick\s*=/i, description: 'onclick handler' },
    { pattern: /javascript:/i, description: 'javascript: protocol' },
    { pattern: /vbscript:/i, description: 'vbscript: protocol' },
    { pattern: /data:text\/html/i, description: 'data URI with HTML' },
  ];
  
  for (const { pattern, description } of dangerousPatterns) {
    if (pattern.test(content)) {
      return { safe: false, reason: `Malicious pattern detected: ${description}` };
    }
  }

  if (['jpg', 'png', 'gif', 'webp'].includes(fileType)) {
    const polyglotIndicators = [
      /GIF89a.*<script/is,
      /\xff\xd8\xff.*<\?php/s,
      /PNG.*<%/s,
    ];

    for (const indicator of polyglotIndicators) {
      if (indicator.test(binaryContent)) {
        return { safe: false, reason: 'Polyglot file detected' };
      }
    }
  }

  if (fileType === 'pdf') {
    const pdfThreats = [
      { pattern: /\/JavaScript/i, description: 'JavaScript in PDF' },
      { pattern: /\/JS/i, description: 'JS action in PDF' },
      { pattern: /\/Launch/i, description: 'Launch action in PDF' },
      { pattern: /\/URI/i, description: 'URI action in PDF' },
      { pattern: /\/SubmitForm/i, description: 'Form submission in PDF' },
      { pattern: /\/AA/i, description: 'Additional actions in PDF' },
    ];

    for (const { pattern, description } of pdfThreats) {
      if (pattern.test(binaryContent)) {
        return { safe: false, reason: description };
      }
    }
  }

  const nullByteIndex = buffer.indexOf(0x00);
  if (nullByteIndex !== -1 && nullByteIndex < scanSize && ['jpg', 'png', 'gif'].includes(fileType)) {
    const startPos = nullByteIndex + 1;
    const endPos = Math.min(nullByteIndex + 100, scanSize);
    const afterNull = buffer.subarray(startPos, endPos).toString('utf8');
    if (/<script/i.test(afterNull) || /<\?php/i.test(afterNull)) {
      return { safe: false, reason: 'Hidden content after null byte' };
    }
  }

  return { safe: true };
}

async function validateUploadedBuffer(buffer: Buffer, originalFilename: string): Promise<{ valid: boolean; reason?: string }> {
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType) {
    return { valid: false, reason: 'File type could not be determined from magic bytes' };
  }

  const allowedTypes = ['jpg', 'png', 'gif', 'webp', 'pdf', 'docx', 'xlsx'];
  if (!allowedTypes.includes(fileType.ext)) {
    return { valid: false, reason: `File type not allowed: ${fileType.ext}` };
  }

  const expectedExt = path.extname(originalFilename).toLowerCase().slice(1);
  const normalizedExpected = expectedExt === 'jpeg' ? 'jpg' : expectedExt;
  
  if (fileType.ext !== normalizedExpected) {
    return { valid: false, reason: `Extension mismatch: claimed ${expectedExt}, actual ${fileType.ext}` };
  }

  const magicBytesValid = await validateMagicBytes(buffer, fileType.ext);
  if (!magicBytesValid) {
    return { valid: false, reason: 'Invalid magic bytes for file type' };
  }

  const deepScan = await deepContentScan(buffer, fileType.ext);
  if (!deepScan.safe) {
    return { valid: false, reason: deepScan.reason };
  }

  if (['jpg', 'png', 'gif', 'webp'].includes(fileType.ext)) {
    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        return { valid: false, reason: 'Image missing dimensions' };
      }

      if (metadata.width > 10000 || metadata.height > 10000) {
        return { valid: false, reason: `Image dimensions too large: ${metadata.width}x${metadata.height}` };
      }

      if (metadata.width < 1 || metadata.height < 1) {
        return { valid: false, reason: 'Invalid image dimensions' };
      }

    } catch (imageError) {
      return { valid: false, reason: 'Image validation failed' };
    }
  }

  return { valid: true };
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

    const controlChars = /[\x00-\x1F\x7F]/;
    if (controlChars.test(file.originalname)) {
      return cb(new Error('Control characters not allowed in filename'));
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

export const scanFileForViruses = async (filepath: string): Promise<{ clean: boolean; viruses?: string[] }> => {
  try {
    const { isInfected, viruses } = await clamScanner.scanFile(filepath);
    
    if (isInfected) {
      logger.error('Virus detected in uploaded file', {
        filepath,
        viruses,
      });

      const quarantinePath = path.join(
        quarantineDir,
        `infected-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(filepath)}`
      );

      await fsPromises.rename(filepath, quarantinePath);
      
      await immutableAuditService.createLog({
        action: 'VIRUS_DETECTED',
        entity: 'FILE_UPLOAD',
        entityId: path.basename(filepath),
        metadata: {
          originalPath: filepath,
          quarantinePath,
          viruses,
        },
        success: false,
      });

      return { clean: false, viruses };
    }
    
    return { clean: true };
  } catch (error) {
    logger.error('Virus scan failed', { 
      filepath, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (!isDevelopment) {
      try {
        await fsPromises.unlink(filepath);
      } catch {}
      throw new Error('VIRUS_SCAN_FAILED');
    }

    logger.warn('Development mode: allowing upload despite scan failure');
    return { clean: true };
  }
};

export const validateUploadedFile = async (filepath: string, originalFilename: string, userId?: string, ipAddress?: string): Promise<boolean> => {
  try {
    const buffer = await fsPromises.readFile(filepath);

    const validation = await validateUploadedBuffer(buffer, originalFilename);
    
    if (!validation.valid) {
      logger.warn('File validation failed', {
        filepath,
        originalFilename,
        reason: validation.reason,
        userId,
        ipAddress,
      });

      await immutableAuditService.createLog({
        userId: userId || 'ANONYMOUS',
        action: 'FILE_VALIDATION_FAILED',
        entity: 'FILE_UPLOAD',
        entityId: path.basename(filepath),
        ipAddress,
        metadata: {
          originalFilename,
          reason: validation.reason,
          fileSize: buffer.length,
        },
        success: false,
      });

      await fsPromises.unlink(filepath);
      throw new Error(validation.reason || 'INVALID_FILE');
    }

    const scanResult = await scanFileForViruses(filepath);
    
    if (!scanResult.clean) {
      throw new Error('VIRUS_DETECTED');
    }

    await immutableAuditService.createLog({
      userId: userId || 'ANONYMOUS',
      action: 'FILE_UPLOAD_VALIDATED',
      entity: 'FILE_UPLOAD',
      entityId: path.basename(filepath),
      ipAddress,
      metadata: {
        originalFilename,
        fileSize: buffer.length,
      },
    });

    return true;
  } catch (error) {
    logger.error('File validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      filepath,
      userId,
      ipAddress,
    });
    
    try {
      const stats = await fsPromises.stat(filepath);
      if (stats) {
        await fsPromises.unlink(filepath);
      }
    } catch {}
    
    throw error;
  }
};

export const sanitizeImage = async (filepath: string): Promise<void> => {
  const sharp = require('sharp');
  const tempPath = filepath + '.temp';

  try {
    await sharp(filepath)
      .withMetadata(false)
      .toFile(tempPath);

    await fsPromises.unlink(filepath);
    await fsPromises.rename(tempPath, filepath);

    logger.info('Image sanitized successfully', { filepath });
  } catch (error) {
    logger.error('Image sanitization failed', { 
      filepath, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
   
    try {
      await fsPromises.unlink(tempPath);
    } catch {}
    throw new Error('Image sanitization failed');
  }
};

export const postUploadValidation = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  const userId = (req as any).user?.userId;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    const isRateLimitOk = await checkUploadRateLimit(userId, ipAddress);
    if (!isRateLimitOk) {
      return res.status(429).json({ 
        error: 'Upload rate limit exceeded. Please try again later.' 
      });
    }

    if (!req.file) return next();

    const tempFilePath = req.file.path;
    const originalFilename = req.file.originalname;

    await validateUploadedFile(tempFilePath, originalFilename, userId, ipAddress);

    const ext = path.extname(tempFilePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      try {
        await sanitizeImage(tempFilePath);
      } catch (error) {
        logger.error('Image sanitization failed during post-upload', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId,
          ipAddress,
        });
        return res.status(400).json({ error: 'File processing failed' });
      }
    }

    const finalPath = path.join(
      uploadsDir, 
      `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${ext}`
    );
    
    await fsPromises.rename(tempFilePath, finalPath);
    req.file.path = finalPath;

    logger.info('File upload successful', {
      userId,
      ipAddress,
      filename: path.basename(finalPath),
      originalFilename,
      size: req.file.size,
    });
    
    next();
  } catch (error) {
    logger.error('Post-upload validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      ipAddress,
    });

    if (req.file?.path) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch {}
    }

    return res.status(400).json({ 
      error: isDevelopment 
        ? (error instanceof Error ? error.message : 'File validation failed')
        : 'File validation failed' 
    });
  }
};

export const checkClamAVHealth = async (): Promise<boolean> => {
  try {
    const testFilePath = path.join(tempDir, `clamav-test-${Date.now()}.txt`);
    await fsPromises.writeFile(testFilePath, 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');
    
    const { isInfected } = await clamScanner.scanFile(testFilePath);
    
    try {
      await fsPromises.unlink(testFilePath);
    } catch {}
    
    return isInfected === true;
  } catch (error) {
    logger.error('ClamAV health check failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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

export const deleteFile = async (filepath: string): Promise<boolean> => {
  try {
    const stats = await fsPromises.stat(filepath);
    if (stats.isFile()) {
      await fsPromises.unlink(filepath);
      logger.info('File deleted successfully', { filepath });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      filepath,
    });
    return false;
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DOCUMENT_SIZE }
});