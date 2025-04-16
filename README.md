# Solana MEV Bot

## 项目概述

Solana MEV Bot 是一个基于 Solana 区块链的套利交易机器人，通过监控和分析 Solana 生态系统中的交易，发现并利用价格差异进行自动化交易，获取最大可提取价值 (MEV)。

## 项目更新

### 目录合并说明

为了简化项目结构，我们已经将原来的 `public` 目录中的API服务器功能整合到了 `solana_webbot` 目录中。这一更新使得所有前端界面和API服务都统一在一个目录下管理，更便于维护和部署。

**合并内容**：
- API服务器 (simple-api-server.js)
- API监控页面 (api-monitor.html, api-list.html)
- 相关静态资源

现在，您可以在 `solana_webbot` 目录中使用 `start-server.sh` 脚本一键启动服务。

## 系统架构

系统由两部分组成：

### 1. 后端服务 (src/)

后端服务是基于 Node.js 和 TypeScript 的 API 服务器，提供核心功能：

- **API 服务**：提供 RESTful API 接口，用于管理代币黑白名单、系统状态监控等
- **交易监控**：监控 Solana 区块链上的交易
- **代币分析**：分析代币的风险和价值
- **套利策略**：执行各种套利策略，最大化收益

### 2. 前端界面 (solana_webbot/)

前端是一个基于 HTML/CSS/JavaScript 的 Web 应用，提供直观的用户界面：

- **控制面板**：显示系统状态、盈利情况、活跃池等实时数据
- **代币管理**：管理白名单和黑名单代币
- **交易记录**：查看历史交易和收益
- **系统设置**：调整系统参数和策略
- **API监控页面**：监控API服务状态和响应
- **API测试界面**：测试各API接口的功能

## API 接口文档

系统提供以下 API 接口：

### 系统相关 API

- `GET /api/system/status`：获取系统状态
- `POST /api/system/start`：启动系统
- `POST /api/system/stop`：停止系统
- `POST /api/system/optimize-memory`：优化内存使用
- `GET /api/memory_stats.json`：获取内存统计数据
- `GET /api/status`：获取API服务器状态
- `GET /api/list`：获取所有API列表

### 代币相关 API

- `GET /api/tokens/blacklist`：获取所有黑名单代币
- `POST /api/tokens/blacklist`：添加代币到黑名单
- `DELETE /api/tokens/blacklist/:mint`：从黑名单中移除代币
- `GET /api/tokens/whitelist`：获取所有白名单代币
- `POST /api/tokens/whitelist`：添加代币到白名单
- `DELETE /api/tokens/whitelist/:mint`：从白名单中移除代币
- `GET /api/tokens/validate/:mint`：验证代币状态
- `GET /api/tokens/all`：获取所有代币
- `GET /api/tokens/details`：获取代币详情
- `GET /api/tokens`：获取代币列表

### 交易相关 API

- `GET /api/transactions`：获取交易列表
- `GET /api/transactions/recent`：获取最近交易
- `GET /api/transactions/:id`：获取交易详情

### 池相关 API

- `GET /api/pools`：获取池列表
- `GET /api/pools/active`：获取活跃池
- `GET /api/pools/:address`：获取池详情

### 设置相关 API

- `GET /api/settings`：获取系统设置
- `PUT /api/settings`：更新系统设置
- `GET /api/settings/strategy`：获取策略设置
- `PUT /api/settings/strategy`：更新策略设置

## 本地开发环境

### 启动后端

```bash
cd src
npm install
npm run dev
```

### 启动前端和API服务器

```bash
cd solana_webbot
# 使脚本可执行
chmod +x start-server.sh
# 启动API服务器
./start-server.sh

# 然后访问以下地址:
# - 仪表盘: http://localhost:8080/index.html
# - API监控页面: http://localhost:8080/api-monitor.html
# - API列表页面: http://localhost:8080/api-list.html
```

## 部署

系统可以部署在任何支持 Node.js 的服务器上。前端可以托管在 Nginx 或其他静态资源服务器。

### 生产环境部署

```bash
# 设置环境变量
cp .env.example .env
# 修改 .env 文件配置

# 启动后端服务
cd src
npm run build
npm run start

# 启动前端和API服务
cd solana_webbot
./start-server.sh
```

## 注意事项

1. 使用前请确保了解 Solana 区块链和 MEV 的基本原理
2. 生产环境中需要设置适当的监控和报警机制
3. 请根据实际情况调整黑白名单配置和风险参数 
4. API服务器默认在8080端口运行，请确保该端口未被其他程序占用 

## 功能简介

- 实时显示系统CPU使用率、型号和核心数
- 实时显示内存使用率
- 展示最近交易、代币发现、趋势图表等（功能未变）

## 使用说明

1. 启动后端API服务
2. 启动前端UI服务
3. 打开前端页面，即可在CPU使用率旁边看到型号和核心数信息

---

本次更新：
- 前端页面支持显示CPU型号和核心数，展示在CPU使用率同一行
- 其他功能未做改动 