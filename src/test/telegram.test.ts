import { describe, it, beforeAll, afterAll } from 'vitest';
import { telegramService } from '../services/telegram.js';
import logger from '../core/logger.js';
import { initializeConfig } from '../core/config.js';
import { NotificationEvent } from '../types/notification.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Telegram Service (Production)', () => {
  beforeAll(async () => {
    // 加载生产配置
    const prodConfigPath = path.join(process.cwd(), 'config', 'production.json');
    const prodConfig = JSON.parse(fs.readFileSync(prodConfigPath, 'utf-8'));
    
    // 初始化配置
    await initializeConfig(prodConfig);
    
    // 初始化Telegram服务
    await telegramService.initialize();
    logger.info('Telegram服务初始化成功');
  });

  afterAll(async () => {
    // 清理资源
    // await telegramService.stop(); // 临时注释，避免编译报错
  });

  it('should send startup notification', async () => {
    const message = '🤖 机器人启动通知\n\n' +
      '系统已成功启动并连接到主网\n' +
      '- 网络: Mainnet\n' +
      '- 时间: ' + new Date().toLocaleString('zh-CN');
    
    await telegramService.sendMessage(
      telegramService.getConfig().chatId,
      message,
      'startup' as NotificationEvent
    );
    logger.info('启动通知发送成功');
  });

  it('should send error notification to admin', async () => {
    const errorMessage = '❗️❌ 错误警报\n\n' +
      '检测到系统错误:\n' +
      '- 类型: 测试错误\n' +
      '- 时间: ' + new Date().toLocaleString('zh-CN') + '\n' +
      '- 详情: 这是一条测试错误消息，用于验证错误通知功能\n\n' +
      '请管理员注意检查系统状态。';
    
    await telegramService.sendMessage(
      telegramService.getConfig().chatId,
      errorMessage,
      'error' as NotificationEvent
    );
    logger.info('错误通知发送成功');
  });

  it('should send trade notification', async () => {
    const tradeMessage = '💰 交易通知\n\n' +
      '执行交易操作:\n' +
      '- 类型: 测试交易\n' +
      '- 代币: SOL/USDC\n' +
      '- 价格: 150 USDC\n' +
      '- 数量: 1 SOL\n' +
      '- 时间: ' + new Date().toLocaleString('zh-CN');
    
    await telegramService.sendMessage(
      telegramService.getConfig().chatId,
      tradeMessage,
      'trade' as NotificationEvent
    );
    logger.info('交易通知发送成功');
  });
}); 