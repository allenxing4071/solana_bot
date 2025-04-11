#!/bin/bash
# 部署现代UI到sol.deeptv.tv的脚本

# 从.env文件读取SSH连接信息
SSH_HOST=$(grep SSH_HOST .env | cut -d '=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d '=' -f2)
SSH_PORT=$(grep SSH_PORT .env | cut -d '=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d '=' -f2)

# 设置远程目标路径
REMOTE_PUBLIC_PATH="/home/ubuntu/public"
TEMP_PATH="/home/ubuntu/temp_modernui"

echo "===== 开始部署现代UI到sol.deeptv.tv ====="
echo "准备连接到 $SSH_USER@$SSH_HOST:$SSH_PORT 使用密钥 $SSH_KEY_PATH"

# 检查密钥文件权限并修改
chmod 600 $SSH_KEY_PATH
echo "已设置密钥文件权限"

# 创建临时目录用于存放现代UI版本
echo "创建临时工作目录..."
mkdir -p temp_modernui
echo "临时目录已创建"

# 修改index.html应用现代UI样式
echo "准备现代UI文件..."
cat > temp_modernui/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>仪表盘 - Solana MEV机器人</title>
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/fix.css">
    <link rel="stylesheet" href="css/common.css">
    <link rel="icon" type="image/png" href="img/favicon.png">
    
    <!-- 环境配置 -->
    <script id="env-config" type="application/json">
    {
        "environment": "production",
        "dataSource": {
            "useMockData": false
        }
    }
    </script>
    
    <!-- 全局配置和工具库 -->
    <script src="config.js"></script>
</head>
<body class="dark-theme">
    <div class="dashboard-container">
        <!-- 侧边栏 -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="img/logo.svg" alt="Logo" class="logo">
                <h2>Solana MEV机器人</h2>
            </div>
            <div class="sidebar-content">
                <!-- 导航菜单 -->
                <nav class="sidebar-nav">
                    <ul>
                        <li class="active"><a href="index.html"><i class="icon-dashboard"></i> 仪表盘</a></li>
                        <li><a href="pools.html"><i class="icon-pools"></i> 流动性池</a></li>
                        <li><a href="tokens.html"><i class="icon-tokens"></i> 代币监控</a></li>
                        <li><a href="trades.html"><i class="icon-trades"></i> 交易记录</a></li>
                        <li><a href="memory.html"><i class="icon-memory"></i> 内存监控</a></li>
                        <li><a href="settings.html"><i class="icon-settings"></i> 设置</a></li>
                    </ul>
                </nav>
                
                <!-- 系统状态 - 现在位于底部 -->
                <div class="status-wrapper">
                    <div class="bot-status">
                        <span class="status-indicator status-stopped"></span>
                        <span id="statusText">系统已停止</span>
                    </div>
                    <div class="bot-controls">
                        <button class="btn btn-primary btn-sm" id="startBtn">
                            <i class="icon-play"></i>
                            启动
                        </button>
                        <button class="btn btn-danger btn-sm" id="stopBtn" disabled>
                            <i class="icon-stop"></i>
                            停止
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        <!-- 主内容区域 -->
        <main class="main-content">
            <header>
                <div class="header-title">
                    <h1>仪表盘概览</h1>
                </div>
                <div class="user-actions">
                    <div class="date-time" id="currentDateTime">
                        加载中...
                    </div>
                    <button class="btn btn-primary btn-sm" id="refreshBtn">
                        刷新数据
                    </button>
                </div>
            </header>

            <!-- 系统消息区域 -->
            <div id="systemMessages" class="system-messages">
                <!-- 这里会显示系统消息 -->
            </div>

            <!-- 状态卡片 -->
            <div class="stats-cards">
                <!-- CPU使用率 -->
                <div class="stat-card">
                    <div class="stat-icon cpu-icon"></div>
                    <div class="stat-info">
                        <h3>CPU使用率</h3>
                        <p id="cpuUsage">0%</p>
                    </div>
                </div>
                
                <!-- 内存使用率 -->
                <div class="stat-card">
                    <div class="stat-icon memory-icon"></div>
                    <div class="stat-info">
                        <h3>内存使用率</h3>
                        <p id="memoryUsage">0%</p>
                    </div>
                </div>
                
                <!-- 运行时间 -->
                <div class="stat-card">
                    <div class="stat-icon clock-icon"></div>
                    <div class="stat-info">
                        <h3>运行时间</h3>
                        <p id="uptime">0小时 0分钟 0秒</p>
                    </div>
                </div>
                
                <!-- 总收益 -->
                <div class="stat-card">
                    <div class="stat-icon wallet-icon"></div>
                    <div class="stat-info">
                        <h3>总收益</h3>
                        <p id="totalProfit">0.0000 SOL</p>
                    </div>
                </div>
            </div>

            <!-- 第一行图表 -->
            <div class="charts-container">
                <!-- 代币发现趋势 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>代币发现趋势</h3>
                        <span>最近12小时</span>
                    </div>
                    <div class="chart-body">
                        <canvas id="tokenDiscoveryChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <!-- 利润趋势 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>利润趋势</h3>
                        <span>最近7天</span>
                    </div>
                    <div class="chart-body">
                        <canvas id="profitTrendChart" width="400" height="200"></canvas>
                    </div>
                </div>
            </div>

            <!-- 第二行图表和表格 -->
            <div class="charts-container">
                <!-- 内存使用趋势 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>内存使用趋势</h3>
                        <span>最近记录</span>
                    </div>
                    <div class="chart-body">
                        <canvas id="memoryUsageChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <!-- 最近交易 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>最近交易</h3>
                        <button class="btn btn-outline-primary btn-sm" onclick="location.href='trades.html'">查看全部</button>
                    </div>
                    <div class="chart-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>交易ID</th>
                                        <th>代币对</th>
                                        <th>数量</th>
                                        <th>收益</th>
                                        <th>时间</th>
                                        <th>状态</th>
                                    </tr>
                                </thead>
                                <tbody id="recentTransactionsTable">
                                    <!-- 由JS动态填充 -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 底部统计和日志区域 -->
            <div class="stats-cards" style="grid-template-columns: repeat(3, 1fr); margin-top: 20px;">
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <h3>监控代币</h3>
                        <p id="monitoringTokens">0</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <h3>活跃池</h3>
                        <p id="activePools">0</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon"></div>
                    <div class="stat-info">
                        <h3>执行交易</h3>
                        <p id="executedTrades">0</p>
                    </div>
                </div>
            </div>

            <!-- 系统日志和最近发现的代币 -->
            <div class="charts-container">
                <!-- 系统日志 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>系统日志</h3>
                        <button class="btn btn-outline-secondary btn-sm" id="clearLogBtn">清除日志</button>
                    </div>
                    <div class="chart-body">
                        <div class="logs-container" id="logContainer">
                            <!-- 日志内容会动态添加 -->
                        </div>
                    </div>
                </div>
                
                <!-- 最近发现的代币 -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>最近发现的代币</h3>
                        <button class="btn btn-outline-primary btn-sm" onclick="location.href='tokens.html'">查看全部</button>
                    </div>
                    <div class="chart-body">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>代币名称</th>
                                        <th>地址</th>
                                        <th>发现时间</th>
                                        <th>流动性</th>
                                        <th>风险等级</th>
                                    </tr>
                                </thead>
                                <tbody id="recentTokensTable">
                                    <!-- 代币数据将通过JS动态添加 -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <!-- JavaScript 依赖 -->
    <script src="https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/5.2.3/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.bootcdn.net/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <script src="js/datetime.js"></script>
    <script src="js/common.js"></script>
    <script src="js/theme.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
EOF
echo "index.html文件已准备完成"

# 创建远程临时目录
echo "创建服务器临时上传目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $TEMP_PATH"

# 上传暗色主题index.html到临时目录
echo "上传index.html到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT temp_modernui/index.html $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 确认css目录存在
echo "检查服务器CSS目录是否存在..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_PUBLIC_PATH/css"

# 创建缺失的CSS文件
echo "创建必要的样式文件..."
cat > temp_modernui/fix.css << 'EOF'
/* 修复样式文件 */
.chart-card canvas {
    max-width: 100%;
    height: auto;
}

/* 确保图表容器高度一致 */
.chart-card .chart-body {
    height: 250px;
    position: relative;
}

/* 表格内文字截断处理 */
.data-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
}

/* 状态样式 */
.success {
    color: var(--success-color);
}

.pending {
    color: var(--warning-color);
}

.failed {
    color: var(--danger-color);
}
EOF

cat > temp_modernui/common.css << 'EOF'
/* 通用样式组件 */
/* 图标样式 */
.icon-dashboard, .icon-pools, .icon-tokens, .icon-trades, .icon-memory, .icon-settings,
.icon-play, .icon-stop, .icon-refresh, .cpu-icon, .memory-icon, .clock-icon, .wallet-icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.icon-dashboard { background-image: url('../img/icons/dashboard.svg'); }
.icon-pools { background-image: url('../img/icons/pools.svg'); }
.icon-tokens { background-image: url('../img/icons/tokens.svg'); }
.icon-trades { background-image: url('../img/icons/trades.svg'); }
.icon-memory { background-image: url('../img/icons/memory.svg'); }
.icon-settings { background-image: url('../img/icons/settings.svg'); }
.icon-play { background-image: url('../img/icons/play.svg'); }
.icon-stop { background-image: url('../img/icons/stop.svg'); }
.icon-refresh { background-image: url('../img/icons/refresh.svg'); }

/* 状态图标 */
.cpu-icon { background-image: url('../img/icons/cpu.svg'); }
.memory-icon { background-image: url('../img/icons/memory.svg'); }
.clock-icon { background-image: url('../img/icons/clock.svg'); }
.wallet-icon { background-image: url('../img/icons/wallet.svg'); }

/* 暗色/亮色主题切换 */
.dark-theme {
    --bg-color: #1a1a2e;
    --card-bg: #21213a;
    --text-primary: #e6e6e6;
    --text-secondary: #b0b0cc;
    --border-color: #2d2d50;
    --hover-bg: #2a2a45;
}

.light-theme {
    --bg-color: #f7f7ff;
    --card-bg: #ffffff;
    --text-primary: #333344;
    --text-secondary: #66667a;
    --border-color: #e4e4f0;
    --hover-bg: #f0f0f8;
}
EOF

# 上传CSS文件
echo "上传CSS文件到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT temp_modernui/fix.css $SSH_USER@$SSH_HOST:$TEMP_PATH/
scp -i $SSH_KEY_PATH -P $SSH_PORT temp_modernui/common.css $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 使用sudo移动文件到Web根目录
echo "移动文件到Web根目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/index.html $REMOTE_PUBLIC_PATH/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/index.html"
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/fix.css $REMOTE_PUBLIC_PATH/css/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/css/fix.css"
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/common.css $REMOTE_PUBLIC_PATH/css/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/css/common.css"

# 创建js/theme.js文件
echo "创建主题JS文件..."
cat > temp_modernui/theme.js << 'EOF'
/**
 * 主题设置脚本
 * 已禁用主题切换功能，系统默认只使用深色模式
 */
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // 如果存在主题切换按钮，隐藏它
    if (themeToggleBtn) {
        themeToggleBtn.style.display = 'none';
    }
    
    // 确保文档始终使用深色主题
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
});
EOF

echo "创建datetime.js文件..."
cat > temp_modernui/datetime.js << 'EOF'
/**
 * 日期时间处理函数
 */
function updateDateTime() {
    const now = new Date();
    const formatted = now.getFullYear() + '/' + 
                     padZero(now.getMonth() + 1) + '/' + 
                     padZero(now.getDate()) + ' ' +
                     padZero(now.getHours()) + ':' + 
                     padZero(now.getMinutes()) + ':' + 
                     padZero(now.getSeconds());
    
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = formatted;
    }
}

function padZero(num) {
    return num < 10 ? '0' + num : num;
}

// 初始化并每秒更新时间
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
});
EOF

# 确保js目录存在
echo "检查服务器JS目录是否存在..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "mkdir -p $REMOTE_PUBLIC_PATH/js"

# 上传JS文件
echo "上传JS文件到临时目录..."
scp -i $SSH_KEY_PATH -P $SSH_PORT temp_modernui/theme.js $SSH_USER@$SSH_HOST:$TEMP_PATH/
scp -i $SSH_KEY_PATH -P $SSH_PORT temp_modernui/datetime.js $SSH_USER@$SSH_HOST:$TEMP_PATH/

# 复制JS文件
echo "移动JS文件到Web根目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/theme.js $REMOTE_PUBLIC_PATH/js/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/js/theme.js"
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo cp $TEMP_PATH/datetime.js $REMOTE_PUBLIC_PATH/js/ && sudo chown www-data:www-data $REMOTE_PUBLIC_PATH/js/datetime.js"

# 清理临时目录
echo "清理临时目录..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "rm -rf $TEMP_PATH"
rm -rf temp_modernui

echo "验证文件上传..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "ls -la $REMOTE_PUBLIC_PATH/index.html $REMOTE_PUBLIC_PATH/css/fix.css $REMOTE_PUBLIC_PATH/css/common.css $REMOTE_PUBLIC_PATH/js/theme.js"

# 确保Web服务器重新加载
echo "重新加载Nginx..."
ssh -i $SSH_KEY_PATH -p $SSH_PORT $SSH_USER@$SSH_HOST "sudo systemctl reload nginx"

echo "===== 部署完成 ====="
echo "现代UI已部署，请访问 http://sol.deeptv.tv/index.html 查看" 