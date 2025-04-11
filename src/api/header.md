# Solana MEV Bot API 文档

## 概述

Solana MEV机器人提供了一套完整的HTTP API接口，用于管理代币黑白名单和验证代币安全性。这些API接口可以帮助您集成机器人的安全验证功能到其他系统或前端应用中。

## 开发环境

- 基础URL: `http://localhost:3000`
- API前缀: `/api`
- 完整API根路径: `http://localhost:3000/api`

## 认证

目前API不需要认证，但在生产环境中**强烈建议**添加适当的认证机制，例如：

- API密钥认证
- JWT认证
- OAuth 2.0授权

## 内容类型

所有API请求和响应均使用JSON格式。

### 请求头设置

发送请求时需要设置以下HTTP头：

```
Content-Type: application/json
Accept: application/json
```

## 标准返回格式

所有API接口遵循以下统一的响应格式：

### 成功响应

```json
{
  "success": true,  // 表示操作成功
  "data": {},       // 返回的数据对象或数组
  "count": 10,      // 如果返回列表数据，会包含计数
  "message": "操作成功的消息" // 可选的成功提示
}
```

### 错误响应

```json
{
  "success": false,    // 表示操作失败
  "error": "错误信息",  // 详细的错误描述
  "code": 400          // 错误代码（可选）
}
```

## 常见HTTP状态码

| 状态码 | 描述 | 使用场景 |
|-------|-----|---------|
| 200 | OK | 请求成功，返回数据 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误或缺失 |
| 404 | Not Found | 请求的资源不存在 |
| 409 | Conflict | 资源冲突（如已存在） |
| 500 | Server Error | 服务器内部错误 |

## 请求限制

- 每个IP每分钟最多可发送100个请求
- 超出限制将返回429状态码
- 建议实现请求重试机制

## 版本控制

当前API版本为v1，未来版本更新将通过URL路径进行区分，例如：

- 当前版本: `/api/tokens/...`
- 未来版本: `/api/v2/tokens/...`

## 调试工具

推荐使用以下工具测试API接口：

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [curl](https://curl.se/) 命令行工具 