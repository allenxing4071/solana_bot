/**
 * 智能路由系统入口文件
 * 基于Llama3的自学习语义路由系统
 */

const llama3Router = require('./engine/llama3_router');
const { routingDb } = require('./db/database');
const { logger } = require('./utils/logger');
const extractFeatures = require('./utils/feature_extractor');

/**
 * 智能路由系统类
 * 集成Llama3路由引擎和数据存储
 */
class IntelligentRoutingSystem {
  constructor() {
    this.initialized = false;
    this.modelDescriptions = {};
  }

  /**
   * 初始化智能路由系统
   * @param {Object} modelDescriptions 模型描述信息
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize(modelDescriptions = {}) {
    logger.log('初始化智能路由系统...');
    
    try {
      // 保存模型描述信息
      this.modelDescriptions = modelDescriptions;
      
      // 初始化数据库
      await routingDb.initialize();
      
      // 初始化路由引擎
      const engineInitialized = await llama3Router.initialize();
      
      this.initialized = true;
      logger.log(`智能路由系统初始化${engineInitialized ? '成功' : '部分成功，路由引擎未就绪'}`);
      
      return true;
    } catch (error) {
      logger.error('智能路由系统初始化失败:', error.message);
      return false;
    }
  }

  /**
   * 处理路由请求
   * @param {string} query 用户查询
   * @param {Array} availableModels 可用模型数组
   * @param {Object} modelStats 模型统计数据
   * @returns {Promise<Object>} 路由决策结果
   */
  async routeQuery(query, availableModels, modelStats = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      logger.log(`处理路由请求: "${query.substring(0, 50)}..."`);
      
      // 提取查询特征
      const features = extractFeatures(query);
      
      // 记录查询
      const queryId = await routingDb.recordQuery(query, features);
      
      // 使用Llama3进行路由决策
      const startTime = Date.now();
      const decision = await llama3Router.routeQuery(query, availableModels, modelStats);
      const routingTime = Date.now() - startTime;
      
      if (decision) {
        // 记录路由决策
        const decisionId = await routingDb.recordRoutingDecision(
          queryId, 
          decision.model, 
          decision.confidence, 
          decision.reasoning
        );
        
        logger.log(`路由决策完成, 模型: ${decision.model}, 置信度: ${decision.confidence}%, 耗时: ${routingTime}ms`);
        
        return {
          ...decision,
          decisionId,
          routingTime
        };
      } else {
        // 获取默认模型或回退模型
        const defaultModel = this.getDefaultModel(availableModels);
        
        // 记录路由决策失败
        const decisionId = await routingDb.recordRoutingDecision(
          queryId, 
          defaultModel, 
          0, 
          "Llama3路由失败，使用默认模型"
        );
        
        logger.warn(`路由决策失败，使用默认模型: ${defaultModel}`);
        
        return {
          model: defaultModel,
          confidence: 0,
          reasoning: "智能路由失败，使用默认模型",
          decisionId,
          routingTime
        };
      }
    } catch (error) {
      logger.error('路由查询处理失败:', error.message);
      
      // 回退到默认模型
      return {
        model: this.getDefaultModel(availableModels),
        confidence: 0,
        reasoning: `路由过程出错: ${error.message}`,
        routingTime: 0
      };
    }
  }

  /**
   * 更新路由决策结果
   * @param {number} decisionId 决策ID
   * @param {boolean} isSuccessful 是否成功
   * @param {number} responseTime 响应时间
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateDecisionResult(decisionId, isSuccessful, responseTime) {
    if (!decisionId) return false;
    
    try {
      return await routingDb.updateDecisionResult(decisionId, isSuccessful, responseTime);
    } catch (error) {
      logger.error('更新决策结果失败:', error.message);
      return false;
    }
  }

  /**
   * 记录用户反馈
   * @param {number} decisionId 决策ID
   * @param {number} rating 评分(1-5)
   * @param {string} comments 评论
   * @returns {Promise<boolean>} 是否成功
   */
  async recordFeedback(decisionId, rating, comments = '') {
    if (!decisionId) return false;
    
    try {
      await routingDb.recordFeedback(decisionId, rating, comments);
      return true;
    } catch (error) {
      logger.error('记录反馈失败:', error.message);
      return false;
    }
  }

  /**
   * 获取模型性能数据
   * @returns {Promise<Object>} 模型性能统计
   */
  async getModelPerformanceStats() {
    try {
      return await routingDb.getModelPerformanceStats();
    } catch (error) {
      logger.error('获取模型性能统计失败:', error.message);
      return {};
    }
  }

  /**
   * 获取默认模型
   * @param {Array} availableModels 可用模型列表
   * @returns {string} 默认模型名称
   */
  getDefaultModel(availableModels) {
    if (!availableModels || availableModels.length === 0) {
      return 'unknown';
    }
    
    // 尝试按优先级选择默认模型
    const preferredModels = ['deepseek-v3.1', 'claude-3-opus', 'gpt-4o', 'claude-3-haiku'];
    
    for (const model of preferredModels) {
      if (availableModels.some(m => m.name === model || (typeof m === 'string' && m === model))) {
        return model;
      }
    }
    
    // 如果没有匹配的首选模型，返回第一个可用模型
    return typeof availableModels[0] === 'string' ? availableModels[0] : availableModels[0].name;
  }

  /**
   * 关闭智能路由系统
   */
  async shutdown() {
    logger.log('正在关闭智能路由系统...');
    
    // 关闭数据库连接
    routingDb.close();
    
    logger.log('智能路由系统已关闭');
  }
}

// 创建并导出智能路由系统实例
const intelligentRoutingSystem = new IntelligentRoutingSystem();
module.exports = intelligentRoutingSystem; 