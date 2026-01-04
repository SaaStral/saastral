/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * (e.g., Service Account credentials, OAuth tokens, API keys).
 *
 * SECURITY-CRITICAL: This service must correctly encrypt/decrypt credentials
 * to prevent credential leakage.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

/**
 * Encryption algorithm: AES-256-GCM
 * - AES-256: Strong symmetric encryption
 * - GCM: Galois/Counter Mode provides authentication (prevents tampering)
 */
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits (GCM standard)
const SALT_LENGTH = 32 // 256 bits for key derivation

export class EncryptionService {
  private masterKey: Buffer

  constructor(encryptionKey?: string) {
    const key = encryptionKey ?? process.env.ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET

    if (!key) {
      throw new Error(
        'Encryption key not found. Set ENCRYPTION_KEY or NEXTAUTH_SECRET environment variable.',
      )
    }

    if (key.length < 32) {
      throw new Error('Encryption key must be at least 32 characters long')
    }

    // Store master key as buffer
    this.masterKey = Buffer.from(key, 'utf-8')
  }

  /**
   * Derive encryption key from master key using scrypt
   * This adds an extra layer of security and allows different salts per encryption
   */
  private async deriveKey(salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(this.masterKey, salt, KEY_LENGTH)) as Buffer
  }

  /**
   * Encrypt a string
   *
   * Output format: salt:iv:authTag:ciphertext
   * All components are hex-encoded for safe storage
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH)
      const iv = randomBytes(IV_LENGTH)

      // Derive encryption key
      const key = await this.deriveKey(salt)

      // Create cipher
      const cipher = createCipheriv(ALGORITHM, key, iv)

      // Encrypt
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
      ciphertext += cipher.final('hex')

      // Get authentication tag (GCM)
      const authTag = cipher.getAuthTag()

      // Return format: salt:iv:authTag:ciphertext
      return [
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        ciphertext,
      ].join(':')
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Decrypt a string
   *
   * Input format: salt:iv:authTag:ciphertext
   */
  async decrypt(encrypted: string): Promise<string> {
    try {
      // Parse encrypted string
      const parts = encrypted.split(':')
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted string format')
      }

      const [saltHex, ivHex, authTagHex, ciphertext] = parts as [string, string, string, string]

      // Convert from hex
      const salt = Buffer.from(saltHex, 'hex')
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')

      // Derive decryption key (same salt as encryption)
      const key = await this.deriveKey(salt)

      // Create decipher
      const decipher = createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)

      // Decrypt
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8')
      plaintext += decipher.final('utf8')

      return plaintext
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Encrypt a JSON object
   * Convenience method that stringifies before encryption
   */
  async encryptJSON<T = unknown>(obj: T): Promise<string> {
    const json = JSON.stringify(obj)
    return this.encrypt(json)
  }

  /**
   * Decrypt to JSON object
   * Convenience method that parses after decryption
   */
  async decryptJSON<T = unknown>(encrypted: string): Promise<T> {
    const json = await this.decrypt(encrypted)
    return JSON.parse(json) as T
  }

  /**
   * Hash a string (one-way, for comparison)
   * Useful for creating deterministic IDs from sensitive data
   */
  async hash(data: string): Promise<string> {
    const salt = Buffer.from(data, 'utf-8') // Use data as salt for deterministic hashing
    const key = await this.deriveKey(salt)
    return key.toString('hex')
  }
}

/**
 * Singleton instance
 * Initialize once and reuse throughout the application
 */
let encryptionServiceInstance: EncryptionService | null = null

export function getEncryptionService(encryptionKey?: string): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService(encryptionKey)
  }
  return encryptionServiceInstance
}
