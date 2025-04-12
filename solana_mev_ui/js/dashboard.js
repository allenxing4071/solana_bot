/**
 * Solana MEV机器人 - 仪表盘页面JavaScript
 * 实现处理API数据、显示图表和交易列表功能
 */

// DOM元素缓存
const elements = {
    cpuUsage: document.getElementById('cpuUsage'),
    cpuBar: document.getElementById('cpuBar'),
    memoryUsage: document.getElementById('memoryUsage'),
    memoryBar: document.getElementById('memoryBar'),
    uptime: document.getElementById('uptime'),
    totalProfit: document.getElementById('totalProfit'),
    monitoredTokens: document.getElementById('monitoredTokens'),
    activePools: document.getElementById('activePools'),
    executedTrades: document.getElementById('executedTrades'),
    tradesTableBody: document.getElementById('tradesTableBody'),
    tokensTableBody: document.getElementById('tokensTableBody'),
    logContainer: document.getElementById('logContainer'),
    lastUpdated: document.getElementById('lastUpdated'),
    refreshData: document.getElementById('refreshData'),
    tokenDiscoveryChart: document.getElementById('tokenDiscoveryChart'),
    profitTrendChart: document.getElementById('profitTrendChart'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    themeToggleBtn: document.getElementById('themeToggleBtn')
};

// 全局变量
const charts = {
    tokenDiscoveryChart: null,
    profitTrendChart: null
};

let systemData = {
    status: 'stopped',
    cpu: 0,
    memory: 0,
    uptime: 0,
    profit: 0,
    monitoredTokens: 0,
    activePools: 0,
    executedTrades: 0,
    tokenDiscoveryTrend: [],  // 代币发现趋势
    profitTrend: [],          // 利润趋势
    isRealData: true          // 是否真实数据
};

// 颜色主题
const themes = {
    dark: {
        backgroundColor: '#1e2130',
        textColor: '#e1e1e6',
        gridColor: 'rgba(255, 255, 255, 0.1)',
        tickColor: 'rgba(255, 255, 255, 0.5)',
    },
    light: {
        backgroundColor: '#f5f7fa',
        textColor: '#2d3748',
        gridColor: 'rgba(0, 0, 0, 0.1)',
        tickColor: 'rgba(0, 0, 0, 0.5)',
    }
};

// 当前主题
let currentTheme = 'dark';

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化...');
    
    // 绑定刷新数据按钮事件
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshDataBtn = document.getElementById('refreshData');
    
    // 尝试绑定刷新按钮，支持两种可能的ID
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('刷新按钮被点击');
            fetchSystemData(true);
        });
        console.log('成功绑定refreshBtn按钮事件');
    } else if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', () => {
            console.log('刷新按钮被点击');
            fetchSystemData(true);
        });
        console.log('成功绑定refreshData按钮事件');
    } else {
        console.warn('未找到刷新按钮元素');
    }
    
    // 绑定启动/停止按钮事件
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', startBot);
    } else {
        console.warn('未找到启动按钮元素');
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopBot);
    } else {
        console.warn('未找到停止按钮元素');
    }
    
    // 绑定主题切换按钮
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    } else {
        console.warn('未找到主题切换按钮元素');
    }
    
    // 绑定清除日志按钮
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            const logContainer = document.getElementById('logContainer');
            if (logContainer) {
                logContainer.innerHTML = '';
                addLog('日志已清除', 'success');
            }
        });
        console.log('成功绑定clearLogsBtn按钮事件');
    } else {
        console.warn('未找到清除日志按钮元素');
    }
    
    // 绑定时间周期按钮点击事件
    bindChartPeriodButtons();
    
    // 先初始化图表，确保图表准备就绪后再加载数据
    console.log('开始初始化图表组件...');
    initCharts();
    console.log('图表初始化完成');
    
    // 图表准备就绪后加载初始数据
    setTimeout(() => {
        console.log('图表已初始化，开始加载数据...');
        // 加载初始数据
        fetchSystemData(true);
        fetchRecentTrades();
        fetchRecentTokens();
        
        // 设置定时刷新
        setInterval(() => {
            fetchSystemData(false);
        }, 30000); // 30秒刷新一次
        
        setInterval(() => {
            fetchRecentTrades();
        }, 60000); // 1分钟刷新一次交易记录
        
        setInterval(() => {
            fetchRecentTokens();
        }, 120000); // 2分钟刷新一次代币数据
    }, 1000); // 延迟1秒确保图表已完全初始化
});

/**
 * 绑定图表时间周期按钮
 */
function bindChartPeriodButtons() {
    // 代币发现趋势图时间周期按钮
    const tokenChartContainer = document.getElementById('tokenDiscoveryChart');
    if (tokenChartContainer) {
        const tokenPeriodBtns = tokenChartContainer.parentElement.querySelectorAll('.btn-outline');
        
        if (tokenPeriodBtns && tokenPeriodBtns.length > 0) {
            tokenPeriodBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    // 移除所有按钮的active类
                    tokenPeriodBtns.forEach(b => b.classList.remove('active'));
                    // 为当前点击的按钮添加active类
                    this.classList.add('active');
                    
                    // 获取时间周期
                    const period = this.textContent.trim();
                    console.log(`切换代币发现趋势图时间周期为: ${period}`);
                    
                    // 根据时间周期更新图表数据
                    fetchTokenDiscoveryTrend(period);
                });
            });
            console.log('代币发现趋势图时间周期按钮绑定成功');
        }
    }
    
    // 利润趋势图时间周期按钮
    const profitChartContainer = document.getElementById('profitTrendChart');
    if (profitChartContainer) {
        const profitPeriodBtns = profitChartContainer.parentElement.querySelectorAll('.btn-outline');
        
        if (profitPeriodBtns && profitPeriodBtns.length > 0) {
            profitPeriodBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    // 移除所有按钮的active类
                    profitPeriodBtns.forEach(b => b.classList.remove('active'));
                    // 为当前点击的按钮添加active类
                    this.classList.add('active');
                    
                    // 获取时间周期
                    const period = this.textContent.trim();
                    console.log(`切换利润趋势图时间周期为: ${period}`);
                    
                    // 根据时间周期更新图表数据
                    fetchProfitTrend(period);
                });
            });
            console.log('利润趋势图时间周期按钮绑定成功');
        }
    }
}

/**
 * 获取代币发现趋势数据
 * @param {string} period - 时间周期 (12小时, 24小时, 7天)
 */
async function fetchTokenDiscoveryTrend(period) {
    try {
        addLog(`正在获取${period}代币发现趋势...`, 'info');
        
        // 这里应该调用API获取不同时间周期的数据
        // 先使用模拟数据
        let mockData = [];
        
        switch(period) {
            case '12小时':
                mockData = Array(12).fill(0).map((_, i) => ({
                    hour: String(i).padStart(2, '0'),
                    count: Math.floor(Math.random() * 15)
                }));
                break;
            case '24小时':
                mockData = Array(24).fill(0).map((_, i) => ({
                    hour: String(i).padStart(2, '0'),
                    count: Math.floor(Math.random() * 20)
                }));
                break;
            case '7天':
                const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                mockData = Array(7).fill(0).map((_, i) => ({
                    hour: days[i],
                    count: Math.floor(Math.random() * 50)
                }));
                break;
            default:
                mockData = Array(12).fill(0).map((_, i) => ({
                    hour: String(i).padStart(2, '0'),
                    count: Math.floor(Math.random() * 15)
                }));
        }
        
        // 更新图表数据
        if (charts.tokenDiscoveryChart) {
            const labels = mockData.map(item => `${item.hour}`);
            const data = mockData.map(item => item.count);
            
            charts.tokenDiscoveryChart.data.labels = labels;
            charts.tokenDiscoveryChart.data.datasets[0].data = data;
            charts.tokenDiscoveryChart.update();
            console.log(`代币发现趋势图(${period})更新成功`);
        }
        
        addLog(`${period}代币发现趋势加载完成`, 'info');
    } catch (error) {
        console.error(`获取${period}代币发现趋势失败:`, error);
        addLog(`获取${period}代币发现趋势失败: ${error.message}`, 'error');
    }
}

/**
 * 获取利润趋势数据
 * @param {string} period - 时间周期 (24小时, 7天, 30天)
 */
async function fetchProfitTrend(period) {
    try {
        addLog(`正在获取${period}利润趋势...`, 'info');
        
        // 这里应该调用API获取不同时间周期的数据
        // 先使用模拟数据
        let mockData = [];
        
        switch(period) {
            case '24小时':
                mockData = Array(24).fill(0).map((_, i) => {
                    return {
                        date: `${String(i).padStart(2, '0')}:00`,
                        value: Math.random() * 30
                    };
                });
                break;
            case '7天':
                const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                mockData = Array(7).fill(0).map((_, i) => {
                    return {
                        date: days[i],
                        value: Math.random() * 40
                    };
                });
                break;
            case '30天':
                mockData = Array(30).fill(0).map((_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    return {
                        date: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                        value: Math.random() * 50
                    };
                });
                break;
            default:
                const defaultDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                mockData = Array(7).fill(0).map((_, i) => {
                    return {
                        date: defaultDays[i],
                        value: Math.random() * 40
                    };
                });
        }
        
        // 更新图表数据
        if (charts.profitTrendChart) {
            const labels = mockData.map(item => item.date);
            const data = mockData.map(item => item.value);
            
            charts.profitTrendChart.data.labels = labels;
            charts.profitTrendChart.data.datasets[0].data = data;
            charts.profitTrendChart.update();
            console.log(`利润趋势图(${period})更新成功`);
        }
        
        addLog(`${period}利润趋势加载完成`, 'info');
    } catch (error) {
        console.error(`获取${period}利润趋势失败:`, error);
        addLog(`获取${period}利润趋势失败: ${error.message}`, 'error');
    }
}

/**
 * 初始化图表
 */
function initCharts() {
    try {
        // 确保Chart.js加载完成
        if (typeof Chart === 'undefined') {
            console.error('Chart.js未加载，无法初始化图表');
            return;
        }

        // 初始化代币发现趋势图
        const tokenChartContainer = document.getElementById('tokenDiscoveryChart');
        if (!tokenChartContainer) {
            console.error('找不到tokenDiscoveryChart容器元素');
            return;
        }

        // 找到容器内的canvas元素
        const tokenCanvas = tokenChartContainer.querySelector('canvas');
        if (!tokenCanvas) {
            console.error('在tokenDiscoveryChart容器中找不到canvas元素');
            return;
        }

        // 获取canvas的2d上下文
        const tokenChartCtx = tokenCanvas.getContext('2d');
        if (!tokenChartCtx) {
            console.error('无法获取tokenDiscoveryChart的2d上下文');
            return;
        }

        console.log('初始化代币发现趋势图...');
        try {
            // 如果已经初始化过，先销毁旧的实例
            if (charts.tokenDiscoveryChart instanceof Chart) {
                charts.tokenDiscoveryChart.destroy();
            }

            charts.tokenDiscoveryChart = new Chart(tokenChartCtx, {
                type: 'bar',
                data: {
                    labels: ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'],
                    datasets: [{
                        label: '发现代币数',
                        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#bd4dff',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
            console.log('代币发现趋势图初始化成功');
        } catch (chartError) {
            console.error('代币发现趋势图初始化失败:', chartError);
        }
        
        // 初始化利润趋势图
        const profitChartContainer = document.getElementById('profitTrendChart');
        if (!profitChartContainer) {
            console.error('找不到profitTrendChart容器元素');
            return;
        }

        // 找到容器内的canvas元素
        const profitCanvas = profitChartContainer.querySelector('canvas');
        if (!profitCanvas) {
            console.error('在profitTrendChart容器中找不到canvas元素');
            return;
        }

        // 获取canvas的2d上下文
        const profitChartCtx = profitCanvas.getContext('2d');
        if (!profitChartCtx) {
            console.error('无法获取profitTrendChart的2d上下文');
            return;
        }

        console.log('初始化利润趋势图...');
        try {
            // 如果已经初始化过，先销毁旧的实例
            if (charts.profitTrendChart instanceof Chart) {
                charts.profitTrendChart.destroy();
            }

            charts.profitTrendChart = new Chart(profitChartCtx, {
                type: 'bar',
                data: {
                    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    datasets: [{
                        label: '收益 (SOL)',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#36a2eb',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
            console.log('利润趋势图初始化成功');
        } catch (chartError) {
            console.error('利润趋势图初始化失败:', chartError);
        }
    } catch (error) {
        console.error('初始化图表失败:', error);
        addLog(`初始化图表失败: ${error.message}`, 'error');
    }
}

/**
 * 获取系统数据
 * @param {boolean} showLoading - 是否显示加载提示
 */
async function fetchSystemData(showLoading = false) {
    if (showLoading) {
        addLog('正在刷新系统数据...', 'info');
    }
    
    try {
        console.log('开始获取系统数据...');
        // 尝试从API获取数据
        try {
            // 使用本地API服务
            const apiUrl = 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/system/status`, { timeout: 3000 });
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
        console.error('获取系统数据失败:', error);
        addLog(`获取系统数据失败: ${error.message}`, 'error');
        
        // 使用模拟数据作为备选方案
        const mockData = generateMockSystemData();
        mockData.isRealData = false;
        updateDashboard(mockData);
        
        if (showLoading) {
            addLog('使用模拟数据更新界面', 'warning');
        }
        
        // 更新最后更新时间
        updateLastUpdated();
    }
}

/**
 * 获取最近交易记录
 */
async function fetchRecentTrades() {
    try {
        // 使用本地API服务
        const apiUrl = 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/transactions`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取交易数据失败');
        }
        
        // 更新交易表格
        updateTradesTable(data.data.slice(0, 5)); // 只显示前5条
    } catch (error) {
        console.error('获取交易记录失败:', error);
        // 使用模拟数据
        updateTradesTable(generateMockTrades());
    }
}

/**
 * 获取最近发现的代币
 */
async function fetchRecentTokens() {
    try {
        // 使用本地API服务
        const apiUrl = 'http://localhost:3000';
        const response = await fetch(`${apiUrl}/tokens`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || '获取代币数据失败');
        }
        
        // 更新代币表格
        updateTokensTable(data.data.slice(0, 5)); // 只显示前5条
    } catch (error) {
        console.error('获取代币数据失败:', error);
        // 使用模拟数据
        updateTokensTable(generateMockTokens());
    }
}

/**
 * 更新仪表盘数据
 * @param {Object} data - 系统数据
 */
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
    
    // 更新系统状态
    updateSystemStatus(systemData.status);
    
    // 更新图表数据
    updateCharts();
}

/**
 * 更新图表数据
 */
function updateCharts() {
    console.log('开始更新图表数据', systemData);
    
    try {
        // 更新代币发现趋势图
        if (charts.tokenDiscoveryChart) {
            console.log('更新代币发现趋势图', systemData.tokenDiscoveryTrend);
            
            // 确保有数据可用
            if (systemData.tokenDiscoveryTrend && Array.isArray(systemData.tokenDiscoveryTrend)) {
                const labels = systemData.tokenDiscoveryTrend.map(item => `${item.hour || '00'}:00`);
                const data = systemData.tokenDiscoveryTrend.map(item => item.count || 0);
                
                console.log('处理后的标签和数据:', labels, data);
                
                // 安全地更新图表数据
                try {
                    charts.tokenDiscoveryChart.data.labels = labels;
                    charts.tokenDiscoveryChart.data.datasets[0].data = data;
                    charts.tokenDiscoveryChart.update();
                    console.log('代币发现趋势图更新成功');
                } catch (updateError) {
                    console.error('代币发现趋势图更新失败:', updateError);
                }
            } else {
                console.warn('缺少代币发现趋势数据');
            }
        } else {
            console.warn('代币发现趋势图尚未初始化');
        }
        
        // 更新利润趋势图
        if (charts.profitTrendChart) {
            console.log('更新利润趋势图', systemData.profitTrend);
            
            // 确保有数据可用
            if (systemData.profitTrend && Array.isArray(systemData.profitTrend)) {
                const labels = systemData.profitTrend.map(item => item.date || '');
                const data = systemData.profitTrend.map(item => item.value || 0);
                
                console.log('处理后的标签和数据:', labels, data);
                
                // 安全地更新图表数据
                try {
                    charts.profitTrendChart.data.labels = labels;
                    charts.profitTrendChart.data.datasets[0].data = data;
                    charts.profitTrendChart.update();
                    console.log('利润趋势图更新成功');
                } catch (updateError) {
                    console.error('利润趋势图更新失败:', updateError);
                }
            } else {
                console.warn('缺少利润趋势数据');
            }
        } else {
            console.warn('利润趋势图尚未初始化');
        }
    } catch (error) {
        console.error('更新图表时发生错误:', error);
    }
}

/**
 * 更新交易表格
 * @param {Array} trades - 交易数据
 */
function updateTradesTable(trades) {
    if (!elements.tradesTableBody) return;
    
    elements.tradesTableBody.innerHTML = '';
    
    if (!trades || trades.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">暂无交易记录</td>';
        elements.tradesTableBody.appendChild(row);
        return;
    }
    
    for (const trade of trades) {
        const row = document.createElement('tr');
        
        // 设置状态类名
        let statusClass = '';
        switch (trade.status) {
            case 'success':
                statusClass = 'text-success';
                break;
            case 'pending':
                statusClass = 'text-warning';
                break;
            case 'failed':
                statusClass = 'text-error';
                break;
            default:
                statusClass = '';
        }
        
        row.innerHTML = `
            <td>${trade.id}</td>
            <td>${trade.pair}</td>
            <td>${trade.amount}</td>
            <td>${trade.profit}</td>
            <td>${trade.time}</td>
            <td class="${statusClass}">${formatStatus(trade.status)}</td>
        `;
        
        elements.tradesTableBody.appendChild(row);
    }
}

/**
 * 更新代币表格
 * @param {Array} tokens - 代币数据
 */
function updateTokensTable(tokens) {
    if (!elements.tokensTableBody) return;
    
    elements.tokensTableBody.innerHTML = '';
    
    if (!tokens || tokens.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">暂无代币数据</td>';
        elements.tokensTableBody.appendChild(row);
        return;
    }
    
    for (const token of tokens) {
        const row = document.createElement('tr');
        
        // 设置风险等级类名
        let riskClass = '';
        if (token.riskScore < 3) {
            riskClass = 'text-success';
        } else if (token.riskScore < 7) {
            riskClass = 'text-warning';
        } else {
            riskClass = 'text-error';
        }
        
        row.innerHTML = `
            <td>${token.name}</td>
            <td>${formatAddress(token.address)}</td>
            <td>${formatDateTime(token.discoveredAt)}</td>
            <td>$${formatNumber(token.liquidity)}</td>
            <td class="${riskClass}">${token.riskScore.toFixed(1)}</td>
        `;
        
        elements.tokensTableBody.appendChild(row);
    }
}

/**
 * 更新系统状态显示
 * @param {string} status - 系统状态
 */
function updateSystemStatus(status) {
    if (!elements.statusIndicator || !elements.statusText) return;
    
    if (status === 'running') {
        elements.statusIndicator.classList.remove('offline');
        elements.statusIndicator.classList.add('online');
        elements.statusText.textContent = '状态: 运行中';
        
        if (elements.startBtn) elements.startBtn.disabled = true;
        if (elements.stopBtn) elements.stopBtn.disabled = false;
    } else {
        elements.statusIndicator.classList.remove('online');
        elements.statusIndicator.classList.add('offline');
        elements.statusText.textContent = '状态: 已停止';
        
        if (elements.startBtn) elements.startBtn.disabled = false;
        if (elements.stopBtn) elements.stopBtn.disabled = true;
    }
}

/**
 * 添加日志信息到日志容器
 * @param {string} message - 日志消息内容
 * @param {string} type - 日志类型 (info, warning, error, success)
 */
function addLog(message, type = 'info') {
    // 获取日志容器
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    // 创建日志项
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    // 设置图标
    let icon = '';
    switch (type) {
        case 'info':
            icon = 'ri-information-line';
            break;
        case 'warning':
            icon = 'ri-error-warning-line';
            break;
        case 'error':
            icon = 'ri-close-circle-line';
            break;
        case 'success':
            icon = 'ri-checkbox-circle-line';
            break;
        default:
            icon = 'ri-information-line';
    }
    
    // 获取当前时间
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 设置日志内容
    logEntry.innerHTML = `
        <div class="log-entry-icon"><i class="${icon}"></i></div>
        <div class="log-entry-content">
            ${message}
            <div class="log-entry-timestamp">${timestamp}</div>
        </div>
    `;
    
    // 添加到容器
    logContainer.appendChild(logEntry);
    
    // 滚动到最新日志
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // 记录到控制台
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function updateLastUpdated() {
    if (!elements.lastUpdated) return;
    
    const now = new Date();
    elements.lastUpdated.textContent = now.toLocaleString();
}

/**
 * 启动MEV机器人
 */
async function startBot() {
    try {
        addLog('正在启动MEV机器人...', 'info');
        
        // 模拟API调用
        updateSystemStatus('running');
        addLog('MEV机器人已成功启动', 'info');
        
        // 刷新数据
        setTimeout(() => {
            fetchSystemData(true);
        }, 1000);
    } catch (error) {
        console.error('启动MEV机器人失败:', error);
        addLog(`启动失败: ${error.message}`, 'error');
    }
}

/**
 * 停止MEV机器人
 */
async function stopBot() {
    try {
        addLog('正在停止MEV机器人...', 'info');
        
        // 模拟API调用
        updateSystemStatus('stopped');
        addLog('MEV机器人已停止', 'info');
        
        // 刷新数据
        setTimeout(() => {
            fetchSystemData(true);
        }, 1000);
    } catch (error) {
        console.error('停止MEV机器人失败:', error);
        addLog(`停止失败: ${error.message}`, 'error');
    }
}

/**
 * 切换主题
 */
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const selectedTheme = themes[currentTheme];
    
    // 将新主题应用到图表
    if (charts.tokenDiscoveryChart) {
        charts.tokenDiscoveryChart.options.scales.x.grid.color = selectedTheme.gridColor;
        charts.tokenDiscoveryChart.options.scales.y.grid.color = selectedTheme.gridColor;
        charts.tokenDiscoveryChart.options.scales.x.ticks.color = selectedTheme.tickColor;
        charts.tokenDiscoveryChart.options.scales.y.ticks.color = selectedTheme.tickColor;
        charts.tokenDiscoveryChart.update();
    }
    
    if (charts.profitTrendChart) {
        charts.profitTrendChart.options.scales.x.grid.color = selectedTheme.gridColor;
        charts.profitTrendChart.options.scales.y.grid.color = selectedTheme.gridColor;
        charts.profitTrendChart.options.scales.x.ticks.color = selectedTheme.tickColor;
        charts.profitTrendChart.options.scales.y.ticks.color = selectedTheme.tickColor;
        charts.profitTrendChart.update();
    }
    
    // 切换文档主题
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
}

/**
 * 格式化地址显示
 * @param {string} address - 完整地址
 * @param {number} prefixLength - 前缀长度
 * @param {number} suffixLength - 后缀长度
 * @returns {string} 格式化后的地址
 */
function formatAddress(address, prefixLength = 6, suffixLength = 4) {
    if (!address || address.length <= prefixLength + suffixLength) return address;
    return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
}

/**
 * 格式化日期时间
 * @param {string} dateStr - ISO日期字符串
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
}

/**
 * 格式化运行时间
 * @param {number} seconds - 运行时间（秒）
 * @returns {string} 格式化后的运行时间
 */
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours}小时 ${minutes}分钟 ${secs}秒`;
}

/**
 * 格式化状态文本
 * @param {string} status - 状态值
 * @returns {string} 格式化后的状态文本
 */
function formatStatus(status) {
    switch (status) {
        case 'success':
            return '成功';
        case 'pending':
            return '处理中';
        case 'failed':
            return '失败';
        default:
            return status;
    }
}

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} number - 需要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字
 */
function formatNumber(number, decimals = 0) {
    return number.toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * 生成模拟系统数据
 * @returns {Object} 模拟系统数据
 */
function generateMockSystemData() {
    return {
        status: Math.random() > 0.3 ? 'running' : 'stopped',
        cpu: 10 + Math.random() * 60,
        memory: 20 + Math.random() * 50,
        uptime: Math.floor(Math.random() * 86400), // 最多1天
        profit: Math.random() * 100,
        monitoredTokens: Math.floor(Math.random() * 200),
        activePools: Math.floor(Math.random() * 100),
        executedTrades: Math.floor(Math.random() * 500),
        tokenDiscoveryTrend: Array(12).fill(0).map((_, i) => ({
            hour: String(i).padStart(2, '0'),
            count: Math.floor(Math.random() * 20)
        })),
        profitTrend: Array(7).fill(0).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
                value: Math.random() * 50
            };
        })
    };
}

/**
 * 生成模拟交易数据
 * @returns {Array} 模拟交易数据
 */
function generateMockTrades() {
    const pairs = ['SOL/USDC', 'ETH/SOL', 'JUP/SOL', 'ORCA/SOL', 'BONK/SOL', 'RAY/SOL'];
    const statuses = ['success', 'pending', 'failed'];
    
    return Array(5).fill(0).map((_, i) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - i * 5);
        
        return {
            id: `Tx${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
            pair: pairs[Math.floor(Math.random() * pairs.length)],
            amount: (Math.random() * 1000).toFixed(1),
            profit: (Math.random() * 0.01).toFixed(4),
            time: now.toLocaleTimeString(),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        };
    });
}

/**
 * 生成模拟代币数据
 * @returns {Array} 模拟代币数据
 */
function generateMockTokens() {
    const names = ['SolGem', 'MoonToken', 'RocketCoin', 'StarDust', 'GalaxyToken'];
    
    return Array(5).fill(0).map((_, i) => {
        const now = new Date();
        now.setHours(now.getHours() - i);
        
        return {
            name: names[i],
            address: `${Math.random().toString(16).substring(2, 34)}`,
            discoveredAt: now.toISOString(),
            liquidity: Math.floor(Math.random() * 1000000),
            riskScore: Math.random() * 10
        };
    });
}

/**
 * 生成测试日志（不同类型）
 */
function generateTestLogs() {
    // 清空现有日志
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        logContainer.innerHTML = '';
    }
    
    // 添加各种类型的日志示例
    addLog('这是一条普通信息日志', 'info');
    addLog('这是一条警告日志', 'warning');
    addLog('这是一条错误日志', 'error');
    addLog('这是一条成功日志', 'success');
    
    // 添加Mock数据示例
    addLog('正在获取系统数据...', 'info');
    addLog('API请求成功，数据已更新', 'success');
    addLog('正在连接到Solana网络...', 'info');
    addLog('发现新代币: TOKEN_XYZ', 'info');
    addLog('交易执行失败: Gas不足', 'error');
    addLog('价格波动警告: SOL/USDT +5.2%', 'warning');
    addLog('交易成功完成，获利: 0.25 SOL', 'success');
    
    // 添加Markdown格式测试
    addLog('**系统状态**: 运行中', 'info');
    addLog('`内存使用率: 65.3%`', 'warning');
    addLog('代码示例: ```function example() { return true; }```', 'info');
}

/**
 * 生成测试日志
 * @param {number} count - 要生成的日志数量
 */
function generateTestLogs(count = 5) {
    if (!count || count <= 0) count = 5;
    
    const logTypes = ['info', 'warning', 'error', 'success'];
    const logMessages = [
        'MEV机器人已成功启动',
        '正在启动MEV机器人...',
        '检测到新代币创建',
        '成功执行交易',
        '获取系统数据失败: Error: HTTP error! Status: 404',
        '正在刷新系统数据...',
        '系统数据刷新完成',
        '使用模拟数据更新界面',
        'MEV机器人已停止',
        '正在停止MEV机器人...',
        '发现潜在套利机会',
        '系统资源使用率过高',
        '网络连接异常',
        '余额不足，无法执行交易',
        '成功监听到新交易池'
    ];
    
    // 清除已有日志
    clearLogs();
    
    // 添加测试日志
    for (let i = 0; i < count; i++) {
        const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
        const timeDelay = i * 100; // 每条日志间隔100毫秒
        
        setTimeout(() => {
            addLog(randomMessage, randomType);
        }, timeDelay);
    }
    
    console.log(`已添加${count}条测试日志`);
}

/**
 * 清除所有日志
 */
function clearLogs() {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    while (logContainer.firstChild) {
        logContainer.removeChild(logContainer.firstChild);
    }
    
    console.log('已清除所有日志');
}

// 添加全局引用
window.generateTestLogs = generateTestLogs;
window.clearLogs = clearLogs;

// 在DOMContentLoaded中添加绑定代码
document.addEventListener('DOMContentLoaded', function() {
    // 绑定测试日志按钮
    const testLogBtn = document.getElementById('testLogBtn');
    if (testLogBtn) {
        testLogBtn.addEventListener('click', function() {
            generateTestLogs(10);
        });
    }
    
    // 绑定清除日志按钮
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', clearLogs);
    }
});
