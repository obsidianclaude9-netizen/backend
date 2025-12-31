//src/config/startup-checks.ts

import { logger } from '../utils/logger';

export const validateSecrets = (): void => {
  const requiredSecrets = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'QR_ENCRYPTION_KEY',
  ];

  for (const secret of requiredSecrets) {
    const value = process.env[secret];
    
    if (!value) {
      throw new Error(`${secret} is not set in environment variables`);
    }

    if (value.length < 32) {
      throw new Error(`${secret} must be at least 32 characters long`);
    }

    const uniqueChars = new Set(value.toLowerCase().split('')).size;
    if (uniqueChars < 16) {
      throw new Error(`${secret} has insufficient entropy (min 16 unique chars)`);
    }

    const weakSecrets = ['secret', 'password', '123456', 'admin', 'test'];
    const lowerValue = value.toLowerCase();
    for (const weak of weakSecrets) {
      if (lowerValue.includes(weak)) {
        throw new Error(`${secret} contains weak pattern: ${weak}`);
      }
    }
  }

  logger.info('✅ All secrets validated successfully');
};
export const validateFileEncryptionKey = (): void => {
  const key = process.env.FILE_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('FILE_ENCRYPTION_KEY is not set in environment variables');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('FILE_ENCRYPTION_KEY must be 64 character hex string (256-bit)');
  }

  const uniqueChars = new Set(key.toLowerCase().split('')).size;
  if (uniqueChars < 12) {
    throw new Error(`FILE_ENCRYPTION_KEY has insufficient entropy (${uniqueChars} unique chars, min 12)`);
  }
  const weakPatterns = [
    /^0+$/,
    /^f+$/i,
    /^(00)+$/,
    /^(ff)+$/i,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(key)) {
      throw new Error('FILE_ENCRYPTION_KEY contains weak pattern');
    }
  }

  logger.info('✅ FILE_ENCRYPTION_KEY validation passed');
};