/**
 * 代理客户端工具
 * 用于与模型代理系统交互
 */

const axios = require('axios');
const { logger } = require('./logger');

// 默认配置
const DEFAULT_CONFIG = {
  proxyUrl: 'http://localhost:3100',
  timeout: 60000, // 60秒
  retries: 3  // 重试次数
};

/**
 * 代理系统客户端
 * 用于测试智能路由系统与代理的集成
 */
class ProxyClient {
  /**
   * 创建代理客户端实例
   * @param {Object} config 配置选项
   */
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axios = axios.create({
      baseURL: this.config.proxyUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 获取模型列表
   * @returns {Promise<Array>} 可用模型列表
   */
  async getModels() {
    try {
      const response = await this.axios.get('/models');
      return response.data;
    } catch (error) {
      logger.error('获取模型列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送聊天请求
   * @param {Array} messages 消息数组
   * @param {Object} options 可选参数
   * @returns {Promise<Object>} 模型响应
   */
  async chat(messages, options = {}) {
    const { model, max_tokens = 500, temperature = 0.7 } = options;
    
    try {
      // 准备请求参数
      const payload = {
        messages,
        max_tokens,
        temperature
      };
      
      // 如果指定了模型，添加到请求中
      if (model) {
        payload.model = model;
      }
      
      // 记录请求信息
      logger.log(`发送聊天请求，${model ? `模型: ${model}` : '使用智能路由'}`);
      
      // 发送请求
      const response = await this.axios.post('/api/chat', payload);
      
      // 记录响应信息
      logger.log(`收到响应，使用模型: ${response.data._actual_model_used || '未知'}`);
      
      return response.data;
    } catch (error) {
      // 处理错误
      if (error.response) {
        // 服务器返回错误响应
        logger.error('聊天请求失败:', error.response.status, error.response.data);
      } else if (error.request) {
        // 请求发送但没有收到响应
        logger.error('聊天请求超时或无响应');
      } else {
        // 请求配置出错
        logger.error('聊天请求配置错误:', error.message);
      }
      
      throw error;
    }
  }

  /**
   * 提交路由反馈
   * @param {string} decisionId 决策ID
   * @param {number} rating 评分(1-5)
   * @param {string} comments 评论
   * @returns {Promise<Object>} 响应结果
   */
  async submitFeedback(decisionId, rating, comments = '') {
    try {
      // 验证参数
      if (!decisionId) {
        throw new Error('缺少决策ID');
      }
      
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new Error('评分必须是1-5之间的数字');
      }
      
      // 发送反馈
      const response = await this.axios.post('/api/routing/feedback', {
        decisionId,
        rating,
        comments
      });
      
      logger.log(`反馈已提交，决策ID: ${decisionId}, 评分: ${rating}`);
      
      return response.data;
    } catch (error) {
      logger.error('提交反馈失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取路由统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getRoutingStats() {
    try {
      const response = await this.axios.get('/api/routing/stats');
      return response.data;
    } catch (error) {
      logger.error('获取路由统计失败:', error.message);
      throw error;
    }
  }

  /**
   * 分析路由查询
   * @param {string} query 用户查询
   * @returns {Promise<Object>} 路由分析结果
   */
  async analyzeRouting(query) {
    try {
      const response = await this.axios.post('/api/routing/analyze', { query });
      return response.data;
    } catch (error) {
      logger.error('路由分析失败:', error.message);
      throw error;
    }
  }

  /**
   * 健康检查
   * @returns {Promise<boolean>} 代理是否健康
   */
  async healthCheck() {
    try {
      const response = await this.axios.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('健康检查失败:', error.message);
      return false;
    }
  }
}

module.exports = ProxyClient; 