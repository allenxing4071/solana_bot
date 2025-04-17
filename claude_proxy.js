// 高级模型代理服务器
// 支持多模型负载均衡 + fallback + 语义路由，兼容本地部署 + 云API + Cursor对接
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('node:fs');
const path = require('node:path');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.CLAUDE_PROXY_PORT || 3100;

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
  }
};

// API密钥配置
const API_KEYS = {
  CLAUDE: process.env.CLAUDE_API_KEY,
  OPENAI: process.env.OPENAI_API_KEY,
  CURSOR: process.env.CURSOR_API_KEY,
  OLLAMA: process.env.OLLAMA_API_KEY,
  DEEPSEEK: process.env.DEEPSEEK_API_KEY,
  GEMINI: process.env.GEMINI_API_KEY
};

// 验证必要的API密钥
if (!API_KEYS.CLAUDE) {
  logger.error('错误: 缺少 CLAUDE_API_KEY 环境变量。请在 .env 文件中设置。');
  // 不完全退出，允许使用其他模型
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
    formatRequest: (params) => ({
      model: 'claude-3-opus-20240229',
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
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
    formatRequest: (params) => ({
      model: 'claude-3-7-sonnet-20250219', // 使用正确的模型ID
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
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
    formatRequest: (params) => ({
      model: 'claude-3-sonnet-20240229',  // 使用原始模型ID，不使用v1:0后缀
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
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
    formatRequest: (params) => ({
      model: 'claude-3-haiku-20240307',
      messages: params.messages,
      max_tokens: params.max_tokens || 1000,
      temperature: params.temperature || 0.7
    }),
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
      model: 'gpt-4.1-preview',  // 使用正确的模型名称
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
    endpoint: 'https://api.cursor.dev/v2/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (params) => {
      // 修改为优先使用claude-3-7-sonnet模型
      return {
        model: "cursor-chat",
        messages: params.messages,
        max_tokens: params.max_tokens || 8000,
        temperature: params.temperature || 0.7,
        // 添加强制使用claude-3-7-sonnet的参数
        claude_model_preference: "claude-3-7-sonnet", // 提示Cursor优先使用Claude 3.7 Sonnet
        tools: params.tools || [],
        context: {
          ...params.context || {},
          model_preference: "claude-3-7-sonnet" // 在上下文中也标明模型偏好
        },
        stream: false
      };
    },
    parseResponse: (response) => {
      // 解析Cursor响应
      return {
        model: "claude-3-7-sonnet-via-cursor", // 标识为通过Cursor访问的Claude模型
        content: [{ 
          type: 'text', 
          text: response.data.choices[0].message.content 
        }],
        usage: response.data.usage,
        tool_calls: response.data.choices[0].message.tool_calls || []
      };
    }
  }
};

// 负载均衡配置 - 每个模型的权重
const MODEL_WEIGHTS = {
  'claude-3-7-sonnet': 100,  // 设置最高优先级
  'claude-3-opus': 40,    // 更高权重，替代claude-3-sonnet
  'claude-3-sonnet': 0,   // 设为0，禁用该模型
  'claude-3-haiku': 40,   // 更快速，更高频率
  'gpt-4o': 10,           // 备用选项
  'gpt-4.1': 25,          // 新增 GPT-4.1 模型，较高权重
  'deepseek-v3.1': 30,    // DeepSeek模型，提高权重
  'deepseek-r1': 20,      // DeepSeek-R1模型，提高权重
  'gemini-pro': 15,       // Gemini基础模型
  'gemini-pro-vision': 5, // Gemini多模态模型
  'gemini-1.5-flash': 20, // Gemini最新模型
  'cursor': 50,           // 提高Cursor权重，作为claude-3-7-sonnet的通道
  'llama3': 0             // 默认不使用，除非特别指定或所有其他模型失败
};

// 根据权重随机选择模型
function selectModelByWeight() {
  const availableModels = [];
  
  // 只添加有API密钥的云模型
  if (API_KEYS.CLAUDE) {
    availableModels.push(
      { name: 'claude-3-7-sonnet', weight: MODEL_WEIGHTS['claude-3-7-sonnet'] },
      { name: 'claude-3-opus', weight: MODEL_WEIGHTS['claude-3-opus'] },
      { name: 'claude-3-haiku', weight: MODEL_WEIGHTS['claude-3-haiku'] }
    );
  }
  
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
  
  // 计算权重总和
  const totalWeight = availableModels.reduce((sum, model) => sum + model.weight, 0);
  
  // 随机选择
  let random = Math.random() * totalWeight;
  for (const model of availableModels) {
    random -= model.weight;
    if (random <= 0) {
      return model.name;
    }
  }
  
  // 默认返回第一个模型
  return availableModels[0].name;
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
  
  // 应用自定义路由规则
  for (const rule of customRoutingRules) {
    if (rule.pattern && content.includes(rule.pattern.toLowerCase())) {
      if (MODELS[rule.model]) {
        logger.log(`匹配自定义路由规则: ${rule.pattern} -> ${rule.model}`);
        return rule.model;
      }
    }
  }
  
  // 编程相关内容优先级最高
  if (isProgramming) {
    // 如果有Cursor API密钥，优先使用Cursor访问claude-3-7-sonnet
    if (API_KEYS.CURSOR) {
      logger.log('编程内容路由到: cursor (使用claude-3-7-sonnet通道)');
      return 'cursor';
    }
    
    // 如果有Claude API密钥，使用claude-3-opus
    if (API_KEYS.CLAUDE) {
      logger.log('编程内容路由到: claude-3-opus (备选)');
      return 'claude-3-opus';
    }
    
    // 如果有GPT-4.1 API密钥，尝试使用GPT-4.1
    if (API_KEYS.OPENAI) {
      logger.log('编程内容路由到: gpt-4.1 (备选)');
      return 'gpt-4.1';
    }
    
    // 如果有Gemini API密钥，尝试使用Gemini
    if (API_KEYS.GEMINI) {
      logger.log('编程内容路由到: gemini-1.5-flash (备选)');
      return 'gemini-1.5-flash';
    }
    
    // 如果中文编程内容且有DeepSeek API密钥，使用DeepSeek-v3.1
    if (hasChinese && API_KEYS.DEEPSEEK) {
      logger.log('中文编程内容路由到: deepseek-v3.1');
      return 'deepseek-v3.1';
    }
  }
  
  // 中文内容其次
  if (hasChinese) {
    // 如果有Cursor API密钥，优先使用Cursor访问claude-3-7-sonnet
    if (API_KEYS.CURSOR) {
      logger.log('中文内容路由到: cursor (使用claude-3-7-sonnet通道)');
      return 'cursor';
    }
    
    // 如果有Gemini API密钥，使用Gemini
    if (API_KEYS.GEMINI) {
      logger.log('中文内容路由到: gemini-pro');
      return 'gemini-pro';
    }
    
    if (API_KEYS.DEEPSEEK) {
      logger.log('中文内容路由到: deepseek-v3.1');
      return 'deepseek-v3.1';
    }
  }
  
  // 默认路由规则
  if (content.includes('复杂') || 
      content.includes('详细') || 
      content.includes('深入') || 
      content.includes('创意') ||
      content.includes('写一篇') ||
      content.includes('代码生成') ||
      content.includes('代码问题') ||
      content.includes('编程') ||
      content.includes('开发') ||
      content.length > 1000) {
    
    // 如果有Cursor API密钥，优先使用Cursor访问claude-3-7-sonnet
    if (API_KEYS.CURSOR) {
      logger.log('复杂内容路由到: cursor (使用claude-3-7-sonnet通道)');
      return 'cursor';
    }
    
    logger.log('复杂内容路由到: claude-3-opus');
    return 'claude-3-opus';
  }
  
  if (content.includes('简要') || 
      content.includes('快速') || 
      content.includes('简单') ||
      content.length < 100) {
    logger.log('简单内容路由到: claude-3-haiku');
    return 'claude-3-haiku';
  }
  
  // 默认使用负载均衡
  logger.log('使用默认负载均衡');
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
  switch (modelConfig.provider) {
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
      throw new Error(`未知的提供商: ${modelConfig.provider}`);
  }
  
  // 检查是否有必要的API密钥(除了本地模型)
  if (modelConfig.provider !== 'ollama' && !apiKey) {
    throw new Error(`缺少${modelConfig.provider}的API密钥`);
  }
  
  // 准备请求
  const requestData = modelConfig.formatRequest(params);
  
  // 为Gemini模型添加API密钥作为URL查询参数
  let endpoint = modelConfig.endpoint;
  if (modelConfig.provider === 'gemini') {
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
  
  const headers = modelConfig.headers(apiKey);
  
  // 发送请求
  logger.log(`正在调用模型API: ${modelName}`);
  
  // 确定使用哪个endpoint
  const targetEndpoint = modelConfig.provider === 'gemini' ? endpoint : modelConfig.endpoint;
  
  const response = await axios.post(
    targetEndpoint,
    requestData,
    { headers }
  );
  
  // 解析响应
  return modelConfig.parseResponse(response);
}

// 带有fallback机制的模型调用
async function callModelWithFallback(params, customRoutingRules = []) {
  // 确定初始模型
  let selectedModel = params.model;
  
  // 如果没有指定模型，使用语义路由
  if (!selectedModel || !MODELS[selectedModel]) {
    selectedModel = routeBySemantics(params.messages, customRoutingRules);
    logger.log(`语义路由选择模型: ${selectedModel}`);
  }
  
  // 构建模型尝试顺序列表
  let modelOrder = [selectedModel];
  
  // 添加其他可用模型作为后备
  for (const model of Object.keys(MODELS)) {
    // 只添加权重大于0的模型作为后备
    if (!modelOrder.includes(model) && MODEL_WEIGHTS[model] > 0) {
      modelOrder.push(model);
    }
  }
  
  // 根据权重降序排序后备模型
  modelOrder = modelOrder.filter(model => MODEL_WEIGHTS[model] > 0);
  // 如果初始选择的模型权重为0但已经存在于列表中，保留它作为第一选择
  if (selectedModel && MODEL_WEIGHTS[selectedModel] === 0) {
    logger.log(`警告: 选择的模型 ${selectedModel} 权重为0，将被从后备列表中移除`);
    modelOrder = modelOrder.filter(model => model !== selectedModel);
  }
  
  // 尝试调用模型，如果失败则尝试下一个
  let lastError = null;
  for (const model of modelOrder) {
    try {
      // 检查是否有必要的API密钥
      if (MODELS[model].provider === 'anthropic' && !API_KEYS.CLAUDE) continue;
      if (MODELS[model].provider === 'openai' && !API_KEYS.OPENAI) continue;
      if (MODELS[model].provider === 'cursor' && !API_KEYS.CURSOR) continue;
      if (MODELS[model].provider === 'deepseek' && !API_KEYS.DEEPSEEK) continue;
      if (MODELS[model].provider === 'gemini' && !API_KEYS.GEMINI) continue;
      
      // 创建新的参数对象，避免修改原始对象
      const callParams = {...params};
      
      // 调用模型
      const result = await callModelAPI(model, callParams, API_KEYS);
      
      // 记录成功使用的模型
      logger.log(`成功使用模型: ${model}`);
      
      // 在响应中添加实际使用的模型信息
      if (result) {
        result._actual_model_used = model;
      }
      
      return result;
    } catch (error) {
      lastError = error;
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

// 设置中间件
app.use(express.json({ limit: '10mb' }));

// 健康检查接口
app.get('/health', (req, res) => {
  // 检查可用的模型和API密钥
  const availableModels = Object.keys(MODELS).filter(model => {
    const provider = MODELS[model].provider;
    if (provider === 'ollama') return true; // 假设Ollama总是可用的
    return API_KEYS[provider.toUpperCase()]; // 检查是否有API密钥
  });
  
  res.status(200).json({ 
    status: 'ok', 
    message: '高级模型代理服务器正常运行',
    available_models: availableModels,
    load_balancing: 'enabled',
    fallback: 'enabled',
    semantic_routing: 'enabled'
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
  try {
    // 从请求中获取参数
    const { model, messages, max_tokens, temperature, routing_rules } = req.body;
    
    // 验证必要参数
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: '请求格式错误', 
        message: '需要提供 messages 数组' 
      });
    }
    
    // 准备模型请求参数
    const modelParams = {
      model,
      messages,
      max_tokens: max_tokens || 1000,
      temperature: temperature || 0.7
    };
    
    // 处理claude-3-sonnet特殊情况
    if (modelParams.model === 'claude-3-sonnet') {
      logger.log('检测到请求使用claude-3-sonnet，自动转为claude-3-opus');
      modelParams.model = 'claude-3-opus';
    }
    
    // 补充参数处理：根据模型名称添加版本号
    if (modelParams.model) {
      // 确保使用完整模型ID
      if (modelParams.model === 'claude-3-7-sonnet') {
        modelParams.model = 'claude-3-7-sonnet-20250219';
      } else if (modelParams.model === 'claude-3-sonnet') {
        // 此分支应该不会执行，但为了安全起见
        modelParams.model = 'claude-3-opus-20240229';
      } else if (modelParams.model === 'claude-3-opus') {
        modelParams.model = 'claude-3-opus-20240229';
      } else if (modelParams.model === 'claude-3-haiku') {
        modelParams.model = 'claude-3-haiku-20240307';
      }
    }
    
    // 调用模型API（带有fallback机制）
    const result = await callModelWithFallback(modelParams, routing_rules);
    
    // 返回响应
    res.json(result);
    
  } catch (error) {
    logger.error(`处理请求时出错: ${error.message}`);
    
    // 如果有详细的错误响应，则返回
    if (error.response?.data) {
      return res.status(error.response.status || 500).json({
        error: '调用模型API失败',
        details: error.response.data
      });
    }
    
    // 否则返回一般错误
    res.status(500).json({ 
      error: '服务器错误', 
      message: `处理请求时出错: ${error.message}` 
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

// 启动服务器
app.listen(PORT, () => {
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