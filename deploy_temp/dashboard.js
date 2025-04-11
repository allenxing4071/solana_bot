/**
 * Solana MEV 机器人 - 系统监控大屏
 * 用于展示系统内存使用情况和性能指标的数据可视化界面
 */

// 系统状态变量
let botRunning = false;
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
    memoryHistory: []
};

// 主题设置 - 默认为暗色主题
const isDarkTheme = localStorage.getItem('darkTheme') !== 'false';
localStorage.setItem('darkTheme', 'true'); // 强制设置为暗色
if (!document.body.classList.contains('dark-theme')) {
    document.body.classList.add('dark-theme');
}

// 当前主题
const currentTheme = 'dark';

// 添加主题状态追踪变量和防抖计时器
let themeTogglePending = false;
let themeToggleTimer = null;

// 获取DOM元素
const elements = {
    statusIndicator: document.querySelector('.status-indicator'),
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
    themeToggleBtn: document.getElementById('themeToggleBtn')
};

// 图表实例
let tokenDiscoveryChart = null;
let profitTrendChart = null;
let memoryChart = null;

// 日志数据
let logEntries = [];

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('开始初始化仪表盘...');
        
        // 设置事件监听器
        setupEventListeners();
        
        // 初始模拟数据
        const mockData = generateMockSystemData();
        updateDashboard(mockData);
        
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
    
    // 主题切换按钮 - 仅响应点击事件，并用stopPropagation防止事件冒泡
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡
            toggleTheme();
        });
    }
    
    // 代币表格行点击事件
    if (elements.tokensTableBody) {
        elements.tokensTableBody.addEventListener('click', (e) => {
            if (e.target.closest('tr')) {
                const row = e.target.closest('tr');
                const tokenAddressElement = row.querySelector('td:nth-child(2) span');
                if (tokenAddressElement) {
                    const tokenAddress = tokenAddressElement.title;
                    showTokenDetails(tokenAddress);
                }
            }
        });
    }
    
    // 交易表格行点击事件
    if (elements.tradesTableBody) {
        elements.tradesTableBody.addEventListener('click', (e) => {
            if (e.target.closest('tr')) {
                const row = e.target.closest('tr');
                const txIdElement = row.querySelector('td:nth-child(1)');
                if (txIdElement) {
                    const txId = txIdElement.textContent;
                    showTransactionDetails(txId);
                }
            }
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
        
        const selectedTheme = theme[currentTheme];
        
        // 代币发现趋势图
        const tokenChartCtx = document.getElementById('tokenDiscoveryChart');
        if (!tokenChartCtx) {
            console.error('找不到tokenDiscoveryChart元素');
            return;
        }
        
        // 为图表画布添加阻止事件冒泡
        tokenChartCtx.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        tokenChartCtx.addEventListener('mousemove', (e) => {
            e.stopPropagation();
        });
        
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
        
        // 为图表画布添加阻止事件冒泡
        profitChartCtx.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        profitChartCtx.addEventListener('mousemove', (e) => {
            e.stopPropagation();
        });
        
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
        let response;
        try {
            response = await fetch('/api/system/status', { timeout: 3000 });
            const responseData = await response.json();
            
            if (!responseData.success) {
                throw new Error(responseData.error || '获取数据失败');
            }
            
            const data = responseData.data;
            console.log('API数据获取成功:', data);
            
            // 更新系统数据
            updateDashboard(data);
            
            if (showLoading) {
                addLog('系统数据刷新完成', 'info');
            }
        } catch (apiError) {
            console.warn('API请求失败，使用模拟数据', apiError);
            // 使用模拟数据
            const mockData = generateMockSystemData();
            updateDashboard(mockData);
            
            if (showLoading) {
                addLog('使用模拟数据更新界面', 'warning');
            }
        }
    } catch (error) {
        console.error('获取系统数据失败', error);
        
        if (showLoading) {
            addLog(`获取系统数据失败: ${error.message}`, 'error');
        }
        
        // 使用模拟数据
        const mockData = generateMockSystemData();
        updateDashboard(mockData);
    }
}

// 更新仪表盘
function updateDashboard(data) {
    // 更新系统数据
    Object.assign(systemData, data);
    
    // 更新状态指标
    elements.cpuUsage.textContent = `${systemData.cpu.toFixed(1)}%`;
    elements.cpuBar.style.width = `${systemData.cpu}%`;
    
    elements.memoryUsage.textContent = `${systemData.memory.toFixed(1)}%`;
    elements.memoryBar.style.width = `${systemData.memory}%`;
    
    // 更新内存图表
    updateMemoryChart();
    
    // 更新运行时间
    elements.uptime.textContent = formatUptime(systemData.uptime);
    
    // 更新收益
    elements.totalProfit.textContent = `${systemData.profit.toFixed(4)} SOL`;
    
    // 更新统计数据
    elements.monitoredTokens.textContent = systemData.monitoredTokens;
    elements.activePools.textContent = systemData.activePools;
    elements.executedTrades.textContent = systemData.executedTrades;
    
    // 更新图表
    updateCharts();
    
    // 添加模拟数据到表格
    populateMockTables();
}

// 更新内存图表
function updateMemoryChart() {
    if (!systemData.memoryHistory || systemData.memoryHistory.length === 0) return;
    
    // 从内存历史记录中提取数据
    const labels = systemData.memoryHistory.map(entry => {
        const time = new Date(entry.time);
        return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const data = systemData.memoryHistory.map(entry => entry.value);
    
    // 检查HTML中是否已存在memoryUsageChart
    const existingCanvas = document.getElementById('memoryUsageChart');
    
    // 如果图表不存在，创建图表
    if (!memoryChart) {
        // 使用现有的canvas元素
        if (existingCanvas) {
            memoryChart = new Chart(existingCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '内存使用 (%)',
                        data: data,
                        borderColor: '#ff6e4d',
                        backgroundColor: 'rgba(255, 110, 77, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                color: currentTheme === 'dark' ? '#b0b0cc' : '#6c757d'
                            },
                            grid: {
                                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }
                        },
                        x: {
                            ticks: {
                                color: currentTheme === 'dark' ? '#b0b0cc' : '#6c757d'
                            },
                            grid: {
                                color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        }
    } else {
        // 更新现有图表
        memoryChart.data.labels = labels;
        memoryChart.data.datasets[0].data = data;
        memoryChart.update();
    }
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
function populateMockTables() {
    // 清空现有表格数据
    elements.tradesTableBody.innerHTML = '';
    elements.tokensTableBody.innerHTML = '';
    
    // 添加模拟交易数据
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
            <td>${trade.id}</td>
            <td>${trade.pair}</td>
            <td>${trade.amount}</td>
            <td class="profit">${trade.profit} SOL</td>
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
            <td>${token.name}</td>
            <td><span title="${token.address}">${token.address}</span></td>
            <td>${token.time}</td>
            <td>${token.liquidity} USDC</td>
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
    container.innerHTML = '';
    
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
        message.textContent = entry.message;
        
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

// 生成模拟数据
function generateMockSystemData() {
    // 随机波动值
    const fluctuation = (Math.random() - 0.5) * 10;
    
    // 基础内存使用率（随时间缓慢增加，50-85之间）
    let baseMemoryUsage = 50 + (Date.now() % 3600000) / 100000;
    if (baseMemoryUsage > 85) baseMemoryUsage = 50;
    
    const memoryUsage = Math.min(98, Math.max(10, baseMemoryUsage + fluctuation));
    const heapUsage = Math.min(95, Math.max(8, memoryUsage - 5 + (Math.random() - 0.5) * 15));
    
    // 生成内存历史数据
    const memHistory = [];
    const now = Date.now();
    
    // 生成过去一小时的数据，每5分钟一个点
    for (let i = 11; i >= 0; i--) {
        const time = now - (i * 5 * 60 * 1000);
        const value = Math.max(10, Math.min(95, baseMemoryUsage + (Math.random() - 0.5) * 15));
        
        memHistory.push({
            time: time,
            value: value
        });
    }
    
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
            heapUsed: (heapUsage / 100) * 4 * 1024 * 1024 * 1024,
            external: 50 + Math.random() * 20,
            arrayBuffers: 30 + Math.random() * 10,
            rss: 1200 + Math.random() * 100
        },
        memoryHistory: memHistory
    };
}

// 切换机器人状态
function toggleBotStatus(isStart) {
    try {
        console.log('切换机器人状态:', isStart ? '启动' : '停止');
        
        // 更新UI
        if (isStart) {
            if (elements.statusIndicator) elements.statusIndicator.className = 'status-indicator status-running';
            if (elements.statusText) {
                elements.statusText.textContent = '系统运行中';
                elements.statusText.className = 'running';
            }
            if (elements.startBtn) elements.startBtn.disabled = true;
            if (elements.stopBtn) elements.stopBtn.disabled = false;
            addLog('机器人已启动', 'success');
            botRunning = true;
        } else {
            if (elements.statusIndicator) elements.statusIndicator.className = 'status-indicator status-stopped';
            if (elements.statusText) {
                elements.statusText.textContent = '系统已停止';
                elements.statusText.className = '';
            }
            if (elements.startBtn) elements.startBtn.disabled = false;
            if (elements.stopBtn) elements.stopBtn.disabled = true;
            addLog('机器人已停止', 'warning');
            botRunning = false;
        }
        
        // 确保日志显示更新
        updateLogDisplay();
        
        // 向API发送请求切换机器人状态
        const action = isStart ? 'start' : 'stop';
        try {
            fetch(`/api/system/${action}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    addLog(`服务器响应: ${data.message || '操作成功'}`, 'info');
                    updateLogDisplay(); // 再次确保日志更新
                })
                .catch(error => {
                    console.error(`无法发送${action}命令:`, error);
                    addLog(`无法发送${action}命令: ${error.message}`, 'error');
                    updateLogDisplay(); // 确保错误日志也会显示
                });
        } catch (apiError) {
            console.warn(`模拟${action}命令`, apiError);
            addLog(`模拟${action}命令执行`, 'info');
            updateLogDisplay(); // 确保日志更新
        }
    } catch (error) {
        console.error('切换状态出错:', error);
        addLog(`切换状态出错: ${error.message}`, 'error');
        updateLogDisplay(); // 确保错误日志也会显示
    }
}

// 显示代币详情
function showTokenDetails(tokenAddress) {
    addLog(`查看代币详情: ${tokenAddress}`, 'info');
    
    // 可以在这里实现弹窗显示代币详情
    fetch(`/api/tokens/details?address=${tokenAddress}`)
        .then(response => response.json())
        .then(data => {
            // 创建模态框显示详情
            createTokenDetailModal(data);
        })
        .catch(error => {
            addLog(`获取代币详情失败: ${error.message}`, 'error');
        });
}

// 显示交易详情
function showTransactionDetails(txId) {
    addLog(`查看交易详情: ${txId}`, 'info');
    
    // 可以在这里实现弹窗显示交易详情
    fetch(`/api/transactions/${txId}`)
        .then(response => response.json())
        .then(data => {
            // 创建模态框显示详情
            createTransactionDetailModal(data);
        })
        .catch(error => {
            addLog(`获取交易详情失败: ${error.message}`, 'error');
        });
}

// 创建代币详情模态框
function createTokenDetailModal(tokenData) {
    // 这里可以根据实际情况创建模态框
    // 由于当前HTML中没有模态框结构，这里先添加日志
    addLog(`代币名称: ${tokenData.name || '未知'}`, 'info');
    addLog(`代币总供应量: ${tokenData.supply || '未知'}`, 'info');
    addLog(`创建时间: ${tokenData.createTime || '未知'}`, 'info');
}

// 创建交易详情模态框
function createTransactionDetailModal(txData) {
    // 这里可以根据实际情况创建模态框
    // 由于当前HTML中没有模态框结构，这里先添加日志
    addLog(`交易哈希: ${txData.hash || txData.id || '未知'}`, 'info');
    addLog(`交易状态: ${txData.status || '未知'}`, 'info');
    addLog(`交易金额: ${txData.amount || '未知'}`, 'info');
}

// 格式化日期时间
function formatDateTime(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${formatTime(date)}`;
}

// 格式化时间
function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

// 切换主题 - 添加防抖动功能
function toggleTheme() {
    // 避免短时间内重复切换
    if (themeTogglePending) {
        return;
    }
    
    // 设置状态标志并启动防抖计时器
    themeTogglePending = true;
    clearTimeout(themeToggleTimer);
    
    // 执行主题切换 - 在光/暗主题之间切换
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }
    
    localStorage.setItem('darkTheme', !isDark);
    
    // 更新图表主题
    updateChartsTheme();
    
    // 添加日志
    addLog(`已切换到${!isDark ? '暗色' : '亮色'}主题`, 'info');
    
    // 500毫秒后重置状态，防止频繁切换
    themeToggleTimer = setTimeout(() => {
        themeTogglePending = false;
    }, 500);
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
    
    const selectedTheme = theme[currentTheme];
    
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
    
    if (memoryChart) {
        memoryChart.options.scales.x.grid.color = selectedTheme.gridColor;
        memoryChart.options.scales.y.grid.color = selectedTheme.gridColor;
        memoryChart.options.scales.x.ticks.color = selectedTheme.tickColor;
        memoryChart.options.scales.y.ticks.color = selectedTheme.tickColor;
        memoryChart.update();
    }
} 