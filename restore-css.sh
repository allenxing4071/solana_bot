#!/bin/bash
# 恢复现代UI版本的CSS样式文件

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始恢复现代UI的CSS样式 ====="

# 创建临时目录
echo "创建临时目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_ui_css"

# 创建主样式文件
echo "创建main.css文件..."
cat > main.css << 'EOL'
/**
 * 主要样式文件
 */

:root {
    --primary-color: #4db6ff;
    --success-color: #4dffbd;
    --warning-color: #ffbf4d;
    --danger-color: #ff6e4d;
    --info-color: #bd4dff;
    
    --dark-bg: #0f1429;
    --dark-card: #1a2035;
    --dark-border: #2e3759;
    --dark-text: #e0e0e0;
    
    --light-bg: #f5f8fa;
    --light-card: #ffffff;
    --light-border: #e0e6ed;
    --light-text: #333333;
    
    --sidebar-width: 250px;
    --header-height: 60px;
    --card-radius: 8px;
    --btn-radius: 4px;
}

/* 基础样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    transition: background-color 0.3s ease;
}

/* 暗色主题 */
body.dark-theme {
    background-color: var(--dark-bg);
    color: var(--dark-text);
}

/* 亮色主题 */
body.light-theme {
    background-color: var(--light-bg);
    color: var(--light-text);
}

/* 布局容器 */
.dashboard-container {
    display: flex;
    min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
    width: var(--sidebar-width);
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    z-index: 100;
}

body.dark-theme .sidebar {
    background-color: var(--dark-card);
    border-right: 1px solid var(--dark-border);
}

body.light-theme .sidebar {
    background-color: var(--light-card);
    border-right: 1px solid var(--light-border);
}

.sidebar-header {
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.sidebar-header .logo {
    width: 60px;
    height: 60px;
    margin-bottom: 10px;
}

.sidebar-header h2 {
    font-size: 18px;
    font-weight: bold;
}

.sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 20px;
}

.sidebar-nav {
    margin-top: 20px;
}

.sidebar-nav ul {
    list-style: none;
}

.sidebar-nav li {
    margin-bottom: 5px;
}

.sidebar-nav a {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    text-decoration: none;
    transition: all 0.2s;
    border-left: 3px solid transparent;
}

body.dark-theme .sidebar-nav a {
    color: #c0c0d0;
}

body.light-theme .sidebar-nav a {
    color: #505060;
}

.sidebar-nav a i {
    margin-right: 10px;
    font-size: 18px;
}

.sidebar-nav li.active a {
    background-color: rgba(77, 182, 255, 0.1);
    border-left-color: var(--primary-color);
}

body.dark-theme .sidebar-nav li:hover a {
    background-color: rgba(255, 255, 255, 0.05);
}

body.light-theme .sidebar-nav li:hover a {
    background-color: rgba(0, 0, 0, 0.05);
}

/* 主内容区域 */
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    padding: 20px;
    transition: all 0.3s ease;
}

/* 头部区域 */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
}

body.dark-theme header {
    border-bottom: 1px solid var(--dark-border);
}

body.light-theme header {
    border-bottom: 1px solid var(--light-border);
}

.header-title h1 {
    font-size: 24px;
    font-weight: bold;
}

.user-actions {
    display: flex;
    align-items: center;
}

.date-time {
    margin-right: 15px;
    font-size: 14px;
    color: #999;
}

/* 卡片样式 */
.card {
    border-radius: var(--card-radius);
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.3s ease;
}

body.dark-theme .card {
    background-color: var(--dark-card);
    border: 1px solid var(--dark-border);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

body.light-theme .card {
    background-color: var(--light-card);
    border: 1px solid var(--light-border);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.card-header {
    padding: 15px 20px;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

body.dark-theme .card-header {
    border-bottom: 1px solid var(--dark-border);
}

body.light-theme .card-header {
    border-bottom: 1px solid var(--light-border);
}

.card-body {
    padding: 20px;
}

/* 按钮样式 */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: var(--btn-radius);
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.btn i {
    margin-right: 5px;
}

.btn-sm {
    padding: 6px 12px;
    font-size: 13px;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background-color: #3da5ee;
}

.btn-danger {
    background-color: var(--danger-color);
    color: white;
}

.btn-danger:hover {
    background-color: #ee5d3d;
}

.btn-outline-primary {
    background-color: transparent;
    border: 1px solid var(--primary-color);
    color: var(--primary-color);
}

.btn-outline-primary:hover {
    background-color: rgba(77, 182, 255, 0.1);
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 统计卡片 */
.stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    border-radius: var(--card-radius);
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

body.dark-theme .stat-card {
    background-color: var(--dark-card);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

body.light-theme .stat-card {
    background-color: var(--light-card);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stat-card.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 24px;
}

.cpu-icon {
    background-color: rgba(77, 182, 255, 0.2);
    background-image: url("../img/cpu.svg");
}

.memory-icon {
    background-color: rgba(77, 255, 189, 0.2);
    background-image: url("../img/memory.svg");
}

.clock-icon {
    background-color: rgba(189, 77, 255, 0.2);
    background-image: url("../img/clock.svg");
}

.wallet-icon {
    background-color: rgba(255, 191, 77, 0.2);
    background-image: url("../img/wallet.svg");
}

.stat-info {
    flex: 1;
}

.stat-info h3 {
    font-size: 14px;
    margin-bottom: 5px;
    opacity: 0.8;
}

.stat-info p {
    font-size: 22px;
    font-weight: bold;
}

/* 图表容器 */
.charts-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.chart-card {
    border-radius: var(--card-radius);
    overflow: hidden;
}

body.dark-theme .chart-card {
    background-color: var(--dark-card);
    border: 1px solid var(--dark-border);
}

body.light-theme .chart-card {
    background-color: var(--light-card);
    border: 1px solid var(--light-border);
}

.chart-header {
    padding: 15px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

body.dark-theme .chart-header {
    border-bottom: 1px solid var(--dark-border);
}

body.light-theme .chart-header {
    border-bottom: 1px solid var(--light-border);
}

.chart-header h3 {
    font-size: 16px;
    font-weight: bold;
}

.chart-header span {
    font-size: 12px;
    opacity: 0.7;
}

.chart-body {
    padding: 15px;
    height: 300px;
    position: relative;
}

.table-container {
    height: 100%;
    overflow-y: auto;
}

/* 状态指示器 */
.status-wrapper {
    padding: 20px;
}

.bot-status {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 8px;
}

.status-running {
    background-color: var(--success-color);
    box-shadow: 0 0 0 4px rgba(77, 255, 189, 0.2);
}

.status-stopped {
    background-color: var(--danger-color);
    box-shadow: 0 0 0 4px rgba(255, 110, 77, 0.2);
}

.bot-controls {
    display: flex;
    gap: 10px;
}

/* 系统消息 */
.system-messages {
    margin-bottom: 20px;
    min-height: 40px;
}

.message {
    padding: 10px 15px;
    border-radius: var(--card-radius);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    animation: fadeIn 0.3s ease;
}

.message-icon {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
}

.message-text {
    flex: 1;
}

.message-info {
    background-color: rgba(77, 182, 255, 0.1);
    border-left: 4px solid var(--primary-color);
}

.message-success {
    background-color: rgba(77, 255, 189, 0.1);
    border-left: 4px solid var(--success-color);
}

.message-warning {
    background-color: rgba(255, 191, 77, 0.1);
    border-left: 4px solid var(--warning-color);
}

.message-error {
    background-color: rgba(255, 110, 77, 0.1);
    border-left: 4px solid var(--danger-color);
}

.message.fade-out {
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.5s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 表格样式 */
table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 12px 15px;
    text-align: left;
}

body.dark-theme th {
    border-bottom: 1px solid var(--dark-border);
}

body.light-theme th {
    border-bottom: 1px solid var(--light-border);
}

body.dark-theme tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

body.light-theme tbody tr:hover {
    background-color: rgba(0, 0, 0, 0.02);
}

.status {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.success {
    background-color: rgba(77, 255, 189, 0.2);
    color: var(--success-color);
}

.pending {
    background-color: rgba(255, 191, 77, 0.2);
    color: var(--warning-color);
}

.failed {
    background-color: rgba(255, 110, 77, 0.2);
    color: var(--danger-color);
}

.profit {
    color: var(--success-color);
    font-weight: bold;
}

.risk-level {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.low {
    background-color: rgba(77, 255, 189, 0.2);
    color: var(--success-color);
}

.medium {
    background-color: rgba(255, 191, 77, 0.2);
    color: var(--warning-color);
}

.high {
    background-color: rgba(255, 110, 77, 0.2);
    color: var(--danger-color);
}

/* 响应式设计 */
@media (max-width: 1200px) {
    .stats-cards {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 991px) {
    .charts-container {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .sidebar {
        width: 70px;
    }
    
    .sidebar-header h2 {
        display: none;
    }
    
    .sidebar-nav a span {
        display: none;
    }
    
    .main-content {
        margin-left: 70px;
    }
    
    .stats-cards {
        grid-template-columns: 1fr;
    }
}
EOL

# 创建样式文件
echo "创建style.css文件..."
cat > style.css << 'EOL'
/**
 * 额外的样式补充
 */

/* 图标字体类 */
[class^="icon-"] {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
}

.icon-dashboard {
    background-image: url('../img/dashboard.svg');
}

.icon-pools {
    background-image: url('../img/pools.svg');
}

.icon-tokens {
    background-image: url('../img/tokens.svg');
}

.icon-trades {
    background-image: url('../img/trades.svg');
}

.icon-memory {
    background-image: url('../img/system.svg');
}

.icon-settings {
    background-image: url('../img/settings.svg');
}

.icon-play {
    background-image: url('../img/play.svg');
}

.icon-stop {
    background-image: url('../img/stop.svg');
}

/* 美化滚动条 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: rgba(150, 150, 150, 0.3);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(150, 150, 150, 0.5);
}

/* 标签页 */
.tabs {
    display: flex;
    border-bottom: 1px solid var(--dark-border);
    margin-bottom: 20px;
}

.tab {
    padding: 10px 20px;
    cursor: pointer;
    position: relative;
}

.tab.active {
    color: var(--primary-color);
}

.tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--primary-color);
}

/* 加载效果 */
.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 布局辅助 */
.mt-20 {
    margin-top: 20px;
}

.mb-20 {
    margin-bottom: 20px;
}

.mr-10 {
    margin-right: 10px;
}

.ml-10 {
    margin-left: 10px;
}

.p-20 {
    padding: 20px;
}

.d-flex {
    display: flex;
}

.align-center {
    align-items: center;
}

.justify-between {
    justify-content: space-between;
}

.flex-wrap {
    flex-wrap: wrap;
}

.gap-10 {
    gap: 10px;
}

.gap-20 {
    gap: 20px;
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.fs-12 {
    font-size: 12px;
}

.fs-14 {
    font-size: 14px;
}

.fs-16 {
    font-size: 16px;
}

.fs-18 {
    font-size: 18px;
}

.fw-bold {
    font-weight: bold;
}

.text-success {
    color: var(--success-color);
}

.text-warning {
    color: var(--warning-color);
}

.text-danger {
    color: var(--danger-color);
}

.text-primary {
    color: var(--primary-color);
}

.text-muted {
    opacity: 0.7;
}

/* 交易指标 */
.trade-metrics {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
}

.metric-card {
    flex: 1;
    min-width: 200px;
    padding: 15px;
    border-radius: var(--card-radius);
    background-color: var(--dark-card);
    border: 1px solid var(--dark-border);
}

.metric-title {
    font-size: 14px;
    margin-bottom: 8px;
    opacity: 0.8;
}

.metric-value {
    font-size: 22px;
    font-weight: bold;
}

.metric-change {
    margin-top: 5px;
    font-size: 12px;
}

.change-up {
    color: var(--success-color);
}

.change-down {
    color: var(--danger-color);
}

/* 设置界面 */
.settings-group {
    margin-bottom: 30px;
}

.settings-title {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--dark-border);
}

.settings-item {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.item-label {
    flex: 1;
}

.item-label h4 {
    font-size: 15px;
    margin-bottom: 5px;
}

.item-label p {
    font-size: 12px;
    opacity: 0.7;
}

.item-control {
    width: 200px;
}

/* 开关样式 */
.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: var(--primary-color);
}

input:focus + .slider {
    box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .slider:before {
    transform: translateX(26px);
}

/* 输入框样式 */
.form-control {
    width: 100%;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--dark-border);
    background-color: var(--dark-card);
    color: var(--dark-text);
    transition: all 0.3s;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(77, 182, 255, 0.2);
}

/* 选择框样式 */
.form-select {
    width: 100%;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--dark-border);
    background-color: var(--dark-card);
    color: var(--dark-text);
    transition: all 0.3s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23e0e0e0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
}

.form-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(77, 182, 255, 0.2);
}
EOL

# 创建CSS目录
echo "创建必要的CSS目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_ui_css/css"

# 上传CSS文件
echo "上传CSS文件..."
scp -i $SSH_KEY_PATH main.css style.css $SSH_USER@$SSH_HOST:~/temp_ui_css/css/

# 移动文件到正确位置
echo "移动文件到Web根目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo mv ~/temp_ui_css/css/* /home/ubuntu/public/css/ && sudo chown www-data:www-data /home/ubuntu/public/css/*"

# 创建图片目录
echo "创建图片目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_ui_css/img"

# 生成基本的SVG图标
echo "生成基本图标..."
cat > logo.svg << 'EOL'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="95" stroke="#4DB6FF" stroke-width="8"/>
  <circle cx="100" cy="100" r="70" stroke="#BD4DFF" stroke-width="5"/>
  <path d="M100 30V100L140 60" stroke="#4DFFBD" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
EOL

# 上传图标
echo "上传图标..."
scp -i $SSH_KEY_PATH logo.svg $SSH_USER@$SSH_HOST:~/temp_ui_css/img/

# 移动图标到正确位置
echo "移动图标到Web根目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p /home/ubuntu/public/img && sudo mv ~/temp_ui_css/img/* /home/ubuntu/public/img/ && sudo chown www-data:www-data /home/ubuntu/public/img/*"

# 清理临时文件
echo "清理临时文件..."
rm -f main.css style.css logo.svg
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "rm -rf ~/temp_ui_css"

# 重启Nginx
echo "重启Nginx..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo systemctl restart nginx"

echo "===== 恢复完成 ====="
echo "现代UI的CSS样式已恢复，请刷新页面查看效果" 