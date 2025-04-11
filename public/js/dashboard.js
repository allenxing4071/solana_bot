/**
 * Solana MEV 机器人 - 系统监控大屏
 * 用于展示系统内存使用情况和性能指标的数据可视化界面
 */

// 全局变量
let memoryHistoryChart = null;
let performanceChart = null;
let systemData = {
    cpu: 0,
    memory: 0,
    uptime: 0,
    profit: 0,
    monitoredTokens: 0,
    activePools: 0,
    executedTrades: 0,
    memoryDetails: {
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
        rss: 0
    },
    memoryHistory: [],
    isRealData: true // 添加数据来源标记，true表示真实数据，false表示模拟数据
};

// 系统状态变量
let botRunning = false;

// 主题设置 - 默认为暗色主题
const isDarkTheme = localStorage.getItem('darkTheme') !== 'false';
document.body.classList.add(isDarkTheme ? 'dark-theme' : 'light-theme');

// 当前主题
const currentTheme = isDarkTheme ? 'dark' : 'light';

// 添加主题状态追踪变量和防抖计时器
let themeTogglePending = false;
let themeToggleTimer = null;

// 获取DOM元素
const elements = {
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    cpuUsage: document.getElementById('cpuUsage'),
    cpuBar: document.getElementById('cpuBar'),
    memoryUsage: document.getElementById('memoryUsage'),
    memoryBar: document.getElementById('memoryBar'),
    uptime: document.getElementById('uptime'),
    totalProfit: document.getElementById('totalProfit'),
    monitoredTokens: document.getElementById('monitoredTokens'),
    activePools: document.getElementById('activePools'),
    executedTrades: document.getElementById('executedTrades'),
    logContainer: document.getElementById('logContainer'),
    tradesTableBody: document.getElementById('tradesTableBody'),
    tokensTableBody: document.getElementById('tokensTableBody'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    refreshData: document.getElementById('refreshData'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    lastUpdated: document.getElementById('lastUpdated')
};

// 图表实例
let tokenDiscoveryChart = null;
let profitTrendChart = null;

// 日志数据
let logEntries = [];

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('开始初始化仪表盘...');
        
        // 设置事件监听器
        setupEventListeners();
        
        // 尝试初始化图表
        initializeCharts();
        
        // 初始数据加载
        fetchSystemData();
        setInterval(fetchSystemData, 5000); // 每5秒更新一次
        
        // 添加初始日志
        addLog('仪表盘初始化完成', 'info');
        
        console.log('仪表盘初始化完成');
    } catch (err) {
        console.error('初始化失败:', err);
        // 显示错误提示
        const errorMsg = `初始化失败: ${err.message}`;
        if (document.getElementById('logContainer')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorMsg;
            document.getElementById('logContainer').appendChild(errorDiv);
        } else {
            alert(errorMsg);
        }
    }
});

// 设置事件监听器
function setupEventListeners() {
    // 启动/停止按钮
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', () => toggleBotStatus(true));
    }
    
    if (elements.stopBtn) {
        elements.stopBtn.addEventListener('click', () => toggleBotStatus(false));
    }
    
    // 刷新按钮
    if (elements.refreshData) {
        elements.refreshData.addEventListener('click', () => {
            fetchSystemData(true);
        });
    }
    
    // 清空日志按钮
    if (elements.clearLogsBtn) {
        elements.clearLogsBtn.addEventListener('click', () => {
            clearLogs();
        });
    }
    
    // 主题切换按钮
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', () => {
            toggleTheme();
        });
    }
}

// 初始化图表
function initializeCharts() {
    try {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 未加载，无法初始化图表');
            setTimeout(initializeCharts, 1000); // 1秒后重试
            return;
        }
        
        console.log('初始化图表...');
        
        // 定义当前主题配置
        const theme = {
            light: {
                gridColor: 'rgba(0, 0, 0, 0.1)',
                tickColor: '#6c757d'
            },
            dark: {
                gridColor: 'rgba(255, 255, 255, 0.1)',
                tickColor: '#b0b0cc'
            }
        };
        
        const isDark = document.body.classList.contains('dark-theme');
        const selectedTheme = theme[isDark ? 'dark' : 'light'];
        
        // 代币发现趋势图
        const tokenChartCtx = document.getElementById('tokenDiscoveryChart');
        if (!tokenChartCtx) {
            console.error('找不到tokenDiscoveryChart元素');
            return;
        }
        
        tokenDiscoveryChart = new Chart(tokenChartCtx, {
            type: 'line',
            data: {
                labels: Array(12).fill('').map((_, i) => `-${12-i}h`),
                datasets: [{
                    label: '新代币',
                    data: Array(12).fill(0).map(() => Math.floor(Math.random() * 10)),
                    borderColor: '#6a4dff',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            color: selectedTheme.tickColor
                        },
                        grid: {
                            color: selectedTheme.gridColor
                        }
                    },
                    x: {
                        grid: {
                            color: selectedTheme.gridColor
                        },
                        ticks: {
                            color: selectedTheme.tickColor
                        }
                    }
                }
            }
        });
        
        // 利润趋势图
        const profitChartCtx = document.getElementById('profitTrendChart');
        if (!profitChartCtx) {
            console.error('找不到profitTrendChart元素');
            return;
        }
        
        profitTrendChart = new Chart(profitChartCtx, {
            type: 'bar',
            data: {
                labels: Array(7).fill('').map((_, i) => `Day ${i+1}`),
                datasets: [{
                    label: '收益 (SOL)',
                    data: Array(7).fill(0).map(() => (Math.random() * 0.5).toFixed(3)),
                    backgroundColor: '#4dffbd',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: selectedTheme.tickColor
                        },
                        grid: {
                            color: selectedTheme.gridColor
                        }
                    },
                    x: {
                        grid: {
                            color: selectedTheme.gridColor
                        },
                        ticks: {
                            color: selectedTheme.tickColor
                        }
                    }
                }
            }
        });
        
        console.log('图表初始化完成');
    } catch (err) {
        console.error('初始化图表失败:', err);
    }
}

// 获取系统数据
async function fetchSystemData(showLoading = false) {
    if (showLoading) {
        addLog('正在刷新系统数据...', 'info');
    }
    
    try {
        console.log('开始获取系统数据...');
        // 尝试从API获取数据
        try {
            const response = await fetch('/api/system/status', { timeout: 3000 });
            const responseData = await response.json();
            
            if (!responseData.success) {
                throw new Error(responseData.error || '获取数据失败');
            }
            
            // 更新系统数据 - 注意data嵌套层次
            const data = responseData.data;
            console.log('API数据获取成功:', data);
            
            // 标记为真实数据
            data.isRealData = true;
            
            // 更新系统数据
            updateDashboard(data);
            
            if (showLoading) {
                addLog('系统数据刷新完成', 'info');
            }
            
            // 更新最后更新时间
            updateLastUpdated();
        } catch (apiError) {
            console.warn('API请求失败，使用模拟数据', apiError);
            // 使用模拟数据
            const mockData = generateMockSystemData();
            // 标记为模拟数据
            mockData.isRealData = false;
            updateDashboard(mockData);
            
            if (showLoading) {
                addLog('使用模拟数据更新界面', 'warning');
            }
            
            // 更新最后更新时间
            updateLastUpdated();
        }
    } catch (error) {
        console.error('获取系统数据失败', error);
        
        if (showLoading) {
            addLog(`获取系统数据失败: ${error.message}`, 'error');
        }
        
        // 使用模拟数据
        const mockData = generateMockSystemData();
        // 标记为模拟数据
        mockData.isRealData = false;
        updateDashboard(mockData);
        
        // 更新最后更新时间
        updateLastUpdated();
    }
}

// 更新仪表盘
function updateDashboard(data) {
    // 更新系统数据
    Object.assign(systemData, data);
    
    // 判断是否为模拟数据
    const mockPrefix = systemData.isRealData === false ? '【模拟】' : '';
    
    // 更新状态指标
    if (elements.cpuUsage) {
        elements.cpuUsage.textContent = `${mockPrefix}${systemData.cpu.toFixed(1)}%`;
    }
    if (elements.cpuBar) {
        elements.cpuBar.style.width = `${systemData.cpu}%`;
    }
    
    if (elements.memoryUsage) {
        elements.memoryUsage.textContent = `${mockPrefix}${systemData.memory.toFixed(1)}%`;
    }
    if (elements.memoryBar) {
        elements.memoryBar.style.width = `${systemData.memory}%`;
    }
    
    // 更新运行时间
    if (elements.uptime) {
        elements.uptime.textContent = `${mockPrefix}${formatUptime(systemData.uptime)}`;
    }
    
    // 更新收益
    if (elements.totalProfit) {
        elements.totalProfit.textContent = `${mockPrefix}${systemData.profit.toFixed(4)} SOL`;
    }
    
    // 更新统计数据
    if (elements.monitoredTokens) {
        elements.monitoredTokens.textContent = `${mockPrefix}${systemData.monitoredTokens}`;
    }
    if (elements.activePools) {
        elements.activePools.textContent = `${mockPrefix}${systemData.activePools}`;
    }
    if (elements.executedTrades) {
        elements.executedTrades.textContent = `${mockPrefix}${systemData.executedTrades}`;
    }
    
    // 更新图表
    updateCharts();
    
    // 添加模拟数据到表格 - 传递模拟状态
    populateMockTables(systemData.isRealData === false);
    
    // 更新机器人状态UI
    updateBotStatus(botRunning);
}

// 更新图表
function updateCharts() {
    if (tokenDiscoveryChart) {
        // 随机更新最后一个数据点
        const data = tokenDiscoveryChart.data.datasets[0].data;
        data[data.length - 1] = Math.floor(Math.random() * 10);
        tokenDiscoveryChart.update();
    }
    
    if (profitTrendChart) {
        // 随机更新最后一个数据点
        const data = profitTrendChart.data.datasets[0].data;
        data[data.length - 1] = (Math.random() * 0.5).toFixed(3);
        profitTrendChart.update();
    }
}

// 添加模拟数据到表格
function populateMockTables(isMockData = false) {
    // 添加模拟交易数据前检查元素是否存在
    if (!elements.tradesTableBody || !elements.tokensTableBody) return;
    
    // 清空现有表格数据
    elements.tradesTableBody.innerHTML = '';
    elements.tokensTableBody.innerHTML = '';
    
    // 添加模拟交易数据
    const mockPrefix = isMockData ? '【模拟】' : '';
    
    const mockTrades = [
        { id: 'Tx5g3...e4f2', pair: 'SOL/USDC', amount: '12.5', profit: '0.0082', time: '10:45:32', status: 'success' },
        { id: 'Txc7b...a3d1', pair: 'JUP/SOL', amount: '55.2', profit: '0.0045', time: '10:42:18', status: 'success' },
        { id: 'Txf4e...b9c2', pair: 'BONK/SOL', amount: '1250000', profit: '0.0037', time: '10:38:05', status: 'success' },
        { id: 'Tx2a1...d8e5', pair: 'RAY/SOL', amount: '84.3', profit: '0.0028', time: '10:35:57', status: 'pending' },
        { id: 'Tx9d3...c6f1', pair: 'SAMO/USDC', amount: '320.7', profit: '0.0014', time: '10:31:42', status: 'failed' }
    ];
    
    for (const trade of mockTrades) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mockPrefix}${trade.id}</td>
            <td>${mockPrefix}${trade.pair}</td>
            <td>${mockPrefix}${trade.amount}</td>
            <td class="profit">${mockPrefix}${trade.profit} SOL</td>
            <td>${trade.time}</td>
            <td><span class="status ${trade.status}">${trade.status}</span></td>
        `;
        elements.tradesTableBody.appendChild(row);
    }
    
    // 添加模拟代币数据
    const mockTokens = [
        { name: 'Solar Flare', address: 'SLRf...5e2a', time: '10:47:25', liquidity: '15,420', risk: 'low' },
        { name: 'Moon Rocket', address: 'MRkt...7c9d', time: '10:45:02', liquidity: '8,750', risk: 'medium' },
        { name: 'Cosmic Coin', address: 'CSmc...4a3b', time: '10:41:37', liquidity: '5,200', risk: 'high' },
        { name: 'Star Dust', address: 'STRd...2f8e', time: '10:38:15', liquidity: '12,330', risk: 'low' },
        { name: 'Galaxy Token', address: 'GLXt...9b5c', time: '10:33:48', liquidity: '7,850', risk: 'medium' }
    ];
    
    for (const token of mockTokens) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${mockPrefix}${token.name}</td>
            <td><span title="${token.address}">${mockPrefix}${token.address}</span></td>
            <td>${token.time}</td>
            <td>${mockPrefix}${token.liquidity} USDC</td>
            <td><span class="risk-level ${token.risk}">${token.risk}</span></td>
        `;
        elements.tokensTableBody.appendChild(row);
    }
}

// 添加日志
function addLog(message, level = 'info') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    
    const logEntry = {
        time: timeStr,
        message: message,
        level: level
    };
    
    logEntries.unshift(logEntry);
    
    // 限制日志数量
    if (logEntries.length > 100) {
        logEntries.pop();
    }
    
    // 直接更新日志显示
    updateLogDisplay();
}

// 更新日志显示
function updateLogDisplay() {
    const container = document.getElementById('logContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 判断是否为模拟数据
    const mockPrefix = systemData.isRealData === false ? '【模拟】' : '';
    
    for (const entry of logEntries) {
        const logLine = document.createElement('div');
        logLine.className = 'log-entry';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = entry.time;
        
        const levelSpan = document.createElement('span');
        levelSpan.className = `log-level-${entry.level}`;
        levelSpan.textContent = `[${entry.level.toUpperCase()}] `;
        
        const message = document.createElement('span');
        message.textContent = mockPrefix + entry.message;
        
        logLine.appendChild(timestamp);
        logLine.appendChild(levelSpan);
        logLine.appendChild(message);
        
        container.appendChild(logLine);
    }
}

// 清空日志
function clearLogs() {
    logEntries = [];
    updateLogDisplay();
    addLog('日志已清空', 'info');
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${Number.parseFloat((bytes / (1024 ** i)).toFixed(2))} ${sizes[i]}`;
}

// 格式化运行时间
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours}小时 ${minutes}分钟 ${secs}秒`;
}

// 更新最后更新时间
function updateLastUpdated() {
    if (elements.lastUpdated) {
        const now = new Date();
        elements.lastUpdated.textContent = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
}

// 生成模拟数据
function generateMockSystemData() {
    // 随机波动值
    const fluctuation = (Math.random() - 0.5) * 10;
    
    // 基础内存使用率（随时间缓慢增加，50-85之间）
    let baseMemoryUsage = 50 + (Date.now() % 3600000) / 100000;
    if (baseMemoryUsage > 85) baseMemoryUsage = 50;
    
    const memoryUsage = Math.min(98, Math.max(10, baseMemoryUsage + fluctuation));
    
    return {
        cpu: 30 + Math.random() * 40,
        memory: memoryUsage,
        uptime: Math.floor(Math.random() * 86400), // 随机0-24小时的秒数
        profit: Math.random() * 2.5,
        monitoredTokens: Math.floor(50 + Math.random() * 50),
        activePools: Math.floor(100 + Math.random() * 200),
        executedTrades: Math.floor(10 + Math.random() * 40),
        memoryDetails: {
            heapTotal: 4 * 1024 * 1024 * 1024, // 4GB
            heapUsed: (memoryUsage / 100) * 4 * 1024 * 1024 * 1024,
            external: 50 + Math.random() * 20,
            arrayBuffers: 30 + Math.random() * 10,
            rss: 1200 + Math.random() * 100
        },
        memoryHistory: []
    };
}

// 启动系统
async function startSystem() {
    try {
        addLog('正在启动系统...', 'info');
        const response = await fetch('/api/system/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '启动系统失败');
        }
        
        // 更新UI
        botRunning = true;
        updateBotStatus(true);
        addLog('系统已启动', 'success');
        
        // 刷新数据
        fetchSystemData();
    } catch (error) {
        console.error('启动系统失败', error);
        addLog(`启动系统失败: ${error.message}`, 'error');
    }
}

// 停止系统
async function stopSystem() {
    try {
        addLog('正在停止系统...', 'info');
        const response = await fetch('/api/system/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '停止系统失败');
        }
        
        // 更新UI
        botRunning = false;
        updateBotStatus(false);
        addLog('系统已停止', 'warning');
        
        // 刷新数据
        fetchSystemData();
    } catch (error) {
        console.error('停止系统失败', error);
        addLog(`停止系统失败: ${error.message}`, 'error');
    }
}

// 更新机器人状态UI
function updateBotStatus(isRunning) {
    if (!elements.statusIndicator || !elements.statusText || !elements.startBtn || !elements.stopBtn) return;
    
    if (isRunning) {
        elements.statusIndicator.className = 'status-indicator status-running';
        elements.statusText.textContent = '状态: 运行中';
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
    } else {
        elements.statusIndicator.className = 'status-indicator status-stopped';
        elements.statusText.textContent = '状态: 已停止';
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
    }
}

// 切换机器人状态
function toggleBotStatus(shouldStart) {
    if (shouldStart) {
        startSystem();
    } else {
        stopSystem();
    }
}

// 切换主题
function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('darkTheme', 'false');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('darkTheme', 'true');
    }
    
    // 更新图表主题
    updateChartsTheme();
    
    // 添加日志
    addLog(`已切换到${!isDark ? '亮色' : '暗色'}主题`, 'info');
}

// 更新图表主题
function updateChartsTheme() {
    // 定义暗色和亮色主题的配置
    const theme = {
        light: {
            gridColor: 'rgba(0, 0, 0, 0.1)',
            tickColor: '#6c757d'
        },
        dark: {
            gridColor: 'rgba(255, 255, 255, 0.1)',
            tickColor: '#b0b0cc'
        }
    };
    
    const isDark = document.body.classList.contains('dark-theme');
    const selectedTheme = theme[isDark ? 'dark' : 'light'];
    
    // 更新图表主题
    if (tokenDiscoveryChart) {
        tokenDiscoveryChart.options.scales.x.grid.color = selectedTheme.gridColor;
        tokenDiscoveryChart.options.scales.y.grid.color = selectedTheme.gridColor;
        tokenDiscoveryChart.options.scales.x.ticks.color = selectedTheme.tickColor;
        tokenDiscoveryChart.options.scales.y.ticks.color = selectedTheme.tickColor;
        tokenDiscoveryChart.update();
    }
    
    if (profitTrendChart) {
        profitTrendChart.options.scales.x.grid.color = selectedTheme.gridColor;
        profitTrendChart.options.scales.y.grid.color = selectedTheme.gridColor;
        profitTrendChart.options.scales.x.ticks.color = selectedTheme.tickColor;
        profitTrendChart.options.scales.y.ticks.color = selectedTheme.tickColor;
        profitTrendChart.update();
    }
} 