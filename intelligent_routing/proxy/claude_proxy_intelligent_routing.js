// 高级模型代理服务器
// 支持多模型负载均衡 + fallback + 语义路由，兼容本地部署 + 云API + Cursor对接
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
// !!! 确保 Llama3 Router 在最顶部被引入 !!!
const llama3Router = require('../engine/llama3_router'); 
// 导入智能路由系统
const { integrateIntelligentRouting } = require('../api/integration');
const fs = require('node:fs');
const path = require('node:path');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.CLAUDE_PROXY_PORT || 3100;

// 是否通过Cursor企业版访问Claude模型
const USE_CURSOR_FOR_CLAUDE = process.env.USE_CURSOR_FOR_CLAUDE === 'true';

// 创建日志目录
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志记录器
const logFilePath = path.join(logDir, 'model_proxy.log');
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
    console.log(message);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
    console.error(message);
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}\n`;
    fs.appendFileSync(logFilePath, logMessage);
    console.warn(message);
  }
};

// 初始化API密钥
const API_KEYS = {
  CLAUDE: process.env.CLAUDE_API_KEY || process.env.anthropic_api_key || null,
  OPENAI: process.env.OPENAI_API_KEY || null,
  CURSOR: process.env.CURSOR_API_KEY || null,
  DEEPSEEK: process.env.DEEPSEEK_API_KEY || null,
  GEMINI: process.env.GEMINI_API_KEY || process.env.gemini_api_key || null,
  OLLAMA: process.env.OLLAMA_API_KEY || null
};

// Cursor-Claude模型访问帮助函数
const cursorClaudeHelper = {
  // 获取通过Cursor访问Claude的端点
  getCursorClaudeEndpoint: (claudeModel) => {
    const modelMapping = {
      'claude-3-opus': 'claude/claude-3-opus-20240229',
      'claude-3-7-sonnet': 'claude/claude-3-7-sonnet-20250219',
      'claude-3-sonnet': 'claude/claude-3-sonnet-20240229',
      'claude-3-haiku': 'claude/claude-3-haiku-20240307'
    };
    
    const cursorModel = modelMapping[claudeModel] || 'claude/claude-3-7-sonnet-20250219';
    return `https://api.cursor.sh/v1/models/${cursorModel}/completions`;
  }
};

// 打印API密钥加载状态(不输出实际密钥)
logger.log(`API密钥状态:
- Claude: ${API_KEYS.CLAUDE ? '已配置' : '未配置'}
- OpenAI: ${API_KEYS.OPENAI ? '已配置' : '未配置'}
- Cursor: ${API_KEYS.CURSOR ? '已配置' : '未配置'}
- DeepSeek: ${API_KEYS.DEEPSEEK ? '已配置' : '未配置'}
- Gemini: ${API_KEYS.GEMINI ? '已配置' : '未配置'}
- Ollama: ${API_KEYS.OLLAMA ? '已配置' : '未配置'}`);

// 验证必要的API密钥
if (!API_KEYS.CLAUDE && !API_KEYS.CURSOR) {
  logger.log('注意: 未配置Claude API密钥，但可以通过Cursor企业版访问Claude模型');
  // 不退出，允许使用其他模型或通过Cursor访问
} else if (USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR) {
  logger.log('已启用通过Cursor企业版访问Claude模型');
}

// 模型配置
const MODELS = {
  // Claude模型
  'claude-3-opus': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (params) => {
      // 提取system消息
      let systemMessage = null;
      const messages = [...params.messages];
      
      // 查找并移除system消息
      const systemIndex = messages.findIndex(msg => msg.role === 'system');
      if (systemIndex !== -1) {
        systemMessage = messages[systemIndex].content;
        messages.splice(systemIndex, 1);
      }
      
      return {
        model: 'claude-3-opus-20240229',
        messages: messages,
        system: systemMessage, // 作为顶级参数
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7
      };
    },
    parseResponse: (response) => response.data
  },
  // 添加Claude 3.7 Sonnet模型
  'claude-3-7-sonnet': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (params) => {
      // 提取system消息
      let systemMessage = null;
      const messages = [...params.messages];
      
      // 查找并移除system消息
      const systemIndex = messages.findIndex(msg => msg.role === 'system');
      if (systemIndex !== -1) {
        systemMessage = messages[systemIndex].content;
        messages.splice(systemIndex, 1);
      }
      
      return {
        model: 'claude-3-7-sonnet-20250219',
        messages: messages,
        system: systemMessage, // 作为顶级参数
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7
      };
    },
    parseResponse: (response) => response.data
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (params) => {
      // 提取system消息
      let systemMessage = null;
      const messages = [...params.messages];
      
      // 查找并移除system消息
      const systemIndex = messages.findIndex(msg => msg.role === 'system');
      if (systemIndex !== -1) {
        systemMessage = messages[systemIndex].content;
        messages.splice(systemIndex, 1);
      }
      
      return {
        model: 'claude-3-sonnet-20240229',
        messages: messages,
        system: systemMessage, // 作为顶级参数
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7
      };
    },
    parseResponse: (response) => response.data
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    formatRequest: (params) => {
      // 提取system消息
      let systemMessage = null;
      const messages = [...params.messages];
      
      // 查找并移除system消息
      const systemIndex = messages.findIndex(msg => msg.role === 'system');
      if (systemIndex !== -1) {
        systemMessage = messages[systemIndex].content;
        messages.splice(systemIndex, 1);
      }
      
      return {
        model: 'claude-3-haiku-20240307',
        messages: messages,
        system: systemMessage, // 作为顶级参数
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7
      };
    },
    parseResponse: (response) => response.data
  },
  // OpenAI模型
  'gpt-4o': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => ({
      model: 'gpt-4o',
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
    parseResponse: (response) => response.data
  },
  // 新增 GPT-4.1 模型
  'gpt-4.1': {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => ({
      model: 'gpt-4-turbo',  // 替换为正确的模型名称，如果不确定使用gpt-4-turbo
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
    parseResponse: (response) => response.data
  },
  // DeepSeek模型
  'deepseek-v3.1': {
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => ({
      model: 'deepseek-chat',  // 修改为正确的模型名称
      messages: params.messages,
      max_tokens: params.max_tokens || 2048,
      temperature: params.temperature || 0.7
    }),
    parseResponse: (response) => ({
      model: 'deepseek-chat',
      content: [{ 
        type: 'text', 
        text: response.data.choices[0].message.content 
      }],
      usage: response.data.usage
    })
  },
  // DeepSeek-R1模型
  'deepseek-r1': {
    provider: 'deepseek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => ({
      model: 'deepseek-coder',  // DeepSeek Coder模型
      messages: params.messages,
      max_tokens: params.max_tokens || 2048,
      temperature: params.temperature || 0.7
    }),
    parseResponse: (response) => ({
      model: 'deepseek-coder',
      content: [{ 
        type: 'text', 
        text: response.data.choices[0].message.content 
      }],
      usage: response.data.usage
    })
  },
  // Google Gemini模型
  'gemini-pro': {
    provider: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (params) => {
      // 转换消息格式为Gemini兼容格式
      const contents = [];
      for (const message of params.messages) {
        if (message.role === 'user' || message.role === 'assistant') {
          const parts = [];
          if (typeof message.content === 'string') {
            parts.push({ text: message.content });
          } else if (Array.isArray(message.content)) {
            for (const part of message.content) {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              }
              // 可以在这里处理其他类型(如图片)
            }
          }
          contents.push({
            role: message.role === 'user' ? 'user' : 'model',
            parts: parts
          });
        }
      }
      
      return {
        contents: contents,
        generationConfig: {
          maxOutputTokens: params.max_tokens || 1000,
          temperature: params.temperature || 0.7
        },
        key: API_KEYS.GEMINI
      };
    },
    parseResponse: (response) => {
      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gemini API返回了空的响应');
      }
      
      return {
        model: 'gemini-pro',
        content: [{ 
          type: 'text', 
          text: response.data.candidates[0].content.parts[0].text 
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  },
  'gemini-pro-vision': {
    provider: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (params) => {
      // 处理多模态内容(文本和图像)
      const contents = [];
      for (const message of params.messages) {
        if (message.role === 'user' || message.role === 'assistant') {
          const parts = [];
          if (typeof message.content === 'string') {
            parts.push({ text: message.content });
          } else if (Array.isArray(message.content)) {
            for (const part of message.content) {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              } else if (part.type === 'image_url') {
                // 处理Base64编码的图像
                const mimeType = part.image_url.mime_type || 'image/jpeg';
                const base64Data = part.image_url.url.split(',')[1] || part.image_url.url;
                parts.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                });
              }
            }
          }
          contents.push({
            role: message.role === 'user' ? 'user' : 'model',
            parts: parts
          });
        }
      }
      
      return {
        contents: contents,
        generationConfig: {
          maxOutputTokens: params.max_tokens || 1000,
          temperature: params.temperature || 0.7
        },
        key: API_KEYS.GEMINI
      };
    },
    parseResponse: (response) => {
      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gemini Vision API返回了空的响应');
      }
      
      return {
        model: 'gemini-pro-vision',
        content: [{ 
          type: 'text', 
          text: response.data.candidates[0].content.parts[0].text 
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  },
  'gemini-1.5-flash': {
    provider: 'gemini',
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    headers: (apiKey) => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (params) => {
      // 转换消息格式为Gemini兼容格式
      const contents = [];
      for (const message of params.messages) {
        if (message.role === 'user' || message.role === 'assistant') {
          const parts = [];
          if (typeof message.content === 'string') {
            parts.push({ text: message.content });
          } else if (Array.isArray(message.content)) {
            for (const part of message.content) {
              if (part.type === 'text') {
                parts.push({ text: part.text });
              }
              // 可以在这里处理其他类型(如图片)
            }
          }
          contents.push({
            role: message.role === 'user' ? 'user' : 'model',
            parts: parts
          });
        }
      }
      
      return {
        contents: contents,
        generationConfig: {
          maxOutputTokens: params.max_tokens || 1000,
          temperature: params.temperature || 0.7
        },
        key: API_KEYS.GEMINI
      };
    },
    parseResponse: (response) => {
      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('Gemini API返回了空的响应');
      }
      
      return {
        model: 'gemini-1.5-flash',
        content: [{ 
          type: 'text', 
          text: response.data.candidates[0].content.parts[0].text 
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  },
  // Ollama模型 (本地部署)
  'llama3': {
    provider: 'ollama',
    endpoint: 'http://localhost:11434/api/generate',
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatRequest: (params) => {
      // 使用共用的格式化函数来处理消息数组
      const prompt = formatMessagesForOllama(params.messages);
      
      return {
        model: 'llama3',
        prompt: prompt,
        stream: false
      };
    },
    parseResponse: (response) => {
      return {
        model: 'llama3',
        content: [{ type: 'text', text: response.data.response }]
      };
    }
  },
  // Cursor模型
  'cursor': {
    provider: 'cursor',
    endpoint: 'https://api.cursor.sh/v1/models/claude-3-7-sonnet/generate',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => {
      // 将消息格式转换为Cursor API格式
      const messages = [...params.messages];
      
      // 查找并提取系统消息
      let systemMessage = '';
      const systemIndex = messages.findIndex(msg => msg.role === 'system');
      if (systemIndex !== -1) {
        systemMessage = messages[systemIndex].content;
        messages.splice(systemIndex, 1);
      }
      
      // 创建Cursor兼容的请求格式
      return {
        messages: messages,
        system: systemMessage || undefined,
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7,
        stream: false
      };
    },
    parseResponse: (response) => {
      // 将Cursor API响应转换为统一格式
      if (!response.data) {
        throw new Error('Cursor API返回了空的响应');
      }
      
      return {
        model: 'claude-3-7-sonnet',
        content: [{ 
          type: 'text', 
          text: response.data.content || response.data.completion || ''
        }],
        usage: response.data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }
};

// 确保所有模型配置了正确的API提供商
for (const model in MODELS) {
  const provider = MODELS[model].provider.toUpperCase();
  let hasKey = Boolean(API_KEYS[provider]);
  
  // 如果是Claude模型且启用了通过Cursor访问
  if (MODELS[model].provider === 'anthropic' && USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR) {
    hasKey = true;
    logger.log(`模型 ${model} (提供商: anthropic) API密钥状态: 通过Cursor访问`);
  } else {
    logger.log(`模型 ${model} (提供商: ${MODELS[model].provider}) API密钥状态: ${hasKey ? '可用' : '缺失'}`);
  }
}

// 模型权重配置（用于负载均衡）
const MODEL_WEIGHTS = {
  'claude-3-opus': 60,        // 通过Cursor访问，高权重高精度模型
  'claude-3-7-sonnet': 70,    // 通过Cursor访问，主力高质量模型
  'claude-3-sonnet': 50,      // 通过Cursor访问，平衡模型
  'claude-3-haiku': 40,       // 通过Cursor访问，速度快的模型
  'gpt-4o': 30,               // OpenAI GPT-4o
  'gpt-4.1': 30,              // OpenAI GPT-4.1
  'deepseek-v3.1': 50,        // 提高DeepSeek权重
  'deepseek-r1': 30,          // DeepSeek-R1模型
  'gemini-pro': 15,           // Gemini基础模型
  'gemini-pro-vision': 5,     // Gemini多模态模型
  'gemini-1.5-flash': 20,     // Gemini最新模型
  'cursor': 20,               // Cursor原生模型权重
  'llama3': 50                // 默认不使用，除非特别指定或所有其他模型失败
};

// 模型状态监控
const MODEL_STATUS = {};

// 初始化模型状态
function initModelStatus() {
  for (const model of Object.keys(MODELS)) {
    MODEL_STATUS[model] = {
      available: true,
      lastCheck: null,
      successRate: 100,
      averageResponseTime: 0,
      requestCount: 0,
      failCount: 0,
      lastError: null
    };
  }
}

// 更新模型状态
function updateModelStatus(model, success, responseTime, error = null) {
  if (!MODEL_STATUS[model]) {
    MODEL_STATUS[model] = {
      available: true,
      lastCheck: null,
      successRate: 100,
      averageResponseTime: 0,
      requestCount: 0,
      failCount: 0,
      lastError: null
    };
  }
  
  const status = MODEL_STATUS[model];
  status.lastCheck = new Date().toISOString();
  status.requestCount++;
  
  if (success) {
    // 更新平均响应时间 (加权平均)
    const oldWeight = Math.max(0, status.requestCount - 1) / status.requestCount;
    const newWeight = 1 / status.requestCount;
    status.averageResponseTime = (status.averageResponseTime * oldWeight) + (responseTime * newWeight);
  } else {
    status.failCount++;
    status.lastError = error;
  }
  
  // 计算成功率
  status.successRate = ((status.requestCount - status.failCount) / status.requestCount) * 100;
  
  // 如果成功率过低，标记为不可用
  status.available = status.successRate > 50;
}

// 初始化模型状态
initModelStatus();

// 根据多维度指标智能选择模型
function selectModelByWeight() {
  const availableModels = [];
  
  // 添加Claude模型(可通过Cursor访问或直接API)
  if (API_KEYS.CLAUDE || (USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR)) {
    const claudeModels = ['claude-3-opus', 'claude-3-7-sonnet', 'claude-3-sonnet', 'claude-3-haiku'];
    for (const model of claudeModels) {
      availableModels.push({ 
        name: model, 
        weight: MODEL_WEIGHTS[model],
        accessVia: USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR ? 'cursor' : 'direct'
      });
    }
  }
  
  // 只添加有API密钥的云模型
  if (API_KEYS.OPENAI) {
    availableModels.push(
      { name: 'gpt-4o', weight: MODEL_WEIGHTS['gpt-4o'] },
      { name: 'gpt-4.1', weight: MODEL_WEIGHTS['gpt-4.1'] }
    );
  }
  
  if (API_KEYS.CURSOR) {
    availableModels.push({ name: 'cursor', weight: MODEL_WEIGHTS.cursor });
  }
  
  if (API_KEYS.DEEPSEEK) {
    availableModels.push(
      { name: 'deepseek-v3.1', weight: MODEL_WEIGHTS['deepseek-v3.1'] },
      { name: 'deepseek-r1', weight: MODEL_WEIGHTS['deepseek-r1'] }
    );
  }
  
  if (API_KEYS.GEMINI) {
    availableModels.push(
      { name: 'gemini-pro', weight: MODEL_WEIGHTS['gemini-pro'] },
      { name: 'gemini-pro-vision', weight: MODEL_WEIGHTS['gemini-pro-vision'] },
      { name: 'gemini-1.5-flash', weight: MODEL_WEIGHTS['gemini-1.5-flash'] }
    );
  }
  
  // 检查Ollama是否在本地运行
  if (MODEL_WEIGHTS.llama3 > 0) {
    availableModels.push({ name: 'llama3', weight: MODEL_WEIGHTS.llama3 });
  }
  
  if (availableModels.length === 0) {
    return null; // 没有可用模型
  }
  
  // 增强选择逻辑: 综合考虑权重、成功率、响应时间和使用频率
  for (const model of availableModels) {
    // 获取模型状态
    const status = MODEL_STATUS[model.name] || { 
      available: true, 
      successRate: 100, 
      averageResponseTime: 0,
      requestCount: 0 
    };
    
    // 计算综合得分
    // 1. 基础权重分(0-100)
    const weightScore = model.weight;
    
    // 2. 成功率分(0-100)
    const successScore = status.successRate;
    
    // 3. 响应时间分(0-100)，响应越快分越高
    const responseTimeScore = status.averageResponseTime > 0 
      ? Math.max(0, 100 - (status.averageResponseTime / 200)) // 每200ms降低1分
      : 80; // 无历史数据时默认80分
    
    // 4. 负载均衡分，使用次数少的优先
    const loadBalanceScore = status.requestCount > 0
      ? Math.max(30, 100 - (status.requestCount * 2)) // 每次请求降低2分，最低30分
      : 100; // 未使用过的模型得满分
    
    // 权重占40%，成功率占30%，响应时间占20%，负载均衡占10%
    const totalScore = (weightScore * 0.4) + 
                      (successScore * 0.3) + 
                      (responseTimeScore * 0.2) + 
                      (loadBalanceScore * 0.1);
    
    // 保存计算的得分
    model.score = totalScore;
    
    logger.log(`模型${model.name}评分: ${Math.round(totalScore)} (权重:${weightScore}, 成功率:${Math.round(successScore)}, 响应:${Math.round(responseTimeScore)}, 均衡:${Math.round(loadBalanceScore)})`);
  }
  
  // 按综合得分排序
  availableModels.sort((a, b) => b.score - a.score);
  
  // 选择得分最高的模型
  const selectedModel = availableModels[0];
  
  if (selectedModel) {
    logger.log(`智能选择最佳模型: ${selectedModel.name} (综合得分: ${Math.round(selectedModel.score)})`);
    return selectedModel.name;
  }
  
  // 默认返回第一个可用模型
  return availableModels[0]?.name || null;
}

// 简单的语义路由函数
function routeBySemantics(messages, customRoutingRules = []) {
  // 获取用户的最后一条消息
  const lastUserMessage = messages
    .filter(msg => msg.role === 'user')
    .pop();
    
  if (!lastUserMessage) {
    return selectModelByWeight(); // 默认负载均衡
  }
  
  const content = lastUserMessage.content.toLowerCase();
  logger.log(`语义路由分析消息: "${content.substring(0, 50)}..."`);
  
  // 任务类型识别
  // =============
  
  // 中文检测
  const hasChinese = content.match(/[\u4e00-\u9fa5]/);
  if (hasChinese) {
    logger.log('检测到中文内容');
  }
  
  // 编程检测
  const isProgramming = content.includes('代码') || 
                        content.includes('编程') || 
                        content.includes('开发') || 
                        content.includes('函数') || 
                        content.includes('算法') || 
                        content.includes('程序') ||
                        content.match(/javascript|python|java|c\+\+|sql|html|css|php|go|rust/i);
  if (isProgramming) {
    logger.log('检测到编程相关内容');
  }
  
  // 创意写作检测
  const isCreativeWriting = content.includes('写一篇') || 
                           content.includes('写作') || 
                           content.includes('创意') || 
                           content.includes('故事') || 
                           content.includes('小说') ||
                           content.includes('诗') ||
                           content.includes('文案');
  if (isCreativeWriting) {
    logger.log('检测到创意写作内容');
  }
  
  // 数学和推理检测
  const isMathReasoning = content.includes('数学') || 
                         content.includes('计算') || 
                         content.includes('推理') || 
                         content.includes('逻辑') || 
                         content.includes('证明') ||
                         content.match(/\d+[+\-*/^=]/);
  if (isMathReasoning) {
    logger.log('检测到数学和逻辑推理内容');
  }
  
  // 翻译检测
  const isTranslation = content.includes('翻译') || 
                       content.includes('translate') || 
                       content.includes('英文') || 
                       content.includes('中文') ||
                       content.includes('日文') ||
                       content.includes('韩文');
  if (isTranslation) {
    logger.log('检测到翻译请求');
  }
  
  // 简短问答检测
  const isSimpleQA = content.length < 100 && 
                    !isProgramming && 
                    !isCreativeWriting && 
                    !isMathReasoning;
  if (isSimpleQA) {
    logger.log('检测到简短问答');
  }
  
  // 复杂长文本内容
  const isComplexContent = content.length > 1000 || 
                          content.includes('复杂') || 
                          content.includes('详细') || 
                          content.includes('分析') || 
                          content.includes('解释');
  if (isComplexContent) {
    logger.log('检测到复杂长文本内容');
  }
  
  // 应用自定义路由规则
  for (const rule of customRoutingRules) {
    if (rule.pattern && content.includes(rule.pattern.toLowerCase())) {
      if (MODELS[rule.model]) {
        logger.log(`匹配自定义路由规则: ${rule.pattern} -> ${rule.model}`);
        return rule.model;
      }
    }
  }
  
  // ===========================
  // 基于任务类型选择最佳模型
  // ===========================
  
  // 优先使用Cursor访问claude-3-7-sonnet (如果有API密钥)
  if (API_KEYS.CURSOR && (isComplexContent || isCreativeWriting)) {
    logger.log('复杂/创意内容路由到: cursor (使用claude-3-7-sonnet通道)');
    return 'cursor';
  }
  
  // 中文内容处理专家：DeepSeek模型
  if (hasChinese) {
    // 中文编程内容
    if (isProgramming && API_KEYS.DEEPSEEK) {
      logger.log('中文编程内容路由到: deepseek-r1 (代码专精模型)');
      return 'deepseek-r1';
    }
    
    // 中文创意写作
    if (isCreativeWriting && API_KEYS.DEEPSEEK) {
      logger.log('中文创意写作路由到: deepseek-v3.1 (中文创意能力强)');
      return 'deepseek-v3.1';
    }
    
    // 中文一般内容
    if (API_KEYS.DEEPSEEK) {
      logger.log('中文内容路由到: deepseek-v3.1 (中文理解能力强)');
      return 'deepseek-v3.1';
    }
  }
  
  // 编程内容处理
  if (isProgramming) {
    // 中文编程
    if (hasChinese && API_KEYS.DEEPSEEK) {
      logger.log('中文编程内容路由到: deepseek-r1 (代码专精模型)');
      return 'deepseek-r1';
    }
    
    // 英文编程，优先使用适合代码的模型
    if (API_KEYS.OPENAI) {
      logger.log('英文编程内容路由到: gpt-4.1 (英文代码生成能力强)');
      return 'gpt-4.1';
    }
  }
  
  // 创意写作
  if (isCreativeWriting) {
    if (hasChinese && API_KEYS.DEEPSEEK) {
      logger.log('中文创意写作路由到: deepseek-v3.1 (中文创作能力出色)');
      return 'deepseek-v3.1';
    }
    
    if (API_KEYS.OPENAI) {
      logger.log('英文创意写作路由到: gpt-4.1 (英文创意能力强)');
      return 'gpt-4.1';
    }
  }
  
  // 数学和逻辑推理
  if (isMathReasoning && API_KEYS.OPENAI) {
    logger.log('数学和推理内容路由到: gpt-4o (逻辑推理能力强)');
    return 'gpt-4o';
  }
  
  // 翻译任务
  if (isTranslation) {
    if (hasChinese && API_KEYS.DEEPSEEK) {
      logger.log('中文翻译路由到: deepseek-v3.1 (中翻英能力强)');
      return 'deepseek-v3.1';
    }
    
    if (API_KEYS.GEMINI) {
      logger.log('翻译内容路由到: gemini-pro (多语言能力强)');
      return 'gemini-pro';
    }
  }
  
  // 复杂长文本分析
  if (isComplexContent) {
    if (API_KEYS.OPENAI) {
      logger.log('复杂内容路由到: gpt-4o (长文本处理能力强)');
      return 'gpt-4o';
    }
    
    if (API_KEYS.DEEPSEEK) {
      logger.log('复杂内容路由到: deepseek-v3.1');
      return 'deepseek-v3.1';
    }
  }
  
  // 简短问答
  if (isSimpleQA) {
    // 简单问题，使用响应快的轻量模型
    if (hasChinese && API_KEYS.DEEPSEEK) {
      logger.log('中文简单问答路由到: deepseek-v3.1');
      return 'deepseek-v3.1';
    }
    
    if (API_KEYS.GEMINI) {
      logger.log('简单问答路由到: gemini-1.5-flash (响应快)');
      return 'gemini-1.5-flash';
    }
    
    if (API_KEYS.OPENAI) {
      logger.log('简单问答路由到: gpt-4.1');
      return 'gpt-4.1';
    }
  }
  
  // 如果没有匹配到特定类型，使用可用性+权重综合选择
  logger.log('未匹配到特定类型，使用可用性+权重综合选择');
  return selectModelByWeight();
}

// 将消息数组转换为适合Ollama的格式
function formatMessagesForOllama(messages) {
  let prompt = '';
  
  for (const msg of messages) {
    if (msg.role === 'system') {
      prompt += `System: ${msg.content}\n\n`;
    } else if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      prompt += `Assistant: ${msg.content}\n\n`;
    }
  }
  
  prompt += 'Assistant: ';
  return prompt;
}

// 调用模型API的函数
async function callModelAPI(modelName, params, apiKeys) {
  const modelConfig = MODELS[modelName];
  if (!modelConfig) {
    throw new Error(`未知的模型: ${modelName}`);
  }
  
  // 获取对应提供商的API密钥
  let apiKey;
  let provider = modelConfig.provider;
  
  // 如果启用了通过Cursor访问Claude，对Claude模型使用Cursor API
  if (USE_CURSOR_FOR_CLAUDE && provider === 'anthropic' && apiKeys.CURSOR) {
    logger.log(`通过Cursor企业版访问Claude模型: ${modelName}`);
    apiKey = apiKeys.CURSOR;
    provider = 'cursor';
  } else {
    switch (provider) {
      case 'anthropic':
        apiKey = apiKeys.CLAUDE;
        break;
      case 'openai':
        apiKey = apiKeys.OPENAI;
        break;
      case 'cursor':
        apiKey = apiKeys.CURSOR;
        break;
      case 'deepseek':
        apiKey = apiKeys.DEEPSEEK;
        break;
      case 'gemini':
        apiKey = apiKeys.GEMINI;
        break;
      case 'ollama':
        apiKey = null; // Ollama本地部署不需要API密钥
        break;
      default:
        throw new Error(`未知的提供商: ${provider}`);
    }
  }
  
  // 如果是通过Cursor访问Claude，修改endpoint和请求格式
  let endpoint = modelConfig.endpoint;
  let headers = {};
  let requestData = {};
  
  if (USE_CURSOR_FOR_CLAUDE && modelConfig.provider === 'anthropic' && apiKeys.CURSOR) {
    // 使用Cursor API代理Claude请求
    endpoint = cursorClaudeHelper.getCursorClaudeEndpoint(modelName);
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKeys.CURSOR}`
    };
    
    // 提取system消息
    let systemMessage = null;
    const messages = [...params.messages];
    
    // 查找并移除system消息
    const systemIndex = messages.findIndex(msg => msg.role === 'system');
    if (systemIndex !== -1) {
      systemMessage = messages[systemIndex].content;
      messages.splice(systemIndex, 1);
    }
    
    // 使用Cursor格式封装Claude请求
    requestData = {
      model: modelName.replace('claude-', 'claude/'),  // 适配Cursor API模型名称格式
      messages: messages,
      system: systemMessage,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    };
  } else {
    // 使用原始模型配置
    headers = modelConfig.headers(apiKey);
    requestData = modelConfig.formatRequest(params);
  }
  
  // 检查是否有必要的API密钥(除了本地模型)
  if (provider !== 'ollama' && !apiKey) {
    throw new Error(`缺少${provider}的API密钥`);
  }
  
  try {
    // 为Gemini模型添加API密钥作为URL查询参数
    if (provider === 'gemini') {
      endpoint = `${endpoint}?key=${apiKey}`;
      // 从请求数据中移除API密钥，因为已经添加到URL中
      if (requestData.key) {
        // 创建新对象而不是使用delete
        const { key, ...newRequestData } = requestData;
        Object.assign(requestData, newRequestData);
        for (const prop in requestData) {
          if (prop !== 'key') continue;
          requestData[prop] = undefined;
        }
      }
    }
    
    // 发送请求
    const startTime = Date.now();
    logger.log(`正在调用模型API: ${modelName}${USE_CURSOR_FOR_CLAUDE && modelConfig.provider === 'anthropic' ? ' (通过Cursor)' : ''}`);
    
    // 记录关键请求信息（但不包含敏感内容）
    const requestSummary = {
      model: modelName,
      provider: USE_CURSOR_FOR_CLAUDE && modelConfig.provider === 'anthropic' ? 'cursor_claude' : modelConfig.provider,
      messageCount: params.messages?.length || 0,
      max_tokens: params.max_tokens,
      temperature: params.temperature
    };
    logger.log(`请求详情: ${JSON.stringify(requestSummary)}`);
    
    // 确定使用哪个endpoint
    const targetEndpoint = provider === 'gemini' ? endpoint : modelConfig.endpoint;
    
    const response = await axios.post(
      targetEndpoint,
      requestData,
      { headers }
    );
    
    const endTime = Date.now();
    logger.log(`模型响应时间: ${endTime - startTime}ms`);
    
    // 解析响应
    return modelConfig.parseResponse(response);
  } catch (error) {
    // 增强错误日志
    const errorInfo = {
      model: modelName,
      provider: USE_CURSOR_FOR_CLAUDE && modelConfig.provider === 'anthropic' ? 'cursor_claude' : modelConfig.provider,
      message: error.message,
      status: error.response?.status || 'unknown',
      data: error.response?.data || 'no data available'
    };
    
    logger.error(`调用模型API失败: ${JSON.stringify(errorInfo)}`);
    
    // 附加详细错误信息到异常对象
    error.modelInfo = {
      name: modelName,
      provider: USE_CURSOR_FOR_CLAUDE && modelConfig.provider === 'anthropic' ? 'cursor_claude' : modelConfig.provider
    };
    
    throw error;
  }
}

// 带有fallback机制的模型调用
async function callModelWithFallback(params, customRoutingRules = []) {
  // 确定初始模型
  let selectedModel = params.model;
  
  // 如果没有指定模型，使用语义路由
  if (!selectedModel || !MODELS[selectedModel]) {
    selectedModel = await intelligentRoute(params.messages, { customRoutingRules });
    logger.log(`语义路由选择模型: ${selectedModel}`);
  }
  
  // 构建模型尝试顺序列表
  let modelOrder = [selectedModel];
  
  // 添加其他可用模型作为后备
  for (const model of Object.keys(MODELS)) {
    // 只添加权重大于0且状态可用的模型作为后备
    if (!modelOrder.includes(model) && 
        MODEL_WEIGHTS[model] > 0 && 
        MODEL_STATUS[model].available) {
      modelOrder.push(model);
    }
  }
  
  // 根据权重降序和成功率排序后备模型
  modelOrder = modelOrder.filter(model => MODEL_WEIGHTS[model] > 0)
    .sort((a, b) => {
      // 首先按可用性排序
      if (MODEL_STATUS[a].available !== MODEL_STATUS[b].available) {
        return MODEL_STATUS[b].available ? 1 : -1;
      }
      // 然后按成功率和权重的综合分数排序
      const scoreA = MODEL_STATUS[a].successRate * 0.7 + MODEL_WEIGHTS[a] * 0.3;
      const scoreB = MODEL_STATUS[b].successRate * 0.7 + MODEL_WEIGHTS[b] * 0.3;
      return scoreB - scoreA;
    });
  
  // 如果初始选择的模型权重为0但已经存在于列表中，保留它作为第一选择
  if (selectedModel && MODEL_WEIGHTS[selectedModel] === 0) {
    logger.log(`警告: 选择的模型 ${selectedModel} 权重为0，但仍尝试使用`);
    modelOrder = modelOrder.filter(model => model !== selectedModel);
    modelOrder.unshift(selectedModel);
  }
  
  // 尝试调用模型，如果失败则尝试下一个
  let lastError = null;
  for (const model of modelOrder) {
    try {
      // 检查是否有必要的API密钥，考虑通过Cursor访问
      const provider = MODELS[model].provider;
      if (provider === 'anthropic' && !API_KEYS.CLAUDE) {
        // 如果启用了通过Cursor访问Claude且有Cursor API密钥，继续尝试
        if (!(USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR)) continue;
      }
      if (provider === 'openai' && !API_KEYS.OPENAI) continue;
      if (provider === 'cursor' && !API_KEYS.CURSOR) continue;
      if (provider === 'deepseek' && !API_KEYS.DEEPSEEK) continue;
      if (provider === 'gemini' && !API_KEYS.GEMINI) continue;
      
      // 创建新的参数对象，避免修改原始对象
      const callParams = {...params};
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 调用模型
      const result = await callModelAPI(model, callParams, API_KEYS);
      
      // 计算响应时间
      const responseTime = Date.now() - startTime;
      
      // 更新模型状态
      updateModelStatus(model, true, responseTime);
      
      // 记录成功使用的模型
      logger.log(`成功使用模型: ${model} (响应时间: ${responseTime}ms)`);
      
      // 在响应中添加实际使用的模型信息
      if (result) {
        result._actual_model_used = model;
        result._response_time_ms = responseTime;
      }
      
      return result;
    } catch (error) {
      lastError = error;
      // 更新模型状态
      updateModelStatus(model, false, 0, error.message);
      
      logger.error(`调用模型${model}失败: ${error.message}`);
      // 添加更详细的错误日志
      if (error.response?.data) {
        logger.error(`详细错误信息: ${JSON.stringify(error.response.data)}`);
      }
      // 继续尝试下一个模型
    }
  }
  
  // 如果所有模型都失败，抛出最后一个错误
  throw lastError || new Error('所有模型都调用失败');
}

// --- Llama3 Router 初始化 --- 
// (移到更靠前的位置，确保在定义路由之前执行)
let isLlama3RouterReady = false; // 全局标志位

(async () => {
    logger.log('[SYSTEM_INIT] 开始初始化 Llama3 Router...'); // 添加明确开始日志
    try {
        if (!llama3Router || typeof llama3Router.initialize !== 'function') {
            throw new Error('Llama3 Router 模块加载失败或 initialize 方法不存在。');
        }
        const initSuccess = await llama3Router.initialize(); // 等待初始化完成
        if (initSuccess) {
            isLlama3RouterReady = true;
            logger.log('[SYSTEM_INIT] Llama3 Router 初始化成功完成！'); // 添加明确成功日志
        } else {
            logger.error('[SYSTEM_INIT] Llama3 Router initialize() 方法返回 false。');
        }
    } catch (initError) {
        logger.error('[SYSTEM_INIT] Llama3 Router 初始化过程中捕获到错误:', initError); // 记录完整错误
    }
    logger.log(`[SYSTEM_INIT] Llama3 Router 初始化流程结束。最终状态 (isLlama3RouterReady): ${isLlama3RouterReady}`); // 添加明确结束日志和状态
})();

// 设置中间件
app.use(express.json({ limit: '10mb' }));

// 健康检查接口
app.get('/health', (req, res) => {
  // 检查可用的模型和API密钥
  const availableModels = Object.keys(MODELS).filter(model => {
    const provider = MODELS[model].provider;
    
    // 如果是Claude模型，检查直接API或通过Cursor访问
    if (provider === 'anthropic') {
      return API_KEYS.CLAUDE || (USE_CURSOR_FOR_CLAUDE && API_KEYS.CURSOR);
    }
    
    if (provider === 'ollama') return true; // 假设Ollama总是可用的
    return API_KEYS[provider.toUpperCase()]; // 检查是否有API密钥
  });
  
  // 计算系统状态
  const modelStatusSummary = {};
  let totalRequests = 0;
  let failedRequests = 0;
  
  for (const model of Object.keys(MODEL_STATUS)) {
    if (MODEL_STATUS[model].requestCount > 0) {
      totalRequests += MODEL_STATUS[model].requestCount;
      failedRequests += MODEL_STATUS[model].failCount;
      
      modelStatusSummary[model] = {
        available: MODEL_STATUS[model].available,
        success_rate: Math.round(MODEL_STATUS[model].successRate * 100) / 100,
        avg_response_time: Math.round(MODEL_STATUS[model].averageResponseTime)
      };
    }
  }
  
  const systemHealth = totalRequests > 0 
    ? Math.round(((totalRequests - failedRequests) / totalRequests) * 100) 
    : 100;
  
  // 返回健康状态
  res.status(200).json({ 
    status: 'ok', 
    message: '高级模型代理服务器正常运行',
    available_models: availableModels,
    load_balancing: 'enabled',
    fallback: 'enabled',
    semantic_routing: 'enabled',
    system_health: {
      health_score: systemHealth,
      uptime: Math.round(process.uptime()),
      total_requests: totalRequests,
      failed_requests: failedRequests,
      success_rate: totalRequests > 0 ? Math.round(((totalRequests - failedRequests) / totalRequests) * 100) : 100
    },
    model_status: modelStatusSummary
  });
});

// 模型列表接口
app.get('/models', (req, res) => {
  const availableModels = Object.keys(MODELS)
    .filter(model => {
      const provider = MODELS[model].provider;
      if (provider === 'ollama') return true;
      return API_KEYS[provider.toUpperCase()];
    })
    .map(model => ({
      name: model,
      provider: MODELS[model].provider,
      weight: MODEL_WEIGHTS[model] || 0
    }));
  
  res.json({ models: availableModels });
});

// 统一的模型API接口
app.post('/api/chat', async (req, res) => {
  logger.log('[API /chat] 收到请求...'); // 请求入口日志
  try {
    const { query, userId = 'default' } = req.body;
    const messages = [{ role: 'user', content: query }];
    
    // *** 使用全局标志位检查初始化状态 ***
    logger.log(`[API /chat] 检查 Llama3 Router 准备状态 (isLlama3RouterReady): ${isLlama3RouterReady}`);

    let decision;
    if (isLlama3RouterReady) { // 使用全局标志位
        logger.log('[API /chat] Llama3 Router 已准备就绪，尝试调用 handleUserRequest...');
        decision = await llama3Router.handleUserRequest(userId, query, { /* 可选参数 */ });
        logger.log(`[API /chat] Llama3 Router 返回决策: ${JSON.stringify(decision)}`);
    } else {
        logger.warn('[API /chat] Llama3 Router 未准备就绪，无法执行智能路由。返回错误。');
        return res.status(500).json({ error: '路由引擎未准备好' });
    }
    
    // 检查 Llama3 返回的决策是否有效
    if (!decision || decision.model === 'error') {
      logger.error('Llama3 路由决策失败或返回错误:', decision?.reasoning || '未知错误');
      return res.status(500).json({ error: '路由决策失败', reasoning: decision?.reasoning });
    }

    logger.log(`[API /chat] 最终路由决策模型: ${decision.model} (Confidence: ${decision.confidence}%)`);

    // 根据决策选择模型并处理请求 (使用 callModelWithFallback)
    const modelParams = {
        messages: messages,
        model: decision.model, 
        max_tokens: 1500,
        temperature: 0.7
    };
    
    const result = await callModelWithFallback(modelParams);
    
    let responseText = '未能获取模型回复。';
    if (result?.content?.[0]?.text) {
        responseText = result.content[0].text;
    } else if (result?.choices?.[0]?.message?.content) {
        responseText = result.choices[0].message.content;
    }
    
    // 返回给用户，包含模型来源标记
    const finalModelUsed = result?._actual_model_used || decision.model;
    res.json({
      model: finalModelUsed,
      response: `${responseText} 【${finalModelUsed}】`,
      confidence: decision.confidence, 
      reasoning: decision.reasoning   
    });
    
  } catch (error) {
    logger.error('处理 /api/chat 请求时出错:', error);
    res.status(500).json({ 
        error: '处理请求时出错', 
        message: error.message, 
        model_info: error.modelInfo
    });
  }
});

// 兼容原有Claude API的端点
app.post('/api/claude', async (req, res) => {
  try {
    // 强制使用Claude模型
    const params = {
      ...req.body,
      model: req.body.model || 'claude-3-7-sonnet' // 默认使用Claude 3.7 Sonnet版本
    };
    
    // 确保使用完整模型ID
    if (params.model === 'claude-3-7-sonnet') {
      params.model = 'claude-3-7-sonnet-20250219';
    } else if (params.model === 'claude-3-opus') {
      params.model = 'claude-3-opus-20240229';
    } else if (params.model === 'claude-3-haiku') {
      params.model = 'claude-3-haiku-20240307';
    } else if (params.model === 'claude-3-sonnet') {
      // 由于claude-3-sonnet不可用，自动转为claude-3-opus
      logger.log('claude-3-sonnet不可用，自动转为claude-3-opus');
      params.model = 'claude-3-opus-20240229';
    }
    
    // 调用模型API
    const result = await callModelAPI(params.model, params, API_KEYS);
    
    // 返回响应
    res.json(result);
    
  } catch (error) {
    logger.error(`调用Claude API时出错: ${error.message}`);
    
    // 如果有详细的错误响应，则返回
    if (error.response?.data) {
      return res.status(error.response.status || 500).json({
        error: '调用Claude API失败',
        details: error.response.data
      });
    }
    
    // 否则返回一般错误
    res.status(500).json({ 
      error: '服务器错误', 
      message: `调用Claude API时出错: ${error.message}` 
    });
  }
});

// 动态更新模型权重的接口
app.post('/api/config/weights', (req, res) => {
  const newWeights = req.body;
  
  if (!newWeights || typeof newWeights !== 'object') {
    return res.status(400).json({ error: '无效的权重配置' });
  }
  
  // 更新权重
  for (const model of Object.keys(newWeights)) {
    if (Object.prototype.hasOwnProperty.call(MODEL_WEIGHTS, model)) {
      const weight = Number.parseInt(newWeights[model], 10);
      if (!Number.isNaN(weight) && weight >= 0) {
        MODEL_WEIGHTS[model] = weight;
      }
    }
  }
  
  res.json({ 
    message: '模型权重已更新', 
    current_weights: MODEL_WEIGHTS 
  });
});

// 模型状态监控接口
app.get('/api/status', (req, res) => {
  const modelStatusInfo = {};
  
  for (const model of Object.keys(MODELS)) {
    const status = MODEL_STATUS[model] || {
      available: false,
      lastCheck: null,
      successRate: 0,
      averageResponseTime: 0,
      requestCount: 0,
      failCount: 0
    };
    
    const provider = MODELS[model].provider;
    const hasApiKey = provider === 'ollama' || !!API_KEYS[provider.toUpperCase()];
    
    modelStatusInfo[model] = {
      name: model,
      provider: provider,
      available: status.available && hasApiKey,
      hasApiKey: hasApiKey,
      weight: MODEL_WEIGHTS[model] || 0,
      statistics: {
        successRate: Math.round(status.successRate * 100) / 100,
        averageResponseTime: Math.round(status.averageResponseTime),
        requestCount: status.requestCount,
        failCount: status.failCount,
        lastUsed: status.lastCheck,
        lastError: status.lastError ? {
          message: status.lastError,
          time: status.lastCheck
        } : null
      }
    };
  }
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    models: modelStatusInfo,
    global_stats: {
      uptime: process.uptime(),
      total_requests: Object.values(MODEL_STATUS).reduce((sum, s) => sum + (s.requestCount || 0), 0),
      successful_requests: Object.values(MODEL_STATUS).reduce((sum, s) => sum + ((s.requestCount || 0) - (s.failCount || 0)), 0),
      failed_requests: Object.values(MODEL_STATUS).reduce((sum, s) => sum + (s.failCount || 0), 0)
    }
  });
});

// 启动服务器
// 初始化智能路由系统
const { intelligentRoute, updateRouteResult, shutdown } = integrateIntelligentRouting(
  app,
  MODELS,
  MODEL_STATUS,
  MODEL_WEIGHTS,
  routeBySemantics
);

// 注册智能路由系统的优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  await shutdown();
  if (server) {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

const server = app.listen(PORT, () => {
  logger.log(`高级模型代理服务器已启动，监听端口 ${PORT}`);
  logger.log(`健康检查接口: http://localhost:${PORT}/health`);
  logger.log(`模型列表接口: http://localhost:${PORT}/models`);
  logger.log(`统一模型API接口: http://localhost:${PORT}/api/chat`);
  logger.log(`Claude API兼容接口: http://localhost:${PORT}/api/claude`);
});

// 优雅地处理进程退出
process.on('SIGINT', () => {
  logger.log('正在关闭高级模型代理服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.log('正在关闭高级模型代理服务器...');
  process.exit(0);
}); 