// src/utils/ticket.utils.ts
import QRCode from 'qrcode';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';


if (!process.env.QR_ENCRYPTION_KEY) {
  throw new Error('QR_ENCRYPTION_KEY is required');
}

const validateEncryptionKey = () => {
  const key = process.env.QR_ENCRYPTION_KEY;
  
  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('QR_ENCRYPTION_KEY must be 64 character hex (256-bit)');
  }

  const weakPatterns = [
    /^0+$/,                          // All zeros
    /^f+$/i,                         // All F's
    /^(00)+$/,                       // Repeating 00
    /^(ff)+$/i,                      // Repeating FF
    /^(0123456789abcdef)+$/i,        // Sequential hex
    /^(fedcba9876543210)+$/i,        // Reverse sequential
    /^(.)\1{63}$/,                   // Same character repeated
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(key)) {
      throw new Error(`QR_ENCRYPTION_KEY contains weak pattern: ${pattern.source}`);
    }
  }

  const uniqueChars = new Set(key.toLowerCase().split('')).size;
  if (uniqueChars < 12) {
    throw new Error(
      `QR_ENCRYPTION_KEY has insufficient entropy: only ${uniqueChars} unique characters (min 12)`
    );
  }

  const charFreq = new Map<string, number>();
  const lowerKey = key.toLowerCase();
  
  for (const char of lowerKey) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of charFreq.values()) {
    const p = count / key.length;
    entropy -= p * Math.log2(p);
  }

  const minEntropy = 3.5;
  if (entropy < minEntropy) {
    throw new Error(
      `QR_ENCRYPTION_KEY entropy too low: ${entropy.toFixed(2)} bits (min ${minEntropy})`
    );
  }

  for (let i = 0; i < lowerKey.length - 8; i++) {
    const substring = lowerKey.substring(i, i + 8);
    
    let isAscending = true;
    for (let j = 0; j < substring.length - 1; j++) {
      const curr = parseInt(substring[j], 16);
      const next = parseInt(substring[j + 1], 16);
      if ((next - curr) !== 1 && !(curr === 15 && next === 0)) {
        isAscending = false;
        break;
      }
    }
    
    if (isAscending) {
      throw new Error('QR_ENCRYPTION_KEY contains sequential pattern');
    }

    let isDescending = true;
    for (let j = 0; j < substring.length - 1; j++) {
      const curr = parseInt(substring[j], 16);
      const next = parseInt(substring[j + 1], 16);
      if ((curr - next) !== 1 && !(curr === 0 && next === 15)) {
        isDescending = false;
        break;
      }
    }
    
    if (isDescending) {
      throw new Error('QR_ENCRYPTION_KEY contains sequential pattern');
    }
  }


  const knownWeakKeys = [
    'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '0000000000000000000000000000000000000000000000000000000000000000',
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  ];

  if (knownWeakKeys.includes(lowerKey)) {
    throw new Error('QR_ENCRYPTION_KEY matches known weak key');
  }

  logger.info('✅ QR_ENCRYPTION_KEY validation passed', {
    entropy: entropy.toFixed(2),
    uniqueChars
  });
};
if (process.env.QR_ENCRYPTION_KEY_V2) {
  const validateV2 = () => {
    const keyV2 = process.env.QR_ENCRYPTION_KEY_V2;
    
    if (!keyV2 || !/^[0-9a-fA-F]{64}$/.test(keyV2)) {
      throw new Error('QR_ENCRYPTION_KEY_V2 must be 64 character hex (256-bit)');
    }
    if (keyV2.toLowerCase() === process.env.QR_ENCRYPTION_KEY?.toLowerCase()) {
      throw new Error('QR_ENCRYPTION_KEY_V2 must differ from QR_ENCRYPTION_KEY');
    }

  };
  
  validateV2();
}

validateEncryptionKey();



const IV_LENGTH = 16;
const ENCRYPTION_KEYS = [
  { id: 'v1', key: Buffer.from(process.env.QR_ENCRYPTION_KEY!, 'hex') },
  
  { id: 'v2', key: Buffer.from(process.env.QR_ENCRYPTION_KEY_V2!, 'hex') },
];
const CURRENT_KEY = ENCRYPTION_KEYS[ENCRYPTION_KEYS.length - 1];
const ALGORITHM = 'aes-256-cbc';



export const generateTicketCode = (): string => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `JGPNR-${year}-${random}`;
};
export const encryptTicketData = (data: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, CURRENT_KEY.key, iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return CURRENT_KEY.id + ':' + iv.toString('hex') + ':' + encrypted;
};
export const decryptTicketData = (encryptedData: string): string => {
  const parts = encryptedData.split(':');
  
  let keyId: string, ivHex: string, encrypted: string;
  
  if (parts.length === 2) {
    keyId = 'v1';
    [ivHex, encrypted] = parts;
  } else if (parts.length === 3) {
    [keyId, ivHex, encrypted] = parts;
  } else {
    throw new Error('Invalid encrypted data format');
  }
  const keyEntry = ENCRYPTION_KEYS.find(k => k.id === keyId);
  if (!keyEntry) {
    throw new Error('Unknown encryption key version');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, keyEntry.key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const generateQRCode = async (
  ticketCode: string,
  ticketData: any
): Promise<string> => {
  try {
    const dataString = JSON.stringify({
      code: ticketCode,
      orderId: ticketData.orderId,
      customerId: ticketData.customerId,
      gameSession: ticketData.gameSession,
      validUntil: ticketData.validUntil,
      timestamp: Date.now(),
    });

    const encrypted = encryptTicketData(dataString);

    // Ensure QR code directory exists
    const qrDir = process.env.QR_CODE_DIR || './uploads/qrcodes';
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const filename = `${ticketCode}.png`;
    const filepath = path.join(qrDir, filename);

    await QRCode.toFile(filepath, encrypted, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    logger.info(`QR code generated: ${ticketCode}`);
    
    // Return relative path for database storage
    return `/uploads/qrcodes/${filename}`;
  } catch (error) {
    logger.error('QR code generation failed:', error);
    throw new Error(`Failed to generate QR code for ticket ${ticketCode}`);
  }
};

export const isValidTicketCodeFormat = (code: string): boolean => {
  const regex = /^JGPNR-\d{4}-[A-Z0-9]{6}$/;
  return regex.test(code);
};

export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isTicketExpired = (validUntil: Date): boolean => {
  return new Date() > validUntil;
};