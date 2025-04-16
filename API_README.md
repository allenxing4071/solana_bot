# Solana MEV 机器人 API 文档

## API 概述

本文档描述了 Solana MEV 机器人项目的所有 API 端点。所有 API 均为公开访问，无需身份验证。
基础 API URL: `http://localhost:8080`

## 系统相关 API

### 获取系统状态

```
GET /api/status
```

返回系统运行状态，包括运行时间和当前状态（运行中或已停止）。

**响应示例**:
```json
{
  "status": "running",
  "uptime": 3600,
  "currentTime": "2023-07-10T12:00:00Z"
}
```

### 获取系统内存状态

```
GET /api/memory
```

返回系统内存使用情况，包括总内存、已用内存、堆内存等信息。

**响应示例**:
```json
{
  "totalMemory": {
    "total": 8192,
    "used": 4096,
    "free": 4096,
    "usedPercentage": 50
  },
  "heapMemory": {
    "total": 4096,
    "used": 2048,
    "free": 2048,
    "usedPercentage": 50
  },
  "peakMemory": 5120,
  "externalMemory": 1024,
  "memoryTrend": [
    {
      "timestamp": "2023-07-10T11:55:00Z",
      "totalUsed": 4000,
      "heapUsed": 2000
    }
  ]
}
```

### 系统健康检查

```
GET /api/health
```

返回系统健康状态，用于监控系统是否在线。

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2023-07-10T12:00:00Z"
}
```

### 启动系统

```
GET /api/start
```

启动 MEV 机器人系统。

**响应示例**:
```json
{
  "success": true,
  "message": "系统已启动"
}
```

### 停止系统

```
GET /api/stop
```

停止 MEV 机器人系统。

**响应示例**:
```json
{
  "success": true,
  "message": "系统已停止"
}
```

### 优化内存

```
GET /api/optimize
```

触发系统内存优化。

**响应示例**:
```json
{
  "success": true,
  "message": "内存优化完成",
  "freedMemory": 512
}
```

## 代币相关 API

### 获取代币列表

```
GET /api/tokens
```

获取所有监控的代币列表。

**查询参数**:
- `page`: 页码（默认 1）
- `limit`: 每页条数（默认 20）
- `search`: 搜索关键词
- `sort`: 排序字段（如 price, volume）
- `order`: 排序方向（asc 或 desc）

**响应示例**:
```json
{
  "tokens": [
    {
      "id": "token1",
      "name": "Solana",
      "symbol": "SOL",
      "price": 100.5,
      "change24h": 5.2,
      "volume24h": 1000000,
      "marketCap": 20000000
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

### 获取代币详情

```
GET /api/tokens/details?id=token1
```

获取特定代币的详细信息。

**查询参数**:
- `id`: 代币ID（必需）

**响应示例**:
```json
{
  "id": "token1",
  "name": "Solana",
  "symbol": "SOL",
  "address": "So11111111111111111111111111111111111111112",
  "price": 100.5,
  "change24h": 5.2,
  "change7d": 10.5,
  "volume24h": 1000000,
  "marketCap": 20000000,
  "totalSupply": 500000000,
  "riskScore": 20
}
```

### 获取所有黑名单代币

```
GET /api/tokens/blacklist
```

获取被加入黑名单的代币列表。

**响应示例**:
```json
{
  "blacklist": [
    {
      "address": "TokenAddress123",
      "name": "Scam Token",
      "reason": "已确认为诈骗代币",
      "addedAt": "2023-07-01T10:00:00Z"
    }
  ]
}
```

### 添加代币到黑名单

```
POST /api/tokens/blacklist
```

将一个代币添加到黑名单。

**请求体**:
```json
{
  "address": "TokenAddress123",
  "name": "Scam Token",
  "reason": "疑似诈骗代币"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "代币已添加到黑名单"
}
```

### 获取所有白名单代币

```
GET /api/tokens/whitelist
```

获取被加入白名单的代币列表。

**响应示例**:
```json
{
  "whitelist": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "name": "Solana",
      "symbol": "SOL",
      "addedAt": "2023-07-01T10:00:00Z"
    }
  ]
}
```

## 流动性池相关 API

### 获取所有流动性池

```
GET /api/pools
```

获取所有监控的流动性池列表。

**查询参数**:
- `page`: 页码（默认 1）
- `limit`: 每页条数（默认 20）
- `search`: 搜索关键词
- `dex`: 交易所筛选（如 "raydium"）

**响应示例**:
```json
{
  "pools": [
    {
      "id": "pool1",
      "name": "SOL/USDC",
      "dex": "Raydium",
      "liquidity": 10000000,
      "volume24h": 5000000,
      "fee": 0.3,
      "apy": 15.2
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### 获取流动性池详情

```
GET /api/pools/:address
```

获取特定流动性池的详细信息。

**参数**:
- `address`: 流动性池地址

**响应示例**:
```json
{
  "id": "pool1",
  "name": "SOL/USDC",
  "address": "PoolAddress123",
  "dex": "Raydium",
  "tokenA": {
    "symbol": "SOL",
    "address": "So11111111111111111111111111111111111111112"
  },
  "tokenB": {
    "symbol": "USDC",
    "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  },
  "liquidity": 10000000,
  "volume24h": 5000000,
  "fee": 0.3,
  "apy": 15.2,
  "priceHistory": [
    {
      "timestamp": "2023-07-10T11:00:00Z",
      "price": 100.2
    }
  ]
}
```

### 获取流动性池统计信息

```
GET /api/pools/stats
```

获取所有流动性池的汇总统计信息。

**响应示例**:
```json
{
  "totalPools": 120,
  "totalLiquidity": 500000000,
  "totalVolume24h": 250000000,
  "topDexes": [
    {
      "name": "Raydium",
      "poolCount": 50,
      "totalLiquidity": 200000000
    }
  ],
  "topPools": [
    {
      "id": "pool1",
      "name": "SOL/USDC",
      "liquidity": 10000000
    }
  ]
}
```

## 交易相关 API

### 获取交易列表

```
GET /api/transactions
```

获取系统执行的交易列表。

**查询参数**:
- `page`: 页码（默认 1）
- `limit`: 每页条数（默认 20）
- `status`: 交易状态筛选（success, failed, pending）

**响应示例**:
```json
{
  "transactions": [
    {
      "id": "tx1",
      "type": "swap",
      "status": "success",
      "timestamp": "2023-07-10T11:55:00Z",
      "tokens": "SOL -> USDC",
      "amount": 10,
      "profit": 0.5
    }
  ],
  "pagination": {
    "total": 200,
    "page": 1,
    "limit": 20,
    "pages": 10
  }
}
```

### 获取最近交易

```
GET /api/transactions/recent
```

获取最近执行的交易列表（无分页）。

**响应示例**:
```json
{
  "transactions": [
    {
      "id": "tx1",
      "type": "swap",
      "status": "success",
      "timestamp": "2023-07-10T11:55:00Z",
      "tokens": "SOL -> USDC",
      "amount": 10,
      "profit": 0.5
    }
  ]
}
```

### 获取交易详情

```
GET /api/transactions/:id
```

获取特定交易的详细信息。

**参数**:
- `id`: 交易ID

**响应示例**:
```json
{
  "id": "tx1",
  "type": "swap",
  "status": "success",
  "timestamp": "2023-07-10T11:55:00Z",
  "tokens": {
    "from": {
      "symbol": "SOL",
      "amount": 10
    },
    "to": {
      "symbol": "USDC",
      "amount": 1050
    }
  },
  "fee": 0.00001,
  "profit": 0.5,
  "signature": "TransactionSignature123",
  "blockNumber": 12345678
}
```

## 数据趋势 API

### 获取利润汇总

```
GET /api/profit/summary
```

获取利润汇总数据。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalProfit": 158.56,
    "dailyProfit": 12.34,
    "weeklyProfit": 67.89,
    "monthlyProfit": 158.56,
    "bestTrade": {
      "token": "SOL",
      "profit": 8.56,
      "date": "2023-07-10T12:00:00Z"
    }
  }
}
```

### 获取代币发现趋势

```
GET /api/token-trends
```

获取代币发现趋势数据。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "time": "2023-07-10T10:00:00Z",
      "count": 8
    },
    {
      "time": "2023-07-10T11:00:00Z",
      "count": 12
    }
  ]
}
```

### 获取利润趋势

```
GET /api/profit-trends
```

获取利润趋势数据。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "time": "2023-07-10T10:00:00Z",
      "value": 1.75
    },
    {
      "time": "2023-07-10T11:00:00Z",
      "value": 2.25
    }
  ]
}
```

### 获取系统日志

```
GET /api/logs
```

获取系统日志数据。

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "time": "2023-07-10T12:00:00Z",
      "level": "info",
      "message": "系统正常运行中"
    },
    {
      "time": "2023-07-10T11:55:00Z",
      "level": "info",
      "message": "发现新代币: TEST"
    }
  ]
}
```

## 通用响应格式

所有API响应遵循统一的格式：

成功响应:
```json
{
  "success": true,
  "data": {
    // 具体数据
  }
}
```

包含模拟数据的响应:
```json
{
  "success": true,
  "isMockData": true,  // 明确标识这是模拟数据
  "data": {
    // 具体数据
  }
}
```

错误响应:
```json
{
  "success": false,
  "error": {
    "code": 404,
    "message": "资源未找到"
  }
}
```

## 错误代码

- 400: 错误请求
- 404: 资源未找到
- 500: 服务器内部错误 