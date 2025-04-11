# 白名单管理 API

本模块提供对代币白名单的管理功能，包括获取、添加和删除代币。

## 获取白名单

获取当前系统中的所有白名单代币列表。

### 请求

```
GET /api/tokens/whitelist
```

### 参数

无需参数

### 响应

```json
{
  "success": true,
  "data": [
    {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "symbol": "USDC",
      "name": "USD Coin",
      "trusted": true
    },
    {
      "mint": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Wrapped SOL",
      "trusted": true
    }
  ],
  "count": 2,
  "message": "成功获取白名单"
}
```

### 响应字段说明

| 字段名 | 类型 | 描述 |
|-------|------|------|
| mint | 字符串 | 代币的Mint地址 |
| symbol | 字符串 | 代币符号 |
| name | 字符串 | 代币名称 |
| trusted | 布尔值 | 代币是否被完全信任 |

## 添加代币到白名单

将指定的代币添加到白名单中。

### 请求

```
POST /api/tokens/whitelist
```

### 请求体

```json
{
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "symbol": "USDC",
  "name": "USD Coin",
  "trusted": true
}
```

### 请求参数说明

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| mint | 字符串 | 是 | 代币的Mint地址，必须是有效的Solana地址格式 |
| symbol | 字符串 | 否 | 代币符号 |
| name | 字符串 | 否 | 代币名称 |
| trusted | 布尔值 | 否 | 代币是否被完全信任，默认为false |

### 响应

#### 成功响应

```json
{
  "success": true,
  "data": {
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "symbol": "USDC",
    "name": "USD Coin",
    "trusted": true
  },
  "message": "代币已成功添加到白名单"
}
```

#### 错误响应 - 代币已存在

```json
{
  "success": false,
  "error": "代币已存在于白名单中",
  "code": 409
}
```

#### 错误响应 - 无效参数

```json
{
  "success": false,
  "error": "无效的代币地址格式",
  "code": 400
}
```

## 从白名单移除代币

从白名单中移除指定的代币。

### 请求

```
DELETE /api/tokens/whitelist/:mint
```

### URL参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| mint | 字符串 | 是 | 要从白名单中移除的代币Mint地址 |

### 请求示例

```
DELETE /api/tokens/whitelist/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### 响应

#### 成功响应

```json
{
  "success": true,
  "data": {
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "removed": true
  },
  "message": "代币已从白名单中移除"
}
```

#### 错误响应 - 代币不存在

```json
{
  "success": false,
  "error": "代币不在白名单中",
  "code": 404
}
```

## 使用示例

### curl 示例

获取白名单:
```bash
curl -X GET http://localhost:3000/api/tokens/whitelist -H "Accept: application/json"
```

添加代币到白名单:
```bash
curl -X POST http://localhost:3000/api/tokens/whitelist \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "symbol": "USDC",
    "name": "USD Coin",
    "trusted": true
  }'
```

从白名单移除代币:
```bash
curl -X DELETE http://localhost:3000/api/tokens/whitelist/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### JavaScript 示例

```javascript
// 获取白名单
async function getWhitelist() {
  const response = await fetch('http://localhost:3000/api/tokens/whitelist');
  const data = await response.json();
  console.log(`发现${data.count}个白名单代币:`);
  console.log(data.data);
}

// 添加代币到白名单
async function addToWhitelist(tokenInfo) {
  const response = await fetch('http://localhost:3000/api/tokens/whitelist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokenInfo)
  });
  const data = await response.json();
  console.log(data.message);
}

// 从白名单移除代币
async function removeFromWhitelist(mint) {
  const response = await fetch(`http://localhost:3000/api/tokens/whitelist/${mint}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  console.log(data.message);
}
``` 