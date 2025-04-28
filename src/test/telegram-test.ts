import { telegramService } from '../services/telegram.js';
import logger from '../core/logger.js';
import { initializeConfig } from '../core/config.js';
import { testConfig } from './test_config.js';
import { NotificationEvent } from '../types/notification.js';

async function testTelegram() {
  try {
    // 初始化配置
    await initializeConfig(testConfig);
    
    // 初始化 Telegram 服务
    await telegramService.initialize();

    // 获取配置
    const config = telegramService.getConfig();
    logger.info('Telegram configuration:', config);

    // 测试消息
    const messages = [
      // {
      //   type: 'startup' as NotificationEvent,
      //   message: '🚀 系统启动测试\n时间: ' + new Date().toLocaleString()
      // },
      {
        type: 'trade' as NotificationEvent,
        message: '💰 交易通知\n代币: SOL/USD\n操作: 买入\n数量: 1.5\n价格: $100'
      },
      {
        type: 'error' as NotificationEvent,
        message: '❌ 错误通知\n类型: 测试错误\n信息: 这是一条测试错误消息'
      }
      // ,{
      //   type: 'position' as NotificationEvent,
      //   message: '📊 持仓更新\n代币: SOL/USD\n数量: 1.5\n入场价: $100\n当前价: $105\n盈亏: +$7.5'
      // },
      // {
      //   type: 'performance' as NotificationEvent,
      //   message: '📈 性能报告\n总交易次数: 10\n胜率: 65%\n总盈亏: +$100'
      // }
    ];

    // 发送所有测试消息
    for (const msg of messages) {
      logger.info(`发送 ${msg.type} 类型的测试消息...`);
      await telegramService.sendMessage(config.chatId, msg.message, msg.type);
      // 等待 1 秒，避免消息发送太快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 测试禁用的事件
    logger.info('测试禁用事件...');
    const disabledConfig = { ...config };
    disabledConfig.events.trade.enabled = false;
    
    // 尝试发送禁用的事件消息
    await telegramService.sendMessage(
      config.chatId,
      '💰 这条交易消息不应该被发送',
      'trade'
    );

    logger.info('所有测试消息发送完成！');
  } catch (error) {
    logger.error('测试失败:', error);
    throw error;
  }
}

// 运行测试
testTelegram(); 