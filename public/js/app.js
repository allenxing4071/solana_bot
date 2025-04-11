// MEV机器人管理界面JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initApp();

    // 绑定按钮事件
    document.getElementById('start-bot').addEventListener('click', startBot);
    document.getElementById('stop-bot').addEventListener('click', stopBot);
    document.getElementById('refresh-status').addEventListener('click', getSystemStatus);
    document.getElementById('clear-logs').addEventListener('click', clearLogs);
    document.getElementById('time-period').addEventListener('change', updateTimeframeStats);
});

// 全局变量
const API_BASE_URL = '/api';
let botStatus = 'stopped';
let logUpdateInterval;
let statsUpdateInterval;

// 初始化应用
async function initApp() {
    try {
        // 获取系统状态
        await getSystemStatus();
        
        // 初始化图表
        initCharts();
        
        // 设置自动刷新
        logUpdateInterval = setInterval(fetchLatestLogs, 5000);
        statsUpdateInterval = setInterval(fetchSystemStats, 10000);
        
        // 添加第一条日志
        addLog('系统初始化完成', 'info');
    } catch (error) {
        addLog('初始化失败: ' + error.message, 'error');
    }
}

// 获取系统状态
async function getSystemStatus() {
    try {
        showLoader('status-container');
        
        // 这里模拟API调用，实际实现时替换为真实的后端API请求
        // const response = await fetch(`${API_BASE_URL}/status`);
        // const data = await response.json();
        
        // 模拟数据，实际项目中删除
        const data = {
            status: Math.random() > 0.5 ? 'running' : 'stopped',
            uptime: Math.floor(Math.random() * 1000000),
            memoryUsage: Math.floor(Math.random() * 1000),
            tokenCount: Math.floor(Math.random() * 100),
            poolCount: Math.floor(Math.random() * 500),
            rpcStatus: 'connected',
            version: '1.0.0'
        };
        
        // 更新状态
        updateStatusUI(data);
        hideLoader('status-container');
        
        // 获取最新统计数据
        fetchSystemStats();
        
        // 添加日志
        addLog('系统状态已刷新', 'info');
    } catch (error) {
        hideLoader('status-container');
        addLog('获取状态失败: ' + error.message, 'error');
    }
}

// 更新状态UI
function updateStatusUI(data) {
    // 保存当前状态
    botStatus = data.status;
    
    // 更新状态指示器
    const statusIndicator = document.getElementById('status-indicator');
    statusIndicator.className = 'status-indicator status-' + data.status;
    document.getElementById('status-text').textContent = data.status === 'running' ? '运行中' : '已停止';
    
    // 根据状态调整按钮可用性
    document.getElementById('start-bot').disabled = data.status === 'running';
    document.getElementById('stop-bot').disabled = data.status === 'stopped';
    
    // 更新系统信息
    document.getElementById('uptime').textContent = formatUptime(data.uptime);
    document.getElementById('memory-usage').textContent = `${data.memoryUsage} MB`;
    document.getElementById('token-count').textContent = data.tokenCount;
    document.getElementById('pool-count').textContent = data.poolCount;
    document.getElementById('rpc-status').textContent = data.rpcStatus;
    document.getElementById('bot-version').textContent = data.version;
}

// 启动机器人
async function startBot() {
    try {
        addLog('正在启动机器人...', 'info');
        showLoader('control-container');
        
        // 这里模拟API调用，实际实现时替换为真实的后端API请求
        // const response = await fetch(`${API_BASE_URL}/start`, { method: 'POST' });
        // const data = await response.json();
        
        // 模拟成功启动
        setTimeout(() => {
            hideLoader('control-container');
            addLog('机器人已成功启动', 'info');
            
            // 更新状态
            document.getElementById('status-indicator').className = 'status-indicator status-running';
            document.getElementById('status-text').textContent = '运行中';
            document.getElementById('start-bot').disabled = true;
            document.getElementById('stop-bot').disabled = false;
            botStatus = 'running';
        }, 1500);
    } catch (error) {
        hideLoader('control-container');
        addLog('启动失败: ' + error.message, 'error');
    }
}

// 停止机器人
async function stopBot() {
    try {
        addLog('正在停止机器人...', 'info');
        showLoader('control-container');
        
        // 这里模拟API调用，实际实现时替换为真实的后端API请求
        // const response = await fetch(`${API_BASE_URL}/stop`, { method: 'POST' });
        // const data = await response.json();
        
        // 模拟成功停止
        setTimeout(() => {
            hideLoader('control-container');
            addLog('机器人已成功停止', 'info');
            
            // 更新状态
            document.getElementById('status-indicator').className = 'status-indicator status-stopped';
            document.getElementById('status-text').textContent = '已停止';
            document.getElementById('start-bot').disabled = false;
            document.getElementById('stop-bot').disabled = true;
            botStatus = 'stopped';
        }, 1500);
    } catch (error) {
        hideLoader('control-container');
        addLog('停止失败: ' + error.message, 'error');
    }
}

// 获取最新日志
async function fetchLatestLogs() {
    try {
        // 这里模拟API调用，实际实现时替换为真实的后端API请求
        // const response = await fetch(`${API_BASE_URL}/logs?limit=10`);
        // const data = await response.json();
        
        // 模拟日志数据
        if (Math.random() > 0.7) {
            const logTypes = ['info', 'warning', 'error'];
            const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
            const messages = [
                '检测到新的交易池',
                '处理交易机会',
                '执行交易',
                '风险检查通过',
                '价格检查完成',
                'RPC请求超时',
                '节点连接重试中',
                '找到套利机会',
                '检测到新代币',
                '更新价格缓存'
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            addLog(message, logType);
        }
    } catch (error) {
        console.error('获取日志失败:', error);
    }
}

// 获取系统统计信息
async function fetchSystemStats() {
    try {
        // 这里模拟API调用，实际实现时替换为真实的后端API请求
        // const response = await fetch(`${API_BASE_URL}/stats`);
        // const data = await response.json();
        
        // 模拟统计数据
        const data = {
            newTokens: {
                today: Math.floor(Math.random() * 20),
                week: Math.floor(Math.random() * 100),
                month: Math.floor(Math.random() * 300)
            },
            trades: {
                today: Math.floor(Math.random() * 10),
                week: Math.floor(Math.random() * 50),
                month: Math.floor(Math.random() * 150)
            },
            profit: {
                today: (Math.random() * 2).toFixed(3),
                week: (Math.random() * 10).toFixed(3),
                month: (Math.random() * 30).toFixed(3)
            },
            recentTokens: [
                { symbol: 'SOLMEV', address: '7nGAzQiTPVfxHjxcXDNgkMPgywvt9jJRR5Q12Adau5Em', time: '10分钟前' },
                { symbol: 'RAYBOT', address: '8YJV7YLWJFAhH87Y9stwpNyixPJpTZZ2QyBcZtMnZQwF', time: '25分钟前' },
                { symbol: 'ORCAAI', address: '5GZCkYqzQpwdMXhxSrX4Vc7uDiPPsNsLNM15A9dKbXsK', time: '45分钟前' }
            ],
            recentTrades: [
                { token: 'SOLMEV', profit: '+0.25 SOL', time: '15分钟前', status: '成功' },
                { token: 'RAYBOT', profit: '+0.12 SOL', time: '40分钟前', status: '成功' },
                { token: 'ORCAAI', profit: '-0.05 SOL', time: '1小时前', status: '失败' }
            ]
        };
        
        // 更新统计信息
        updateStatsUI(data);
        updateCharts(data);
    } catch (error) {
        console.error('获取统计信息失败:', error);
    }
}

// 更新统计信息UI
function updateStatsUI(data) {
    // 获取当前选中的时间范围
    const timeframe = document.getElementById('time-period').value;
    
    // 更新数字统计
    document.getElementById('new-tokens-count').textContent = data.newTokens[timeframe];
    document.getElementById('trades-count').textContent = data.trades[timeframe];
    document.getElementById('profit-value').textContent = data.profit[timeframe] + ' SOL';
    
    // 更新最近代币列表
    const tokensContainer = document.getElementById('recent-tokens');
    tokensContainer.innerHTML = '';
    data.recentTokens.forEach(token => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${token.symbol}</td>
            <td><span class="address-abbr" title="${token.address}">${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}</span></td>
            <td>${token.time}</td>
        `;
        tokensContainer.appendChild(row);
    });
    
    // 更新最近交易列表
    const tradesContainer = document.getElementById('recent-trades');
    tradesContainer.innerHTML = '';
    data.recentTrades.forEach(trade => {
        const row = document.createElement('tr');
        const isProfitable = trade.profit.startsWith('+');
        row.innerHTML = `
            <td>${trade.token}</td>
            <td class="${isProfitable ? 'text-success' : 'text-danger'}">${trade.profit}</td>
            <td>${trade.time}</td>
            <td><span class="badge ${trade.status === '成功' ? 'bg-success' : 'bg-danger'}">${trade.status}</span></td>
        `;
        tradesContainer.appendChild(row);
    });
}

// 初始化图表
function initCharts() {
    // 使用Chart.js（实际项目中需要引入此库）
    // 以下是模拟，实际项目中删除注释并实现
    console.log('图表初始化');
}

// 更新图表数据
function updateCharts(data) {
    // 更新图表数据（模拟）
    console.log('图表数据更新');
}

// 添加日志条目
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('operation-log');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    // 将新日志添加到顶部
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    // 限制日志条数
    if (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// 清除日志
function clearLogs() {
    document.getElementById('operation-log').innerHTML = '';
    addLog('日志已清除', 'info');
}

// 更新时间段统计
function updateTimeframeStats() {
    fetchSystemStats();
}

// 显示加载动画
function showLoader(containerId) {
    const container = document.getElementById(containerId);
    const loader = document.createElement('div');
    loader.className = 'spinner-border text-primary loader';
    loader.setAttribute('role', 'status');
    loader.innerHTML = '<span class="visually-hidden">加载中...</span>';
    
    // 添加加载指示器
    if (container) {
        container.appendChild(loader);
    }
}

// 隐藏加载动画
function hideLoader(containerId) {
    const container = document.getElementById(containerId);
    const loader = container.querySelector('.loader');
    
    if (loader) {
        container.removeChild(loader);
    }
}

// 格式化运行时间
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days}天 `;
    if (hours > 0) result += `${hours}小时 `;
    result += `${minutes}分钟`;
    
    return result;
} 