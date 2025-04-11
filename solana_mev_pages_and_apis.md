# Solana MEV机器人 - 页面与接口字段清单

## 前端页面

### 1. 仪表盘页面 (index.html)
- **侧边栏区域**
  - 菜单项：仪表盘、流动性池、代币监控、交易记录、内存监控、设置
  - 系统状态：状态指示器、状态文本
  - 控制按钮：启动按钮、停止按钮

- **顶部区域**
  - 页面标题：仪表盘概览
  - 上次更新时间：lastUpdated
  - 主题切换按钮：themeToggleBtn
  - 刷新数据按钮：refreshData

- **统计卡片区域**
  - CPU使用率：cpuUsage、cpuBar（进度条）
  - 内存使用率：memoryUsage、memoryBar（进度条）
  - 运行时间：uptime
  - 总收益：totalProfit

- **图表区域**
  - 代币发现趋势图：tokenDiscoveryChart（近12小时）
  - 利润趋势图：profitTrendChart（近7天）

- **交易统计区域**
  - 监控代币数：monitoredTokens
  - 活跃池数：activePools
  - 执行交易数：executedTrades

- **日志区域**
  - 系统日志标题
  - 清除日志按钮：clearLogsBtn
  - 日志容器：logContainer

- **最近交易区域**
  - 交易表格：交易ID、代币对、数量、收益、时间、状态
  - 交易表体：tradesTableBody

- **最近发现的代币区域**
  - 代币表格：代币名称、地址、发现时间、流动性、风险等级
  - 代币表体：tokensTableBody

### 2. 内存监控页面 (memory.html)
- **顶部区域**
  - 页面标题：内存监控
  - 当前日期时间：currentDateTime
  - 刷新数据按钮：refreshData
  - 优化内存按钮：optimizeMemory

- **内存统计卡片区域**
  - 当前内存使用：totalMemory、usedMemory、usedPercentage
  - 堆内存：heapTotal、heapUsed、heapPercentage
  - 峰值内存：peakMemory
  - 外部内存：externalMemory

- **图表区域**
  - 内存使用趋势图：memoryChart
  - 堆内存分配图：heapChart

- **内存优化建议区域**
  - 刷新建议按钮：generateSuggestions
  - 建议容器：suggestionsContainer

- **内存消耗点分析区域**
  - 状态筛选：statusFilter
  - 搜索输入：searchInput
  - 消耗点表格：模块、内存使用、状态、最后更新
  - 消耗点表体：consumptionPoints

- **内存日志区域**
  - 清空日志按钮：clearLogs
  - 日志容器：logsContainer

- **内存泄漏检测区域**
  - 检测泄漏按钮：checkLeaks
  - 泄漏容器：leaksContainer

### 3. 流动性池页面 (pools.html)
- **侧边栏区域**（同仪表盘）

- **顶部区域**
  - 页面标题：流动性池
  - 当前日期时间：currentDateTime

- **筛选和搜索工具栏**
  - 搜索输入框
  - 交易所筛选下拉框
  - 排序方式下拉框
  - 刷新数据按钮：refreshBtn

- **流动性池统计区域**
  - 监控池子总数：totalPools
  - 总锁定价值：totalValue
  - 平均日交易量：avgVolume
  - 最活跃DEX：mostActiveDex

- **流动性池列表区域**
  - 最后更新时间：lastUpdated
  - 池子表格：池子、DEX、流动性、24h交易量、APY、价格、价格变化、操作
  - 池子表体：poolsTableBody
  - 查看详情按钮

- **分页控件**
  - 上一页按钮
  - 页码信息
  - 下一页按钮

### 4. 代币监控页面 (tokens.html)
- **侧边栏区域**（同仪表盘）

- **顶部区域**
  - 页面标题：代币监控
  - 当前日期时间：currentDateTime
  - 主题切换按钮：themeToggleBtn

- **代币统计卡片区域**
  - 白名单代币数：whitelistCount
  - 黑名单代币数：blacklistCount
  - 今日检测数：detectedToday
  - 平均风险评分：avgRiskScore

- **代币筛选和管理工具栏**
  - 搜索输入框：tokenFilter
  - 代币类型筛选：tokenTypeFilter
  - 添加白名单按钮：addWhitelistBtn
  - 添加黑名单按钮：addBlacklistBtn

- **代币表格区域**
  - 代币表格：代币名称、符号、地址、类型、风险评分、价格、操作
  - 代币表体：tokensTableBody
  - 详情按钮
  - 移除按钮

- **代币详情模态框**
  - 代币名称：modalTokenName
  - 详情内容：tokenDetailContent
  - 关闭按钮：closeModalBtn
  - 操作按钮：tokenActionBtn

- **添加代币模态框**
  - 标题：addTokenModalTitle
  - 表单：addTokenForm
  - 代币地址：tokenAddress
  - 代币符号：tokenSymbol
  - 代币名称：tokenName
  - 黑名单原因：blacklistReason
  - 取消按钮：cancelAddTokenBtn
  - 确认添加按钮：submitAddTokenBtn

### 5. 交易记录页面 (trades.html)
- **侧边栏区域**（同仪表盘）

- **顶部区域**
  - 页面标题：交易记录
  - 当前日期时间：currentDateTime
  - 主题切换按钮：themeToggleBtn

- **交易统计卡片区域**
  - 总交易数：totalTrades
  - 成功率：successRate
  - 总收益：totalProfit
  - 平均收益：avgProfit

- **交易图表区域**
  - 交易量趋势图：tradeVolumeChart
  - 时间范围选择：tradeVolumeTimeRange
  - 收益分析图：profitChart
  - 时间范围选择：profitTimeRange

- **交易筛选和管理工具栏**
  - 搜索输入框：tradeFilter
  - 交易状态筛选：tradeStatusFilter
  - 交易类型筛选：tradeTypeFilter
  - 导出数据按钮：exportTradesBtn

- **交易表格区域**
  - 交易表格：交易ID、时间、代币、类型、交易池、数量、价格、价值、费用、状态、操作
  - 交易表体：tradesTableBody
  - 详情按钮

- **分页控件**
  - 上一页按钮：prevPageBtn
  - 页码信息：pageInfo
  - 下一页按钮：nextPageBtn

- **交易详情模态框**
  - 交易ID：modalTradeId
  - 详情内容：tradeDetailContent
  - 关闭按钮：closeModalBtn
  - 在区块浏览器查看按钮：viewExplorerBtn

### 6. 系统设置页面 (settings.html)
- **侧边栏区域**（同仪表盘）

- **顶部区域**
  - 页面标题：系统设置
  - 当前日期时间：currentDateTime
  - 主题切换按钮：themeToggleBtn
  - 保存设置按钮：saveSettingsBtn

- **设置面板导航**
  - 基本设置选项卡
  - 网络配置选项卡
  - 钱包设置选项卡
  - 交易策略选项卡
  - 通知设置选项卡
  - 高级配置选项卡

- **基本设置面板**
  - 机器人名称：botName
  - 日志级别：logLevel
  - 内存限制：maxMemory
  - 操作模式：operationMode
  - 启用统计分析：enableStats

- **网络配置面板**
  - 主要RPC节点：primaryRpc
  - 备用RPC节点：backupRpc
  - WebSocket端点：wsEndpoint
  - 连接超时：connectionTimeout
  - 使用Jito MEV中继网络：useJitoRelay
  - Jito中继URL：jitoRelayUrl

- **钱包设置面板**
  - 钱包类型：walletType
  - 钱包密钥对：walletKeypair
  - 钱包地址：walletAddress
  - 最大交易金额：maxTradeAmount
  - 每日交易限额：maxDailyTradeVolume

## API接口

### 1. 系统接口 (/api/system)
- **GET /api/health** - 健康检查
- **GET /api/system/status** - 获取系统状态数据
- **POST /api/system/start** - 启动系统
- **POST /api/system/stop** - 停止系统
- **POST /api/system/optimize-memory** - 优化内存
- **GET /api/system/memory-stats** - 获取内存统计数据

### 2. 代币接口 (/api/tokens)
- **GET /api/tokens** - 获取代币列表
- **GET /api/tokens/all** - 获取所有代币
- **GET /api/tokens/blacklist** - 获取所有黑名单代币
- **POST /api/tokens/blacklist** - 添加代币到黑名单
- **DELETE /api/tokens/blacklist/:mint** - 从黑名单移除代币
- **GET /api/tokens/whitelist** - 获取所有白名单代币
- **POST /api/tokens/whitelist** - 添加代币到白名单
- **DELETE /api/tokens/whitelist/:mint** - 从白名单移除代币
- **GET /api/tokens/validate/:mint** - 验证代币安全状态
- **GET /api/tokens/details** - 获取代币详情

### 3. 流动性池接口 (/api/pools)
- **GET /api/pools** - 获取所有流动性池
- **GET /api/pools/:address** - 获取单个流动性池详情
- **GET /api/pools/dex/:dexName** - 获取指定DEX的所有流动性池
- **GET /api/pools/token/:mint** - 获取包含指定代币的所有流动性池
- **GET /api/pools/stats** - 获取流动性池统计信息

### 4. 交易接口 (/api/transactions)
- **GET /api/transactions** - 获取交易记录
- **GET /api/transactions/:id** - 获取特定交易详情
- **GET /api/transactions/stats** - 获取交易统计信息

### 5. 设置接口 (/api/settings)
- **GET /api/settings** - 获取系统设置
- **POST /api/settings** - 更新系统设置
- **POST /api/settings/apply** - 应用设置更改

## UI设计与组件建议

### 整体设计风格

1. **现代暗色主题为主**
   - 采用深色背景配合高对比度元素，减轻长时间监控的视觉疲劳
   - 使用Solana品牌色调(紫色#9945FF、青色#14F195)作为交互元素和数据高亮
   - 推荐使用**TailwindCSS**或**Styled Components**实现一致的主题系统，支持暗/亮主题切换

2. **专业金融界面布局**
   - 采用类似彭博终端的分区设计，将信息密度与可读性平衡
   - 使用**GridStack.js**实现可拖拽、可调整大小的面板布局，允许用户自定义重要指标的位置

3. **响应式框架选择**
   - 推荐基于**React**或**Vue**构建，搭配**Ant Design Pro**或**Vuetify**等专业UI框架
   - 确保在多设备上保持功能完整性，同时优化不同屏幕大小的布局

### 数据可视化方案

1. **高级图表库选择**
   - 核心推荐: **ECharts**替代当前的Chart.js，提供更丰富的金融图表和更好的性能
   - 特定场景补充:
     - 价格走势图: **TradingView轻量级图表**，提供专业K线和技术分析能力
     - 网络关系图: **Sigma.js**用于可视化流动性池与代币的关系网络
     - 实时更新: 结合**Socket.IO**实现图表数据的低延迟更新

2. **仪表盘页面专用组件**
   - 核心指标展示: **CountUp.js**实现数字动画变化
   - 环形进度图: **ApexCharts**的仪表盘组件展示CPU/内存使用率
   - 迷你趋势图: **Sparklines**在统计卡片中显示微型趋势

3. **内存监控可视化**
   - 实时监控图: **D3.js**构建自定义的实时流图
   - 资源分配图: **ECharts**的树图或旭日图展示内存分配
   - 考虑集成**Grafana**嵌入式面板，提供专业级的系统监控图表

### 表格与数据展示

1. **高性能数据表格**
   - 核心推荐: **ag-Grid**替代原生表格，处理大量交易和池数据，支持:
     - 虚拟滚动(仅渲染可见行)，处理成千上万条记录
     - 列固定、调整和自定义排序
     - 内置筛选和分组功能
     - 单元格条件格式化(如红绿色标识涨跌)

2. **代币与流动性池表格增强**
   - 地址显示: 集成**Etherscan/Solscan API**在表格中显示代币小图标
   - 风险评分: 使用渐变色条组件直观显示风险级别
   - 价格变化: 添加迷你趋势图列和动态数字变化

3. **交易记录高级展示**
   - 时间轴视图: 使用**vis-timeline**提供交易的时间轴视图
   - 交易详情模态框: 使用**react-modal**或对应框架的模态组件
   - 交易路径可视化: 小型**flow-charts**展示交易路径

### 性能优化方案

1. **数据处理与缓存**
   - 客户端状态管理: 使用**Redux Toolkit**或**Pinia**高效管理复杂状态
   - 数据缓存: 应用**SWR**或**React Query**实现API数据智能缓存
   - 数据压缩: 考虑WebSocket传输时使用**MessagePack**减少数据大小

2. **渲染优化**
   - 虚拟化列表: 对长列表使用**react-window**或**vue-virtual-scroller**
   - 代码分割: 基于路由的动态加载，减少初始加载体积
   - 图表延迟渲染: 使用**Intersection Observer**在视图内才渲染图表

3. **加载体验**
   - 骨架屏: 使用**react-loading-skeleton**或类似组件
   - 优先内容: 实施关键CSS和内容优先加载策略
   - 后台数据预取: 预测用户可能访问的下一页面并预加载数据

### 页面专项建议

1. **仪表盘页面**
   - 添加**时间范围选择器**控制所有图表的时间范围
   - 关键指标使用**大尺寸数字**配合**迷你趋势图**和**同比增长标识**
   - 考虑添加**系统健康评分**综合展示整体状态

2. **内存监控页面**
   - 实现**内存使用预警阈值**可视化和配置
   - 添加**内存泄漏检测图**，展示潜在的内存问题
   - 考虑**资源使用热图**按时间段展示资源使用情况

3. **流动性池和代币监控**
   - 添加**市场地图**以气泡图形式展示池大小和活跃度
   - 实现**相似代币检测**，识别可能的欺诈代币
   - 加入**DEX比较视图**对比不同交易所的同一交易对

4. **设置页面**
   - 提供**配置模板**功能，快速切换不同交易策略
   - 添加**配置验证**和**影响分析**，预判设置变更的效果
   - 实现**设置历史**，可回滚到之前的配置 