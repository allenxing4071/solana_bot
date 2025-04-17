// Claude API 代理测试脚本
// 测试与 Claude 代理服务器的通信
const axios = require('axios');

// 代理服务器配置
const PROXY_URL = 'http://localhost:3100'; // 确保与 .env 中的 CLAUDE_PROXY_PORT 一致

// 测试 Claude API 代理
async function testClaudeProxy() {
  try {
    console.log('开始测试 Claude 代理服务器...');
    
    // 首先测试健康检查接口
    console.log('测试 健康检查接口...');
    const healthResponse = await axios.get(`${PROXY_URL}/health`);
    console.log('健康检查响应:', healthResponse.data);
    
    // 然后测试 Claude API 接口
    console.log('\n测试 Claude API 接口...');
    const apiResponse = await axios.post(`${PROXY_URL}/api/claude`, {
      model: 'claude-3-opus-20240229',
      messages: [
        {
          role: 'user',
          content: '你好，请用中文回答：今天天气如何？'
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    // 输出 Claude 的回答
    if (apiResponse.data && apiResponse.data.content) {
      console.log('\nClaude API 响应:');
      console.log('模型:', apiResponse.data.model);
      console.log('内容:', apiResponse.data.content);
    } else {
      console.log('\nClaude API 响应格式异常:', apiResponse.data);
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    
    // 输出详细错误信息
    if (error.response?.status) {
      console.error('错误状态码:', error.response.status);
    }
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 执行测试
testClaudeProxy(); 