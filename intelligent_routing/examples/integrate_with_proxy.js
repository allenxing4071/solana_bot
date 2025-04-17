/**
 * 智能路由系统集成示例
 * 展示如何将基于Llama3的智能路由系统集成到现有claude_proxy.js代理中
 */

// 以下是需要在claude_proxy.js中添加的代码片段

/**
 * 第1步：导入智能路由系统集成模块
 */
const { integrateIntelligentRouting } = require('../intelligent_routing/api/integration');

/**
 * 第2步：初始化智能路由系统
 * 在创建Express应用之后，初始化路由系统
 */
// 创建Express应用
const app = express();
// 设置常规Express中间件...

// 初始化智能路由系统
const { intelligentRoute, updateRouteResult, shutdown } = integrateIntelligentRouting(
  app,            // Express应用实例
  MODELS,         // 模型配置
  MODEL_STATUS,   // 模型状态
  MODEL_WEIGHTS,  // 模型权重
  routeBySemantics // 现有的语义路由函数
);

/**
 * 第3步：使用智能路由替代现有的路由函数
 * 修改模型路由逻辑，使用智能路由系统
 */
async function processChat(req, res) {
  const { messages, model, max_tokens, temperature, routing_rules } = req.body;
  
  try {
    // 如果指定了模型，直接使用
    if (model && MODELS[model]) {
      // ...使用指定的模型处理请求
    } else {
      // 使用智能路由系统选择模型
      // 注意：这将替代原有的 "routeBySemantics" 调用
      const startTime = Date.now();
      const selectedModel = await intelligentRoute(messages);
      logger.log(`智能路由选择模型: ${selectedModel}`);
      
      // 使用选择的模型调用API
      const apiResult = await callModelAPI(selectedModel, {
        messages,
        max_tokens,
        temperature
      });
      
      // 记录路由结果
      // 注意: 原始routeQuery会返回decisionId，存储在apiResult._routing_decision_id中
      if (apiResult._routing_decision_id) {
        const responseTime = Date.now() - startTime;
        await updateRouteResult(
          apiResult._routing_decision_id,
          selectedModel,
          !apiResult.error,
          responseTime
        );
      }
      
      // 返回响应
      // ...处理结果并返回给客户端
    }
  } catch (error) {
    // ...处理错误
  }
}

/**
 * 第4步：添加反馈按钮到响应页面
 * 在返回结果前添加反馈机制
 */
// 在响应中添加反馈按钮
function addFeedbackButtons(response, decisionId) {
  // 只有在有决策ID时才添加反馈机制
  if (!decisionId) return response;
  
  // 为简单起见，这里使用纯文本方式，实际应用中可使用HTML
  return {
    ...response,
    _feedback: {
      decision_id: decisionId,
      feedback_url: `/api/routing/feedback`
    },
    content: [
      ...response.content,
      {
        type: 'text',
        text: `\n\n---\n对这个回答满意吗？[提交反馈](/api/routing/feedback?id=${decisionId})`
      }
    ]
  };
}

/**
 * 第5步：在应用关闭时优雅退出
 * 确保系统所有组件正确关闭
 */
// 处理应用关闭
process.on('SIGINT', async () => {
  console.log('正在关闭高级模型代理服务器...');
  
  // 关闭智能路由系统
  await shutdown();
  
  // 关闭Express服务器
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

/**
 * 完整流程示例
 * 展示智能路由系统的完整工作流程
 */
async function exampleCompleteFlow() {
  // 用户发送请求
  const userQuery = "请帮我解释量子计算的基本原理";
  
  // 1. 路由决策
  const decision = await intelligentRoute([{ role: 'user', content: userQuery }]);
  console.log(`选择模型: ${decision.model} (置信度: ${decision.confidence}%)`);
  
  // 2. 调用模型API
  const startTime = Date.now();
  const apiResult = await callModelAPI(decision.model, {
    messages: [{ role: 'user', content: userQuery }],
    max_tokens: 500
  });
  const responseTime = Date.now() - startTime;
  
  // 3. 更新路由结果
  await updateRouteResult(decision.decisionId, decision.model, true, responseTime);
  
  // 4. 显示结果并收集反馈
  console.log("模型回复:", apiResult.content[0].text);
  
  // 5. 用户提交反馈
  const userRating = 5; // 假设用户给了5星评价
  await fetch('/api/routing/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      decisionId: decision.decisionId,
      rating: userRating,
      comments: "很准确的解释"
    })
  });
} 