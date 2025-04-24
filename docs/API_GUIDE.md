# Solana MEV 机器人 API 开发指南

## API 概述

Solana MEV 机器人 API 提供了一系列接口，用于管理和监控机器人的运行状态、配置黑白名单、查询交易数据等。API 服务器可以独立运行，也可以作为主程序的一部分启动。

## API 服务器

### 特性
- RESTful API 设计
- JSON 数据格式
- 支持跨域请求(CORS)
- 完整的错误处理
- 文件持久化存储

### 启动方式

**独立启动**:
```bash
npm run api:only
```

**随主程序启动**:
```bash
npm run start
```

## API 端点

### 系统状态

#### 获取系统状态
```
GET /api/system/status
```

**响应示例**:
```json
{
  "status": "running",
  "uptime": "2d 5h 30m",
  "version": "1.2.0",
  "memoryUsage": {
    "rss": "156MB",
    "heapTotal": "64MB",
    "heapUsed": "48MB"
  }
}
```

### 代币管理

#### 获取代币黑名单
```
GET /api/tokens/blacklist
```

**响应示例**:
```json
{
  "blacklist": [
    {
      "address": "TokenAddress123",
      "symbol": "SCAM",
      "name": "ScamToken",
      "reason": "Honeypot",
      "addedAt": "2023-12-01T12:00:00Z"
    }
  ]
}
```

#### 添加代币到黑名单
```
POST /api/tokens/blacklist
```

**请求体**:
```json
{
  "address": "TokenAddress456",
  "symbol": "FAKE",
  "name": "FakeToken",
  "reason": "Rugpull risk"
}
```

#### 从黑名单移除代币
```
DELETE /api/tokens/blacklist/:address
```

#### 获取代币白名单
```
GET /api/tokens/whitelist
```

#### 添加代币到白名单
```
POST /api/tokens/whitelist
```

**请求体**:
```json
{
  "address": "TokenAddress789",
  "symbol": "GOOD",
  "name": "GoodToken",
  "reason": "Verified project"
}
```

#### 从白名单移除代币
```
DELETE /api/tokens/whitelist/:address
```

### 性能监控

#### 获取内存使用统计
```
GET /api/memory_stats.json
```

**响应示例**:
```json
{
  "rss": 156000000,
  "heapTotal": 64000000,
  "heapUsed": 48000000,
  "external": 12000000,
  "timestamp": "2023-12-01T12:00:00Z"
}
```

#### 获取交易列表
```
GET /api/transactions
```

**查询参数**:
- `limit`: 返回结果数量限制 (默认: 20)
- `offset`: 结果偏移量 (默认: 0)
- `status`: 交易状态过滤 (可选: "pending", "success", "failed")

**响应示例**:
```json
{
  "transactions": [
    {
      "id": "tx123",
      "tokenAddress": "TokenAddress123",
      "tokenSymbol": "SOL",
      "amount": "1.5",
      "type": "buy",
      "status": "success",
      "timestamp": "2023-12-01T12:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

## 错误处理

API 使用标准的 HTTP 状态码表示请求结果:

- `200 OK`: 请求成功
- `400 Bad Request`: 请求参数错误
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器错误

错误响应格式:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "详细错误信息"
  }
}
```

## 代码规范

### 注释规范

为保持代码的一致性和可维护性，请遵循以下注释规范:

#### 文件头注释
```typescript
/**
 * @file 文件名
 * @description 文件功能描述
 * @author 作者
 * @date 创建日期
 * @version 版本号
 */
```

#### 类注释
```typescript
/**
 * @class 类名
 * @description 类的功能描述
 * @example
 * ```typescript
 * const instance = new ClassName();
 * instance.method();
 * ```
 */
```

#### 方法注释
```typescript
/**
 * @method 方法名
 * @description 方法功能描述
 * @param {参数类型} 参数名 - 参数描述
 * @returns {返回类型} - 返回值描述
 * @throws {错误类型} - 可能抛出的错误
 */
```

### API 开发最佳实践

1. **版本控制**
   - 在URL中使用版本号 (例如: `/api/v1/resource`)
   - 主要版本变更时增加版本号

2. **安全考虑**
   - 使用HTTPS
   - 实现适当的访问控制
   - 验证所有输入数据
   - 限制请求频率

3. **性能优化**
   - 使用数据缓存
   - 分页返回大量数据
   - 压缩响应数据
   - 使用异步处理长时间运行的任务

4. **文档维护**
   - 保持API文档更新
   - 包含请求和响应示例
   - 说明所有参数和返回值

## 错误代码参考

| 错误代码          | 描述                     | HTTP状态码 |
|------------------|--------------------------|------------|
| INVALID_PARAM    | 请求参数无效              | 400        |
| NOT_FOUND        | 资源不存在                | 404        |
| UNAUTHORIZED     | 未授权访问                | 401        |
| INTERNAL_ERROR   | 内部服务器错误            | 500        |
| RATE_LIMITED     | 请求频率超限              | 429        |
| INVALID_TOKEN    | 令牌验证失败              | 401        |
| TOKEN_BLACKLISTED| 代币已在黑名单中          | 400        |
| TOKEN_EXISTS     | 代币已存在                | 409        |

## 附录: 代币验证流程

代币验证 API 使用多重检查确保代币的安全性:

1. 合约代码分析
2. 流动性评估
3. 持币地址分布分析
4. 历史交易模式检查
5. 与已知问题代币对比

API 将返回一个安全评分和风险因素列表，帮助用户决定是否进行交易。

---

*最后更新时间: 2024年4月* 