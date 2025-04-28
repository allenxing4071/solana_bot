import { telegramService } from '../services/telegram.js';

async function realPushTest() {
  // 使用用户提供的真实chatId
  const chatId = '7395950412';
  // 事件类型可选: 'info' | 'trade' | 'error' | 'warning'
  const eventType = 'info';
  const message =
    '【Solana Bot 导航菜单】\n' +
    '请选择要操作的栏目（回复序号）：\n' +
    '1. 通知分级与多渠道支持\n' +
    '2. 通知模板与多语言\n' +
    '3. 通知频控与去重\n' +
    '4. 通知历史与追溯\n' +
    '5. 交互式命令与反馈\n' +
    '6. 动态配置与热更新\n' +
    '7. 安全与权限\n' +
    '请直接回复对应数字进入下一级操作。';

  // 如果telegramService支持动态设置botToken，可在此处设置
  // telegramService.config.botToken = '7368714077:AAHXATYrFT8uOibqYNG6UuGWJQVAq3RyixQ';
  // 否则请确保src/services/telegram.ts配置文件中已设置为该token

  try {
    await telegramService.initialize();
    await telegramService.sendMessage(chatId, message, eventType as any);
    console.log('导航菜单已推送，请检查Telegram是否收到。');
  } catch (error) {
    console.error('推送失败:', error);
  }
}

realPushTest(); 