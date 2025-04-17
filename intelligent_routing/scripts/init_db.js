/**
 * 数据库初始化脚本
 * 创建智能路由系统所需的数据库和表结构
 */

const path = require('node:path');
const fs = require('node:fs');
const { routingDb } = require('../db/database');

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  console.log('创建数据目录:', DATA_DIR);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据库
console.log('初始化智能路由数据库...');

routingDb.initialize()
  .then(() => {
    console.log('数据库初始化成功');
    
    // 添加一些示例模型性能数据
    console.log('添加示例模型性能数据...');
    addSampleModelData()
      .then(() => {
        console.log('示例数据添加成功');
        process.exit(0);
      })
      .catch(error => {
        console.error('添加示例数据时出错:', error.message);
        process.exit(1);
      });
  })
  .catch(error => {
    console.error('数据库初始化失败:', error.message);
    process.exit(1);
  });

/**
 * 添加示例模型性能数据
 * 为模型路由学习提供初始基准
 */
async function addSampleModelData() {
  if (!routingDb.db) {
    throw new Error('数据库尚未初始化');
  }
  
  // 示例模型性能数据
  const modelData = [
    // deepseek-v3.1: 中文和创意写作强
    { model: 'deepseek-v3.1', domain: null, language: null, successRate: 90, responseTime: 12000, rating: 4.5 },
    { model: 'deepseek-v3.1', domain: '创意', language: 'chinese', successRate: 95, responseTime: 11000, rating: 4.8 },
    { model: 'deepseek-v3.1', domain: '常识', language: 'chinese', successRate: 93, responseTime: 10500, rating: 4.6 },
    { model: 'deepseek-v3.1', domain: '编程', language: 'chinese', successRate: 85, responseTime: 12500, rating: 4.0 },
    
    // claude-3-opus: 复杂推理和英文强
    { model: 'claude-3-opus', domain: null, language: null, successRate: 92, responseTime: 18000, rating: 4.7 },
    { model: 'claude-3-opus', domain: '数学', language: 'english', successRate: 96, responseTime: 17000, rating: 4.9 },
    { model: 'claude-3-opus', domain: '数学', language: 'chinese', successRate: 88, responseTime: 19000, rating: 4.2 },
    { model: 'claude-3-opus', domain: '商业', language: 'english', successRate: 94, responseTime: 16500, rating: 4.8 },
    
    // claude-3-haiku: 快速响应简单任务
    { model: 'claude-3-haiku', domain: null, language: null, successRate: 85, responseTime: 6000, rating: 4.0 },
    { model: 'claude-3-haiku', domain: '常识', language: 'english', successRate: 90, responseTime: 5500, rating: 4.3 },
    { model: 'claude-3-haiku', domain: '常识', language: 'chinese', successRate: 82, responseTime: 6200, rating: 3.9 },
    { model: 'claude-3-haiku', domain: '翻译', language: 'mixed', successRate: 88, responseTime: 5800, rating: 4.2 },
    
    // claude-3-7-sonnet: 综合表现均衡
    { model: 'claude-3-7-sonnet', domain: null, language: null, successRate: 89, responseTime: 9000, rating: 4.4 },
    { model: 'claude-3-7-sonnet', domain: '常识', language: 'english', successRate: 91, responseTime: 8500, rating: 4.5 },
    { model: 'claude-3-7-sonnet', domain: '常识', language: 'chinese', successRate: 88, responseTime: 9200, rating: 4.3 },
    { model: 'claude-3-7-sonnet', domain: '编程', language: 'english', successRate: 87, responseTime: 9500, rating: 4.2 },
    
    // gpt-4o: 代码和技术强
    { model: 'gpt-4o', domain: null, language: null, successRate: 91, responseTime: 10000, rating: 4.6 },
    { model: 'gpt-4o', domain: '编程', language: 'english', successRate: 97, responseTime: 9000, rating: 4.9 },
    { model: 'gpt-4o', domain: '编程', language: 'chinese', successRate: 92, responseTime: 9500, rating: 4.7 },
    { model: 'gpt-4o', domain: '数学', language: 'english', successRate: 95, responseTime: 9200, rating: 4.8 },
    
    // deepseek-r1: 代码专长
    { model: 'deepseek-r1', domain: null, language: null, successRate: 88, responseTime: 11000, rating: 4.3 },
    { model: 'deepseek-r1', domain: '编程', language: 'english', successRate: 96, responseTime: 10000, rating: 4.8 },
    { model: 'deepseek-r1', domain: '编程', language: 'chinese', successRate: 93, responseTime: 10500, rating: 4.6 },
    { model: 'deepseek-r1', domain: '数学', language: 'english', successRate: 90, responseTime: 11200, rating: 4.4 }
  ];
  
  // 查询是否已有数据
  return new Promise((resolve, reject) => {
    routingDb.db.get('SELECT COUNT(*) as count FROM model_performance', [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 如果表中没有数据，添加示例数据
      if (row.count === 0) {
        // 准备插入语句
        const stmt = routingDb.db.prepare(`
          INSERT INTO model_performance 
          (model_name, domain, language, success_count, total_count, avg_response_time, avg_rating, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        
        // 开始事务
        routingDb.db.run('BEGIN TRANSACTION');
        
        // 插入每条记录
        for (const data of modelData) {
          const totalCount = 100; // 假设每个模型有100个样本
          const successCount = Math.round(data.successRate * totalCount / 100);
          
          stmt.run(
            data.model,
            data.domain,
            data.language,
            successCount,
            totalCount,
            data.responseTime,
            data.rating,
            function(err) {
              if (err) {
                routingDb.db.run('ROLLBACK');
                reject(err);
                return;
              }
            }
          );
        }
        
        // 提交事务
        routingDb.db.run('COMMIT', err => {
          if (err) {
            reject(err);
            return;
          }
          
          stmt.finalize();
          resolve();
        });
      } else {
        console.log('数据库中已有性能数据，跳过添加示例数据');
        resolve();
      }
    });
  });
} 