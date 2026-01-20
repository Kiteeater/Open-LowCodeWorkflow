/**
 * 加密服务
 *
 * 使用 Web Crypto API 提供安全的加密/解密功能
 *
 * 安全特性：
 * - AES-GCM 256 位加密
 * - PBKDF2 密钥派生（100,000 次迭代，SHA-256）
 * - 随机 IV（初始化向量）
 * - 可选的 master password 保护
 */

import type { LLMError } from '@/types/llm';

const MASTER_KEY_STORAGE_KEY = 'edgeflow-master-key';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

/**
 * 加密服务类
 */
export class CryptoService {
  /**
   * 加密文本
   *
   * 使用 AES-GCM 256 位加密
   *
   * @param plaintext - 要加密的明文
   * @param masterPassword - 可选的主密码，如果不提供则使用存储的主密钥
   * @returns Base64 编码的加密数据，格式：`iv:salt:ciphertext`
   */
  async encrypt(
    plaintext: string,
    masterPassword?: string,
  ): Promise<{ success: true; encrypted: string } | { success: false; error: LLMError }> {
    try {
      // 生成随机 IV 和 Salt
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

      // 派生加密密钥
      const key = await this.deriveKey(salt, masterPassword);

      // 加密数据
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        data,
      );

      // 组合 IV + Salt + Ciphertext 并转为 Base64
      const combined = new Uint8Array(iv.length + salt.length + ciphertext.byteLength);
      combined.set(iv, 0);
      combined.set(salt, iv.length);
      combined.set(new Uint8Array(ciphertext), iv.length + salt.length);

      const encrypted = this.arrayBufferToBase64(combined);

      return { success: true, encrypted };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENCRYPTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown encryption error',
        },
      };
    }
  }

  /**
   * 解密文本
   *
   * @param encrypted - Base64 编码的加密数据
   * @param masterPassword - 可选的主密码，必须与加密时使用的密码一致
   * @returns 解密后的明文，失败则返回 null
   */
  async decrypt(
    encrypted: string,
    masterPassword?: string,
  ): Promise<{ success: true; decrypted: string } | { success: false; error: LLMError }> {
    try {
      // 解析 Base64 数据
      const combined = this.base64ToArrayBuffer(encrypted);

      // 提取 IV、Salt 和 Ciphertext
      const iv = combined.slice(0, IV_LENGTH);
      const salt = combined.slice(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
      const ciphertext = combined.slice(IV_LENGTH + SALT_LENGTH);

      // 派生解密密钥
      const key = await this.deriveKey(salt, masterPassword);

      // 解密数据
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        ciphertext,
      );

      // 解码为文本
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decrypted);

      return { success: true, decrypted: plaintext };
    } catch (error) {
      // 密码错误或数据损坏
      return {
        success: false,
        error: {
          code: 'DECRYPTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to decrypt data',
        },
      };
    }
  }

  /**
   * 获取或创建主密钥
   *
   * 主密钥存储在 localStorage 中（建议 UI 提醒用户）
   *
   * @returns 32 字节的随机主密钥（Base64 编码）
   */
  async getOrCreateMasterKey(): Promise<string> {
    try {
      // 尝试从 localStorage 获取
      const existing = localStorage.getItem(MASTER_KEY_STORAGE_KEY);
      if (existing) {
        return existing;
      }

      // 生成新的随机主密钥
      const masterKey = crypto.getRandomValues(new Uint8Array(32));
      const masterKeyBase64 = this.arrayBufferToBase64(masterKey);

      // 存储到 localStorage
      localStorage.setItem(MASTER_KEY_STORAGE_KEY, masterKeyBase64);

      return masterKeyBase64;
    } catch (error) {
      throw new Error(`Failed to get or create master key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 计算密码的 SHA-256 哈希
   *
   * 用于密码验证
   *
   * @param password - 要哈希的密码
   * @returns Base64 编码的哈希值
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(new Uint8Array(hashBuffer));
  }

  /**
   * 派生加密密钥
   *
   * 使用 PBKDF2 算法从密码派生密钥
   *
   * @param salt - 盐值
   * @param masterPassword - 可选的主密码
   * @returns 派生的密钥
   */
  private async deriveKey(
    salt: Uint8Array,
    masterPassword?: string,
  ): Promise<CryptoKey> {
    // 如果提供了 master password，使用它；否则使用存储的主密钥
    const password = masterPassword
      ? await this.hashPassword(masterPassword)
      : await this.getOrCreateMasterKey();

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * ArrayBuffer 转 Base64
   *
   * @param buffer - 二进制数据
   * @returns Base64 编码字符串
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }

  /**
   * Base64 转 ArrayBuffer
   *
   * @param base64 - Base64 编码字符串
   * @returns 二进制数据
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * 导出单例实例
 */
export const cryptoService = new CryptoService();
