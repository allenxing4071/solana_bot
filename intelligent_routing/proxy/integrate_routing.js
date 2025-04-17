/**
 * 智能路由系统整合脚本
 * 
 * 此脚本展示如何将Llama3智能路由系统整合到现有的多模型代理中
 * 可通过修改claude_proxy.js或使用本脚本来实现整合
 */

const fs = require('node:fs');
const path = require('node:path');

// 需要修改的文件
const proxyFile = path.resolve(__dirname, 'claude_proxy.js');

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
const { integrateIntelligentRouting } = require('../api/integration');
`;

// 检查是否已经导入
if (!proxyContent.includes('integrateIntelligentRouting')) {
  // 在其他导入语句后添加
  proxyContent = proxyContent.replace(
    "const dotenv = require('dotenv');",
    "const dotenv = require('dotenv');" + importCode
  );
  
  console.log('✅ 已添加智能路由系统导入');
} else {
  console.log('⚠️ 智能路由系统导入已存在，跳过');
}

// 2. 初始化智能路由系统
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

// 检查是否已经初始化
if (!proxyContent.includes('integrateIntelligentRouting(')) {
  // 在应用创建后添加初始化代码
  const appCreationPattern = /const app = express\(\);[\s\S]*?const PORT =/;
  if (appCreationPattern.test(proxyContent)) {
    proxyContent = proxyContent.replace(
      appCreationPattern,
      (match) => match + initCode
    );
    console.log('✅ 已添加智能路由系统初始化代码');
  } else {
    console.error('⚠️ 无法找到添加初始化代码的位置');
  }
} else {
  console.log('⚠️ 智能路由系统已初始化，跳过');
}

// 3. 替换路由函数
const callModelWithFallbackPattern = /async function callModelWithFallback\(params, customRoutingRules = \[\]\) \{[\s\S]*?let modelToUse;[\s\S]*?if \(!params\.model\) \{[\s\S]*?(?:modelToUse = routeBySemantics\(params\.messages, customRoutingRules\);)[\s\S]*?\}/;

if (callModelWithFallbackPattern.test(proxyContent)) {
  proxyContent = proxyContent.replace(
    callModelWithFallbackPattern,
    (match) => {
      return match.replace(
        'modelToUse = routeBySemantics(params.messages, customRoutingRules);',
        `// 使用智能路由系统
modelToUse = await intelligentRoute(params.messages, { customRoutingRules });
logger.log(\`智能路由选择模型: \${modelToUse}\`);`
      );
    }
  );
  console.log('✅ 已替换路由函数');
} else {
  console.error('⚠️ 无法找到路由函数替换位置');
}

// 4. 添加反馈处理
const processCompletionPattern = /res\.json\(result\);[\s\S]*?\}\) \}/;
if (processCompletionPattern.test(proxyContent)) {
  proxyContent = proxyContent.replace(
    processCompletionPattern,
    (match) => {
      return match.replace(
        'res.json(result);',
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
    }
  );
  console.log('✅ 已添加反馈处理代码');
} else {
  console.error('⚠️ 无法找到添加反馈处理代码的位置');
}

// 保存到新文件，避免直接覆盖
const newFileName = proxyFile.replace('.js', '_with_routing.js');
fs.writeFileSync(newFileName, proxyContent, 'utf8');

console.log(`\n✅ 整合完成！已将修改保存到: ${path.basename(newFileName)}`);
console.log('请检查文件并测试整合效果。若满意，可将其重命名为 claude_proxy.js');
console.log('\n使用说明:');
console.log('1. 确保 intelligent_routing 系统已正确配置');
console.log('2. 启动代理服务器前先初始化智能路由数据库: cd .. && npm run init-db');
console.log('3. 启动整合后的代理服务器: node claude_proxy_with_routing.js');

// 退出
process.exit(0); 