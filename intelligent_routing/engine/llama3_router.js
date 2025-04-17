/**
 * Llama3路由引擎
 * 基于本地部署的Llama3模型实现智能路由决策
 */

const axios = require('axios');
const crypto = require('node:crypto');
const { logger } = require('../utils/logger');
const CommandPriorityParser = require('./command_parser');
const PortManager = require('./port_manager');
const sqlite3 = require('sqlite3').verbose(); // 引入 sqlite3
const path = require('node:path');

/**
 * 上下文管理器
 * 负责维护用户对话历史和上下文信息
 */
class ContextManager {
  constructor() {
    this.userContexts = new Map(); // 用户ID -> 上下文信息
    this.maxContextLength = 8192; // Llama3的上下文长度限制
  }

  /**
   * 获取用户上下文
   * @param {string} userId 用户ID
   * @returns {Object} 用户上下文信息
   */
  getUserContext(userId) {
    if (!this.userContexts.has(userId)) {
      this.userContexts.set(userId, {
        history: [],
        preferences: {},
        lastUpdate: Date.now()
      });
    }
    return this.userContexts.get(userId);
  }

  /**
   * 更新用户上下文
   * @param {string} userId 用户ID
   * @param {Object} context 新的上下文信息
   */
  updateUserContext(userId, context) {
    const userContext = this.getUserContext(userId);
    userContext.history.push(context);
    userContext.lastUpdate = Date.now();
    
    // 如果历史记录超过限制，移除最旧的记录
    while (this.calculateContextSize(userContext) > this.maxContextLength) {
      userContext.history.shift();
    }
  }

  /**
   * 计算上下文大小
   * @param {Object} context 上下文信息
   * @returns {number} 上下文大小（tokens）
   */
  calculateContextSize(context) {
    return context.history.reduce((total, item) => {
      return total + (item.content?.length ?? 0);
    }, 0);
  }

  /**
   * 分析用户偏好
   * @param {string} userId 用户ID
   * @returns {Object} 用户偏好分析结果
   */
  analyzeUserPreferences(userId) {
    const context = this.getUserContext(userId);
    const preferences = {
      modelPreferences: {},
      taskTypes: {},
      languagePreferences: {}
    };

    // 分析历史记录，提取用户偏好
    for (const item of context.history) {
      if (item.model) {
        preferences.modelPreferences[item.model] = (preferences.modelPreferences[item.model] || 0) + 1;
      }
      if (item.taskType) {
        preferences.taskTypes[item.taskType] = (preferences.taskTypes[item.taskType] || 0) + 1;
      }
      if (item.language) {
        preferences.languagePreferences[item.language] = (preferences.languagePreferences[item.language] || 0) + 1;
      }
    }

    return preferences;
  }
}

// --- 数据库配置 ---
const dbPath = path.join(__dirname, '..', 'data', 'routing_data.db');
let db = null; // 初始化为 null

// --- 数据库连接函数 (返回 Promise) ---
function connectDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            logger.log('[llama3_router] 数据库已连接。'); // 使用 logger
            resolve();
            return;
        }
        
        // 在尝试连接前打印最终路径
        logger.log(`[llama3_router] 正在尝试连接数据库，路径: ${dbPath}`); 
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                logger.error(`[llama3_router] 数据库连接失败: ${err.message}`, { path: dbPath }); // 使用 logger
                db = null;
                reject(new Error(`数据库连接失败: ${err.message}`));
            } else {
                logger.log('[llama3_router] 数据库连接成功。'); // 使用 logger
                resolve();
            }
        });
    });
}

// --- 保存查询记录函数 (修改后返回 query_id) ---
function saveQueryRecord(queryText, queryHash, timestamp) {
    logger.log('[llama3_router] 尝试保存查询记录...', { queryHash, timestamp });
    return new Promise((resolve, reject) => {
        if (!db) {
            logger.warn('[llama3_router] 数据库未连接，无法保存查询记录。');
            reject(new Error('数据库未连接'));
            return;
        }
        // 包含 query_text 和 query_hash
        const sqlInsert = 'INSERT INTO queries (query_text, query_hash, timestamp) VALUES (?, ?, ?)';
        db.run(sqlInsert, [queryText, queryHash, timestamp], function(err) {
            if (err) {
                // 如果是因为 UNIQUE constraint 失败 (query_hash 已存在)
                if (err.message.includes('UNIQUE constraint failed')) {
                    logger.log(`[llama3_router] 查询记录已存在，尝试获取现有 ID: ${queryHash}`);
                    // 查询已存在的记录的 ID
                    const sqlSelect = 'SELECT id FROM queries WHERE query_hash = ?';
                    db.get(sqlSelect, [queryHash], (selectErr, row) => {
                        if (selectErr) {
                            logger.error(`[llama3_router] 获取已存在查询 ID 失败: ${selectErr.message}`, { queryHash });
                            reject(selectErr);
                        } else if (row) {
                            logger.log(`[llama3_router] 获取到已存在查询 ID: ${row.id}`);
                            resolve(row.id); // 返回查询到的 ID
                        } else {
                            // 理论上不应该发生，因为 UNIQUE constraint 失败意味着记录存在
                            logger.error(`[llama3_router] 严重错误：UNIQUE constraint 失败但未找到记录`, { queryHash });
                            reject(new Error('无法获取已存在查询的 ID'));
                        }
                    });
                } else {
                    logger.error(`[llama3_router] 保存查询记录失败: ${err.message}`, { queryHash, timestamp });
                    reject(err);
                }
            } else {
                logger.log(`[llama3_router] 查询记录保存成功，新 ID: ${this.lastID}, Hash: ${queryHash}`);
                resolve(this.lastID); // 返回新插入的 ID
            }
        });
    });
}

// --- 保存路由决策函数 (修改为接收 queryId) ---
function saveRoutingDecision(queryId, decision, responseTime, timestamp) {
    // 注意参数变化：queryHash -> queryId
    logger.log('[llama3_router] 尝试保存路由决策...', { queryId, decision, responseTime, timestamp });
    return new Promise((resolve, reject) => {
        if (!db) {
            logger.warn('[llama3_router] 数据库未连接，无法保存路由决策。');
            reject(new Error('数据库未连接'));
            return;
        }
        const { model, confidence, reasoning } = decision;
        const numericResponseTime = typeof responseTime === 'number' ? responseTime : null;
        const isSuccessful = decision.model !== 'error' && decision.model !== 'routing_failed'; // 简单判断是否成功

        // 使用 query_id，并添加 is_successful
        const sql = `INSERT INTO routing_decisions (query_id, selected_model, confidence, reasoning, is_successful, response_time, timestamp)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [queryId, model, confidence, reasoning, isSuccessful, numericResponseTime, timestamp], function(err) {
            if (err) {
                logger.error(`[llama3_router] 保存路由决策失败: ${err.message}`, { queryId, model, confidence, reasoning, responseTime, timestamp });
                reject(err);
            } else {
                logger.log(`[llama3_router] 路由决策保存成功 for query_id: ${queryId}`);
                resolve();
            }
        });
    });
}

/**
 * Llama3路由引擎
 * 通过本地部署的Ollama服务调用Llama3模型进行路由决策
 */
const llama3Router = {
  // Ollama服务地址
  ollamaEndpoint: 'http://localhost:11434',
  modelName: 'llama3',
  commandParser: new CommandPriorityParser(),
  portManager: new PortManager(),
  contextManager: new ContextManager(),
  
  isInitialized: false,
  
  /**
   * 初始化路由引擎
   * 检查Ollama服务是否可用，并确保Llama3模型已下载
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[llama3_router] 路由引擎已初始化。');
      return true;
    }
    
    console.log('正在初始化 Llama3 路由引擎...');
    this.isInitialized = false; // 先标记为未完成
    try {
      // 1. 连接数据库并等待完成
      await connectDatabase(); 
      
      // 2. 检查Ollama服务和模型
      // ... (省略检查Ollama和下载模型的代码)
      const response = await axios.get(`${this.ollamaEndpoint}/api/version`);
      logger.log('Ollama已连接，版本:', response.data.version);
      await this.ensureModelAvailable(); // 确保模型可用
      
      // 3. 所有步骤成功后，标记为初始化完成
      this.isInitialized = true;
      console.log('Llama3 路由引擎初始化成功。');
      return true;
    } catch (error) {
      logger.error('Llama3 路由引擎初始化失败:', error.message);
      this.isInitialized = false; // 失败时确保标记为未完成
      db = null; // 初始化失败，数据库连接也置为null
      return false;
    }
  },

  /**
   * 确保Llama3模型可用
   * 如果模型未下载，则触发下载过程
   * @returns {Promise<void>}
   */
  async ensureModelAvailable() {
    try {
      // 检查模型是否存在
      const modelsResponse = await axios.get(`${this.ollamaEndpoint}/api/tags`);
      const modelExists = modelsResponse.data.models.some(model => model.name === this.modelName);
      
      if (!modelExists) {
        logger.log(`Llama3模型不存在，开始下载...`);
        await axios.post(`${this.ollamaEndpoint}/api/pull`, {
          name: this.modelName,
          stream: false
        });
        logger.log('Llama3模型下载完成');
      } else {
        logger.log('Llama3模型已存在，准备就绪');
      }
    } catch (error) {
      logger.error('Llama3模型检查或下载失败:', error.message);
      throw error;
    }
  },

  /**
   * 处理路由查询请求
   * @param {string} query 用户查询文本
   * @param {Array} availableModels 可用模型列表
   * @param {Object} modelStats 模型统计数据
   * @returns {Promise<Object|null>} 路由决策结果
   */
  async routeQuery(query, availableModels, modelStats) {
    // 首先检查是否有优先级指令
    const {hasPriority, specifiedModel, content} = this.commandParser.parseCommand(query);
    
    if (hasPriority) {
      logger.log('使用用户指定的模型:', specifiedModel);
      return {
        model: specifiedModel,
        content: content,
        isPriority: true,
        confidence: 100,
        reasoning: '用户指定模型'
      };
    }

    const startTime = Date.now();
    const routingPrompt = this.buildRoutingPrompt(query, availableModels, modelStats);
    
    try {
      const queryPreview = query.length > 50 ? `${query.slice(0, 50)}...` : query;
      logger.log('向Llama3发送路由决策请求:', queryPreview);
      
      const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
        model: this.modelName,
        prompt: routingPrompt,
        stream: false,
        options: {
          temperature: 0.1,  // 保持较低温度以获得确定性输出
          num_predict: 300   // 限制输出长度
        }
      });
      
      const decision = this.parseRoutingDecision(response.data.response);
      const elapsedTime = Date.now() - startTime;
      
      const selectedModel = decision?.model ?? '无法决策';
      logger.log('Llama3路由决策完成, 耗时:', elapsedTime, 'ms, 选择模型:', selectedModel);
      
      return {
        ...decision,
        isPriority: false
      };
    } catch (error) {
      logger.error('Llama3路由决策失败:', error.message);
      // 回退到规则路由
      return null;
    }
  },

  /**
   *.构建路由提示模板
   * @param {string} query 用户查询
   * @param {Array} availableModels 可用模型列表
   * @param {Object} modelStats 模型统计信息
   * @returns {string} 完整提示文本
   */
  buildRoutingPrompt(query, availableModels, modelStats) {
    // 构建模型描述部分
    const modelDescriptions = availableModels.map(m => {
      const stats = modelStats[m.name] || {};
      return `- ${m.name}: ${m.description || '通用模型'}, 成功率: ${stats.successRate || 'N/A'}%, 平均响应时间: ${stats.averageResponseTime || 'N/A'}ms`;
    }).join('\n');

    // 返回完整提示
    return `系统: 你是一个智能路由系统。根据查询特点选择最合适的AI模型。分析查询的语言、主题、复杂度，确定最适合处理的模型。
    
查询: "${query}"

可用模型及其专长:
${modelDescriptions}

任务: 分析查询的语言(中文/英文)、主题领域(代码/创意/数学/常识等)、复杂度和长度，然后选择最合适的模型。

输出格式(必须使用JSON格式): 
{"selectedModel": "模型名称", "confidence": 0-100的数字, "reasoning": "选择该模型的理由"}

你的分析和选择:`;
  },

  /**
   * 解析路由决策响应
   * @param {string} responseText Llama3的响应文本
   * @returns {Object|null} 解析后的决策对象
   */
  parseRoutingDecision(responseText) {
    try {
      // 尝试提取JSON
      const jsonMatch = responseText.match(/\{[\s\S]*"selectedModel"[\s\S]*\}/);
      if (jsonMatch) {
        const decision = JSON.parse(jsonMatch[0]);
        return {
          model: decision.selectedModel,
          confidence: Number.parseInt(decision.confidence, 10),
          reasoning: decision.reasoning
        };
      }
      
      // 如果没有找到JSON，尝试提取模型名称
      const modelMatch = responseText.match(/selectedModel['"]*:[\s]*['"]*([a-zA-Z0-9\-\.]+)['"]/);
      if (modelMatch?.[1]) {
        // 尝试提取置信度
        const confidenceMatch = responseText.match(/confidence['"]*:[\s]*([0-9]+)/);
        const confidence = confidenceMatch ? Number.parseInt(confidenceMatch[1], 10) : 50;
        
        return {
          model: modelMatch[1],
          confidence: confidence,
          reasoning: "通过文本提取获得模型名称"
        };
      }
      
      // 无法解析
      logger.error('无法从Llama3响应中解析出路由决策');
      logger.error('原始响应:', responseText);
      return null;
    } catch (error) {
      logger.error('解析路由决策时出错:', error.message);
      logger.error('原始响应:', responseText);
      return null;
    }
  },
  
  /**
   * 获取查询的哈希值，用于缓存和识别
   * @param {string} query 查询字符串
   * @returns {string} 查询的哈希值
   */
  getQueryHash(query) {
    return crypto.createHash('md5').update(query).digest('hex');
  },

  /**
   * 处理用户请求
   * @param {string} userId 用户ID
   * @param {string} userQuery 用户查询
   * @param {Object} options 选项
   * @returns {Promise<Object>} 路由决策
   */
  async handleUserRequest(userId, userQuery, options = {}) {
    if (!this.isInitialized) {
      console.error('[Router] 错误：Llama3 路由引擎尚未初始化完成，无法处理请求。');
      return {
        model: 'error',
        confidence: 0,
        reasoning: 'Router not initialized'
      };
    }
    
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const queryHash = this.getQueryHash(userQuery);
    let queryId = null;

    try {
      queryId = await saveQueryRecord(userQuery, queryHash, timestamp);
      if (queryId === null) throw new Error('未能获取有效的 queryId');
    } catch (saveError) {
      console.error('[Router] 保存查询记录或获取 queryId 时出错: ', saveError.message);
      return { model: 'error', confidence: 0, reasoning: 'Failed to save query record or get queryId' };
    }

    try {
      const context = this.contextManager.getUserContext(userId);
      const preferences = this.contextManager.analyzeUserPreferences(userId);
      
      if (userQuery.toLowerCase().includes('port') || userQuery.toLowerCase().includes('端口')) {
        return await this.handlePortManagementRequest(userQuery, context);
      }
      
      const availableModels = options.availableModels || [];
      const modelStats = options.modelStats || {};
      const decision = await this.routeQuery(userQuery, availableModels, modelStats);
      
      const endTime = Date.now();
      const routingResponseTime = (endTime - startTime) / 1000;
      
      if (decision) {
        try {
          await saveRoutingDecision(queryId, decision, routingResponseTime, timestamp);
        } catch (saveError) {
          console.error('[Router] 保存路由决策时出错 (非阻塞): ', saveError.message);
        }
      } else {
        const failedDecision = { model: 'routing_failed', confidence: 0, reasoning: 'Llama3 decision failed' };
        try {
          await saveRoutingDecision(queryId, failedDecision, routingResponseTime, timestamp);
        } catch (saveError) {
          console.error('[Router] 保存失败路由决策时出错 (非阻塞): ', saveError.message);
        }
        console.warn('[Router] Llama3 路由决策失败，已记录失败情况。');
      }
      
      this.contextManager.updateUserContext(userId, {
        query: userQuery,
        response: decision,
        model: decision?.model,
        timestamp: Date.now()
      });
      
      return decision;
    } catch (error) {
      logger.error('处理用户请求失败:', error);
      const endTime = Date.now();
      const errorResponseTime = (endTime - startTime) / 1000;
      const errorDecision = { model: 'error', confidence: 0, reasoning: error.message };
      if (queryId) {
        try {
          await saveRoutingDecision(queryId, errorDecision, errorResponseTime, timestamp);
        } catch (saveError) {
          console.error('[Router] 保存错误路由决策时出错 (非阻塞): ', saveError.message);
        }
      }
      throw error;
    }
  },

  async handlePortManagementRequest(query, context) {
    try {
      const prompt = `分析以下端口管理请求的类型：
${query}

可能的类型：
1. 端口注册
2. 端口查询
3. 端口释放
4. 端口报告

请返回JSON格式的分析结果，包含：
{
  "type": "请求类型",
  "project": "项目名称（如果有）",
  "details": "详细信息"
}`;

      const analysis = await this.routeQuery(prompt, {
        userContext: context,
        preferences: {}
      });
      const { type, project, details } = JSON.parse(analysis.content);

      switch (type) {
        case '端口注册':
          return await this.portManager.registerProject(project, details);
        case '端口查询':
          return await this.portManager.getPortStatus(project);
        case '端口释放':
          return await this.portManager.releasePorts(project);
        case '端口报告':
          return await this.portManager.generatePortReport();
        default:
          throw new Error('未知的端口管理请求类型');
      }
    } catch (error) {
      logger.error('处理端口管理请求失败:', error);
      throw error;
    }
  }
};

module.exports = llama3Router; 