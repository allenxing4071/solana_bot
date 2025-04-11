#!/bin/bash
# 恢复现代UI版本的dashboard.js文件

set -e  # 遇到错误立即停止

# 从.env文件读取配置
SSH_HOST=$(grep SSH_HOST .env | cut -d'=' -f2)
SSH_USER=$(grep SSH_USER .env | cut -d'=' -f2)
SSH_KEY_PATH=$(grep SSH_KEY_PATH .env | cut -d'=' -f2)

echo "===== 开始恢复现代UI的dashboard.js ====="

# 创建临时目录
echo "创建临时目录..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "mkdir -p ~/temp_ui_restore"

# 创建dashboard.js文件
echo "创建dashboard.js文件..."
cat > dashboard.js << 'EOL'
/**
 * 仪表盘主要功能
 * 用于控制仪表盘的数据获取、图表渲染和用户交互
 */

// 全局变量
let statsRefreshInterval;
let memoryChart = null;
let cpuChart = null;
let profitChart = null;
let tokenChart = null;

// DOM就绪后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('仪表盘初始化...');
    
    // 初始化图表
    initCharts();
    
    // 加载初始数据
    loadDashboardData();
    
    // 设置自动刷新
    statsRefreshInterval = setInterval(loadDashboardData, 5000);
    
    // 设置时间更新
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // 绑定按钮事件
    document.getElementById('refreshBtn').addEventListener('click', function() {
        showMessage('刷新数据中...', 'info');
        loadDashboardData(true);
    });
    
    document.getElementById('startBtn').addEventListener('click', startSystem);
    document.getElementById('stopBtn').addEventListener('click', stopSystem);
    
    // 检查系统状态
    checkSystemStatus();
});

// 初始化图表
function initCharts() {
    // 获取当前主题
    const isDarkTheme = document.body.classList.contains('dark-theme');
    const chartTextColor = isDarkTheme ? '#e0e0e0' : '#333333';
    const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // 配置图表默认样式
    Chart.defaults.color = chartTextColor;
    Chart.defaults.borderColor = gridColor;
    
    // 内存使用趋势图
    const memoryCtx = document.getElementById('memoryUsageChart').getContext('2d');
    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '内存使用率 (%)',
                data: [],
                borderColor: '#4db6ff',
                backgroundColor: 'rgba(77, 182, 255, 0.2)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: '使用率 (%)'
                    }
                }
            }
        }
    });
    
    // 利润趋势图
    const profitCtx = document.getElementById('profitTrendChart').getContext('2d');
    profitChart = new Chart(profitCtx, {
        type: 'bar',
        data: {
            labels: ['一', '二', '三', '四', '五', '六', '日'],
            datasets: [{
                label: '收益 (SOL)',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: '#4dffbd',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // 代币发现趋势
    const tokenCtx = document.getElementById('tokenDiscoveryChart').getContext('2d');
    tokenChart = new Chart(tokenCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '新发现代币',
                data: [],
                borderColor: '#bd4dff',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// 加载仪表盘数据
async function loadDashboardData(showLoading = false) {
    if (showLoading) {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.classList.add('loading');
        });
    }
    
    try {
        // 获取系统状态数据
        const response = await fetch('/api/system/status');
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '获取数据失败');
        }
        
        // 更新UI数据
        updateDashboardStats(data.data);
        
        if (showLoading) {
            showMessage('数据已刷新', 'success');
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        
        if (showLoading) {
            showMessage('无法加载数据: ' + error.message, 'error');
            // 使用模拟数据
            updateDashboardStats(generateMockData());
        }
    } finally {
        if (showLoading) {
            document.querySelectorAll('.stat-card').forEach(card => {
                card.classList.remove('loading');
            });
        }
    }
}

// 更新仪表盘统计数据
function updateDashboardStats(data) {
    // 更新基本指标
    document.getElementById('cpuUsage').textContent = `${data.cpu.toFixed(1)}%`;
    document.getElementById('memoryUsage').textContent = `${data.memory.toFixed(1)}%`;
    document.getElementById('uptime').textContent = formatUptime(data.uptime);
    document.getElementById('totalProfit').textContent = `${data.profit.toFixed(4)} SOL`;
    
    // 更新内存使用图表
    if (data.memoryHistory && data.memoryHistory.length > 0) {
        updateMemoryChart(data.memoryHistory);
    }
    
    // 更新其他图表（这里使用随机数据模拟，实际应使用真实数据）
    updateMockCharts();
}

// 更新内存使用图表
function updateMemoryChart(memoryHistory) {
    // 提取最新的20个数据点
    const historyLimit = 20;
    const limitedHistory = memoryHistory.slice(-historyLimit);
    
    // 格式化时间标签
    const labels = limitedHistory.map(entry => {
        const date = new Date(entry.time);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    // 提取值
    const values = limitedHistory.map(entry => entry.value);
    
    // 更新图表
    memoryChart.data.labels = labels;
    memoryChart.data.datasets[0].data = values;
    memoryChart.update();
}

// 更新模拟图表数据（用于演示）
function updateMockCharts() {
    // 生成7天随机收益数据
    const profitData = Array(7).fill(0).map(() => (Math.random() * 0.5).toFixed(4));
    profitChart.data.datasets[0].data = profitData;
    profitChart.update();
    
    // 生成12小时代币发现数据
    const hours = Array(12).fill(0).map((_, i) => `${(24-12+i)%24}:00`);
    const tokenData = Array(12).fill(0).map(() => Math.floor(Math.random() * 12));
    
    tokenChart.data.labels = hours;
    tokenChart.data.datasets[0].data = tokenData;
    tokenChart.update();
}

// 生成模拟数据
function generateMockData() {
    // 生成内存历史记录
    const memoryHistory = [];
    const now = Date.now();
    
    for (let i = 0; i < 20; i++) {
        memoryHistory.push({
            time: now - (19 - i) * 5 * 60 * 1000, // 每5分钟一个点
            value: 30 + Math.random() * 40 // 30%-70%随机值
        });
    }
    
    return {
        cpu: 20 + Math.random() * 30,
        memory: 40 + Math.random() * 20,
        uptime: Math.floor(Math.random() * 86400), // 0-24小时随机
        profit: Math.random() * 1,
        memoryHistory: memoryHistory
    };
}

// 格式化运行时间
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}小时 ${minutes}分钟 ${secs}秒`;
}

// 更新日期时间显示
function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('currentDateTime');
    
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    dateTimeElement.textContent = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 显示消息提示
function showMessage(message, type = 'info') {
    const messagesContainer = document.getElementById('systemMessages');
    
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <span class="message-icon"></span>
        <span class="message-text">${message}</span>
    `;
    
    // 添加到容器
    messagesContainer.appendChild(messageElement);
    
    // 2秒后自动消失
    setTimeout(() => {
        messageElement.classList.add('fade-out');
        setTimeout(() => {
            if (messagesContainer.contains(messageElement)) {
                messagesContainer.removeChild(messageElement);
            }
        }, 500);
    }, 2000);
}

// 检查系统状态
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/system/status');
        if (!response.ok) {
            updateStatusUI(false);
            return;
        }
        
        const data = await response.json();
        // 检查系统是否在运行
        const isRunning = data.data && data.data.status === 'running';
        updateStatusUI(isRunning);
    } catch (error) {
        console.error('检查系统状态失败:', error);
        updateStatusUI(false);
    }
}

// 更新状态UI
function updateStatusUI(isRunning) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (isRunning) {
        statusIndicator.className = 'status-indicator status-running';
        statusText.textContent = '系统运行中';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusIndicator.className = 'status-indicator status-stopped';
        statusText.textContent = '系统已停止';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

// 启动系统
async function startSystem() {
    try {
        showMessage('启动系统中...', 'info');
        
        const response = await fetch('/api/system/start', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('启动请求失败');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '无法启动系统');
        }
        
        updateStatusUI(true);
        showMessage('系统已启动', 'success');
    } catch (error) {
        console.error('启动系统失败:', error);
        showMessage('启动系统失败: ' + error.message, 'error');
    }
}

// 停止系统
async function stopSystem() {
    try {
        showMessage('停止系统中...', 'info');
        
        const response = await fetch('/api/system/stop', {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error('停止请求失败');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || '无法停止系统');
        }
        
        updateStatusUI(false);
        showMessage('系统已停止', 'warning');
    } catch (error) {
        console.error('停止系统失败:', error);
        showMessage('停止系统失败: ' + error.message, 'error');
    }
}
EOL

# 上传dashboard.js
echo "上传dashboard.js..."
scp -i $SSH_KEY_PATH dashboard.js $SSH_USER@$SSH_HOST:~/temp_ui_restore/dashboard.js

# 移动文件到正确位置
echo "移动文件到正确位置..."
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "sudo mv ~/temp_ui_restore/dashboard.js /home/ubuntu/public/js/ && sudo chown www-data:www-data /home/ubuntu/public/js/dashboard.js"

# 清理临时文件
echo "清理临时文件..."
rm -f dashboard.js
ssh -i $SSH_KEY_PATH $SSH_USER@$SSH_HOST "rm -rf ~/temp_ui_restore"

echo "===== 恢复完成 ====="
echo "现代UI的dashboard.js已恢复，请刷新页面查看效果" 