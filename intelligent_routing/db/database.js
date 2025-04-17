/**
 * 数据库模块
 * 实现查询和路由决策数据的存储与分析
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { logger } = require('../utils/logger');

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据库文件路径
const DB_PATH = path.join(DATA_DIR, 'routing_data.db');

/**
 * 路由数据库类
 * 管理智能路由系统的数据存储和检索
 */
class RoutingDatabase {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * 初始化数据库连接和表结构
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      try {
        logger.log('初始化路由数据库...');
        this.db = new sqlite3.Database(DB_PATH);
        
        // 创建表结构
        this.db.serialize(() => {
          // 查询记录表
          this.db.run(`CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_text TEXT NOT NULL,
            query_hash TEXT NOT NULL UNIQUE,
            language TEXT,
            domain TEXT,
            complexity INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          
          // 路由决策表
          this.db.run(`CREATE TABLE IF NOT EXISTS routing_decisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query_id INTEGER NOT NULL,
            selected_model TEXT NOT NULL,
            confidence INTEGER,
            reasoning TEXT,
            is_successful BOOLEAN,
            response_time INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (query_id) REFERENCES queries(id)
          )`);
          
          // 用户反馈表
          this.db.run(`CREATE TABLE IF NOT EXISTS user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            routing_decision_id INTEGER NOT NULL,
            rating INTEGER CHECK(rating BETWEEN 1 AND 5),
            comments TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (routing_decision_id) REFERENCES routing_decisions(id)
          )`);
          
          // 模型性能表
          this.db.run(`CREATE TABLE IF NOT EXISTS model_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT NOT NULL,
            domain TEXT,
            language TEXT,
            success_count INTEGER DEFAULT 0,
            total_count INTEGER DEFAULT 0,
            avg_response_time INTEGER DEFAULT 0,
            avg_rating REAL DEFAULT 0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(model_name, domain, language)
          )`);
          
          // 添加索引
          this.db.run('CREATE INDEX IF NOT EXISTS idx_query_hash ON queries(query_hash)');
          this.db.run('CREATE INDEX IF NOT EXISTS idx_model_name ON routing_decisions(selected_model)');

          logger.log('数据库表结构初始化完成');
          this.initialized = true;
          resolve(true);
        });
      } catch (error) {
        logger.error('数据库初始化失败:', error.message);
        reject(error);
      }
    });
  }

  /**
   * 记录用户查询
   * @param {string} queryText 查询文本
   * @param {Object} features 可选的查询特征
   * @returns {Promise<number>} 插入的查询ID
   */
  async recordQuery(queryText, features = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const queryHash = crypto.createHash('md5').update(queryText).digest('hex');
      const { language, domain, complexity } = features;
      
      // 首先检查是否存在相同的查询
      this.db.get('SELECT id FROM queries WHERE query_hash = ?', [queryHash], (err, row) => {
        if (err) {
          logger.error('检查查询记录时出错:', err.message);
          reject(err);
          return;
        }
        
        // 如果已存在，返回现有ID
        if (row) {
          resolve(row.id);
          return;
        }
        
        // 否则插入新查询
        this.db.run(
          'INSERT INTO queries (query_text, query_hash, language, domain, complexity) VALUES (?, ?, ?, ?, ?)',
          [queryText, queryHash, language, domain, complexity],
          function(err) {
            if (err) {
              logger.error('记录查询时出错:', err.message);
              reject(err);
              return;
            }
            
            logger.log(`新查询已记录，ID: ${this.lastID}`);
            resolve(this.lastID);
          }
        );
      });
    });
  }

  /**
   * 记录路由决策
   * @param {number} queryId 查询ID
   * @param {string} selectedModel 选择的模型
   * @param {number} confidence 置信度
   * @param {string} reasoning 选择理由
   * @returns {Promise<number>} 插入的决策ID
   */
  async recordRoutingDecision(queryId, selectedModel, confidence, reasoning) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO routing_decisions (query_id, selected_model, confidence, reasoning) VALUES (?, ?, ?, ?)',
        [queryId, selectedModel, confidence, reasoning],
        function(err) {
          if (err) {
            logger.error('记录路由决策时出错:', err.message);
            reject(err);
            return;
          }
          
          logger.log(`新路由决策已记录，ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * 更新路由决策的执行结果
   * @param {number} decisionId 决策ID
   * @param {boolean} isSuccessful 是否成功
   * @param {number} responseTime 响应时间(ms)
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateDecisionResult(decisionId, isSuccessful, responseTime) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE routing_decisions SET is_successful = ?, response_time = ? WHERE id = ?',
        [isSuccessful ? 1 : 0, responseTime, decisionId],
        function(err) {
          if (err) {
            logger.error('更新路由决策结果时出错:', err.message);
            reject(err);
            return;
          }
          
          logger.log(`路由决策结果已更新，ID: ${decisionId}`);
          resolve(true);
        }
      );
    });
  }

  /**
   * 记录用户反馈
   * @param {number} routingDecisionId 路由决策ID
   * @param {number} rating 评分(1-5)
   * @param {string} comments 评论
   * @returns {Promise<number>} 插入的反馈ID
   */
  async recordFeedback(routingDecisionId, rating, comments) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      // 验证评分范围
      if (rating < 1 || rating > 5) {
        reject(new Error('评分必须在1-5之间'));
        return;
      }
      
      this.db.run(
        'INSERT INTO user_feedback (routing_decision_id, rating, comments) VALUES (?, ?, ?)',
        [routingDecisionId, rating, comments],
        function(err) {
          if (err) {
            logger.error('记录用户反馈时出错:', err.message);
            reject(err);
            return;
          }
          
          logger.log(`新用户反馈已记录，ID: ${this.lastID}`);
          
          // 更新模型性能数据
          this.updateModelPerformanceWithFeedback(routingDecisionId, rating)
            .then(() => resolve(this.lastID))
            .catch(error => {
              logger.error('更新模型性能时出错:', error.message);
              // 仍然返回反馈ID，不因性能更新失败而中断
              resolve(this.lastID);
            });
        }.bind(this)
      );
    });
  }

  /**
   * 根据反馈更新模型性能数据
   * @param {number} routingDecisionId 路由决策ID
   * @param {number} rating 评分
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateModelPerformanceWithFeedback(routingDecisionId, rating) {
    return new Promise((resolve, reject) => {
      // 获取决策相关信息
      this.db.get(
        `SELECT rd.selected_model, q.language, q.domain 
         FROM routing_decisions rd 
         JOIN queries q ON rd.query_id = q.id 
         WHERE rd.id = ?`,
        [routingDecisionId],
        (err, row) => {
          if (err || !row) {
            reject(err || new Error('找不到路由决策记录'));
            return;
          }
          
          const { selected_model, language, domain } = row;
          
          // 更新或插入模型性能记录
          this.db.run(
            `INSERT INTO model_performance 
             (model_name, domain, language, success_count, total_count, avg_rating, last_updated) 
             VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(model_name, domain, language) 
             DO UPDATE SET 
               total_count = total_count + 1,
               success_count = success_count + CASE WHEN ? >= 4 THEN 1 ELSE 0 END,
               avg_rating = (avg_rating * total_count + ?) / (total_count + 1),
               last_updated = CURRENT_TIMESTAMP`,
            [selected_model, domain, language, rating >= 4 ? 1 : 0, rating, rating, rating],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              
              logger.log(`模型性能数据已更新: ${selected_model}, ${domain}, ${language}`);
              resolve(true);
            }
          );
        }
      );
    });
  }

  /**
   * 获取模型性能统计
   * @returns {Promise<Object>} 模型性能数据
   */
  async getModelPerformanceStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT model_name, 
                domain, 
                language, 
                success_count, 
                total_count, 
                CASE WHEN total_count > 0 THEN (success_count * 100.0 / total_count) ELSE 0 END as success_rate,
                avg_response_time, 
                avg_rating
         FROM model_performance`,
        (err, rows) => {
          if (err) {
            logger.error('获取模型性能统计时出错:', err.message);
            reject(err);
            return;
          }
          
          // 转换为按模型名分组的对象
          const stats = {};
          rows.forEach(row => {
            if (!stats[row.model_name]) {
              stats[row.model_name] = {
                successRate: 0,
                averageResponseTime: 0,
                averageRating: 0,
                domainStats: {},
                languageStats: {}
              };
            }
            
            // 更新域和语言统计
            if (row.domain) {
              stats[row.model_name].domainStats[row.domain] = {
                successRate: row.success_rate,
                totalCount: row.total_count,
                averageRating: row.avg_rating
              };
            }
            
            if (row.language) {
              stats[row.model_name].languageStats[row.language] = {
                successRate: row.success_rate,
                totalCount: row.total_count,
                averageRating: row.avg_rating
              };
            }
            
            // 更新总体统计
            if (!row.domain && !row.language) {
              stats[row.model_name].successRate = row.success_rate;
              stats[row.model_name].averageResponseTime = row.avg_response_time;
              stats[row.model_name].averageRating = row.avg_rating;
            }
          });
          
          resolve(stats);
        }
      );
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      logger.log('数据库连接已关闭');
    }
  }
}

// 导出数据库实例
const routingDb = new RoutingDatabase();
module.exports = { routingDb }; 