# Solana MEV Bot

## 项目概述

Solana MEV Bot 是一个基于 Solana 区块链的套利交易机器人，通过监控和分析 Solana 生态系统中的交易，发现并利用价格差异进行自动化交易，获取最大可提取价值 (MEV)。

## 最新优化更新

我们对系统进行了一系列重要优化，提高了稳定性和用户体验：

1. **API请求路径优化**
   - 支持多路径尝试机制，确保API请求不因路径错误而失败
   - 增强了API URL解析和构建逻辑，自动适应不同环境配置

2. **数据处理增强**
   - 改进了API响应数据的解析逻辑，适应多种数据格式
   - 实现了模拟数据回退机制，即使API服务不可用也能展示界面

3. **错误处理与恢复**
   - 引入全面的错误处理机制，避免前端因API错误而崩溃
   - 添加了API健康检查功能，自动检测和报告API状态

4. **前端加载优化**
   - 重构了页面初始化逻辑，提高加载速度
   - 优化了脚本加载顺序，确保关键功能优先初始化

5. **环境配置增强**
   - 统一了环境变量配置，确保前后端配置一致
   - 增加了调试模式和详细日志输出

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

## 快速开始

### 准备工作

确保你已安装以下工具：
- Node.js（建议v16或更高版本）
- npm 或 yarn

### 启动后端API服务

```bash
# 进入src目录
cd src

# 安装依赖
npm install

# 启动开发服务
npm run api:dev
```

### 启动前端UI服务

```bash
# 进入前端目录
cd solana_webbot

# 启动HTTP服务器
npx http-server -p 8082
```

### 访问应用

打开浏览器，访问：
- 仪表盘：http://localhost:8082
- 内存监控：http://localhost:8082/memory.html
- 代币监控：http://localhost:8082/tokens.html
- 流动性池：http://localhost:8082/pools.html

## API 接口列表

系统提供以下主要API接口：

### 系统状态相关
- `GET /api/status`：获取系统状态
- `GET /api/stats/system`：获取系统性能数据

### 代币相关
- `GET /api/tokens`：获取代币列表
- `GET /api/stats/tokens/trend?period=24`：获取代币趋势数据（24小时/7天/30天）

### 交易相关
- `GET /api/transactions`：获取交易列表
- `GET /api/stats/profit/trend?period=24`：获取利润趋势数据（24小时/7天/30天）

### 系统控制
- `POST /api/start`：启动系统
- `POST /api/stop`：停止系统

## 常见问题

### 无法连接API服务
- 确认API服务是否已经启动（`npm run api:dev`）
- 检查API服务端口（默认8080）是否被占用
- 确认浏览器是否存在跨域限制（本地开发环境不会有跨域问题）

### 页面显示"无数据"
- 检查API服务是否正常运行
- 查看浏览器控制台是否有API错误信息
- 尝试刷新页面或清除浏览器缓存

### 系统不显示实时数据
- 确认系统状态是否为"运行中"
- 检查网络连接是否稳定
- 查看浏览器控制台中的API请求响应

## 开发者指南

### 目录结构
- `src/`: 后端API服务和核心逻辑
- `solana_webbot/`: 前端UI界面
  - `js/`: JavaScript文件
  - `css/`: 样式文件
  - `img/`: 图片资源
  - `*.html`: 页面文件

### 添加新API接口
1. 在`src/api/routes/`中添加新的路由文件
2. 在`src/api/controllers/`中实现对应的控制器
3. 在`src/api/index.ts`中注册新路由

### 修改前端页面
1. 在`solana_webbot/js/`目录中找到对应的JavaScript文件
2. 修改相关函数或添加新功能
3. 如需修改UI，编辑对应的HTML和CSS文件

## 贡献指南

欢迎为项目做出贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个Pull Request

## 许可证

本项目遵循MIT许可证。详情请查看LICENSE文件。

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