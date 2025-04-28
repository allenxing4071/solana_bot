/**
 * 设置控制器
 * 处理系统配置和设置相关的所有请求
 */

import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../core/logger.js';

// 模块名称
const MODULE_NAME = 'SettingsController';

// 设置文件路径
const SETTINGS_FILE_PATH = path.join(process.cwd(), 'config', 'settings.json');

// 默认设置
const DEFAULT_SETTINGS = {
  system: {
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    websocketEndpoint: 'wss://api.mainnet-beta.solana.com',
    useBackupNodes: true,
    maxTransactionRetry: 3,
    healthCheckInterval: 30000,
    priceCheckInterval: 5000,
    logLevel: 'info',
    logToConsole: true,
    logToFile: false
  },
  trading: {
    buyAmountSol: 0.05,
    takeProfitPercentage: 20,
    stopLossPercentage: 10,
    maxBuySlippage: 5,
    maxSellSlippage: 5,
    priorityFee: 0.000005,
    listenOnly: true,
    maxTransactionAmount: 0.1
  },
  security: {
    checkTokenCode: true,
    minimumLiquidity: 1000,
    minPoolAgeDays: 1,
    maxRiskScore: 7
  }
};

/**
 * 获取系统设置
 */
export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('获取系统设置', MODULE_NAME);
    
    let settings = DEFAULT_SETTINGS;
    
    // 尝试从文件读取设置
    try {
      const fileData = await fs.readFile(SETTINGS_FILE_PATH, 'utf8');
      const fileSettings = JSON.parse(fileData);
      settings = { ...DEFAULT_SETTINGS, ...fileSettings };
    } catch (error) {
      // 如果文件不存在或读取失败，使用默认设置
      logger.warn('无法读取设置文件，使用默认设置', MODULE_NAME, {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // 确保配置目录存在
      try {
        await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
      } catch (mkdirError) {
        logger.error('创建配置目录失败', MODULE_NAME, {
          error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
        });
      }
      
      // 写入默认设置
      try {
        await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
        logger.info('已创建默认设置文件', MODULE_NAME);
      } catch (writeError) {
        logger.error('创建默认设置文件失败', MODULE_NAME, {
          error: writeError instanceof Error ? writeError.message : String(writeError)
        });
      }
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('获取系统设置失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '获取系统设置失败'
    });
  }
};

/**
 * 保存系统设置
 */
export const saveSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const newSettings = req.body;
    logger.info('保存系统设置', MODULE_NAME);
    
    // 验证设置数据
    if (!newSettings || typeof newSettings !== 'object') {
      res.status(400).json({
        success: false,
        error: '无效的设置数据'
      });
      return;
    }
    
    // 合并默认设置
    const settings = { ...DEFAULT_SETTINGS, ...newSettings };
    
    // 确保配置目录存在
    try {
      await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
    } catch (mkdirError) {
      logger.error('创建配置目录失败', MODULE_NAME, {
        error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError)
      });
    }
    
    // 保存设置到文件
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf8');
    
    res.json({
      success: true,
      message: '设置已保存',
      data: settings
    });
  } catch (error) {
    logger.error('保存系统设置失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '保存系统设置失败'
    });
  }
};

/**
 * 应用系统设置
 */
export const applySettings = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('应用系统设置', MODULE_NAME);
    
    // 这里可以添加实际应用设置的逻辑
    // 例如：重新配置连接、更新日志级别等
    
    // 模拟应用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟更新环境变量
    process.env.LOG_LEVEL = req.body?.system?.logLevel || process.env.LOG_LEVEL || 'info';
    
    res.json({
      success: true,
      message: '设置已应用',
      applied: {
        timestamp: new Date().toISOString(),
        settings: req.body
      }
    });
  } catch (error) {
    logger.error('应用系统设置失败', MODULE_NAME, {
      error: error instanceof Error ? error.message : String(error)
    });
    res.status(500).json({
      success: false,
      error: '应用系统设置失败'
    });
  }
}; 