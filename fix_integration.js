/**
 * 修复智能路由系统集成脚本
 * 
 * 这个脚本会手动修复智能路由系统的集成问题
 */

const fs = require('node:fs');
const path = require('node:path');

// 需要修改的文件
const proxyFile = path.resolve(__dirname, 'claude_proxy.js');
const outputFile = path.resolve(__dirname, 'claude_proxy_intelligent_routing.js');

// 确保文件存在
if (!fs.existsSync(proxyFile)) {
  console.error(`错误: 找不到文件 ${proxyFile}`);
  process.exit(1);
}

// 读取文件内容
let proxyContent = fs.readFileSync(proxyFile, 'utf8');

// 1. 添加智能路由系统的导入
const importCode = `
// 导入智能路由系统
const { integrateIntelligentRouting } = require('../api/integration');`;

// 在dotenv引入后添加导入代码
proxyContent = proxyContent.replace(
  "const dotenv = require('dotenv');",
  "const dotenv = require('dotenv');" + importCode
);

console.log('✅ 已添加智能路由系统导入');

// 2. 查找变量定义的位置
const appCreationMatch = proxyContent.match(/const app = express\(\);[\s\S]*?const server = app\.listen\(PORT/);
if (!appCreationMatch) {
  console.error('❌ 无法找到应用创建和服务器启动代码');
  process.exit(1);
}

// 找到MODELS和MODEL_STATUS定义
let modelsMatch = proxyContent.match(/const MODELS = {[\s\S]*?};/);
let modelStatusMatch = proxyContent.match(/const MODEL_STATUS = {[\s\S]*?};/);
let modelWeightsMatch = proxyContent.match(/const MODEL_WEIGHTS = {[\s\S]*?};/);

if (!modelsMatch || !modelStatusMatch || !modelWeightsMatch) {
  console.error('❌ 无法找到模型配置');
  process.exit(1);
}

// 3. 在服务器创建之前添加智能路由初始化
const serverStartCode = `const server = app.listen(PORT`;
const initCode = `
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
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

`;

proxyContent = proxyContent.replace(
  serverStartCode,
  initCode + serverStartCode
);

console.log('✅ 已添加智能路由系统初始化代码');

// 4. 修改路由函数
const callModelPattern = /async function callModelWithFallback\(params, customRoutingRules = \[\]\) {[\s\S]*?let modelToUse;[\s\S]*?if \(!params\.model\) {/;
const modelSelectionPattern = /modelToUse = routeBySemantics\(params\.messages, customRoutingRules\);/;

// 找到路由代码块
const callModelMatch = proxyContent.match(callModelPattern);
if (!callModelMatch) {
  console.error('❌ 无法找到模型调用函数');
  process.exit(1);
}

// 修改模型选择逻辑
let callModelBlock = callModelMatch[0];
if (modelSelectionPattern.test(callModelBlock)) {
  callModelBlock = callModelBlock.replace(
    modelSelectionPattern,
    `// 使用智能路由系统
      modelToUse = await intelligentRoute(params.messages, { customRoutingRules });
      logger.log(\`智能路由选择模型: \${modelToUse}\`);`
  );
  
  // 更新到主内容中
  proxyContent = proxyContent.replace(callModelMatch[0], callModelBlock);
  console.log('✅ 已替换路由函数');
} else {
  console.error('❌ 无法找到模型选择代码');
}

// 5. 添加反馈处理逻辑
const apiResponsePattern = /app\.post\(['"]\/v1\/chat\/completions['"][\s\S]*?try {[\s\S]*?const result = await completionWithRetries[\s\S]*?res\.json\(result\);/;
const resJsonPattern = /res\.json\(result\);/;

const apiResponseMatch = proxyContent.match(apiResponsePattern);
if (apiResponseMatch) {
  let apiResponseBlock = apiResponseMatch[0];
  
  // 添加反馈代码
  if (resJsonPattern.test(apiResponseBlock)) {
    apiResponseBlock = apiResponseBlock.replace(
      resJsonPattern,
      `// 如果使用了智能路由，将决策ID添加到响应中
      if (result._routing_decision_id) {
        // 添加反馈机制
        result._feedback = {
          decision_id: result._routing_decision_id,
          feedback_url: '/api/routing/feedback'
        };
      }
      res.json(result);`
    );
    
    // 更新到主内容中
    proxyContent = proxyContent.replace(apiResponseMatch[0], apiResponseBlock);
    console.log('✅ 已添加反馈处理代码');
  } else {
    console.error('❌ 无法找到响应JSON代码');
  }
} else {
  console.error('❌ 无法找到API响应处理代码');
}

// 保存到新文件
fs.writeFileSync(outputFile, proxyContent, 'utf8');

console.log(`\n✅ 整合完成！已将修改保存到: ${path.basename(outputFile)}`);
console.log('请检查文件并测试整合效果。');
console.log('\n使用说明:');
console.log('1. 确保 intelligent_routing 系统已正确配置');
console.log('2. 启动整合后的代理服务器: node claude_proxy_intelligent_routing.js'); 