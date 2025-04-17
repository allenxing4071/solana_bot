#!/usr/bin/env node

/**
 * 智能路由系统命令行工具
 * 用于测试和演示智能路由决策
 */

const readline = require('node:readline');
const intelligentRoutingSystem = require('./index');
const { logger } = require('./utils/logger');
const extractFeatures = require('./utils/feature_extractor');

// 测试用模型配置
const TEST_MODELS = {
  'deepseek-v3.1': {
    description: '中文理解专家，善于处理复杂中文问题，适合创意写作',
    available: true,
    weight: 15
  },
  'claude-3-opus': {
    description: '推理能力强，适合复杂思考、学术研究和分析',
    available: true,
    weight: 10
  },
  'claude-3-haiku': {
    description: '快速响应，处理简单任务和对话',
    available: true,
    weight: 20
  },
  'claude-3-7-sonnet': {
    description: '推理能力与响应速度平衡，适合常规对话和中等复杂问题',
    available: true,
    weight: 25
  },
  'gpt-4o': {
    description: '多模态能力，代码和技术任务优秀',
    available: true,
    weight: 15
  },
  'deepseek-r1': {
    description: '专注代码生成和技术问题解答',
    available: true,
    weight: 15
  }
};

// 状态：是否已初始化
let isInitialized = false;

// 创建命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 主函数
async function main() {
  console.log('==========================================');
  console.log('   智能路由系统测试工具 - 基于Llama3');
  console.log('==========================================');
  console.log();
  console.log('正在初始化系统...');
  
  try {
    // 初始化路由系统
    const success = await intelligentRoutingSystem.initialize();
    isInitialized = success;
    
    if (!success) {
      console.log('警告：系统初始化未完全成功，可能无法使用某些功能');
    }
    
    console.log();
    showMainMenu();
  } catch (error) {
    console.error('初始化过程中出错:', error.message);
    process.exit(1);
  }
}

// 显示主菜单
function showMainMenu() {
  console.log('主菜单:');
  console.log('1. 测试路由查询');
  console.log('2. 查看模型性能数据');
  console.log('3. 特征提取测试');
  console.log('4. 退出');
  console.log();
  
  rl.question('请选择操作 (1-4): ', answer => {
    switch (answer.trim()) {
      case '1':
        testRouting();
        break;
      case '2':
        showModelStats();
        break;
      case '3':
        testFeatureExtraction();
        break;
      case '4':
        console.log('正在退出...');
        intelligentRoutingSystem.shutdown()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
        break;
      default:
        console.log('无效选择，请重试');
        showMainMenu();
    }
  });
}

// 测试路由查询
function testRouting() {
  if (!isInitialized) {
    console.log('系统未完全初始化，测试可能不准确');
  }
  
  console.log();
  console.log('路由测试 - 输入一个查询，系统将选择最合适的模型');
  console.log('(输入"exit"返回主菜单)');
  console.log();
  
  rl.question('输入查询: ', async query => {
    if (query.toLowerCase() === 'exit') {
      console.log();
      showMainMenu();
      return;
    }
    
    try {
      console.log('\n分析中...\n');
      
      // 准备可用模型列表
      const availableModels = Object.entries(TEST_MODELS)
        .filter(([_, info]) => info.available)
        .map(([name, info]) => ({
          name,
          description: info.description,
          weight: info.weight
        }));
      
      // 获取模型性能统计
      const modelStats = await intelligentRoutingSystem.getModelPerformanceStats();
      
      // 使用智能路由系统进行路由决策
      const startTime = Date.now();
      const decision = await intelligentRoutingSystem.routeQuery(query, availableModels, modelStats);
      const routingTime = Date.now() - startTime;
      
      console.log(`======== 路由决策结果 (耗时: ${routingTime}ms) ========`);
      console.log(`选择模型: ${decision.model}`);
      console.log(`置信度: ${decision.confidence}%`);
      console.log(`决策理由: ${decision.reasoning}`);
      console.log('=============================================');
      
      // 提问是否满意此结果
      rl.question('\n您对这个路由决策满意吗？(1-5，1=不满意，5=非常满意): ', async rating => {
        const ratingNum = parseInt(rating.trim(), 10);
        
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          console.log('无效评分，跳过反馈记录');
        } else if (decision.decisionId) {
          // 记录反馈
          await intelligentRoutingSystem.recordFeedback(decision.decisionId, ratingNum);
          console.log(`感谢您的反馈(${ratingNum}/5)！系统会学习并改进。`);
        }
        
        console.log();
        // 询问是否继续测试
        rl.question('是否继续测试？(y/n): ', answer => {
          if (answer.toLowerCase() === 'y') {
            testRouting();
          } else {
            console.log();
            showMainMenu();
          }
        });
      });
    } catch (error) {
      console.error('路由过程出错:', error.message);
      console.log();
      
      rl.question('按Enter返回主菜单...', () => {
        console.log();
        showMainMenu();
      });
    }
  });
}

// 显示模型性能统计
async function showModelStats() {
  try {
    console.log('\n获取模型性能数据...\n');
    
    const stats = await intelligentRoutingSystem.getModelPerformanceStats();
    
    console.log('======== 模型性能数据 ========');
    for (const [modelName, modelData] of Object.entries(stats)) {
      console.log(`\n--- ${modelName} ---`);
      console.log(`整体成功率: ${modelData.successRate.toFixed(1)}%`);
      console.log(`平均响应时间: ${modelData.averageResponseTime}ms`);
      console.log(`平均评分: ${modelData.averageRating.toFixed(1)}/5`);
      
      if (Object.keys(modelData.domainStats).length > 0) {
        console.log('\n领域统计:');
        for (const [domain, domainData] of Object.entries(modelData.domainStats)) {
          console.log(`  ${domain}: 成功率=${domainData.successRate.toFixed(1)}%, 评分=${domainData.averageRating.toFixed(1)}/5 (${domainData.totalCount}个样本)`);
        }
      }
      
      if (Object.keys(modelData.languageStats).length > 0) {
        console.log('\n语言统计:');
        for (const [language, langData] of Object.entries(modelData.languageStats)) {
          console.log(`  ${language}: 成功率=${langData.successRate.toFixed(1)}%, 评分=${langData.averageRating.toFixed(1)}/5 (${langData.totalCount}个样本)`);
        }
      }
    }
    console.log('\n===============================');
  } catch (error) {
    console.error('获取统计数据时出错:', error.message);
  }
  
  console.log();
  rl.question('按Enter返回主菜单...', () => {
    console.log();
    showMainMenu();
  });
}

// 测试特征提取
function testFeatureExtraction() {
  console.log();
  console.log('特征提取测试 - 输入一个查询，系统将分析其特征');
  console.log('(输入"exit"返回主菜单)');
  console.log();
  
  rl.question('输入查询: ', query => {
    if (query.toLowerCase() === 'exit') {
      console.log();
      showMainMenu();
      return;
    }
    
    try {
      // 提取查询特征
      const features = extractFeatures(query);
      
      console.log('\n======== 查询特征分析 ========');
      console.log(`语言: ${features.language}`);
      console.log(`领域: ${features.domain}`);
      console.log(`复杂度: ${features.complexity}/100`);
      console.log('==============================\n');
    } catch (error) {
      console.error('特征提取出错:', error.message);
    }
    
    // 询问是否继续测试
    rl.question('是否继续测试？(y/n): ', answer => {
      if (answer.toLowerCase() === 'y') {
        testFeatureExtraction();
      } else {
        console.log();
        showMainMenu();
      }
    });
  });
}

// 启动应用
main().catch(error => {
  console.error('程序运行出错:', error);
  process.exit(1);
}); 