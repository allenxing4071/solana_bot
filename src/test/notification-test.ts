import logger from '../core/logger.js';
import { NotificationService } from '../services/notification.js';
import { NotificationPriority } from '../types/notification.js';
import { initializeConfig } from '../core/config.js';
import { testConfig } from './test_config.js';
import { telegramService } from '../services/telegram.js';

async function testNotifications() {
  try {
    // 初始化配置
    await initializeConfig(testConfig);
    
    // 初始化 Telegram 服务
    await telegramService.initialize();
    logger.info('Telegram service initialized');
    
    const notificationService = NotificationService.getInstance();

    // 1. 市场分析通知
    logger.info('=== Testing Market Analysis Notifications ===');
    await notificationService.sendNotification(
      'info',
      '📊 市场分析报告\n' +
      '时间: ' + new Date().toLocaleString() + '\n' +
      '币种: SOL/USD\n' +
      '24h成交量: $2.5B\n' +
      '24h价格变化: +8.5%\n' +
      '当前趋势: 上升通道\n' +
      '主要支撑位: $95, $92\n' +
      '主要阻力位: $105, $108\n' +
      'RSI指标: 65 (中性偏多)\n' +
      'MACD: 金叉形成',
      NotificationPriority.LOW
    );

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. 风险预警通知
    logger.info('=== Testing Risk Alert Notifications ===');
    await notificationService.sendNotification(
      'warning',
      '⚠️ 风险预警提醒\n' +
      '时间: ' + new Date().toLocaleString() + '\n' +
      '警告类型: 价格剧烈波动\n' +
      '币种: SOL/USD\n' +
      '5分钟波动: -3.2%\n' +
      '当前价格: $98.5\n' +
      '建议操作: 请注意仓位管理\n' +
      '风险等级: 中等',
      NotificationPriority.HIGH
    );

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. 系统状态通知
    logger.info('=== Testing System Status Notifications ===');
    await notificationService.sendNotification(
      'info',
      '🖥️ 系统状态报告\n' +
      '时间: ' + new Date().toLocaleString() + '\n' +
      '系统运行时间: 24小时\n' +
      'CPU使用率: 45%\n' +
      '内存使用率: 60%\n' +
      '网络延迟: 150ms\n' +
      '活跃订单数: 5\n' +
      '待处理任务: 2\n' +
      '系统状态: 正常运行',
      NotificationPriority.LOW
    );

    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 账户安全通知
    logger.info('=== Testing Security Notifications ===');
    await notificationService.sendNotification(
      'warning',
      '🔒 账户安全提醒\n' +
      '时间: ' + new Date().toLocaleString() + '\n' +
      '检测到新IP登录\n' +
      'IP地址: 192.168.1.100\n' +
      '登录位置: 中国深圳\n' +
      '设备类型: Desktop\n' +
      '如非本人操作，请立即修改密码',
      NotificationPriority.HIGH
    );

    logger.info('All test notifications sent successfully');

  } catch (error) {
    logger.error('Error during notification tests:', error);
    process.exit(1);
  }
}

testNotifications().then(() => {
  logger.info('\n=== All notification tests completed successfully ===');
  process.exit(0);
}).catch((error) => {
  logger.error('Failed to run notification tests:', error);
  process.exit(1);
});