# Solana MEV 机器人前端

前端界面用于监控和控制 Solana MEV 机器人。提供流动性池监控、代币监控、交易记录和系统设置等功能。

## 项目结构

```
public/
├── css/                      # 样式文件
│   ├── main.css              # 基础样式
│   ├── style.css             # 主要组件样式
│   ├── common.css            # 通用样式组件
│   └── fix.css               # 样式修复和覆盖
│
├── js/                       # JavaScript文件
│   ├── common.js             # 通用功能和数据处理
│   ├── dashboard.js          # 仪表盘页面功能
│   ├── pools.js              # 流动性池页面功能
│   ├── tokens.js             # 代币监控页面功能
│   ├── trades.js             # 交易记录页面功能
│   ├── memory.js             # 内存监控页面功能
│   ├── settings.js           # 设置页面功能
│   ├── theme.js              # 主题管理
│   ├── datetime.js           # 日期时间处理
│   └── lib/                  # 第三方库
│       └── chart.min.js      # 图表库
│
├── img/                      # 图片资源
│   ├── logo.svg              # 系统logo
│   ├── favicon.png           # 网站图标
│   └── tokens/               # 代币图标
│
├── index.html                # 仪表盘页面
├── pools.html                # 流动性池页面
├── tokens.html               # 代币监控页面
├── trades.html               # 交易记录页面
├── memory.html               # 内存监控页面
├── settings.html             # 系统设置页面
│
├── config.js                 # 全局配置文件
├── config.production.js      # 生产环境配置示例
└── .env.example              # 环境变量示例
```

### 主要组件说明

#### 1. 核心文件

- **common.js**: 提供所有页面共用的函数，如数据加载、错误处理、日期格式化等。它还负责初始化环境配置，根据配置文件和HTML内联配置决定是使用真实API数据还是模拟数据。

- **config.js**: 全局配置文件，定义了应用的环境、API设置、数据源设置等。可根据不同环境进行修改。

#### 2. 页面组件

- **dashboard.js**: 仪表盘功能，显示系统概况、性能指标、最近交易和代币等。

- **pools.js**: 管理流动性池，显示池信息、交易量、流动性等数据，支持搜索、过滤和排序。

- **tokens.js**: 代币监控功能，管理白名单、黑名单代币，显示代币详情和风险评分。

- **trades.js**: 交易记录功能，显示历史交易、统计分析、图表等，支持导出数据。

- **memory.js**: 内存监控功能，跟踪系统内存使用情况，优化内存占用。

- **settings.js**: 系统设置，管理RPC连接、交易参数、通知设置等。

#### 3. 支持功能

- **theme.js**: 主题管理，支持深色和浅色主题切换。

- **datetime.js**: 时间日期处理，显示实时系统时间和格式化日期。

#### 4. 数据处理

系统支持两种数据来源：

1. **真实API数据**: 从后端API获取真实数据。
2. **模拟数据**: 在开发和测试环境下，通过生成器函数创建模拟数据。

各页面实现了对应的模拟数据生成器函数：
- `generateMockPools()`: 生成流动性池数据
- `generateMockTokens()`: 生成代币数据
- `generateMockTrades()`: 生成交易记录数据

## 环境配置说明

本项目支持通过环境配置灵活切换数据源（真实API数据或模拟数据），方便开发和测试。

### 配置方式

主要有以下几种配置方式，优先级从高到低：

1. **HTML中的内联配置** (优先级最高)

   在HTML文件的head部分，通过特定的script标签设置：

   ```html
   <script id="env-config" type="application/json">
   {
       "environment": "development",
       "dataSource": {
           "useMockData": true
       }
   }
   </script>
   ```

2. **config.js文件** (次优先级)

   修改项目根目录下的`config.js`文件：

   ```js
   const AppEnvironmentConfig = {
       environment: 'development',
       dataSource: {
           useMockData: true  // 设置为true启用模拟数据
       }
   };
   ```

3. **运行时配置** (开发者工具)

   在浏览器控制台中可以动态修改配置：

   ```js
   // 切换到模拟数据
   window.AppConfig.dataSource.useMockData = true;
   // 保存到会话存储
   sessionStorage.setItem('app-config', JSON.stringify(window.AppConfig));
   // 刷新页面应用更改
   location.reload();
   ```

### 配置选项说明

| 配置路径 | 类型 | 默认值 | 说明 |
|---------|------|-------|------|
| `environment` | string | 'development' | 环境设置 (development/testing/production) |
| `dataSource.useMockData` | boolean | false | 是否使用模拟数据 |
| `dataSource.supportsPagination` | boolean | true | API是否支持分页 |
| `dataSource.supportsSearch` | boolean | true | API是否支持搜索和过滤 |
| `api.baseUrl` | string | '' | API服务器基础URL |
| `api.timeout` | number | 15000 | API请求超时时间(毫秒) |

## 部署切换环境

### 开发环境

开发环境通常使用模拟数据进行前端开发和测试：

```html
<script id="env-config" type="application/json">
{
    "environment": "development",
    "dataSource": {
        "useMockData": true
    }
}
</script>
```

### 测试环境

测试环境可以连接测试API，但在API故障时回退到模拟数据：

```html
<script id="env-config" type="application/json">
{
    "environment": "testing",
    "api": {
        "baseUrl": "https://test-api.example.com"
    },
    "dataSource": {
        "useMockData": false
    }
}
</script>
```

### 生产环境

生产环境只使用真实API数据：

```html
<script id="env-config" type="application/json">
{
    "environment": "production",
    "api": {
        "baseUrl": "https://api.example.com"
    },
    "dataSource": {
        "useMockData": false
    },
    "logging": {
        "level": "error",
        "enableConsole": false
    }
}
</script>
```

## 数据模拟说明

当启用模拟数据时，系统会为以下部分生成模拟数据：

- 流动性池列表和详情
- 代币监控列表和详情
- 交易记录和统计
- 仪表盘数据和图表

模拟数据会根据当前页面和操作动态生成，支持分页、搜索和排序功能，以尽可能逼真地模拟真实API交互。

## 通用数据加载流程

所有页面都遵循相同的数据加载模式：

1. 页面初始化时调用数据加载函数（例如 `fetchPoolsData()`、`fetchTokensData()`）
2. 数据加载函数通过 `getDataSource()` 方法获取数据
3. `getDataSource()` 根据配置决定使用真实API或模拟数据
4. 数据加载后渲染到UI组件

当API请求失败且有模拟数据生成器时，会自动使用模拟数据作为后备，确保UI始终有数据显示。

## 数据和真实数据切换

在集成真实API之前，建议使用模拟数据进行前端开发和测试。当API准备就绪后，只需修改环境配置即可无缝切换到真实数据。 