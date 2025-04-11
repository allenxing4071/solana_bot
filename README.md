# Solana MEV机器人

Solana MEV (最大可提取价值) 机器人是一个用于在Solana区块链上监控和执行套利交易的系统。它通过监控流动性池、代币价格和套利机会，自动执行有利可图的交易。

## 功能特点

- **仪表盘监控**: 实时显示系统状态、CPU和内存使用率、收益统计等
- **代币监控**: 追踪最新发现的代币及其风险评估
- **流动性池分析**: 监控Solana上的流动性池
- **交易执行**: 自动执行有利可图的交易
- **内存优化**: 提供内存使用监控和优化工具
- **风险管理**: 具有黑白名单系统，安全控制交易

## 技术架构

- **前端**: 原生JavaScript、HTML、CSS
- **后端**: Node.js、Express
- **区块链接口**: Solana Web3.js
- **数据可视化**: Chart.js

## 系统要求

- Node.js 16+
- npm 或 yarn
- 现代浏览器（Chrome, Firefox, Safari, Edge）

## 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/solana-mev-bot.git
   cd solana-mev-bot
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 编译TypeScript代码
   ```bash
   npm run build
   ```

4. 启动应用
   ```bash
   ./start-app.sh
   ```

## 快速使用指南

1. 访问仪表盘
   打开浏览器，输入 http://localhost:3000

2. 配置系统
   - 进入设置页面进行系统配置
   - 配置RPC节点、钱包、交易策略等

3. 启动机器人
   - 在仪表盘上点击"启动"按钮开始监控
   - 机器人将自动监控和执行交易

4. 监控系统
   - 通过仪表盘实时监控系统状态
   - 通过日志查看详细操作记录

## 项目结构

```
solana-mev-bot/
├── public/             # 前端文件
│   ├── css/            # 样式文件
│   ├── js/             # JavaScript文件
│   ├── img/            # 图片资源
│   └── *.html          # HTML页面
├── src/                # 后端源代码
│   ├── api/            # API服务
│   ├── core/           # 核心功能
│   ├── modules/        # 功能模块
│   └── services/       # 服务
├── dist/               # 编译后的代码
├── start-app.sh        # 启动脚本
└── package.json        # 项目配置
```

## API文档

### 系统API

- `GET /api/system/status` - 获取系统状态
- `POST /api/system/start` - 启动系统
- `POST /api/system/stop` - 停止系统
- `POST /api/system/optimize-memory` - 优化内存

### 交易API

- `GET /api/transactions` - 获取交易列表
- `GET /api/transactions/:id` - 获取交易详情
- `GET /api/transactions/recent` - 获取最近交易

### 代币API

- `GET /api/tokens` - 获取代币列表
- `GET /api/tokens/details` - 获取代币详情

## 常见问题

**问题**: 系统无法启动怎么办？  
**回答**: 检查Node.js版本是否符合要求，并确保所有依赖已正确安装。

**问题**: 如何更改API端口？  
**回答**: 在环境变量中设置API_PORT，或修改src/api/server.ts中的默认端口。

## 联系方式

如有问题，请通过以下方式联系我们：
- 邮箱: support@example.com
- GitHub: [项目问题](https://github.com/yourusername/solana-mev-bot/issues)

## 许可证

MIT 