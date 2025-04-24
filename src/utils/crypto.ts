/**
 * @file crypto.ts
 * @description 加密工具函数，用于安全存储和检索敏感数据
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import logger from '../core/logger';

const MODULE_NAME = 'CryptoUtil';
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

/**
 * 生成随机密钥（仅用于初始化）
 * @returns 32字节的随机密钥，Base64编码
 */
export function generateRandomKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * 从环境变量或配置文件获取加密密钥
 * 如果不存在，生成一个新的并保存
 * @returns 加密密钥
 */
function getEncryptionKey(): Buffer {
  try {
    // 首先尝试从环境变量获取
    let key = process.env.ENCRYPTION_KEY;
    
    // 如果环境变量中没有密钥，尝试从配置文件获取
    if (!key) {
      const keyPath = './.keys/encryption.key';
      
      // 确保目录存在
      fs.mkdirSync('./.keys', { recursive: true, mode: 0o700 }); // 设置只有所有者可访问
      
      // 尝试读取密钥文件
      if (fs.existsSync(keyPath)) {
        key = fs.readFileSync(keyPath, 'utf8').trim();
      } else {
        // 如果密钥文件不存在，生成一个新的
        key = generateRandomKey();
        fs.writeFileSync(keyPath, key, { mode: 0o600 }); // 设置只有所有者可读写
        logger.info('生成了新的加密密钥', MODULE_NAME);
      }
    }
    
    // 从Base64编码转换回Buffer
    return Buffer.from(key, 'base64');
  } catch (error) {
    logger.error('获取加密密钥失败', MODULE_NAME, error);
    throw new Error('无法获取加密密钥');
  }
}

/**
 * 加密敏感数据
 * @param data 要加密的数据（字符串）
 * @returns 加密后的数据（对象，包含iv和加密内容）
 */
export function encrypt(data: string): { iv: string; content: string } {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // 初始化向量
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // 加密数据
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // 返回初始化向量和加密内容
    return {
      iv: iv.toString('hex'),
      content: encrypted
    };
  } catch (error) {
    logger.error('加密数据失败', MODULE_NAME, error);
    throw new Error('数据加密失败');
  }
}

/**
 * 解密敏感数据
 * @param encrypted 加密数据对象（包含iv和加密内容）
 * @returns 解密后的原始数据（字符串）
 */
export function decrypt(encrypted: { iv: string; content: string }): string {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(encrypted.iv, 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // 解密数据
    let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('解密数据失败', MODULE_NAME, error);
    throw new Error('数据解密失败');
  }
}

/**
 * 安全存储钱包私钥
 * @param privateKey 钱包私钥
 * @param filePath 存储文件路径
 */
export function secureStorePrivateKey(privateKey: string, filePath: string = './.keys/wallet.enc'): void {
  try {
    // 加密私钥
    const encrypted = encrypt(privateKey);
    
    // 确保目录存在
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    
    // 保存加密数据
    fs.writeFileSync(filePath, JSON.stringify(encrypted), { mode: 0o600 });
    logger.info('私钥已安全存储', MODULE_NAME);
  } catch (error) {
    logger.error('存储私钥失败', MODULE_NAME, error);
    throw new Error('无法安全存储私钥');
  }
}

/**
 * 安全检索钱包私钥
 * @param filePath 存储文件路径
 * @returns 解密后的钱包私钥
 */
export function secureRetrievePrivateKey(filePath: string = './.keys/wallet.enc'): string {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('找不到私钥文件');
    }
    
    // 读取加密数据
    const encrypted = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 解密私钥
    return decrypt(encrypted);
  } catch (error) {
    logger.error('检索私钥失败', MODULE_NAME, error);
    throw new Error('无法检索私钥');
  }
}

/**
 * 安全删除私钥文件
 * @param filePath 存储文件路径
 */
export function secureDeletePrivateKey(filePath: string = './.keys/wallet.enc'): void {
  try {
    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      // 删除文件
      fs.unlinkSync(filePath);
      logger.info('私钥文件已安全删除', MODULE_NAME);
    }
  } catch (error) {
    logger.error('删除私钥文件失败', MODULE_NAME, error);
    throw new Error('无法删除私钥文件');
  }
}

export default {
  encrypt,
  decrypt,
  secureStorePrivateKey,
  secureRetrievePrivateKey,
  secureDeletePrivateKey,
  generateRandomKey
}; 