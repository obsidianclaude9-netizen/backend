// src/utils/file-encryption.ts

import crypto from 'crypto';
import fs from 'fs/promises';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const FILE_ENCRYPTION_KEY = Buffer.from(
  process.env.FILE_ENCRYPTION_KEY || '', 
  'hex'
);

export const encryptFile = async (
  filepath: string
): Promise<void> => {
  const data = await fs.readFile(filepath);
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, FILE_ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  // Format: IV (16) + AuthTag (16) + Encrypted Data
  const output = Buffer.concat([iv, authTag, encrypted]);
  
  await fs.writeFile(filepath + '.enc', output);
  await fs.unlink(filepath); // Delete original
  
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