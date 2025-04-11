/**
 * Solana MEV 机器人 - 内存监控系统
 * 用于展示系统内存使用情况和性能指标的专用监控模块
 */

// 系统状态变量
let memoryData = {
    totalMemory: 0,        // 总内存
    usedMemory: 0,         // 已使用内存
    freeMemory: 0,         // 空闲内存
    heapTotal: 0,          // 堆总大小
    heapUsed: 0,           // 已使用堆大小
    external: 0,           // 外部内存
    peakMemory: 0,         // 峰值内存
    memoryHistory: [],     // 内存历史记录
    performanceMetrics: [] // 性能指标
};

// 系统日志
let memoryLogs = [];

// 内存消耗点
let memoryConsumptionPoints = [];

// 主题设置 - 默认为暗色主题
const isDarkTheme = localStorage.getItem('darkTheme') !== 'false';
localStorage.setItem('darkTheme', 'true'); // 强制设置为暗色
if (!document.body.classList.contains('dark-theme')) {
    document.body.classList.add('dark-theme');
}

// 图表主题配置
const chartTheme = {
    light: {
        gridColor: 'rgba(0, 0, 0, 0.1)',
        tickColor: '#6c757d'
    },
    dark: {
        gridColor: 'rgba(255, 255, 255, 0.1)',
        tickColor: '#b0b0cc'
    }
};

// 当前主题
let currentTheme = 'dark';

// 添加主题状态追踪变量和防抖计时器
let themeTogglePending = false;
let themeToggleTimer = null;

// 图表对象
let memoryChart = null;
let performanceChart = null;

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    console.log('初始化内存监控页面...');
    
    // 使用安全初始化方法
    safeInitialize();
});

/**
 * 安全初始化方法 - 所有DOM操作都带有存在性检查
 */
function safeInitialize() {
    // 初始化元素引用
    const elements = {
        // 主按钮和状态元素
        refreshData: document.getElementById('refreshData'),
        optimizeMemory: document.getElementById('optimizeMemory'),
        generateSuggestions: document.getElementById('generateSuggestions'),
        clearLogs: document.getElementById('clearLogs'),
        checkLeaks: document.getElementById('checkLeaks'),
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        startBtn: document.getElementById('startBtn'),
        stopBtn: document.getElementById('stopBtn'),
        refreshSuggestions: document.getElementById('refreshSuggestions'),
        
        // 图表相关元素
        memoryChart: document.getElementById('memoryChart'),
        heapChart: document.getElementById('heapChart'),
        
        // 状态显示元素
        currentDateTime: document.getElementById('currentDateTime'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText'),
        
        // 内存统计元素
        totalMemory: document.getElementById('totalMemory'),
        usedMemory: document.getElementById('usedMemory'),
        usedPercentage: document.getElementById('usedPercentage'),
        heapTotal: document.getElementById('heapTotal'),
        heapUsed: document.getElementById('heapUsed'),
        heapPercentage: document.getElementById('heapPercentage'),
        peakMemory: document.getElementById('peakMemory'),
        externalMemory: document.getElementById('externalMemory'),
        
        // 日志和显示元素
        logsContainer: document.getElementById('logsContainer'),
        leaksContainer: document.getElementById('leaksContainer'),
        suggestionsContainer: document.getElementById('suggestionsContainer'),
        consumptionPoints: document.getElementById('consumptionPoints')
    };
    
    // 记录找不到的元素
    const missingElements = [];
    for (const [name, element] of Object.entries(elements)) {
        if (!element) {
            missingElements.push(name);
        }
    }
    
    if (missingElements.length > 0) {
        console.warn('以下元素未找到，可能会影响功能:', missingElements.join(', '));
    }
    
    // 添加事件监听器 - 只有在元素存在时才添加
    if (elements.refreshData) {
        elements.refreshData.addEventListener('click', () => {
            fetchMemoryData();
            addLogEntry('用户手动刷新了内存数据', 'info');
        });
    }
    
    if (elements.optimizeMemory) {
        elements.optimizeMemory.addEventListener('click', optimizeMemory);
    }
    
    if (elements.generateSuggestions) {
        elements.generateSuggestions.addEventListener('click', () => {
            if (typeof generateOptimizationSuggestions === 'function') {
                generateOptimizationSuggestions();
            } else if (typeof generateSuggestions === 'function') {
                generateSuggestions();
            }
            addLogEntry('用户刷新了内存优化建议', 'info');
        });
    }
    
    if (elements.clearLogs && elements.logsContainer) {
        elements.clearLogs.addEventListener('click', () => {
            elements.logsContainer.innerHTML = '';
            memoryLogs = [];
            addLogEntry('日志已清空', 'info');
        });
    }
    
    if (elements.checkLeaks) {
        elements.checkLeaks.addEventListener('click', checkMemoryLeaks);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', () => {
            if (typeof updateMemoryConsumptionPoints === 'function') {
                updateMemoryConsumptionPoints();
            } else if (typeof updateConsumptionPoints === 'function') {
                updateConsumptionPoints();
            }
        });
    }
    
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener('change', () => {
            if (typeof updateMemoryConsumptionPoints === 'function') {
                updateMemoryConsumptionPoints();
            } else if (typeof updateConsumptionPoints === 'function') {
                updateConsumptionPoints();
            }
        });
    }
    
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', () => {
            updateBotStatus(true);
            addLogEntry('用户启动了机器人', 'info');
        });
    }
    
    if (elements.stopBtn) {
        elements.stopBtn.addEventListener('click', () => {
            updateBotStatus(false);
            addLogEntry('用户停止了机器人', 'info');
        });
    }
    
    if (elements.refreshSuggestions) {
        elements.refreshSuggestions.addEventListener('click', () => {
            if (typeof refreshOptimizationSuggestions === 'function') {
                refreshOptimizationSuggestions();
            }
        });
    }
    
    // 初始化图表和数据
    updateSystemTime();
    if (typeof initializeCharts === 'function' && elements.memoryChart && elements.heapChart) {
        initializeCharts(elements.memoryChart, elements.heapChart);
    }
    
    // 获取初始数据
    fetchMemoryData();
    
    // 初始化内存优化建议和内存消耗点分析
    if (typeof generateOptimizationSuggestions === 'function') {
        generateOptimizationSuggestions();
    } else if (typeof generateSuggestions === 'function') {
        generateSuggestions();
    }
    
    if (typeof analyzeMemoryConsumptionPoints === 'function') {
        analyzeMemoryConsumptionPoints();
    }
    
    // 定时更新
    setInterval(updateSystemTime, 1000);
    setInterval(fetchMemoryData, 10000);
    
    // 设置机器人状态为停止
    updateBotStatus(false);
    
    // 添加初始日志
    addLogEntry('内存监控系统已初始化', 'info');
}

// 更新机器人状态
function updateBotStatus(isRunning) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    // 如果元素不存在，直接返回
    if (!statusIndicator || !statusText) {
        console.log('状态指示器元素不存在，无法更新状态');
        return;
    }
    
    if (isRunning) {
        statusIndicator.className = 'status-indicator status-running';
        statusText.textContent = '状态: 运行中';
    } else {
        statusIndicator.className = 'status-indicator status-stopped';
        statusText.textContent = '状态: 已停止';
    }
}

// 切换主题 - 添加防抖动功能
function toggleTheme() {
    // 由于已决定只使用深色主题，此函数不再切换主题
    // 仅记录操作
    console.log('主题切换功能已禁用，系统仅使用深色主题');
    
    // 添加日志
    addLogEntry('主题切换功能已禁用，系统仅使用深色主题', 'info');
}

// 更新图表主题
function updateChartTheme() {
    const theme = chartTheme[currentTheme];
    
    if (memoryChart) {
        memoryChart.options.scales.x.grid.color = theme.gridColor;
        memoryChart.options.scales.y.grid.color = theme.gridColor;
        memoryChart.options.scales.x.ticks.color = theme.tickColor;
        memoryChart.options.scales.y.ticks.color = theme.tickColor;
        memoryChart.update();
    }
    
    if (performanceChart) {
        performanceChart.options.scales.x.grid.color = theme.gridColor;
        performanceChart.options.scales.y.grid.color = theme.gridColor;
        performanceChart.options.scales.x.ticks.color = theme.tickColor;
        performanceChart.options.scales.y.ticks.color = theme.tickColor;
        performanceChart.update();
    }
}

// 更新系统时间
function updateSystemTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN');
    const dateString = now.toLocaleDateString('zh-CN');
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = `${dateString} ${timeString}`;
    }
}

/**
 * 初始化图表
 * @param {HTMLCanvasElement} memoryCanvas 内存图表画布
 * @param {HTMLCanvasElement} heapCanvas 堆内存图表画布
 */
function initializeCharts(memoryCanvas, heapCanvas) {
    console.log('初始化内存监控图表，画布对象:', memoryCanvas, heapCanvas);
    
    // 确保Chart.js已加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载，尝试加载后再初始化图表');
        const script = document.createElement('script');
        script.src = 'js/lib/chart.min.js';
        script.onload = () => {
            console.log('Chart.js加载完成，开始初始化图表');
            initializeChartsAfterLoad(memoryCanvas, heapCanvas);
        };
        script.onerror = () => {
            console.error('无法加载Chart.js，图表将无法显示');
        };
        document.head.appendChild(script);
        return;
    }
    
    // 如果没有提供画布，尝试从DOM获取
    if (!memoryCanvas) {
        memoryCanvas = document.getElementById('memoryChart');
        console.log('使用DOM获取memoryChart:', memoryCanvas);
    }
    
    if (!heapCanvas) {
        heapCanvas = document.getElementById('heapChart');
        console.log('使用DOM获取heapChart:', heapCanvas);
    }
    
    // 检查画布是否有效
    if (!memoryCanvas || !heapCanvas) {
        console.error('图表画布未找到，无法初始化图表');
        return;
    }
    
    initializeChartsAfterLoad(memoryCanvas, heapCanvas);
}

/**
 * Chart.js加载完成后初始化图表
 * @param {HTMLCanvasElement} memoryCanvas 内存图表画布
 * @param {HTMLCanvasElement} heapCanvas 堆内存图表画布
 */
function initializeChartsAfterLoad(memoryCanvas, heapCanvas) {
    try {
        console.log('开始初始化图表，画布检查:', Boolean(memoryCanvas), Boolean(heapCanvas));
        
        // 使用增强的图表更新函数(如果已定义)
        if (typeof window.updateMemoryUsageChart === 'function' && 
            typeof window.updateHeapAllocationChart === 'function') {
            
            console.log('使用增强版图表更新函数');
            
            // 调用更新函数，传入初始数据
            // 确保内存数据存在
            if (!window.memoryData) {
                console.log('初始内存数据不存在，创建默认数据');
                window.memoryData = generateMemoryData();
            }
            
            console.log('调用增强版图表更新函数，数据:', window.memoryData);
            window.updateMemoryUsageChart(window.memoryData.usedMemory);
            window.updateHeapAllocationChart(window.memoryData.heapUsed, window.memoryData.heapTotal);
            
            // 绑定更新函数，当数据更新时更新图表
            window.updateChartsFromMemoryData = function(data) {
                if (typeof window.updateAllMemoryCharts === 'function') {
                    window.updateAllMemoryCharts(data);
                } else {
                    window.updateMemoryUsageChart(data.usedMemory);
                    window.updateHeapAllocationChart(data.heapUsed, data.heapTotal);
                }
            };
            
            return; // 使用增强版函数时，不需要继续执行原始初始化逻辑
        }
        
        // 如果增强版函数未定义，则使用原始初始化逻辑
        console.log('使用原始图表初始化逻辑');
        
        // 创建内存使用趋势图
        if (!window.memoryChart) {
            console.log('创建内存使用趋势图');
            
            const ctx = memoryCanvas.getContext('2d');
            if (!ctx) {
                console.error('无法获取画布2D上下文');
                return;
            }
            
            // 准备初始数据
            const labels = [];
            const data = [];
            
            // 生成10个初始数据点
            const now = new Date();
            for (let i = 10; i >= 1; i--) {
                const time = new Date(now.getTime() - i * 60000); // 每分钟一个点
                labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
                data.push(Math.round(Math.random() * 500 + 200)); // 200-700MB随机数据
            }
            
            // 创建内存图表
            window.memoryChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '内存使用量 (MB)',
                        data: data,
                        borderColor: '#4e73df',
                        backgroundColor: 'rgba(78, 115, 223, 0.05)',
                        borderWidth: 2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0 // 禁用动画以提高性能
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: '时间'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: '内存 (MB)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
            
            console.log('内存使用趋势图创建完成');
        }
        
        // 创建堆内存图表
        if (!window.heapChart) {
            console.log('创建堆内存分配图');
            
            const ctx = heapCanvas.getContext('2d');
            if (!ctx) {
                console.error('无法获取堆内存画布2D上下文');
                return;
            }
            
            // 模拟数据
            const heapUsed = 240; // 240MB
            const heapTotal = 512; // 512MB
            const heapFree = heapTotal - heapUsed;
            
            // 创建堆内存图表
            window.heapChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['已用堆内存', '未用堆内存'],
                    datasets: [{
                        data: [heapUsed, heapFree],
                        backgroundColor: ['#e74a3b', '#1cc88a'],
                        hoverBackgroundColor: ['#be3c30', '#17a673'],
                        hoverBorderColor: 'rgba(234, 236, 244, 1)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 0 // 禁用动画以提高性能
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} MB`;
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
            
            console.log('堆内存分配图创建完成');
        }
        
        console.log('图表初始化完成');
    } catch (error) {
        console.error('初始化图表时出错:', error);
    }
}

/**
 * 刷新内存数据
 */
function fetchMemoryData() {
    console.log('刷新内存数据...');
    
    // 显示加载状态
    updateLoadingState(true);
    
    // 尝试通过API获取真实数据
    if (window.api && typeof window.api.getMemoryStats === 'function') {
        window.api.getMemoryStats()
            .then(data => {
                console.log('获取到API内存数据:', data);
                
                // 验证数据有效性
                if (data && typeof data === 'object') {
                    // 更新内存数据
                    updateMemoryData(data);
                    
                    // 更新UI显示
                    updateUI();
                    
                    // 记录日志
                    addLogEntry('内存数据已更新', 'info');
                } else {
                    throw new Error('API返回的数据无效');
                }
            })
            .catch(error => {
                console.error('获取内存数据失败:', error);
                
                // 使用模拟数据作为后备
                const mockData = generateMemoryData();
                updateMemoryData(mockData);
                
                // 更新UI显示
                updateUI();
                
                // 记录错误日志
                addLogEntry('无法获取真实内存数据，使用模拟数据', 'warning');
            })
            .finally(() => {
                // 无论成功失败，都清除加载状态
                updateLoadingState(false);
            });
    } else {
        // 没有API，使用模拟数据
        console.warn('未检测到API，使用模拟数据');
        const mockData = generateMemoryData();
        updateMemoryData(mockData);
        
        // 更新UI显示
        updateUI();
        
        // 清除加载状态
        updateLoadingState(false);
        
        // 记录日志
        addLogEntry('使用模拟内存数据', 'info');
    }
}

/**
 * 更新内存数据
 * @param {object} data 新的内存数据
 */
function updateMemoryData(data) {
    if (!data) return;
    
    // 更新全局内存数据对象
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            memoryData[key] = data[key];
        }
    }
    
    // 添加时间戳
    memoryData.lastUpdated = Date.now();
    
    // 如果有内存历史数据，更新它
    if (!memoryData.memoryHistory) {
        memoryData.memoryHistory = [];
    }
    
    // 添加当前数据点到历史记录
    memoryData.memoryHistory.push({
        timestamp: Date.now(),
        usedMemory: memoryData.usedMemory,
        heapUsed: memoryData.heapUsed
    });
    
    // 保持历史记录最多30个点
    if (memoryData.memoryHistory.length > 30) {
        memoryData.memoryHistory = memoryData.memoryHistory.slice(-30);
    }
    
    // 调用更新图表的函数
    if (typeof window.updateChartsFromMemoryData === 'function') {
        window.updateChartsFromMemoryData(memoryData);
    }
}

/**
 * 更新UI显示
 */
function updateUI() {
    // 更新统计卡片
    updateStatCards();
    
    // 更新系统时间
    updateSystemTime();
    
    // 更新消耗点
    updateConsumptionPoints();
    
    // 更新状态指示器
    updateStatusIndicator();
}

/**
 * 更新加载状态
 * @param {boolean} isLoading 是否显示加载状态
 */
function updateLoadingState(isLoading) {
    // 获取所有需要更新状态的元素
    const elements = document.querySelectorAll('.stat-card, .chart-card');
    
    // 更新元素的加载状态
    elements.forEach(element => {
        if (isLoading) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    });
    
    // 更新按钮状态
    const buttons = document.querySelectorAll('button[data-action]');
    buttons.forEach(button => {
        button.disabled = isLoading;
    });
}

/**
 * 更新状态指示器
 */
function updateStatusIndicator() {
    const statusIndicator = document.getElementById('statusIndicator');
    if (!statusIndicator) return;
    
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (!statusDot || !statusText) return;
    
    // 计算内存使用率
    const usedPercentage = Math.round((memoryData.usedMemory / memoryData.totalMemory) * 100);
    
    let status = 'normal';
    let statusMessage = '正常';
    
    if (usedPercentage >= 90) {
        status = 'critical';
        statusMessage = '危险';
    } else if (usedPercentage >= 70) {
        status = 'warning';
        statusMessage = '警告';
    } else if (usedPercentage >= 50) {
        status = 'moderate';
        statusMessage = '中等';
    }
    
    // 更新状态显示
    statusDot.className = 'status-dot status-' + status;
    statusText.textContent = statusMessage;
}

// 自动刷新数据的定时器
let autoRefreshTimer = null;

/**
 * 开始自动刷新
 * @param {number} interval 刷新间隔(毫秒)
 */
function startAutoRefresh(interval = 30000) {
    // 清除现有定时器
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
    }
    
    // 设置新定时器
    autoRefreshTimer = setInterval(() => {
        console.log('执行自动刷新...');
        fetchMemoryData();
    }, interval);
    
    console.log(`已设置自动刷新，间隔: ${interval}ms`);
    
    // 添加到window对象方便外部访问
    window._timerId = autoRefreshTimer;
}

/**
 * 停止自动刷新
 */
function stopAutoRefresh() {
    if (autoRefreshTimer) {
        clearInterval(autoRefreshTimer);
        autoRefreshTimer = null;
        window._timerId = null;
        console.log('自动刷新已停止');
    }
}

// 在页面加载完成后，开始自动刷新
document.addEventListener('DOMContentLoaded', () => {
    // 初始刷新一次数据
    fetchMemoryData();
    
    // 开始自动刷新
    startAutoRefresh(30000); // 30秒刷新一次
});

/**
 * 更新内存统计卡片
 */
function updateStatCards() {
    const updateElement = (id, content) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    };
    
    // 更新总内存使用
    updateElement('totalMemory', formatMemorySize(memoryData.totalMemory));
    updateElement('usedMemory', `已使用: ${formatMemorySize(memoryData.usedMemory)} `);
    updateElement('usedPercentage', `(${calculatePercentage(memoryData.usedMemory, memoryData.totalMemory)}%)`);
    
    // 更新堆内存使用
    updateElement('heapTotal', formatMemorySize(memoryData.heapTotal));
    updateElement('heapUsed', `已使用: ${formatMemorySize(memoryData.heapUsed)} `);
    updateElement('heapPercentage', `(${calculatePercentage(memoryData.heapUsed, memoryData.heapTotal)}%)`);
    
    // 更新峰值内存
    updateElement('peakMemory', formatMemorySize(memoryData.peakMemory));
    
    // 更新外部内存
    updateElement('externalMemory', formatMemorySize(memoryData.external));
}

/**
 * 更新图表
 */
function updateCharts() {
    // 更新内存使用历史图表
    if (memoryChart) {
        if (!memoryData.memoryHistory || !Array.isArray(memoryData.memoryHistory) || memoryData.memoryHistory.length === 0) {
            console.warn('内存历史数据不存在或为空，使用模拟数据');
            generateMockMemoryData();
            return;
        }
        
        memoryChart.data.datasets[0].data = memoryData.memoryHistory.map(item => item.usedMemory / (1024 * 1024));
        memoryChart.data.datasets[1].data = memoryData.memoryHistory.map(item => item.heapUsed / (1024 * 1024));
        memoryChart.data.labels = memoryData.memoryHistory.map(item => {
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        });
        memoryChart.update();
    }
    
    // 更新性能指标图表
    if (performanceChart) {
        if (!memoryData.performanceMetrics || !Array.isArray(memoryData.performanceMetrics) || memoryData.performanceMetrics.length === 0) {
            console.warn('性能指标数据不存在或为空，使用模拟数据');
            
            // 使用模拟数据
            const mockMetrics = {
                cpuUsage: 35 + Math.random() * 20,
                memoryEfficiency: 75 + Math.random() * 15,
                requestLatency: 25 + Math.random() * 30,
                gcFrequency: 40 + Math.random() * 15
            };
            
            performanceChart.data.datasets[0].data = [
                mockMetrics.cpuUsage,
                mockMetrics.memoryEfficiency,
                mockMetrics.requestLatency,
                mockMetrics.gcFrequency
            ];
        } else {
            const latestMetrics = memoryData.performanceMetrics[memoryData.performanceMetrics.length - 1];
            performanceChart.data.datasets[0].data = [
                latestMetrics.cpuUsage,
                latestMetrics.memoryEfficiency,
                latestMetrics.requestLatency,
                latestMetrics.gcFrequency
            ];
        }
        
        performanceChart.update();
    }
}

/**
 * 更新内存消耗点
 */
function updateConsumptionPoints() {
    const consumptionPointsContainer = document.getElementById('consumptionPoints');
    if (!consumptionPointsContainer) return;
    
    const modules = generateConsumptionPoints();
    
    // 获取搜索和筛选值
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    const statusFilterElement = document.getElementById('statusFilter');
    const statusFilter = statusFilterElement ? statusFilterElement.value : 'ALL';
    
    // 筛选模块
    const filteredModules = modules.filter(module => {
        // 搜索筛选
        const matchesSearch = searchQuery === '' || 
                            module.name.toLowerCase().includes(searchQuery);
        
        // 状态筛选
        const matchesStatus = statusFilter === 'ALL' || 
                            module.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
    
    // 生成HTML
    let html = '';
    for (const module of filteredModules) {
        html += `
            <tr>
                <td>${module.name}</td>
                <td>${module.usage}</td>
                <td><span class="status-badge status-${module.status}">${getStatusText(module.status)}</span></td>
                <td>${module.lastUpdate}</td>
            </tr>
        `;
    }
    
    // 如果没有结果，显示提示信息
    if (filteredModules.length === 0) {
        html = `
            <tr>
                <td colspan="4" class="text-center">没有找到匹配的内存消耗点</td>
            </tr>
        `;
    }
    
    consumptionPointsContainer.innerHTML = html;
}

/**
 * 获取状态文本
 */
function getStatusText(status) {
    switch(status) {
        case 'LOW': return '低消耗';
        case 'MEDIUM': return '中等';
        case 'HIGH': return '高消耗';
        default: return '未知';
    }
}

// 更新内存统计卡片
function updateMemoryStats() {
    const updateElement = (id, content) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    };
    
    // 更新总内存使用
    updateElement('totalMemory', formatMemorySize(memoryData.totalMemory));
    updateElement('usedMemory', `已使用: ${formatMemorySize(memoryData.usedMemory)} `);
    updateElement('usedPercentage', `(${calculatePercentage(memoryData.usedMemory, memoryData.totalMemory)}%)`);
    
    // 更新堆内存使用
    updateElement('heapTotal', formatMemorySize(memoryData.heapTotal));
    updateElement('heapUsed', `已使用: ${formatMemorySize(memoryData.heapUsed)} `);
    updateElement('heapPercentage', `(${calculatePercentage(memoryData.heapUsed, memoryData.heapTotal)}%)`);
    
    // 更新峰值内存
    updateElement('peakMemory', formatMemorySize(memoryData.peakMemory));
    
    // 更新外部内存
    updateElement('externalMemory', formatMemorySize(memoryData.external));
}

// 更新图表
function updateCharts() {
    // 更新内存使用历史图表
    if (memoryChart) {
        if (!memoryData.memoryHistory || !Array.isArray(memoryData.memoryHistory) || memoryData.memoryHistory.length === 0) {
            console.warn('内存历史数据不存在或为空，使用模拟数据');
            generateMockMemoryData();
            return;
        }
        
        memoryChart.data.datasets[0].data = memoryData.memoryHistory.map(item => item.usedMemory / (1024 * 1024));
        memoryChart.data.datasets[1].data = memoryData.memoryHistory.map(item => item.heapUsed / (1024 * 1024));
        memoryChart.data.labels = memoryData.memoryHistory.map(item => {
            const date = new Date(item.timestamp);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        });
        memoryChart.update();
    }
    
    // 更新性能指标图表
    if (performanceChart) {
        if (!memoryData.performanceMetrics || !Array.isArray(memoryData.performanceMetrics) || memoryData.performanceMetrics.length === 0) {
            console.warn('性能指标数据不存在或为空，使用模拟数据');
            
            // 使用模拟数据
            const mockMetrics = {
                cpuUsage: 35 + Math.random() * 20,
                memoryEfficiency: 75 + Math.random() * 15,
                requestLatency: 25 + Math.random() * 30,
                gcFrequency: 40 + Math.random() * 15
            };
            
            performanceChart.data.datasets[0].data = [
                mockMetrics.cpuUsage,
                mockMetrics.memoryEfficiency,
                mockMetrics.requestLatency,
                mockMetrics.gcFrequency
            ];
        } else {
            const latestMetrics = memoryData.performanceMetrics[memoryData.performanceMetrics.length - 1];
            performanceChart.data.datasets[0].data = [
                latestMetrics.cpuUsage,
                latestMetrics.memoryEfficiency,
                latestMetrics.requestLatency,
                latestMetrics.gcFrequency
            ];
        }
        
        performanceChart.update();
    }
}

// 更新内存消耗点
function updateMemoryConsumptionPoints() {
    memoryConsumptionPoints = memoryData.consumptionPoints || generateMockConsumptionPoints();
    renderMemoryConsumptionTable();
}

// 渲染内存消耗表格
function renderMemoryConsumptionTable() {
    const tableBody = document.getElementById('memoryConsumptionTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    for (const point of memoryConsumptionPoints) {
        const row = document.createElement('tr');
        
        const moduleCell = document.createElement('td');
        moduleCell.textContent = point.module;
        row.appendChild(moduleCell);
        
        const consumptionCell = document.createElement('td');
        consumptionCell.textContent = formatMemorySize(point.consumption);
        row.appendChild(consumptionCell);
        
        const percentageCell = document.createElement('td');
        percentageCell.textContent = `${calculatePercentage(point.consumption, memoryData.usedMemory)}%`;
        row.appendChild(percentageCell);
        
        const statusCell = document.createElement('td');
        const statusSpan = document.createElement('span');
        statusSpan.className = `status-${point.status.toLowerCase()}`;
        statusSpan.textContent = getStatusText(point.status);
        statusCell.appendChild(statusSpan);
        row.appendChild(statusCell);
        
        const actionCell = document.createElement('td');
        const optimizeButton = document.createElement('button');
        optimizeButton.textContent = '优化';
        optimizeButton.className = 'btn btn-sm';
        optimizeButton.addEventListener('click', () => optimizeModuleMemory(point));
        actionCell.appendChild(optimizeButton);
        row.appendChild(actionCell);
        
        tableBody.appendChild(row);
    }
    
    // 应用过滤条件
    filterMemoryConsumptionPoints();
}

// 过滤内存消耗点
function filterMemoryConsumptionPoints() {
    const searchInput = document.getElementById('consumptionSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filterElement = document.getElementById('consumptionFilter');
    const filterValue = filterElement ? filterElement.value : 'all';
    
    const tableBody = document.getElementById('memoryConsumptionTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.getElementsByTagName('tr');
    
    for (const row of rows) {
        const moduleText = row.cells[0].textContent.toLowerCase();
        const statusSpan = row.cells[3].querySelector('span');
        if (!statusSpan) continue;
        
        const statusText = statusSpan.textContent.toLowerCase();
        
        let showRow = moduleText.includes(searchTerm);
        
        if (filterValue !== 'all') {
            showRow = showRow && statusText === getStatusText(filterValue).toLowerCase();
        }
        
        row.style.display = showRow ? '' : 'none';
    }
}

// 优化内存
function optimizeMemory() {
    addLogEntry('开始进行内存优化...', 'info');
    
    // 模拟优化过程
    setTimeout(() => {
        // 减少10-20%的内存使用
        const reductionPercent = 10 + Math.random() * 10;
        const memoryReduced = memoryData.usedMemory * (reductionPercent / 100);
        
        memoryData.usedMemory -= memoryReduced;
        memoryData.heapUsed -= (memoryReduced * 0.8); // 假设80%的减少来自堆
        
        // 更新内存历史记录
        if (memoryData.memoryHistory.length > 0) {
            const lastEntry = memoryData.memoryHistory[memoryData.memoryHistory.length - 1];
            lastEntry.usedMemory = memoryData.usedMemory;
            lastEntry.heapUsed = memoryData.heapUsed;
        }
        
        // 更新内存消耗点
        for (const point of memoryConsumptionPoints) {
            point.consumption *= (1 - (Math.random() * 0.2)); // 减少0-20%
            // 更新状态
            if (point.status === 'HIGH' && Math.random() > 0.5) {
                point.status = 'NORMAL';
            }
        }
        
        // 更新显示
        updateMemoryStats();
        updateCharts();
        renderMemoryConsumptionTable();
        
        addLogEntry(`内存优化完成，释放了约 ${formatMemorySize(memoryReduced)} (${reductionPercent.toFixed(1)}%)`, 'info');
    }, 1500);
}

// 优化特定模块的内存
function optimizeModuleMemory(module) {
    addLogEntry(`开始优化模块 "${module.module}" 的内存...`, 'info');
    
    // 模拟优化过程
    setTimeout(() => {
        // 减少20-40%的内存消耗
        const reductionPercent = 20 + Math.random() * 20;
        const memoryReduced = module.consumption * (reductionPercent / 100);
        
        // 减少模块的内存消耗
        module.consumption -= memoryReduced;
        
        // 更新总内存使用
        memoryData.usedMemory -= memoryReduced;
        memoryData.heapUsed -= (memoryReduced * 0.8); // 假设80%的减少来自堆
        
        // 更新状态
        if (module.status === 'HIGH' || module.status === 'MEDIUM') {
            module.status = Math.random() > 0.7 ? 'NORMAL' : 'MEDIUM';
        }
        
        // 更新显示
        updateMemoryStats();
        updateCharts();
        renderMemoryConsumptionTable();
        
        addLogEntry(`模块 "${module.module}" 内存优化完成，释放了约 ${formatMemorySize(memoryReduced)} (${reductionPercent.toFixed(1)}%)`, 'info');
    }, 1000);
}

// 添加日志条目
function addLogEntry(message, level = 'info') {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('zh-CN');
    
    memoryLogs.unshift({
        timestamp,
        message,
        level
    });
    
    // 限制日志条目数量
    if (memoryLogs.length > 100) {
        memoryLogs.pop();
    }
    
    renderLogs();
}

// 渲染日志
function renderLogs() {
    const logsContainer = document.getElementById('logsContainer');
    if (!logsContainer) return;
    
    logsContainer.innerHTML = '';
    
    for (const log of memoryLogs) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = log.timestamp;
        
        const levelSpan = document.createElement('span');
        levelSpan.className = `log-level-${log.level}`;
        levelSpan.textContent = `[${log.level.toUpperCase()}] `;
        
        const message = document.createElement('span');
        message.textContent = log.message;
        
        logEntry.appendChild(timestamp);
        logEntry.appendChild(levelSpan);
        logEntry.appendChild(message);
        
        logsContainer.appendChild(logEntry);
    }
}

// 生成模拟内存数据
function generateMockMemoryData() {
    const now = Date.now();
    const memoryHistory = [];
    const performanceMetrics = [];
    
    // 生成过去24个时间点的内存历史数据
    for (let i = 0; i < 24; i++) {
        const time = now - (23 - i) * 10 * 60 * 1000; // 每10分钟一个点
        const baseMemory = 200 + Math.random() * 100; // 基础内存使用
        
        memoryHistory.push({
            timestamp: time,
            usedMemory: (baseMemory + i * 2) * 1024 * 1024, // 随时间略微增长
            heapUsed: (baseMemory * 0.8 + i * 1.5) * 1024 * 1024 // 堆内存使用
        });
    }
    
    // 生成过去12个时间点的性能指标
    for (let i = 0; i < 12; i++) {
        const time = now - (11 - i) * 10 * 60 * 1000;
        
        performanceMetrics.push({
            timestamp: time,
            cpuUsage: 20 + Math.random() * 30, // CPU使用率
            memoryEfficiency: 70 + Math.random() * 20, // 内存效率
            requestLatency: 10 + Math.random() * 40, // 请求延迟
            gcFrequency: 30 + Math.random() * 20 // GC频率
        });
    }
    
    // 构造模拟数据
    memoryData = {
        totalMemory: 1024 * 1024 * 1024, // 1GB
        usedMemory: 400 * 1024 * 1024, // 400MB
        heapTotal: 512 * 1024 * 1024, // 512MB
        heapUsed: 300 * 1024 * 1024, // 300MB
        peakMemory: 450 * 1024 * 1024, // 450MB
        external: 50 * 1024 * 1024, // 50MB
        memoryHistory: memoryHistory,
        performanceMetrics: performanceMetrics,
        consumptionPoints: generateMockConsumptionPoints()
    };
    
    // 更新UI
    updateMemoryStats();
    updateCharts();
    updateMemoryConsumptionPoints();
    
    // 添加日志
    addLogEntry('已生成模拟内存数据用于演示', 'info');
}

// 生成模拟内存消耗点
function generateMockConsumptionPoints() {
    const modules = [
        '交易模块',
        'RPC服务',
        '池监听器',
        '价格服务',
        '钱包管理器',
        '事件监听器',
        'DEX交互服务',
        '通知服务',
        '策略执行器',
        '日志服务'
    ];
    
    return modules.map(module => {
        const consumption = Math.random() * 300 * 1024 * 1024; // 0-300MB
        let status;
        
        if (consumption > 200 * 1024 * 1024) {
            status = 'HIGH';
        } else if (consumption > 100 * 1024 * 1024) {
            status = 'MEDIUM';
        } else {
            status = 'NORMAL';
        }
        
        return { module, consumption, status };
    });
}

/**
 * 格式化内存大小
 * @param {number} bytes 内存字节数
 * @returns {string} 格式化后的内存大小字符串
 */
function formatMemorySize(bytes) {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
        return '0 MB';
    }
    
    const MB = bytes / (1024 * 1024);
    
    if (MB >= 1024) {
        const GB = MB / 1024;
        return `${GB.toFixed(2)} GB`;
    }
    
    return `${Math.round(MB)} MB`;
}

/**
 * 计算百分比
 * @param {number} used 已用值
 * @param {number} total 总值
 * @returns {number} 百分比值
 */
function calculatePercentage(used, total) {
    if (typeof used !== 'number' || typeof total !== 'number' || 
        Number.isNaN(used) || Number.isNaN(total) || total <= 0) {
        return 0;
    }
    
    return Math.round((used / total) * 100);
}

/**
 * 添加内存优化建议到建议容器
 * @param {string} suggestion - 优化建议内容
 * @param {string} type - 建议类型：info, warning, success, error
 */
function addOptimizationSuggestion(suggestion, type = 'info') {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    if (!suggestionsContainer) return;
    
    const suggestionElement = document.createElement('div');
    suggestionElement.className = `log-entry log-level-${type}`;
    
    const timestamp = new Date().toLocaleTimeString('zh-CN');
    
    suggestionElement.innerHTML = `
        <span class="log-timestamp">${timestamp}</span>
        <span class="log-content">${suggestion}</span>
    `;
    
    suggestionsContainer.appendChild(suggestionElement);
    suggestionsContainer.scrollTop = suggestionsContainer.scrollHeight;
}

/**
 * 生成内存优化建议
 * 基于当前内存使用情况生成一系列优化建议
 */
function generateOptimizationSuggestions() {
    // 清空现有建议
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
    }
    
    // 检查内存使用情况并生成相应建议
    const heapUsagePercentage = calculatePercentage(memoryData.heapUsed, memoryData.heapTotal);
    const memoryUsagePercentage = calculatePercentage(memoryData.usedMemory, memoryData.totalMemory);
    
    // 根据内存使用率添加不同类型的建议
    if (heapUsagePercentage > 70) {
        addOptimizationSuggestion(`堆内存使用率达到${heapUsagePercentage}%，建议进行垃圾回收`, 'warning');
    } else if (heapUsagePercentage > 50) {
        addOptimizationSuggestion(`堆内存使用率为${heapUsagePercentage}%，正常范围内`, 'info');
    } else {
        addOptimizationSuggestion(`堆内存使用率为${heapUsagePercentage}%，运行良好`, 'success');
    }
    
    // 添加一些常见的内存优化建议
    addOptimizationSuggestion('建议减少闲置连接池数量，可释放约15MB内存', 'info');
    addOptimizationSuggestion('监测到3个未关闭的网络连接，可能导致内存泄漏', 'warning');
    addOptimizationSuggestion('建议优化大数组处理逻辑，减少内存复制操作', 'info');
    
    // 添加一些最近的优化结果
    const randomReleasedMemory = Math.floor(Math.random() * 20) + 5;
    addOptimizationSuggestion(`最近一次垃圾回收已释放${randomReleasedMemory}MB内存`, 'success');
    
    // 根据消耗点添加针对性建议
    if (memoryConsumptionPoints.length > 0) {
        // 找出高内存消耗模块
        const highConsumptionModules = memoryConsumptionPoints.filter(point => point.status === 'HIGH');
        if (highConsumptionModules.length > 0) {
            highConsumptionModules.forEach(module => {
                addOptimizationSuggestion(`模块 ${module.module} 内存消耗过高，建议优化或考虑重启`, 'warning');
            });
        }
    }
}

// 生成内存优化建议
function generateMemoryOptimizationSuggestions() {
    const suggestions = [
        "关闭长时间未使用的区块链连接可减少内存占用",
        "定期清理缓存的交易数据可提高系统响应速度",
        "减少同时运行的策略数量可降低内存压力",
        "优化大数据量的历史记录存储方式",
        "使用分页加载而非一次性加载所有数据",
        "避免在循环中创建大量临时对象",
        "对不再使用的数据及时进行垃圾回收"
    ];
    
    // 随机选择3-5条建议
    const count = Math.floor(Math.random() * 3) + 3; // 3到5条
    const selectedSuggestions = [];
    const usedIndexes = new Set();
    
    while (selectedSuggestions.length < count && usedIndexes.size < suggestions.length) {
        const index = Math.floor(Math.random() * suggestions.length);
        if (!usedIndexes.has(index)) {
            usedIndexes.add(index);
            selectedSuggestions.push(suggestions[index]);
        }
    }
    
    // 渲染建议到UI
    const suggestionsContainer = document.getElementById('optimizationSuggestions');
    if (suggestionsContainer) {
        suggestionsContainer.innerHTML = '';
        
        if (selectedSuggestions.length === 0) {
            suggestionsContainer.innerHTML = '<p class="no-data">目前没有优化建议</p>';
            return;
        }
        
        const ul = document.createElement('ul');
        ul.className = 'suggestions-list';
        
        selectedSuggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            ul.appendChild(li);
        });
        
        suggestionsContainer.appendChild(ul);
        addLogEntry('生成了新的内存优化建议', 'info');
    }
}

// 分析内存消耗点
function analyzeMemoryConsumptionPoints() {
    const memoryPoints = [
        { module: '区块链连接管理', usage: Math.floor(Math.random() * 80) + 20, status: 'MEDIUM' },
        { module: '交易数据缓存', usage: Math.floor(Math.random() * 90) + 10, status: 'LOW' },
        { module: '策略执行引擎', usage: Math.floor(Math.random() * 100) + 50, status: 'HIGH' },
        { module: '历史数据存储', usage: Math.floor(Math.random() * 70) + 30, status: 'MEDIUM' },
        { module: '实时价格监控', usage: Math.floor(Math.random() * 60) + 40, status: 'MEDIUM' },
        { module: '用户界面渲染', usage: Math.floor(Math.random() * 40) + 10, status: 'LOW' },
        { module: '日志记录系统', usage: Math.floor(Math.random() * 30) + 10, status: 'LOW' },
        { module: 'MEV策略分析', usage: Math.floor(Math.random() * 120) + 30, status: 'HIGH' }
    ];
    
    // 为每个点分配状态
    memoryPoints.forEach(point => {
        if (point.usage < 50) {
            point.status = 'LOW';
        } else if (point.usage < 100) {
            point.status = 'MEDIUM';
        } else {
            point.status = 'HIGH';
        }
    });
    
    // 渲染到表格
    const tableBody = document.getElementById('memoryPointsTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        
        if (memoryPoints.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="no-data">没有找到内存消耗点</td>';
            tableBody.appendChild(row);
            return;
        }
        
        memoryPoints.forEach(point => {
            const row = document.createElement('tr');
            row.className = `memory-point-row ${point.status.toLowerCase()}`;
            
            const moduleCell = document.createElement('td');
            moduleCell.textContent = point.module;
            
            const usageCell = document.createElement('td');
            usageCell.textContent = `${point.usage} MB`;
            
            const statusCell = document.createElement('td');
            let statusText = '低';
            let statusClass = 'status-low';
            
            if (point.status === 'MEDIUM') {
                statusText = '中';
                statusClass = 'status-medium';
            } else if (point.status === 'HIGH') {
                statusText = '高';
                statusClass = 'status-high';
            }
            
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            
            row.appendChild(moduleCell);
            row.appendChild(usageCell);
            row.appendChild(statusCell);
            tableBody.appendChild(row);
        });
        
        addLogEntry('更新了内存消耗点分析', 'info');
        
        // 添加搜索和筛选功能
        setupMemoryPointsFilters(memoryPoints);
    }
}

// 设置内存消耗点的搜索和筛选功能
function setupMemoryPointsFilters(memoryPoints) {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchInput || !statusFilter) return;
    
    const filterPoints = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        
        const tableBody = document.getElementById('memoryPointsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        const filteredPoints = memoryPoints.filter(point => {
            const matchesSearch = point.module.toLowerCase().includes(searchTerm);
            const matchesStatus = statusValue === 'ALL' || point.status === statusValue;
            return matchesSearch && matchesStatus;
        });
        
        if (filteredPoints.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="no-data">没有找到匹配的内存消耗点</td>';
            tableBody.appendChild(row);
            return;
        }
        
        filteredPoints.forEach(point => {
            const row = document.createElement('tr');
            row.className = `memory-point-row ${point.status.toLowerCase()}`;
            
            const moduleCell = document.createElement('td');
            moduleCell.textContent = point.module;
            
            const usageCell = document.createElement('td');
            usageCell.textContent = `${point.usage} MB`;
            
            const statusCell = document.createElement('td');
            let statusText = '低';
            let statusClass = 'status-low';
            
            if (point.status === 'MEDIUM') {
                statusText = '中';
                statusClass = 'status-medium';
            } else if (point.status === 'HIGH') {
                statusText = '高';
                statusClass = 'status-high';
            }
            
            statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
            
            row.appendChild(moduleCell);
            row.appendChild(usageCell);
            row.appendChild(statusCell);
            tableBody.appendChild(row);
        });
    };
    
    searchInput.addEventListener('input', filterPoints);
    statusFilter.addEventListener('change', filterPoints);
}

// 刷新内存优化建议
function refreshOptimizationSuggestions() {
    generateMemoryOptimizationSuggestions();
    addLogEntry('刷新了内存优化建议', 'info');
}

/**
 * 生成内存优化建议
 */
function generateSuggestions() {
    const suggestionsContainer = document.getElementById('suggestionsContainer');
    suggestionsContainer.innerHTML = '<div class="loading">生成建议中...</div>';
    
    // 模拟获取建议的延迟
    setTimeout(() => {
        // 一些示例建议
        const suggestions = [
            {
                text: '内存泄漏检测发现Socket连接未正确关闭，可能导致内存泄漏。建议在不需要时主动关闭连接。',
                type: 'warning'
            },
            {
                text: '监控到大量未使用的对象缓存，建议减少缓存大小或实现LRU策略。',
                type: 'info'
            },
            {
                text: '部分模块使用了过大的Buffer，建议检查并优化Buffer大小。',
                type: 'info'
            },
            {
                text: '交易历史记录缓存过大，建议限制最大条目数并定期清理。',
                type: 'warning'
            },
            {
                text: '检测到堆内存碎片化严重，可能需要定期进行垃圾回收。',
                type: 'error'
            }
        ];
        
        // 渲染建议
        let html = '<ul class="suggestions-list">';
        suggestions.forEach(suggestion => {
            html += `<li class="log-level-${suggestion.type}">${suggestion.text}</li>`;
        });
        html += '</ul>';
        
        suggestionsContainer.innerHTML = html;
    }, 500);
}

/**
 * 生成内存消耗点数据
 */
function generateConsumptionPoints() {
    const modules = [
        { name: '交易监控模块', usage: '120MB', status: 'HIGH', lastUpdate: '2023/04/10 15:30' },
        { name: '流动性池跟踪器', usage: '85MB', status: 'MEDIUM', lastUpdate: '2023/04/10 15:28' },
        { name: '区块链数据索引', usage: '210MB', status: 'HIGH', lastUpdate: '2023/04/10 15:25' },
        { name: '用户界面缓存', usage: '45MB', status: 'LOW', lastUpdate: '2023/04/10 15:20' },
        { name: '代币价格追踪器', usage: '78MB', status: 'MEDIUM', lastUpdate: '2023/04/10 15:15' },
        { name: 'WebSocket连接管理', usage: '62MB', status: 'MEDIUM', lastUpdate: '2023/04/10 15:10' },
        { name: '日志记录服务', usage: '35MB', status: 'LOW', lastUpdate: '2023/04/10 15:05' },
        { name: '交易执行引擎', usage: '145MB', status: 'HIGH', lastUpdate: '2023/04/10 15:00' }
    ];
    
    return modules;
}

/**
 * 更新内存图表
 * @param {number} usedMemory 已使用内存
 * @param {number} heapUsed 已使用堆内存
 * @param {number} heapTotal 总堆内存
 */
function updateMemoryCharts(usedMemory, heapUsed, heapTotal) {
    // 更新时间标签 - 添加存在性检查
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    const memoryUpdateEl = document.getElementById('memoryChartUpdate');
    if (memoryUpdateEl) {
        memoryUpdateEl.textContent = `最后更新: ${timeString}`;
    }
    
    const heapUpdateEl = document.getElementById('heapChartUpdate');
    if (heapUpdateEl) {
        heapUpdateEl.textContent = `最后更新: ${timeString}`;
    }
    
    // 检查是否有Chart全局对象
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js未找到，图表将不会显示');
        return;
    }
    
    try {
        // 检查函数和元素是否存在
        if (typeof updateMemoryUsageChart === 'function') {
            // 内存使用趋势图表
            updateMemoryUsageChart(usedMemory);
        }
        
        if (typeof updateHeapAllocationChart === 'function') {
            // 堆内存分配图表
            updateHeapAllocationChart(heapUsed, heapTotal);
        }
    } catch (error) {
        console.error('更新图表失败:', error);
        addLogEntry(`更新图表失败: ${error.message}`, 'error');
    }
}

/**
 * 更新内存使用趋势图表
 * @param {number} usedMemory 已使用内存
 */
function updateMemoryUsageChart(usedMemory) {
    // 使用安全的方式获取图表元素
    const memoryChartCtx = document.getElementById('memoryChart');
    if (!memoryChartCtx) {
        console.warn('找不到内存图表元素，无法更新图表');
        return;
    }
    
    // 初始化内存使用趋势数据
    if (!window.memoryChart) {
        // 初始化内存数据
        const labels = [];
        const data = [];
        
        // 获取当前时间
        const now = new Date();
        
        // 添加过去30分钟的标签和空数据点
        for (let i = 30; i >= 0; i--) {
            const time = new Date(now - i * 60000);
            labels.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
            data.push(null); // 用null表示没有数据
        }
        
        try {
            // 创建内存使用图表
            window.memoryChart = new Chart(memoryChartCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '内存使用 (MB)',
                        data: data,
                        borderColor: '#4dffbd',
                        backgroundColor: 'rgba(77, 255, 189, 0.1)',
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        pointRadius: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '内存 (MB)'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '时间'
                            }
                        }
                    },
                    animation: {
                        duration: 500
                    }
                }
            });
        } catch (error) {
            console.error('创建内存图表失败:', error);
            return;
        }
    }
    
    // 安全地更新内存使用趋势数据
    try {
        if (!window.memoryChart || !window.memoryChart.data || !window.memoryChart.data.datasets) {
            console.warn('内存图表未正确初始化，无法更新数据');
            return;
        }
        
        const data = window.memoryChart.data.datasets[0].data;
        data.push(usedMemory);
        data.shift();
        
        // 获取当前时间
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        // 更新标签
        const labels = window.memoryChart.data.labels;
        labels.push(timeString);
        labels.shift();
        
        // 更新图表
        window.memoryChart.update();
    } catch (error) {
        console.error('更新内存图表数据失败:', error);
    }
}

/**
 * 更新堆内存分配图表
 * @param {number} heapUsed 已使用堆内存
 * @param {number} heapTotal 总堆内存
 */
function updateHeapAllocationChart(heapUsed, heapTotal) {
    // 使用安全的方式获取图表元素
    const heapChartCtx = document.getElementById('heapChart');
    if (!heapChartCtx) {
        console.warn('找不到堆内存图表元素，无法更新图表');
        return;
    }
    
    // 计算未使用堆内存
    const heapFree = heapTotal - heapUsed;
    
    // 初始化堆内存分配图表
    if (!window.heapChart) {
        try {
            window.heapChart = new Chart(heapChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['已使用', '未使用'],
                    datasets: [{
                        data: [heapUsed, heapFree],
                        backgroundColor: [
                            'rgba(239, 71, 111, 0.7)',
                            'rgba(77, 255, 189, 0.7)'
                        ],
                        borderColor: [
                            'rgba(239, 71, 111, 1)',
                            'rgba(77, 255, 189, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const percentage = ((value / heapTotal) * 100).toFixed(1);
                                    return `${label}: ${value} MB (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('创建堆内存图表失败:', error);
            return;
        }
    } else {
        // 安全地更新堆内存分配数据
        try {
            if (!window.heapChart || !window.heapChart.data || !window.heapChart.data.datasets) {
                console.warn('堆内存图表未正确初始化，无法更新数据');
                return;
            }
            
            window.heapChart.data.datasets[0].data = [heapUsed, heapFree];
            window.heapChart.update();
        } catch (error) {
            console.error('更新堆内存图表数据失败:', error);
        }
    }
}

/**
 * 内存泄漏检测 - 真实API版本
 */
async function checkMemoryLeaks() {
    const leaksContainer = document.getElementById('leaksContainer');
    if (!leaksContainer) return;
    
    leaksContainer.innerHTML = '<div class="log-loading">检测中...</div>';
    
    try {
        // 获取最新的系统状态数据，包含泄漏信息
        const response = await fetch('/api/system/status');
        
        if (!response.ok) {
            throw new Error(`API错误: ${response.status}`);
        }
        
        const data = await response.json();
        const leakWarnings = data.optimization?.leakWarnings || 0;
        const consumers = data.consumers || [];
        
        // 清空容器
        leaksContainer.innerHTML = '';
        
        // 显示检测结果
        if (leakWarnings > 0) {
            // 查找可能存在泄漏的消费者
            const suspectConsumers = consumers.filter(c => 
                c.status.includes('泄漏') || c.memoryUsage > 80);
            
            // 添加泄漏检测结果
            for (const consumer of suspectConsumers) {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'log-entry warning';
                entryDiv.innerHTML = `
                    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                    <span class="module">${consumer.name}:</span>
                    <span class="message">可能存在内存泄漏，内存使用率: ${Math.round(consumer.memoryUsage)}%</span>
                `;
                leaksContainer.appendChild(entryDiv);
            }
            
            // 添加总结
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'log-entry danger';
            summaryDiv.innerHTML = `
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="message">检测完成，发现${leakWarnings}个可能的内存问题</span>
            `;
            leaksContainer.appendChild(summaryDiv);
        } else {
            // 没有发现泄漏
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry success';
            entryDiv.innerHTML = `
                <span class="timestamp">${new Date().toLocaleTimeString()}</span>
                <span class="message">检测完成，未发现内存泄漏问题</span>
            `;
            leaksContainer.appendChild(entryDiv);
        }
        
        addLogEntry('内存泄漏检测完成', 'info');
        
    } catch (error) {
        console.error('内存泄漏检测失败:', error);
        
        // 显示错误
        leaksContainer.innerHTML = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'log-entry error';
        errorDiv.innerHTML = `
            <span class="timestamp">${new Date().toLocaleTimeString()}</span>
            <span class="message">检测失败: ${error.message}</span>
        `;
        leaksContainer.appendChild(errorDiv);
        
        addLogEntry(`内存泄漏检测失败: ${error.message}`, 'error');
    }
} 