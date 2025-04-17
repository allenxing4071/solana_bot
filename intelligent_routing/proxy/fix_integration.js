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
const importCode = '\n// 导入智能路由系统\nconst { integrateIntelligentRouting } = require(\'../api/integration\');';

// 在dotenv引入后添加导入代码
proxyContent = proxyContent.replace(
  "const dotenv = require('dotenv');",
  "const dotenv = require('dotenv');" + importCode
);

console.log('✅ 已添加智能路由系统导入');

// 找到MODELS和MODEL_STATUS定义
const modelsMatch = proxyContent.match(/const MODELS = {[\s\S]*?};/);
const modelStatusMatch = proxyContent.match(/const MODEL_STATUS = {[\s\S]*?};/);
const modelWeightsMatch = proxyContent.match(/const MODEL_WEIGHTS = {[\s\S]*?};/);

if (!modelsMatch || !modelStatusMatch || !modelWeightsMatch) {
  console.error('❌ 无法找到模型配置');
  process.exit(1);
}

console.log('✅ 已找到模型配置');

// 3. 在服务器创建之前添加智能路由初始化
// 先检查是否有app.listen调用
if (!proxyContent.includes('app.listen(PORT')) {
  console.error('❌ 无法找到服务器启动代码');
  process.exit(1);
}

const serverStartCode = 'const server = app.listen(PORT';
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

// 尝试不同的方式替换
if (proxyContent.includes(serverStartCode)) {
  proxyContent = proxyContent.replace(
    serverStartCode,
    initCode + serverStartCode
  );
  console.log('✅ 已添加智能路由系统初始化代码');
} else {
  // 尝试另一种模式
  const appListen = proxyContent.match(/app\.listen\(PORT[^;]*;/);
  if (appListen) {
    const replacement = `// 初始化智能路由系统
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

const server = ${appListen[0]}`;
    
    proxyContent = proxyContent.replace(appListen[0], replacement);
    console.log('✅ 已通过替代方式添加智能路由系统初始化代码');
  } else {
    console.error('❌ 无法找到应用服务器启动代码');
    process.exit(1);
  }
}

// 4. 修改路由函数
const callModelPattern = /async function callModelWithFallback\(params, customRoutingRules = \[\]\) {[\s\S]*?let modelToUse;[\s\S]*?if \(!params\.model\) {/;
const modelSelectionPattern = /modelToUse = routeBySemantics\(params\.messages, customRoutingRules\);/;

// 找到路由代码块
const callModelMatch = proxyContent.match(callModelPattern);
if (!callModelMatch) {
  console.error('❌ 无法找到模型调用函数，尝试使用更宽松的匹配方式');
  
  // 尝试更宽松的匹配方式
  const alternativePattern = /async function callModelWithFallback[\s\S]*?routeBySemantics\(params\.messages/;
  const altMatch = proxyContent.match(alternativePattern);
  
  if (!altMatch) {
    console.error('❌ 仍然无法找到模型调用函数');
    process.exit(1);
  }
  
  console.log('✅ 使用替代方式找到模型调用函数');
  // 直接替换routeBySemantics调用
  proxyContent = proxyContent.replace(
    /routeBySemantics\(params\.messages, customRoutingRules\)/,
    'await intelligentRoute(params.messages, { customRoutingRules })'
  );
  console.log('✅ 已替换路由函数');
} else {
  // 修改模型选择逻辑
  let callModelBlock = callModelMatch[0];
  if (modelSelectionPattern.test(callModelBlock)) {
    callModelBlock = callModelBlock.replace(
      modelSelectionPattern,
      '// 使用智能路由系统\n      modelToUse = await intelligentRoute(params.messages, { customRoutingRules });\n      logger.log(`智能路由选择模型: ${modelToUse}`);'
    );
    
    // 更新到主内容中
    proxyContent = proxyContent.replace(callModelMatch[0], callModelBlock);
    console.log('✅ 已替换路由函数');
  } else {
    console.error('❌ 无法找到模型选择代码');
  }
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
      '// 如果使用了智能路由，将决策ID添加到响应中\n      if (result._routing_decision_id) {\n        // 添加反馈机制\n        result._feedback = {\n          decision_id: result._routing_decision_id,\n          feedback_url: \'/api/routing/feedback\'\n        };\n      }\n      res.json(result);'
    );
    
    // 更新到主内容中
    proxyContent = proxyContent.replace(apiResponseMatch[0], apiResponseBlock);
    console.log('✅ 已添加反馈处理代码');
  } else {
    console.error('❌ 无法找到响应JSON代码，尝试使用替代匹配方式');
    
    // 尝试直接查找和替换res.json(result)
    if (proxyContent.includes('res.json(result);')) {
      proxyContent = proxyContent.replace(
        'res.json(result);',
        '// 如果使用了智能路由，将决策ID添加到响应中\n      if (result._routing_decision_id) {\n        // 添加反馈机制\n        result._feedback = {\n          decision_id: result._routing_decision_id,\n          feedback_url: \'/api/routing/feedback\'\n        };\n      }\n      res.json(result);'
      );
      console.log('✅ 已通过替代方式添加反馈处理代码');
    } else {
      console.error('❌ 仍然无法找到响应JSON代码');
    }
  }
} else {
  console.error('❌ 无法找到API响应处理代码，尝试使用替代匹配方式');
  
  // 尝试直接查找和替换res.json(result)
  if (proxyContent.includes('res.json(result);')) {
    proxyContent = proxyContent.replace(
      'res.json(result);',
      '// 如果使用了智能路由，将决策ID添加到响应中\n      if (result._routing_decision_id) {\n        // 添加反馈机制\n        result._feedback = {\n          decision_id: result._routing_decision_id,\n          feedback_url: \'/api/routing/feedback\'\n        };\n      }\n      res.json(result);'
    );
    console.log('✅ 已通过替代方式添加反馈处理代码');
  } else {
    console.error('❌ 仍然无法找到API响应处理代码');
  }
}

// 保存到新文件
fs.writeFileSync(outputFile, proxyContent, 'utf8');

console.log(`\n✅ 整合完成！已将修改保存到: ${path.basename(outputFile)}`);
console.log('请检查文件并测试整合效果。');
console.log('\n使用说明:');
console.log('1. 确保 intelligent_routing 系统已正确配置');
console.log('2. 启动整合后的代理服务器: node claude_proxy_intelligent_routing.js'); 