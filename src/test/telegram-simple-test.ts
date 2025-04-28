import { Telegraf } from 'telegraf';
import logger from '../core/logger.js';

// 生成随机价格波动
function getRandomPriceChange(basePrice: number, maxPercent: number = 0.1): number {
  const change = (Math.random() * 2 - 1) * maxPercent;
  return Number((basePrice * (1 + change)).toFixed(2));
}

// 生成订单号
function generateOrderId(): string {
  return '0x' + Math.random().toString(16).substr(2, 8) + '...' + Math.random().toString(16).substr(2, 3);
}

// 计算手续费
function calculateFee(amount: number): number {
  return Number((amount * 0.001).toFixed(3)); // 0.1% 手续费
}

async function testTelegram() {
  try {
    const botToken = '7368714077:AAHXATYrFT8uOibqYNG6UuGWJQVAq3RyixQ';
    const chatId = '7395950412';
    
    logger.info('开始测试更真实的交易执行结果通知...');
    
    // 创建 bot 实例
    const bot = new Telegraf(botToken);
    
    // 交易参数
    const tradingPairs = ['SOL/USD', 'ETH/USD', 'BTC/USD'];
    const basePrice = {
      'SOL/USD': 103.5,
      'ETH/USD': 3450.75,
      'BTC/USD': 62150.25
    };
    
    // 模拟多个交易场景
    const scenarios = [
      // 场景1: 完整买入成交
      {
        pair: 'SOL/USD',
        type: '限价单',
        side: '买入',
        quantity: 2.5,
        basePrice: basePrice['SOL/USD'],
        orderType: '限价单',
        executionType: '完全成交'
      },
      // 场景2: 部分卖出成交
      {
        pair: 'ETH/USD',
        type: '市价单',
        side: '卖出',
        quantity: 1.2,
        basePrice: basePrice['ETH/USD'],
        orderType: '市价单',
        executionType: '部分成交'
      },
      // 场景3: 大额交易分批成交
      {
        pair: 'BTC/USD',
        type: '限价单',
        side: '买入',
        quantity: 0.5,
        basePrice: basePrice['BTC/USD'],
        orderType: '限价单',
        executionType: '分批成交'
      }
    ];

    for (const scenario of scenarios) {
      const orderId = generateOrderId();
      const executionPrice = getRandomPriceChange(scenario.basePrice);
      const totalAmount = Number((executionPrice * scenario.quantity).toFixed(2));
      const fee = calculateFee(totalAmount);
      
      // 交易开始消息
      const startMessage = {
        type: '交易开始',
        icon: '🔄',
        content: `开始执行交易\n` +
                `交易对: ${scenario.pair}\n` +
                `操作: ${scenario.side}\n` +
                `订单类型: ${scenario.type}\n` +
                `计划数量: ${scenario.quantity} ${scenario.pair.split('/')[0]}\n` +
                `当前价格: $${scenario.basePrice}\n` +
                `预估金额: $${(scenario.basePrice * scenario.quantity).toFixed(2)}\n` +
                `市场深度: ${scenario.side === '买入' ? '卖单' : '买单'}簿 > ${(scenario.quantity * 1.5).toFixed(2)} ${scenario.pair.split('/')[0]}\n` +
                `价格波动: 24h ±${(Math.random() * 5).toFixed(2)}%`
      };

      // 订单提交消息
      const submitMessage = {
        type: '订单提交',
        icon: '📝',
        content: `订单已提交\n` +
                `订单号: ${orderId}\n` +
                `交易对: ${scenario.pair}\n` +
                `类型: ${scenario.type}\n` +
                `方向: ${scenario.side}\n` +
                `价格: ${scenario.type === '限价单' ? '$' + scenario.basePrice : '市价'}\n` +
                `数量: ${scenario.quantity} ${scenario.pair.split('/')[0]}\n` +
                `订单状态: 等待成交\n` +
                `委托时间: ${new Date().toLocaleString()}`
      };

      // 订单成交消息
      const executionMessage = {
        type: '订单成交',
        icon: '✅',
        content: `订单${scenario.executionType}\n` +
                `订单号: ${orderId}\n` +
                `成交价格: $${executionPrice}\n` +
                `成交数量: ${scenario.quantity} ${scenario.pair.split('/')[0]}\n` +
                `成交金额: $${totalAmount}\n` +
                `手续费: $${fee}\n` +
                `成交类型: ${scenario.executionType}\n` +
                `滑点: ${((executionPrice - scenario.basePrice) / scenario.basePrice * 100).toFixed(3)}%\n` +
                `成交时间: ${new Date().toLocaleString()}`
      };

      // 交易总结消息
      const summaryMessage = {
        type: '交易总结',
        icon: '📊',
        content: `交易执行完成\n` +
                `交易对: ${scenario.pair}\n` +
                `操作: ${scenario.side}\n` +
                `订单类型: ${scenario.type}\n` +
                `计划均价: $${scenario.basePrice}\n` +
                `实际均价: $${executionPrice}\n` +
                `成交数量: ${scenario.quantity} ${scenario.pair.split('/')[0]}\n` +
                `成交金额: $${totalAmount}\n` +
                `手续费: $${fee}\n` +
                `净收益: ${scenario.side === '卖出' ? '$' + (totalAmount - scenario.basePrice * scenario.quantity).toFixed(2) : 'N/A'}\n` +
                `收益率: ${scenario.side === '卖出' ? ((executionPrice - scenario.basePrice) / scenario.basePrice * 100).toFixed(2) + '%' : 'N/A'}\n` +
                `当前持仓: ${scenario.side === '买入' ? scenario.quantity : 0} ${scenario.pair.split('/')[0]}\n` +
                `持仓均价: $${scenario.side === '买入' ? executionPrice : 0}`
      };

      const messages = [startMessage, submitMessage, executionMessage, summaryMessage];

      // 逐个发送消息
      for (const msg of messages) {
        logger.info(`发送 ${msg.type} 消息...`);
        const formattedMessage = `${msg.icon} ${msg.type}\n\n${msg.content}\n\n发送时间: ${new Date().toLocaleString()}`;
        
        const result = await bot.telegram.sendMessage(chatId, formattedMessage);
        logger.info(`${msg.type} 消息发送成功:`, result.message_id);
        
        // 等待 2 秒再发送下一条，模拟真实交易流程
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 在不同场景之间添加间隔
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    logger.info('更真实的交易执行结果通知测试完成！');
    
  } catch (error) {
    logger.error('测试失败:', error);
    throw error;
  }
}

// 运行测试
logger.info('开始运行更真实的交易执行结果通知测试...');
testTelegram().catch(error => {
  logger.error('测试执行失败:', error);
  process.exit(1);
}); 