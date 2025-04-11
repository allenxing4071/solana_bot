/**
 * API测试脚本
 * 用于测试黑白名单API功能
 */

// 使用fetch进行HTTP请求
const fetch = require('node-fetch');

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 测试代币信息
const testToken = {
  mint: '7KVn1SBRoTxEYKiCicKBcpBQvGTPLFBYQJTPqSfRfnLZ',
  symbol: 'TEST',
  name: 'Test Token',
  reason: '测试用途'
};

// 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * 发送HTTP请求并处理响应
 * @param {string} url 请求URL
 * @param {Object} options 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function sendRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`${colors.red}请求失败:${colors.reset}`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

/**
 * 测试健康检查API
 */
async function testHealthCheck() {
  console.log(`${colors.blue}测试健康检查API...${colors.reset}`);
  
  const { status, data } = await sendRequest(`${API_BASE_URL}/health`);
  
  if (status === 200 && data.status === 'ok') {
    console.log(`${colors.green}✓ 健康检查通过${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 健康检查失败${colors.reset}`, data);
  }
}

/**
 * 测试黑名单API
 */
async function testBlacklistAPI() {
  console.log(`\n${colors.blue}测试黑名单API...${colors.reset}`);
  
  // 1. 获取黑名单
  console.log(`${colors.yellow}1. 获取黑名单${colors.reset}`);
  let response = await sendRequest(`${API_BASE_URL}/tokens/blacklist`);
  console.log(`状态码: ${response.status}`);
  console.log(`黑名单数量: ${response.data.count || 0}`);
  
  // 2. 添加代币到黑名单
  console.log(`\n${colors.yellow}2. 添加代币到黑名单${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/blacklist`, {
    method: 'POST',
    body: JSON.stringify(testToken)
  });
  
  if (response.status === 201 || response.status === 200) {
    console.log(`${colors.green}✓ 代币添加到黑名单成功${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币添加到黑名单失败${colors.reset}`, response.data);
  }
  
  // 3. 再次获取黑名单确认添加成功
  console.log(`\n${colors.yellow}3. 验证黑名单添加${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/blacklist`);
  
  const blacklisted = response.data?.data?.some(token => token.mint === testToken.mint);
  if (blacklisted) {
    console.log(`${colors.green}✓ 代币在黑名单中找到${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币未在黑名单中找到${colors.reset}`);
  }
  
  // 4. 从黑名单删除代币
  console.log(`\n${colors.yellow}4. 从黑名单删除代币${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/blacklist/${testToken.mint}`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log(`${colors.green}✓ 代币从黑名单删除成功${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币从黑名单删除失败${colors.reset}`, response.data);
  }
}

/**
 * 测试白名单API
 */
async function testWhitelistAPI() {
  console.log(`\n${colors.blue}测试白名单API...${colors.reset}`);
  
  // 1. 获取白名单
  console.log(`${colors.yellow}1. 获取白名单${colors.reset}`);
  let response = await sendRequest(`${API_BASE_URL}/tokens/whitelist`);
  console.log(`状态码: ${response.status}`);
  console.log(`白名单数量: ${response.data.count || 0}`);
  
  // 对testToken做修改，添加trusted字段，不包含reason字段
  const trustedToken = {
    mint: testToken.mint,
    symbol: testToken.symbol,
    name: testToken.name,
    trusted: true
  };
  
  // 2. 添加代币到白名单
  console.log(`\n${colors.yellow}2. 添加代币到白名单${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/whitelist`, {
    method: 'POST',
    body: JSON.stringify(trustedToken)
  });
  
  if (response.status === 201 || response.status === 200) {
    console.log(`${colors.green}✓ 代币添加到白名单成功${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币添加到白名单失败${colors.reset}`, response.data);
  }
  
  // 3. 再次获取白名单确认添加成功
  console.log(`\n${colors.yellow}3. 验证白名单添加${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/whitelist`);
  
  const whitelisted = response.data?.data?.some(token => token.mint === trustedToken.mint);
  if (whitelisted) {
    console.log(`${colors.green}✓ 代币在白名单中找到${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币未在白名单中找到${colors.reset}`);
  }
  
  // 4. 从白名单删除代币
  console.log(`\n${colors.yellow}4. 从白名单删除代币${colors.reset}`);
  response = await sendRequest(`${API_BASE_URL}/tokens/whitelist/${trustedToken.mint}`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log(`${colors.green}✓ 代币从白名单删除成功${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ 代币从白名单删除失败${colors.reset}`, response.data);
  }
}

/**
 * 测试代币验证API
 */
async function testTokenValidation() {
  console.log(`\n${colors.blue}测试代币验证API...${colors.reset}`);
  
  // 1. 添加测试代币到黑名单
  console.log(`${colors.yellow}1. 先将测试代币添加到黑名单${colors.reset}`);
  await sendRequest(`${API_BASE_URL}/tokens/blacklist`, {
    method: 'POST',
    body: JSON.stringify(testToken)
  });
  
  // 2. 验证代币状态
  console.log(`\n${colors.yellow}2. 验证黑名单中的代币${colors.reset}`);
  const response = await sendRequest(`${API_BASE_URL}/tokens/validate/${testToken.mint}`);
  
  if (response.status === 200) {
    console.log(`状态码: ${response.status}`);
    console.log(`验证结果: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.data.isBlacklisted) {
      console.log(`${colors.green}✓ 代币正确识别为黑名单${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ 代币未被识别为黑名单${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ 代币验证请求失败${colors.reset}`, response.data);
  }
  
  // 3. 从黑名单中删除测试代币
  console.log(`\n${colors.yellow}3. 清理 - 从黑名单删除测试代币${colors.reset}`);
  await sendRequest(`${API_BASE_URL}/tokens/blacklist/${testToken.mint}`, {
    method: 'DELETE'
  });
}

/**
 * 运行所有测试
 */
async function runTests() {
  console.log(`${colors.blue}======== API 测试开始 ========${colors.reset}`);
  
  try {
    await testHealthCheck();
    await testBlacklistAPI();
    await testWhitelistAPI();
    await testTokenValidation();
    
    console.log(`\n${colors.green}======== 所有测试完成 ========${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}测试过程中出错:${colors.reset}`, error);
  }
}

// 执行测试
runTests(); 