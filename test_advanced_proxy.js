// 高级模型代理测试脚本
// 测试负载均衡、fallback和语义路由功能
const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');

// 代理服务器配置
const PROXY_URL = 'http://localhost:3100'; // 确保与 .env 中的 CLAUDE_PROXY_PORT 一致

// 创建结果目录
const resultsDir = path.join(__dirname, 'test_results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// 保存测试结果到文件
function saveResult(testName, data) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = path.join(resultsDir, `${testName}_${timestamp}.json`);
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`结果已保存到: ${filename}`);
}

// 测试健康检查接口
async function testHealth() {
  try {
    console.log('\n测试 健康检查接口...');
    const response = await axios.get(`${PROXY_URL}/health`);
    console.log('健康检查响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('健康检查失败:', error.message);
    throw error;
  }
}

// 测试获取可用模型列表
async function testModels() {
  try {
    console.log('\n测试 模型列表接口...');
    const response = await axios.get(`${PROXY_URL}/models`);
    console.log('可用模型:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取模型列表失败:', error.message);
    throw error;
  }
}

// 测试负载均衡功能
async function testLoadBalancing() {
  try {
    console.log('\n测试 负载均衡功能...');
    const results = [];
    
    // 发送多个请求，观察模型选择情况
    for (let i = 0; i < 5; i++) {
      console.log(`发送请求 ${i+1}/5...`);
      const response = await axios.post(`${PROXY_URL}/api/chat`, {
        messages: [
          {
            role: 'user',
            content: '写一个简短的问候语'
          }
        ]
      });
      
      results.push({
        request_number: i+1,
        model_used: response.data._actual_model_used || '未知',
        content_preview: `${JSON.stringify(response.data.content).substring(0, 100)}...`
      });
      
      console.log(`请求 ${i+1} 使用模型: ${response.data._actual_model_used || '未知'}`);
      
      // 等待一秒再发送下一个请求
      if (i < 4) await new Promise(r => setTimeout(r, 1000));
    }
    
    saveResult('load_balancing_test', results);
    return results;
  } catch (error) {
    console.error('负载均衡测试失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 测试语义路由功能
async function testSemanticRouting() {
  try {
    console.log('\n测试 语义路由功能...');
    const testCases = [
      {
        description: '简单问题 (应该路由到快速模型)',
        message: '今天天气怎么样？'
      },
      {
        description: '复杂分析 (应该路由到高级模型)',
        message: '请对中国和美国的经济政策进行深入分析，比较它们在全球经济中的影响和未来发展趋势。'
      },
      {
        description: '创意写作 (应该路由到高级模型)',
        message: '写一篇关于未来太空旅行的科幻小说开头，要有创意和想象力。'
      },
      {
        description: '代码生成 (应该路由到高级模型)',
        message: '请用React写一个复杂的带分页和搜索功能的表格组件。'
      }
    ];
    
    const results = [];
    
    for (const [index, testCase] of testCases.entries()) {
      console.log(`测试用例 ${index+1}/${testCases.length}: ${testCase.description}`);
      const response = await axios.post(`${PROXY_URL}/api/chat`, {
        messages: [
          {
            role: 'user',
            content: testCase.message
          }
        ]
      });
      
      results.push({
        test_case: testCase.description,
        message: testCase.message,
        model_used: response.data._actual_model_used || '未知',
        content_preview: `${JSON.stringify(response.data.content).substring(0, 100)}...`
      });
      
      console.log(`测试用例 ${index+1} 使用模型: ${response.data._actual_model_used || '未知'}`);
      
      // 等待一秒再发送下一个请求
      if (index < testCases.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
    
    saveResult('semantic_routing_test', results);
    return results;
  } catch (error) {
    console.error('语义路由测试失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 测试指定模型
async function testSpecificModel(modelName) {
  try {
    console.log(`\n测试 指定模型: ${modelName}...`);
    
    const response = await axios.post(`${PROXY_URL}/api/chat`, {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: '你是什么模型？请简短回答。'
        }
      ]
    });
    
    console.log(`模型 ${modelName} 响应:`);
    console.log('实际使用模型:', response.data._actual_model_used || modelName);
    console.log('内容:', JSON.stringify(response.data.content));
    
    return {
      requested_model: modelName,
      actual_model: response.data._actual_model_used || modelName,
      content: response.data.content
    };
  } catch (error) {
    console.error(`测试模型 ${modelName} 失败:`, error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 测试自定义路由规则
async function testCustomRouting() {
  try {
    console.log('\n测试 自定义路由规则...');
    
    const response = await axios.post(`${PROXY_URL}/api/chat`, {
      messages: [
        {
          role: 'user',
          content: '这是一个路由测试问题'
        }
      ],
      routing_rules: [
        {
          pattern: '路由测试',
          model: 'claude-3-haiku'
        }
      ]
    });
    
    console.log('自定义路由测试响应:');
    console.log('使用模型:', response.data._actual_model_used || '未知');
    console.log('内容:', JSON.stringify(response.data.content));
    
    return {
      routing_rule: '路由测试 -> claude-3-haiku',
      actual_model: response.data._actual_model_used || '未知',
      content: response.data.content
    };
  } catch (error) {
    console.error('自定义路由测试失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 测试设置模型权重
async function testSetWeights() {
  try {
    console.log('\n测试 设置模型权重...');
    
    // 获取当前权重
    console.log('获取当前模型列表和权重...');
    const beforeModels = await axios.get(`${PROXY_URL}/models`);
    console.log('当前模型权重:', beforeModels.data);
    
    // 设置新的权重
    console.log('设置新的模型权重...');
    const newWeights = {
      'claude-3-haiku': 100,  // 提高haiku的权重
      'claude-3-sonnet': 0,   // 降低sonnet的权重
      'claude-3-opus': 0      // 降低opus的权重
    };
    
    const updateResponse = await axios.post(`${PROXY_URL}/api/config/weights`, newWeights);
    console.log('更新权重响应:', updateResponse.data);
    
    // 获取更新后的权重
    console.log('获取更新后的模型列表和权重...');
    const afterModels = await axios.get(`${PROXY_URL}/models`);
    console.log('更新后模型权重:', afterModels.data);
    
    // 测试负载均衡效果
    console.log('测试更新权重后的负载均衡效果...');
    const results = [];
    
    for (let i = 0; i < 3; i++) {
      console.log(`发送请求 ${i+1}/3...`);
      const response = await axios.post(`${PROXY_URL}/api/chat`, {
        messages: [
          {
            role: 'user',
            content: '简单问候'
          }
        ]
      });
      
      results.push({
        request_number: i+1,
        model_used: response.data._actual_model_used || '未知'
      });
      
      console.log(`请求 ${i+1} 使用模型: ${response.data._actual_model_used || '未知'}`);
      
      // 等待一秒再发送下一个请求
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    }
    
    // 恢复原始权重
    console.log('恢复原始模型权重...');
    const originalWeights = {
      'claude-3-opus': 20,
      'claude-3-sonnet': 30,
      'claude-3-haiku': 40
    };
    
    await axios.post(`${PROXY_URL}/api/config/weights`, originalWeights);
    
    return {
      before_weights: beforeModels.data,
      new_weights: newWeights,
      after_weights: afterModels.data,
      test_results: results
    };
  } catch (error) {
    console.error('设置权重测试失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
    throw error;
  }
}

// 主测试函数
async function runTests() {
  try {
    console.log('开始测试高级模型代理服务器...');
    
    // 运行所有测试
    const healthResult = await testHealth();
    const modelsResult = await testModels();
    
    // 根据可用模型决定后续测试
    const availableModels = modelsResult.models.map(m => m.name);
    
    // 只有当至少有一个Claude模型可用时，才进行后续测试
    if (availableModels.some(m => m.startsWith('claude'))) {
      // 基本功能测试
      const loadBalancingResults = await testLoadBalancing();
      const semanticRoutingResults = await testSemanticRouting();
      
      // 特定功能测试
      if (availableModels.includes('claude-3-haiku')) {
        await testSpecificModel('claude-3-haiku');
      }
      
      await testCustomRouting();
      await testSetWeights();
    } else {
      console.log('没有可用的Claude模型，跳过后续测试');
    }
    
    console.log('\n所有测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 执行测试
runTests(); 