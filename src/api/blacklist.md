# 黑名单管理 API

本模块提供对代币黑名单的管理功能，包括获取、添加和删除代币。

## 获取黑名单

获取当前系统中的所有黑名单代币列表。

### 请求

```
GET /api/tokens/blacklist
```

### 参数

无需参数

### 响应

```json
{
  "success": true,
  "data": [
    {
      "mint": "9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT",
      "symbol": "SCAM",
      "name": "诈骗代币示例",
      "reason": "疑似诈骗代币"
    },
    {
      "mint": "3GrWiik5GkCHP6hfJKNEbd97e9fGNNPnBNHjQimGMdVg",
      "symbol": "RUG",
      "name": "Rug Pull示例",
      "reason": "流动性异常"
    }
  ],
  "count": 2,
  "message": "成功获取黑名单"
}
```

### 响应字段说明

| 字段名 | 类型 | 描述 |
|-------|------|------|
| mint | 字符串 | 代币的Mint地址 |
| symbol | 字符串 | 代币符号 |
| name | 字符串 | 代币名称 |
| reason | 字符串 | 代币被加入黑名单的原因 |

## 添加代币到黑名单

将指定的代币添加到黑名单中。

### 请求

```
POST /api/tokens/blacklist
```

### 请求体

```json
{
  "mint": "9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT",
  "symbol": "SCAM",
  "name": "诈骗代币示例",
  "reason": "疑似诈骗代币"
}
```

### 请求参数说明

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| mint | 字符串 | 是 | 代币的Mint地址，必须是有效的Solana地址格式 |
| symbol | 字符串 | 否 | 代币符号 |
| name | 字符串 | 否 | 代币名称 |
| reason | 字符串 | 否 | 添加到黑名单的原因，便于后续审查和管理 |

### 响应

#### 成功响应

```json
{
  "success": true,
  "data": {
    "mint": "9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT",
    "symbol": "SCAM",
    "name": "诈骗代币示例",
    "reason": "疑似诈骗代币"
  },
  "message": "代币已成功添加到黑名单"
}
```

#### 错误响应 - 代币已存在

```json
{
  "success": false,
  "error": "代币已存在于黑名单中",
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

## 从黑名单移除代币

从黑名单中移除指定的代币。

### 请求

```
DELETE /api/tokens/blacklist/:mint
```

### URL参数

| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| mint | 字符串 | 是 | 要从黑名单中移除的代币Mint地址 |

### 请求示例

```
DELETE /api/tokens/blacklist/9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT
```

### 响应

#### 成功响应

```json
{
  "success": true,
  "data": {
    "mint": "9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT",
    "removed": true
  },
  "message": "代币已从黑名单中移除"
}
```

#### 错误响应 - 代币不存在

```json
{
  "success": false,
  "error": "代币不在黑名单中",
  "code": 404
}
```

## 使用示例

### curl 示例

获取黑名单:
```bash
curl -X GET http://localhost:3000/api/tokens/blacklist -H "Accept: application/json"
```

添加代币到黑名单:
```bash
curl -X POST http://localhost:3000/api/tokens/blacklist \
  -H "Content-Type: application/json" \
  -d '{
    "mint": "9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT",
    "symbol": "SCAM",
    "name": "诈骗代币示例",
    "reason": "疑似诈骗代币"
  }'
```

从黑名单移除代币:
```bash
curl -X DELETE http://localhost:3000/api/tokens/blacklist/9WzKXGLnk8AQKmBmis4UndrcRKZxXwg79Kz73CgVW7qT
```

### JavaScript 示例

```javascript
// 获取黑名单
async function getBlacklist() {
  const response = await fetch('http://localhost:3000/api/tokens/blacklist');
  const data = await response.json();
  console.log(`发现${data.count}个黑名单代币:`);
  console.log(data.data);
}

// 添加代币到黑名单
async function addToBlacklist(tokenInfo) {
  const response = await fetch('http://localhost:3000/api/tokens/blacklist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tokenInfo)
  });
  const data = await response.json();
  console.log(data.message);
}

// 从黑名单移除代币
async function removeFromBlacklist(mint) {
  const response = await fetch(`http://localhost:3000/api/tokens/blacklist/${mint}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  console.log(data.message);
}
``` 