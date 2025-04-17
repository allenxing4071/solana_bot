/**
 * 智能路由集成模块
 * 将智能路由系统与现有代理系统集成
 */

const intelligentRoutingSystem = require('../index');
const { logger } = require('../utils/logger');

/**
 * 集成智能路由到现有系统
 * @param {Object} app Express应用实例
 * @param {Object} MODELS 模型配置
 * @param {Object} MODEL_STATUS 模型状态
 * @param {Object} MODEL_WEIGHTS 模型权重
 * @param {Function} existingRouteFunction 现有的路由函数
 * @returns {Object} 集成API和函数
 */
function integrateIntelligentRouting(app, MODELS, MODEL_STATUS, MODEL_WEIGHTS, existingRouteFunction) {
  // 模型描述
  const MODEL_DESCRIPTIONS = {
    'deepseek-v3.1': '中文理解专家，善于处理复杂中文问题，适合创意写作',
    'claude-3-opus': '推理能力强，适合复杂思考、学术研究和分析',
    'claude-3-haiku': '快速响应，处理简单任务和对话',
    'claude-3-7-sonnet': '推理能力与响应速度平衡，适合常规对话和中等复杂问题',
    'gpt-4o': '多模态能力，代码和技术任务优秀',
    'deepseek-r1': '专注代码生成和技术问题解答'
  };
  
  // 初始化智能路由系统
  logger.log('正在初始化智能路由系统并集成到代理...');
  
  intelligentRoutingSystem.initialize(MODEL_DESCRIPTIONS)
    .then(success => {
      logger.log(`智能路由系统初始化${success ? '成功' : '失败'}`);
    })
    .catch(error => {
      logger.error('智能路由系统初始化出错:', error.message);
    });
  
  /**
   * 智能路由函数 - 替代或增强现有路由
   * @param {Array} messages 消息数组
   * @param {Object} options 路由选项
   * @returns {string} 选择的模型名称
   */
  async function intelligentRoute(messages, options = {}) {
    if (!messages || messages.length === 0) {
      return existingRouteFunction(messages);
    }
    
    try {
      // 提取用户查询文本
      const userMessage = messages[messages.length - 1];
      const query = userMessage.content;
      
      if (!query || typeof query !== 'string') {
        return existingRouteFunction(messages);
      }
      
      logger.log(`智能路由系统处理请求: "${query.substring(0, 50)}..."`);
      
      // 准备可用模型列表
      const availableModels = Object.keys(MODELS)
        .filter(model => MODEL_STATUS[model].available)
        .map(model => ({
          name: model,
          description: MODEL_DESCRIPTIONS[model] || '',
          weight: MODEL_WEIGHTS[model] || 1
        }));
      
      if (availableModels.length === 0) {
        logger.warn('没有可用模型，使用默认路由');
        return existingRouteFunction(messages);
      }
      
      // 获取模型性能统计
      const modelStats = await intelligentRoutingSystem.getModelPerformanceStats();
      
      // 使用智能路由系统进行路由决策
      const startTime = Date.now();
      const decision = await intelligentRoutingSystem.routeQuery(query, availableModels, modelStats);
      const routingTime = Date.now() - startTime;
      
      if (decision && decision.model) {
        logger.log(`智能路由决策: ${decision.model}, 置信度: ${decision.confidence}%, 耗时: ${routingTime}ms, 理由: ${decision.reasoning}`);
        
        // 如果置信度低于阈值，回退到现有路由
        if (decision.confidence < 50) {
          const semanticModel = existingRouteFunction(messages);
          logger.log(`智能路由置信度较低(${decision.confidence}%)，回退到语义路由: ${semanticModel}`);
          
          // 记录决策结果(使用现有路由结果)
          if (decision.decisionId) {
            intelligentRoutingSystem.updateDecisionResult(decision.decisionId, true, 0);
          }
          
          return semanticModel;
        }
        
        return decision.model;
      } else {
        // 路由失败，回退到现有路由
        logger.warn('智能路由决策失败，回退到现有路由');
        return existingRouteFunction(messages);
      }
    } catch (error) {
      logger.error('智能路由过程出错:', error.message);
      return existingRouteFunction(messages);
    }
  }
  
  // 注册API路由
  if (app) {
    // 路由分析API - 分析查询并返回路由决策
    app.post('/api/routing/analyze', async (req, res) => {
      try {
        const { query } = req.body;
        
        if (!query) {
          return res.status(400).json({ error: '请提供查询文本' });
        }
        
        // 准备可用模型
        const availableModels = Object.keys(MODELS)
          .filter(model => MODEL_STATUS[model].available)
          .map(model => ({
            name: model,
            description: MODEL_DESCRIPTIONS[model] || '',
            weight: MODEL_WEIGHTS[model] || 1
          }));
        
        // 获取模型性能统计
        const modelStats = await intelligentRoutingSystem.getModelPerformanceStats();
        
        // 进行路由决策
        const decision = await intelligentRoutingSystem.routeQuery(query, availableModels, modelStats);
        
        res.json(decision);
      } catch (error) {
        logger.error('路由分析API错误:', error.message);
        res.status(500).json({ error: '路由分析失败', message: error.message });
      }
    });
    
    // 反馈API - 记录用户对路由决策的反馈
    app.post('/api/routing/feedback', async (req, res) => {
      try {
        const { decisionId, rating, comments } = req.body;
        
        if (!decisionId || !rating) {
          return res.status(400).json({ error: '请提供决策ID和评分' });
        }
        
        // 验证评分范围
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ error: '评分必须在1-5之间' });
        }
        
        // 记录反馈
        const success = await intelligentRoutingSystem.recordFeedback(decisionId, rating, comments);
        
        if (success) {
          res.json({ success: true, message: '反馈已记录' });
        } else {
          res.status(500).json({ error: '记录反馈失败' });
        }
      } catch (error) {
        logger.error('反馈API错误:', error.message);
        res.status(500).json({ error: '反馈处理失败', message: error.message });
      }
    });
    
    // 模型性能统计API
    app.get('/api/routing/stats', async (req, res) => {
      try {
        const stats = await intelligentRoutingSystem.getModelPerformanceStats();
        res.json(stats);
      } catch (error) {
        logger.error('获取统计API错误:', error.message);
        res.status(500).json({ error: '获取统计失败', message: error.message });
      }
    });
    
    logger.log('智能路由API已注册到应用');
  }
  
  // 更新路由决策结果的函数
  async function updateRouteResult(decisionId, model, isSuccessful, responseTime) {
    if (!decisionId) return;
    
    try {
      await intelligentRoutingSystem.updateDecisionResult(decisionId, isSuccessful, responseTime);
    } catch (error) {
      logger.error('更新路由结果失败:', error.message);
    }
  }
  
  // 优雅关闭
  function shutdown() {
    return intelligentRoutingSystem.shutdown();
  }
  
  return {
    intelligentRoute,
    updateRouteResult,
    shutdown
  };
}

module.exports = { integrateIntelligentRouting }; 