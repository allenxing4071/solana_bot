# Solana MEV Bot API 服务器

## 📖 概述

API服务器为Solana MEV机器人提供了一套完整的HTTP接口，用于管理代币的黑名单和白名单。它可以**独立于主要的MEV机器人运行**，使用文件持久化存储黑白名单数据，便于集成到其他系统或前端应用。

## 🌟 功能特点

```
┌─────────────────────────────┐
│       API服务器核心功能       │
├─────────────┬───────────────┤
│ 黑名单管理    │ 获取/添加/删除  │
├─────────────┼───────────────┤
│ 白名单管理    │ 获取/添加/删除  │
├─────────────┼───────────────┤
│ 代币验证     │ 查询安全状态    │
├─────────────┼───────────────┤
│ 健康检查      │ 服务器状态监控  │
├─────────────┼───────────────┤
│ 错误处理      │ 标准化错误响应  │
├─────────────┼───────────────┤
│ 日志记录      │ 操作追踪       │
├─────────────┼───────────────┤
│ CORS支持     │ 跨域资源共享    │
└─────────────┴───────────────┘
```

## 🔧 安装和配置

API服务器是Solana MEV Bot的一部分，在安装Bot的同时已经安装。

### 环境配置

1. 在`.env`文件中设置以下变量：
```
API_PORT=3000            # API服务器端口 (默认: 3000)
ENABLE_API_SERVER=true   # 是否启用API服务器
```

### 文件路径配置

确认黑名单和白名单文件路径配置正确（在`appConfig`中）：
```javascript
security: {
  tokenValidation: {
    blacklistPath: './config/blacklist.json',
    whitelistPath: './config/whitelist.json'
  }
}
```

## 🚀 启动服务器

### 作为独立服务启动

```bash
# 使用NPM脚本启动
npm run api:only

# 或直接使用Node启动
node start_api_server.js
```

### 随MEV Bot一起启动

只需在启动MEV Bot时确保`.env`文件中的`ENABLE_API_SERVER=true`即可：

```bash
npm run start
```

## 📚 API端点

### 系统接口

#### 健康检查

- **GET /api/health**
  - 描述: 检查API服务器是否正常运行
  - 响应: `{"status": "ok", "timestamp": "2023-07-01T12:00:00.000Z"}`

### 黑名单管理

#### 获取黑名单

- **GET /api/tokens/blacklist**
  - 描述: 获取所有黑名单代币
  - 响应: 
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "mint": "ExampleBadToken111111111111111111111111111",
        "symbol": "SCAM",
        "name": "Scam Token Example",
        "reason": "已知诈骗项目"
      }
    ]
  }
  ```

#### 添加到黑名单

- **POST /api/tokens/blacklist**
  - 描述: 添加代币到黑名单
  - 请求体: 
  ```json
  {
    "mint": "ExampleBadToken111111111111111111111111111",
    "symbol": "SCAM",
    "name": "Scam Token Example",
    "reason": "已知诈骗项目"
  }
  ```
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已成功添加到黑名单",
    "data": {
      "mint": "ExampleBadToken111111111111111111111111111",
      "symbol": "SCAM", 
      "name": "Scam Token Example",
      "reason": "已知诈骗项目"
    }
  }
  ```

#### 从黑名单删除

- **DELETE /api/tokens/blacklist/:mint**
  - 描述: 从黑名单移除代币
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已从黑名单中移除",
    "data": {"mint": "ExampleBadToken111111111111111111111111111"}
  }
  ```

### 白名单管理

#### 获取白名单

- **GET /api/tokens/whitelist**
  - 描述: 获取所有白名单代币
  - 响应: 
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "mint": "ExampleGoodToken22222222222222222222222",
        "symbol": "GOOD",
        "name": "Good Token Example",
        "trusted": true
      }
    ]
  }
  ```

#### 添加到白名单

- **POST /api/tokens/whitelist**
  - 描述: 添加代币到白名单
  - 请求体: 
  ```json
  {
    "mint": "ExampleGoodToken22222222222222222222222",
    "symbol": "GOOD",
    "name": "Good Token Example",
    "trusted": true
  }
  ```
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已成功添加到白名单",
    "data": {
      "mint": "ExampleGoodToken22222222222222222222222",
      "symbol": "GOOD",
      "name": "Good Token Example",
      "trusted": true
    }
  }
  ```

#### 从白名单删除

- **DELETE /api/tokens/whitelist/:mint**
  - 描述: 从白名单移除代币
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "message": "代币已从白名单中移除",
    "data": {"mint": "ExampleGoodToken22222222222222222222222"}
  }
  ```

### 代币验证

- **GET /api/tokens/validate/:mint**
  - 描述: 验证代币安全状态
  - 参数: `mint` - 代币Mint地址
  - 响应: 
  ```json
  {
    "success": true,
    "mint": "ExampleBadToken111111111111111111111111111",
    "isWhitelisted": false,
    "isBlacklisted": true,
    "reason": "已知诈骗项目"
  }
  ```

## 🧪 测试

我们提供了一个测试脚本来测试API的功能：

```bash
# 运行API测试脚本
npm run test:api
```

该脚本会测试以下功能：
1. 健康检查
2. 黑名单操作（获取、添加、验证、删除）
3. 白名单操作（获取、添加、验证、删除）
4. 代币验证

## 📋 实用示例

### 使用curl测试API

#### 1. 检查API服务器状态

```bash
curl http://localhost:3000/api/health
```

#### 2. 获取所有黑名单代币

```bash
curl http://localhost:3000/api/tokens/blacklist
```

#### 3. 添加代币到黑名单

```bash
curl -X POST http://localhost:3000/api/tokens/blacklist \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "ExampleBadToken111111111111111111111111111",
    "symbol": "SCAM",
    "name": "Scam Token Example",
    "reason": "已知诈骗项目"
  }'
```

#### 4. 验证代币状态

```bash
curl http://localhost:3000/api/tokens/validate/ExampleBadToken111111111111111111111111111
```

### 使用Node.js调用API

```javascript
// 获取黑名单示例
async function getBlacklist() {
  const response = await fetch('http://localhost:3000/api/tokens/blacklist');
  const data = await response.json();
  console.log(`发现${data.count}个黑名单代币:`);
  console.log(data.data);
}

// 添加代币到白名单示例
async function addToWhitelist(tokenInfo) {
  const response = await fetch('http://localhost:3000/api/tokens/whitelist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tokenInfo)
  });
  const data = await response.json();
  console.log(data.message);
}
```

## 🔒 安全注意事项

1. **身份验证**: API服务器默认不进行身份验证，如需在生产环境使用，请添加适当的身份验证机制：
   - 可考虑添加JWT认证
   - 实现API密钥机制
   - 使用OAuth2授权

2. **HTTPS加密**: 生产环境应使用HTTPS保护API通信安全

3. **访问控制**: 限制API的访问IP，特别是在公共网络环境

4. **代理保护**: 在敏感环境中使用代理或API网关保护API服务器

5. **输入验证**: 所有API输入都应进行严格验证，特别是代币地址格式

## 📊 API架构图

```
┌─────────────────┐       ┌─────────────────┐
│                 │       │                 │
│   客户端应用     │◄─────►│   API 服务器    │
│  (前端/脚本)     │       │                 │
│                 │       └────────┬────────┘
└─────────────────┘                │
                                   │
                           ┌───────▼───────┐
                           │               │
                           │  文件存储系统  │
                           │               │
                           └───────┬───────┘
                                   │
                           ┌───────▼───────┐
                           │               │
                           │   MEV 机器人   │
                           │               │
                           └───────────────┘
```

## 📝 日志

所有API请求和错误都会记录在日志系统中，可通过以下方式查看日志：

```bash
# 查看最新的API服务器日志
tail -f logs/api.log
```

## ❓ 常见问题

1. **Q: API服务器无法启动，显示"端口已被占用"**
   
   A: 检查是否有其他程序使用了配置的端口，或在`.env`中修改`API_PORT`设置

2. **Q: 添加到黑/白名单后，MEV Bot没有立即响应**
   
   A: MEV Bot会定期重新加载黑白名单配置，您也可以重启Bot使更改立即生效

3. **Q: 如何在程序中使用API验证代币安全性?**
   
   A: 可以在交易前调用`/api/tokens/validate/:mint`端点来检查代币是否在黑名单中

4. **Q: 文件存储在哪里?**
   
   A: 黑白名单文件默认存储在`./config/`目录中，可在配置文件中修改路径

## 📞 支持与反馈

如有问题或需要支持，请通过以下方式联系我们：
- 提交Issue
- 发送电子邮件至support@example.com

## 📅 更新日志

- **1.0.0** (2023-07-01): 初始版本发布
- **1.1.0** (2023-08-15): 添加了代币验证API
- **1.2.0** (2023-09-30): 改进了错误处理和日志记录
- **1.3.0** (2023-11-15): 增加了更多请求示例和API架构图
- **2.0.0** (2024-04-01): 重构API服务器，支持独立运行，更好的错误处理和文档 