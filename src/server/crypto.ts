/**
 * Encryption and Credential Protection Module
 * AES-256-GCM encryption for service account private keys and OAuth secrets.
 */
import crypto from 'crypto';

// Server-side master key (can be overridden by environment variable)
const MASTER_SECRET = process.env.ENCRYPTION_KEY || 'nexus-erp-enterprise-vault-key-2026-prod-0912';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recommended for GCM
const KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

/**
 * Encrypts a plaintext string (private key, client secret)
 * Returns hex encoded string: iv:authTag:encryptedData
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted credential string
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText) return '';
  // Check if string is formatted as iv:authTag:encrypted
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    // If not encrypted format, return as is (for dev compatibility)
    return cipherText;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return '';
  }
}

/**
 * Masks a secret string for safe display in UI
 * e.g. "•••••••••••••••••••••••••a1b2"
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 6) return '••••••';
  const last4 = secret.slice(-4);
  return `••••••••••••••••••••••••${last4}`;
}
