// src/utils/file-encryption.ts

import crypto from 'crypto';
import fs from 'fs/promises';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const FILE_ENCRYPTION_KEY_HEX = process.env.FILE_ENCRYPTION_KEY;

if (!FILE_ENCRYPTION_KEY_HEX || !/^[0-9a-fA-F]{64}$/.test(FILE_ENCRYPTION_KEY_HEX)) {
  throw new Error(
    'FILE_ENCRYPTION_KEY must be set and be a 64-character hex string. ' +
    'Generate one with: openssl rand -hex 32'
  );
}

const FILE_ENCRYPTION_KEY = Buffer.from(FILE_ENCRYPTION_KEY_HEX, 'hex');

export const encryptFile = async (
  filepath: string
): Promise<void> => {
  const data = await fs.readFile(filepath);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, FILE_ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  const output = Buffer.concat([iv, authTag, encrypted]);
  
  await fs.writeFile(filepath + '.enc', output);
  await fs.unlink(filepath); 
  
  logger.info('File encrypted', { filepath });
};

export const decryptFile = async (
  filepath: string
): Promise<Buffer> => {
  const data = await fs.readFile(filepath);
  
  const iv = data.slice(0, 16);
  const authTag = data.slice(16, 32);
  const encrypted = data.slice(32);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, FILE_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted;
};