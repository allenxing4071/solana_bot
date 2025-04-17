/**
 * Solana MEV机器人 - 仪表盘页面JavaScript
 * 实现处理API数据、显示图表和交易列表功能
 * 
 * 版本: v1.0.7 - 2025年4月13日更新
 * 已修复: API端口改为8080
 * 已修复: API健康检查使用/api/status端点
 * 已修复: data.data.slice is not a function 错误
 * 已修复: getApiBaseUrl is not defined 错误
 * 已增强: API调试功能
 * 已添加: API健康检查
 */

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
const getApiBaseUrl = () => {
    // 首先尝试从全局环境变量中获取
    if (window?.ENV?.API_URL) {
        // 如果有端口，拼接端口
        let baseUrl = window.ENV.API_URL;
        if (window?.ENV?.API_PORT) {
            // 确保URL不以/结尾
            baseUrl = baseUrl.replace(/\/$/, '');
            baseUrl += `:${window.ENV.API_PORT}`;
        }
        
        console.log(`[getApiBaseUrl] 从ENV获取API地址: ${baseUrl}`);
        return baseUrl;
    }
    
    // 尝试从当前URL推断
    const currentUrl = window.location.origin;
    const apiUrl = currentUrl.replace(':8082', ':8080');
    
    console.log(`[getApiBaseUrl] 根据当前地址推断API地址: ${apiUrl}`);
    return apiUrl;
};

/**
 * 检查API服务是否正常运行
 * @returns {Promise<boolean>} API是否可用
 */
async function checkApiStatus() {
    try {
        console.log('[checkApiStatus] 开始检查API状态...');
        const apiUrl = getApiBaseUrl();
        
        // 使用状态检查接口
        const statusEndpoint = `${apiUrl}/api/status`;
        console.log(`[checkApiStatus] 请求状态检查: ${statusEndpoint}`);
        
        // 完全简化请求，不使用任何自定义选项，避免CORS问题
        const response = await fetch(statusEndpoint);
        
        // 如果服务器响应正常
        if (response.ok) {
            console.log('[checkApiStatus] API服务正常运行');
            return true;
        }
            console.warn(`[checkApiStatus] API服务响应异常: ${response.status} ${response.statusText}`);
            return false;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('[checkApiStatus] API请求超时');
        } else {
            console.error('[checkApiStatus] API健康检查失败:', error);
        }
        return false;
    }
}

/**
 * API调试助手 - 输出调试信息
 */
function apiDebugHelper() {
    console.log('%c========== API调试信息 ==========', 'color: blue; font-weight: bold');
    console.log('环境配置:', window.ENV);
    console.log('当前API地址:', getApiBaseUrl());
    console.log('如何排查API问题:');
    console.log('1. 确认后端API服务已启动并可访问');
    console.log('2. 确认API地址配置正确');
    console.log('3. 在Network面板检查API请求状态和响应');
    console.log('4. 查看Console面板的详细日志信息');
    console.log('%c===================================', 'color: blue; font-weight: bold');
    
    // 立即检查API状态
    checkApiStatus().then(isApiAvailable => {
        if (isApiAvailable) {
            console.log('%c✅ 后端API服务正常运行', 'color: green; font-weight: bold');
            addLog('✅ 后端API服务正常运行', 'success');
        } else {
            console.log('%c❌ 后端API服务不可用', 'color: red; font-weight: bold');
            addLog('❌ 后端API服务不可用', 'error');
        }
    });
}

// 页面加载时输出API调试信息和检查API状态
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(apiDebugHelper, 500);
});

// 全局变量定义
const elements = {};
const charts = {};
const systemData = {
    isRealData: true, // 标识数据来源是否为真实数据（否则为模拟数据）
    status: 'stopped',
    cpu: 0,
    memory: 0,
    uptime: 0,
    profit: 0,
    monitoredTokens: 0,
    activePools: 0,
    executedTrades: 0,
    profitTrend: [],
    tokenDiscoveryTrend: []
};

// DOM元素初始化
function initElements() {
    console.log('初始化DOM元素引用...');
    
    try {
        // 获取主要UI元素
        elements = {
            // 状态指示器
            statusIndicator: document.querySelector('.status-indicator'),
            statusText: document.querySelector('.status-text'),
            
            // 统计卡片
            cpuUsage: document.querySelector('.cpu-usage'),
            cpuBar: document.querySelector('.cpu-bar'),
            cpuCores: document.querySelector('.cpu-cores'),
            memoryUsage: document.querySelector('.memory-usage'),
            memoryBar: document.querySelector('.memory-bar'),
            
            // 交易表格
            tradesTableBody: document.getElementById('tradesTableBody'),
            
            // 代币表格
            tokensTableBody: document.getElementById('tokensTableBody'),
            
            // 按钮
            refreshBtn: document.getElementById('refreshBtn'),
            startBtn: document.getElementById('startButton'),
            stopBtn: document.getElementById('stopButton'),
            
            // 图表周期按钮
            chartPeriodBtns: document.querySelectorAll('.chart-period-btn'),
            
            // 日志容器
            logContainer: document.getElementById('logContainer')
        };
        
        // 检查关键元素是否存在
        if (!elements.tradesTableBody) {
            console.error('无法找到tradesTableBody元素，ID可能不正确');
        }
        
        if (!elements.tokensTableBody) {
            console.error('无法找到tokensTableBody元素，ID可能不正确');
        }
        
        // 初始化表格元素（以防ID不一致）
        if (!elements.tradesTableBody) {
            elements.tradesTableBody = document.querySelector('table.trades-table tbody');
            console.log('尝试通过类选择器查找交易表格:', elements.tradesTableBody ? '找到' : '未找到');
        }
        
        if (!elements.tokensTableBody) {
            elements.tokensTableBody = document.querySelector('table.tokens-table tbody');
            console.log('尝试通过类选择器查找代币表格:', elements.tokensTableBody ? '找到' : '未找到');
        }
        
        // 如果仍然找不到，尝试查找所有表格并使用第一个和第二个
        if (!elements.tradesTableBody || !elements.tokensTableBody) {
            const allTables = document.querySelectorAll('table tbody');
            console.log(`找到 ${allTables.length} 个表格tbody元素`);
            
            if (allTables.length >= 1 && !elements.tradesTableBody) {
                elements.tradesTableBody = allTables[0];
                console.log('使用第一个表格tbody作为tradesTableBody');
            }
            
            if (allTables.length >= 2 && !elements.tokensTableBody) {
                elements.tokensTableBody = allTables[1];
                console.log('使用第二个表格tbody作为tokensTableBody');
            }
        }
        
        console.log('DOM元素初始化完成:', elements);
        return true;
    } catch (error) {
        console.error('初始化DOM元素时出错:', error);
        return false;
    }
}

// 在全局作用域调用初始化函数，确保DOM元素已就绪
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded事件触发，初始化元素');
    initElements();
    
    // 绑定事件处理程序
    bindEventHandlers();
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
                    
                    // 根据时间周期更新图表数据 - 使用新的函数
                    fetchTokenTrend(period);
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
                    
                    // 根据时间周期更新图表数据 - 使用新的函数
                    fetchProfitTrend(period);
                });
            });
            console.log('利润趋势图时间周期按钮绑定成功');
        }
    }
}

/**
 * 初始化图表
 * @param {Object} elements DOM元素对象
 */
function initCharts(elements) {
    console.log('[initCharts] 开始初始化图表');
    
    try {
        // 初始化利润趋势图
        initProfitChart(elements);
        
        // 初始化代币趋势图
        initTokenChart(elements);
    } catch (error) {
        console.error('[initCharts] 初始化图表失败:', error);
    }
}

/**
 * 初始化利润趋势图
 * @param {Object} elements DOM元素对象
 */
function initProfitChart(elements) {
    const chartContainer = document.getElementById('profitTrendChart');
    if (!chartContainer) {
        console.error('[initProfitChart] 找不到图表容器 #profitTrendChart');
        return;
    }
    
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
        console.error('[initProfitChart] 找不到图表 canvas 元素');
        return;
    }
    
    // 创建图表配置
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '利润 (SOL)',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(2)} SOL`;
                        }
                    }
                }
            }
        }
    };
    
    // 创建图表实例
    const chart = new Chart(canvas, config);
    
    // 保存图表实例以便后续更新
    window.profitChart = chart;
    
    // 获取利润趋势数据
    fetchProfitTrend('24小时')
        .then(data => {
            updateProfitChart(data);
        })
        .catch(error => {
            console.error('[initProfitChart] 获取利润趋势数据失败:', error);
        });
    
    console.log('[initProfitChart] 利润趋势图初始化完成');
}

/**
 * 更新利润趋势图
 * @param {Array} data 趋势数据
 */
function updateProfitChart(data) {
    if (!window.profitChart || !data || !Array.isArray(data)) {
        console.error('[updateProfitChart] 无效的图表或数据');
        return;
    }
    
    try {
        const chart = window.profitChart;
        const labels = [];
        const values = [];
        
        // 处理数据
        for (const item of data) {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            labels.push(timeStr);
            values.push(item.value);
        }
        
        // 更新图表数据
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        
        // 更新图表
        chart.update();
        
        console.log('[updateProfitChart] 利润趋势图更新完成');
    } catch (error) {
        console.error('[updateProfitChart] 更新利润趋势图失败:', error);
    }
}

/**
 * 初始化代币趋势图
 * @param {Object} elements DOM元素对象
 */
function initTokenChart(elements) {
    const chartContainer = document.getElementById('tokenDiscoveryChart');
    if (!chartContainer) {
        console.error('[initTokenChart] 找不到图表容器 #tokenDiscoveryChart');
        return;
    }
    
    const canvas = chartContainer.querySelector('canvas');
    if (!canvas) {
        console.error('[initTokenChart] 找不到图表 canvas 元素');
        return;
    }
    
    // 创建图表配置
    const config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '代币数量',
                data: [],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            }
        }
    };
    
    // 创建图表实例
    const chart = new Chart(canvas, config);
    
    // 保存图表实例以便后续更新
    window.tokenChart = chart;
    
    // 获取代币趋势数据
    fetchTokenTrend('24小时')
        .then(data => {
            updateTokenChart(data);
        })
        .catch(error => {
            console.error('[initTokenChart] 获取代币趋势数据失败:', error);
        });
    
    console.log('[initTokenChart] 代币趋势图初始化完成');
}

/**
 * 更新代币趋势图
 * @param {Array} data 趋势数据
 */
function updateTokenChart(data) {
    if (!window.tokenChart || !data || !Array.isArray(data)) {
        console.error('[updateTokenChart] 无效的图表或数据');
        return;
    }
    
    try {
        const chart = window.tokenChart;
        const labels = [];
        const values = [];
        
        // 处理数据
        for (const item of data) {
            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            labels.push(timeStr);
            values.push(item.value);
        }
        
        // 更新图表数据
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        
        // 更新图表
        chart.update();
        
        console.log('[updateTokenChart] 代币趋势图更新完成');
    } catch (error) {
        console.error('[updateTokenChart] 更新代币趋势图失败:', error);
    }
}

/**
 * 加载利润趋势数据
 * @param {string} period 时间周期
 */
function loadProfitTrendData(period) {
    console.log(`[loadProfitTrendData] 加载${period}利润趋势数据`);
    
    // 调用API获取数据
    fetchProfitTrend(period)
        .then(data => {
            console.log(`[loadProfitTrendData] 获取到${data.length}条利润趋势数据`);
            updateProfitTrendChart(data);
        })
        .catch(error => {
            console.error('[loadProfitTrendData] 获取利润趋势数据失败:', error);
        });
}

/**
 * 加载代币趋势数据
 * @param {string} period 时间周期
 */
function loadTokenTrendData(period) {
    console.log(`[loadTokenTrendData] 加载${period}代币趋势数据`);
    
    // 调用API获取数据
    fetchTokenTrend(period)
        .then(data => {
            console.log(`[loadTokenTrendData] 获取到${data.length}条代币趋势数据`);
            updateTokenDiscoveryChart(data);
        })
        .catch(error => {
            console.error('[loadTokenTrendData] 获取代币趋势数据失败:', error);
        });
}

/**
 * 初始化代币发现趋势图
 */
function initTokenDiscoveryChart() {
    try {
        const tokenChartContainer = document.getElementById('tokenDiscoveryChart');
        if (!tokenChartContainer) {
            console.error('找不到tokenDiscoveryChart容器元素');
            return;
        }

        // 找到容器内的canvas元素
        const tokenCanvas = tokenChartContainer.querySelector('canvas');
        if (!tokenCanvas) {
            console.error('在tokenDiscoveryChart容器中找不到canvas元素');
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            tokenChartContainer.appendChild(canvas);
            console.log('为tokenDiscoveryChart容器创建了新的canvas元素');
            return setTimeout(initTokenDiscoveryChart, 100);
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

            // 准备初始数据 - 使用空数据
            const initialHours = [];
            const initialData = [];

            // 将初始空数据保存到systemData中
            systemData.tokenDiscoveryTrend = [];

            charts.tokenDiscoveryChart = new Chart(tokenChartCtx, {
                type: 'bar',
                data: {
                    labels: initialHours,
                    datasets: [{
                        label: '发现代币数',
                        data: initialData,
                        backgroundColor: '#bd4dff',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    animation: {
                        duration: 1000 // 控制动画时间
                    }
                }
            });
            console.log('代币发现趋势图初始化成功');
        } catch (chartError) {
            console.error('代币发现趋势图初始化失败:', chartError);
        }
    } catch (error) {
        console.error('初始化代币发现趋势图失败:', error);
    }
}

/**
 * 初始化利润趋势图
 */
function initProfitTrendChart() {
    try {
        console.log('开始初始化利润趋势图...');
        const profitChartContainer = document.getElementById('profitTrendChart');
        if (!profitChartContainer) {
            console.error('找不到profitTrendChart容器元素');
            return;
        }

        // 找到容器内的canvas元素
        const profitCanvas = profitChartContainer.querySelector('canvas');
        if (!profitCanvas) {
            console.error('在profitTrendChart容器中找不到canvas元素');
            // 创建canvas元素
            const canvas = document.createElement('canvas');
            profitChartContainer.appendChild(canvas);
            console.log('为profitTrendChart容器创建了新的canvas元素');
            return setTimeout(initProfitTrendChart, 100);
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
                console.log('销毁旧的利润趋势图实例');
            }

            // 准备初始数据 - 使用空数据
            const initialDays = [];
            const initialProfits = [];

            // 将初始空数据保存到systemData中
            systemData.profitTrend = [];

            // 确保Chart对象存在
            if (typeof Chart === 'undefined') {
                console.error('Chart对象未定义，可能是Chart.js库未加载');
                loadChartJS(() => {
                    console.log('Chart.js加载完成，重新尝试初始化图表');
                    setTimeout(initProfitTrendChart, 300);
                });
                return;
            }

            charts.profitTrendChart = new Chart(profitChartCtx, {
                type: 'bar',
                data: {
                    labels: initialDays,
                    datasets: [{
                        label: '收益 (SOL)',
                        data: initialProfits,
                        backgroundColor: '#36a2eb',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    animation: {
                        duration: 1000 // 控制动画时间
                    }
                }
            });
            console.log('利润趋势图初始化成功');
            
            // 立即尝试获取数据更新图表
            fetchProfitTrend('24小时');
        } catch (chartError) {
            console.error('利润趋势图初始化失败:', chartError);
            addLog('初始化利润趋势图失败，将在3秒后重试', 'warning');
            setTimeout(initProfitTrendChart, 3000);
        }
    } catch (error) {
        console.error('初始化利润趋势图失败:', error);
        addLog('初始化利润趋势图出现异常，将在5秒后重试', 'error');
        setTimeout(initProfitTrendChart, 5000);
    }
}

/**
 * 动态加载Chart.js库
 * @param {Function} callback - 加载完成后的回调函数
 */
function loadChartJS(callback) {
    console.log('开始动态加载Chart.js...');
    
    // 检查是否已经在加载中
    if (document.getElementById('chartjs-script')) {
        console.log('Chart.js已在加载中...');
        return;
    }
    
    // 创建script元素
    const script = document.createElement('script');
    script.id = 'chartjs-script';
    script.type = 'text/javascript';
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
    script.async = true;
    
    // 设置加载事件
    script.onload = () => {
        console.log('Chart.js加载成功');
        if (typeof callback === 'function') {
            callback();
        }
    };
    
    script.onerror = () => {
        console.error('Chart.js加载失败');
        addLog('图表库加载失败，部分功能可能不可用', 'error');
    };
    
    // 添加到文档
    document.head.appendChild(script);
    addLog('正在加载图表库...', 'info');
}

/**
 * 获取代币发现趋势数据
 * @param {string} period - 时间周期 (12小时, 24小时, 7天)
 */
async function fetchTokenDiscoveryTrend(period) {
    try {
        addLog(`正在获取${period}代币发现趋势...`, 'info');
        
        // 构建API URL
        const apiUrl = `${getApiBaseUrl()}/token-trends`;
        console.log(`[fetchTokenDiscoveryTrend] 请求API: ${apiUrl}`);
        
        // 发起API请求
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        // 解析响应数据
        const data = await response.json();
        console.log('[fetchTokenDiscoveryTrend] 收到API响应:', data);
        
        // 提取对应时间周期的数据
        let trendData = [];
        
        if (data.success && data.data && data.data[period]) {
            trendData = data.data[period];
            console.log(`[fetchTokenDiscoveryTrend] 提取${period}数据:`, trendData);
        } else {
            console.warn(`[fetchTokenDiscoveryTrend] API响应中找不到${period}的数据`);
        }
        
        // 更新系统数据中的趋势数据
        systemData.tokenDiscoveryTrend = trendData;
        
        // 更新图表数据
        if (charts.tokenDiscoveryChart) {
            const labels = trendData.map(item => `${item.hour}`);
            const data = trendData.map(item => item.count);
            
            charts.tokenDiscoveryChart.data.labels = labels;
            charts.tokenDiscoveryChart.data.datasets[0].data = data;
            charts.tokenDiscoveryChart.update();
            console.log(`代币发现趋势图(${period})更新成功，数据点数: ${trendData.length}`);
        } else {
            console.error('代币发现趋势图未初始化，重新初始化图表');
            initCharts(); // 如果图表不存在则重新初始化
        }
        
        addLog(`${period}代币发现趋势加载完成`, 'info');
    } catch (error) {
        console.error(`获取${period}代币发现趋势失败:`, error);
        addLog(`获取${period}代币发现趋势失败: ${error.message}`, 'error');
    }
}

/**
 * 获取利润趋势数据
 * @param {string} period - 时间段(24h, 7d, 30d)
 */
const fetchProfitTrend = period => {
    // 转换时间段到API接受的格式
    const periodValue = convertPeriodToAPIFormat(period);
    console.log(`尝试获取利润趋势数据，时间段: ${periodValue}`);
    
    // 构建可能的API路径
    const apiPaths = [
        `/api/stats/profit/trend?period=${periodValue}`,
        `/stats/profit/trend?period=${periodValue}`
    ];
    
    // 尝试每个可能的API路径
    tryFetchFromPaths(apiPaths, response => {
        try {
            console.log('利润趋势API响应:', response);
            
        let trendData = [];
            let success = false;
            
            // 检查API响应格式并提取数据
            if (response && response.success && Array.isArray(response.data)) {
                trendData = response.data;
                success = true;
            } else if (Array.isArray(response)) {
                trendData = response;
                success = true;
            } else if (response && response.data && Array.isArray(response.data.data)) {
                trendData = response.data.data;
                success = true;
            }
            
            if (success && trendData.length > 0) {
                const formattedData = formatTrendDataForChart(trendData);
                updateProfitTrendChart(formattedData);
                return;
            }
            
            // 如果没有有效数据，生成模拟数据
            console.log('未找到有效的利润趋势数据，使用模拟数据');
            const mockData = generateMockTrendData(periodValue);
            updateProfitTrendChart(mockData);
    } catch (error) {
            console.error('处理利润趋势数据出错:', error);
            // 在出错时使用模拟数据
            const mockData = generateMockTrendData(periodValue);
            updateProfitTrendChart(mockData);
        }
    });
};

/**
 * 尝试从多个API路径获取数据
 * @param {Array} paths - API路径数组
 * @param {Function} callback - 成功获取数据后的回调函数
 */
const tryFetchFromPaths = (paths, callback) => {
    const baseUrl = getApiBaseUrl();
    let pathIndex = 0;
    
    const tryNextPath = () => {
        if (pathIndex >= paths.length) {
            console.error('所有API路径尝试均失败');
            // 生成模拟数据作为后备
            callback([]);
            return;
        }
        
        const currentPath = paths[pathIndex];
        const apiUrl = baseUrl + currentPath;
        console.log("尝试从以下路径获取数据: " + apiUrl);
        
        fetch(apiUrl)
            .then(response => {
        if (!response.ok) {
                    throw new Error(`HTTP错误！状态码: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("从" + apiUrl + "成功获取数据:", data);
                callback(data);
            })
            .catch(error => {
                console.error(`从路径 ${apiUrl} 获取数据失败:`, error);
                pathIndex++;
                tryNextPath();
            });
    };
    
    tryNextPath();
};

/**
 * 将时间段转换为API可接受的格式
 * @param {string} period - 时间段(24h, 7d, 30d)
 * @returns {string} - 格式化后的时间段
 */
const convertPeriodToAPIFormat = period => {
    // 移除'h'或'd'并返回数字部分
    if (period === '24h') return '24';
    if (period === '7d') return '7';
    if (period === '30d') return '30';
    return '24'; // 默认24小时
};

/**
 * 生成模拟趋势数据
 * @param {string} period - 时间段
 * @returns {Array} - 模拟数据数组
 */
const generateMockTrendData = period => {
    const now = new Date();
    const data = [];
    let numPoints;
    
    // 根据时间段确定数据点数量
    if (period === '24') {
        numPoints = 24;
    } else if (period === '7') {
        numPoints = 7;
    } else if (period === '30') {
        numPoints = 30;
    } else {
        numPoints = 24;
    }
    
    for (let i = 0; i < numPoints; i++) {
        const timestamp = new Date(now.getTime() - (numPoints - i) * 3600000);
        const value = Math.random() * 10 + 5; // 生成5-15之间的随机值
        data.push({
            timestamp: timestamp.toISOString(),
            value: parseFloat(value.toFixed(2))
        });
    }
    
    return data;
};

/**
 * 更新代币趋势图表
 * @param {Object} data - 包含labels和values的数据对象
 */
const updateTokensTrendChart = data => {
    if (!tokensTrendChart) {
        console.error('代币趋势图表未初始化');
        initTokensTrendChart();
    }
    
    if (tokensTrendChart) {
        tokensTrendChart.data.labels = data.labels;
        tokensTrendChart.data.datasets[0].data = data.values;
        tokensTrendChart.update();
        console.log('代币趋势图表已更新');
    }
};

/**
 * 格式化趋势数据用于图表显示
 * @param {Array} trendData - 原始趋势数据
 * @returns {Object} - 格式化后的数据，包含labels和values数组
 */
const formatTrendDataForChart = trendData => {
    const labels = [];
    const values = [];
    
    for (const item of trendData) {
        const date = new Date(item.timestamp);
        labels.push(formatDateTime(date));
        values.push(item.value);
    }
    
    return { labels, values };
};

/**
 * 更新利润趋势图表
 * @param {Object} data - 包含labels和values的数据对象
 */
const updateProfitTrendChart = data => {
    if (!profitTrendChart) {
        console.error('利润趋势图表未初始化');
        initProfitTrendChart();
    }
    
    if (profitTrendChart) {
        profitTrendChart.data.labels = data.labels;
        profitTrendChart.data.datasets[0].data = data.values;
        profitTrendChart.update();
        console.log('利润趋势图表已更新');
    }
};

/**
 * 获取代币趋势数据
 * @param {string} period - 时间段(24h, 7d, 30d)
 */
const fetchTokenTrend = period => {
    // 转换时间段到API接受的格式
    const periodValue = convertPeriodToAPIFormat(period);
    console.log(`尝试获取代币趋势数据，时间段: ${periodValue}`);
    
    // 构建可能的API路径
    const apiPaths = [
        `/api/stats/tokens/trend?period=${periodValue}`,
        `/api/stats/token/trend?period=${periodValue}`,
        `/stats/tokens/trend?period=${periodValue}`,
        `/stats/token/trend?period=${periodValue}`
    ];
    
    // 尝试每个可能的API路径
    tryFetchFromPaths(apiPaths, response => {
        try {
            console.log('代币趋势API响应:', response);
            
            let trendData = [];
            let success = false;
            
            // 检查API响应格式并提取数据
            if (response?.success && Array.isArray(response.data)) {
                trendData = response.data;
                success = true;
            } else if (Array.isArray(response)) {
                trendData = response;
                success = true;
            } else if (response?.data && Array.isArray(response.data.data)) {
                trendData = response.data.data;
                success = true;
            }
            
            if (success && trendData.length > 0) {
                const formattedData = formatTrendDataForChart(trendData);
                updateTokensTrendChart(formattedData);
                return;
            }
            
            // 如果没有有效数据，生成模拟数据
            console.log('未找到有效的代币趋势数据，使用模拟数据');
            const mockData = generateMockTrendData(periodValue);
            updateTokensTrendChart(mockData);
    } catch (error) {
            console.error('处理代币趋势数据出错:', error);
            // 在出错时使用模拟数据
            const mockData = generateMockTrendData(periodValue);
            updateTokensTrendChart(mockData);
    }
    });
};

/**
 * 更新交易表格
 * @param {Array} transactions - 交易数据数组
 */
const updateRecentTradesTable = transactions => {
    const tableBody = document.getElementById('recentTradesTableBody');
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 检查是否有交易数据
    if (!transactions || transactions.length === 0) {
        // 显示无数据提示
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">无数据</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // 显示最近的5条交易记录
    const recentTransactions = transactions.slice(0, 5);
    
    // 遍历交易记录并添加到表格
    for (const tx of recentTransactions) {
        const row = document.createElement('tr');
        
        // 格式化交易数据
        const profit = parseFloat(tx.profit || 0).toFixed(4);
        const date = new Date(tx.timestamp);
        const formattedDate = formatDateTime(date);
        
        // 状态样式
        let statusClass = '';
        let statusText = tx.status || 'Unknown';
        
        if (statusText.toLowerCase() === 'success') {
            statusClass = 'badge-success';
            statusText = '成功';
        } else if (statusText.toLowerCase() === 'failed') {
            statusClass = 'badge-danger';
            statusText = '失败';
        } else if (statusText.toLowerCase() === 'pending') {
            statusClass = 'badge-warning';
            statusText = '处理中';
        }
        
        // 设置表格内容
        row.innerHTML = `
            <td>${tx.id || '未知'}</td>
            <td>${tx.pair || '未知'}</td>
            <td>${tx.amount}</td>
            <td class="text-success">+${profit} SOL</td>
            <td>${formattedDate}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
        `;
        
        tableBody.appendChild(row);
    }
};

/**
 * 更新代币表格
 * @param {Array} tokens - 代币数据数组
 */
const updateTokensTable = tokens => {
    console.log('[updateTokensTable] 更新代币表格，数据条数:', tokens?.length || 0);
    
    // 获取表格主体元素
    const tableBody = document.getElementById('tokensTableBody');
    if (!tableBody) {
        console.error('[updateTokensTable] 找不到代币表格主体元素 #tokensTableBody');
        return;
    }
    
    // 清空表格
    tableBody.innerHTML = '';
    
    // 检查是否有数据
    if (!tokens || tokens.length === 0) {
        console.warn('[updateTokensTable] 没有代币数据');
        
        // 添加一个无数据的行
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `<td colspan="6" class="text-center">暂无代币数据</td>`;
        tableBody.appendChild(noDataRow);
        return;
    }
    
    // 为每个代币创建一行
    for (const token of tokens) {
        // 创建新行
        const row = document.createElement('tr');
        
        // 格式化代币数据
        const price = Number.parseFloat(token.price || 0).toFixed(4);
        const date = new Date(token.createdAt || token.timestamp);
        const formattedDate = formatDateTime(date);
        
        // 设置行内容
        row.innerHTML = `
            <td>${token.symbol || '未知'}</td>
            <td>${token.name || '未知'}</td>
            <td>${formatAddress(token.address)}</td>
            <td>$${price}</td>
            <td>${formattedDate}</td>
            <td><span class="risk-score risk-${getRiskClass(token.riskScore || 0)}">${token.riskScore || 0}</span></td>
        `;
        
        // 添加行到表格
        tableBody.appendChild(row);
    }
    
    console.log('[updateTokensTable] 代币表格更新完成');
};

/**
 * 更新系统状态显示
 * @param {string} status - 系统状态
 */
function updateSystemStatus(status) {
    if (!elements.statusIndicator || !elements.statusText) return;
    
    if (status === 'running' || status === 'running【M】') {
        elements.statusIndicator.classList.remove('offline');
        elements.statusIndicator.classList.add('online');
        // 添加模拟数据标识
        const mockSuffix = systemData.isRealData === false ? '【M】' : '';
        elements.statusText.textContent = `状态: 运行中${mockSuffix}`;
        
        if (elements.startBtn) elements.startBtn.disabled = true;
        if (elements.stopBtn) elements.stopBtn.disabled = false;
    } else {
        elements.statusIndicator.classList.remove('online');
        elements.statusIndicator.classList.add('offline');
        // 添加模拟数据标识
        const mockSuffix = systemData.isRealData === false ? '【M】' : '';
        elements.statusText.textContent = `状态: 已停止${mockSuffix}`;
        
        if (elements.startBtn) elements.startBtn.disabled = false;
        if (elements.stopBtn) elements.stopBtn.disabled = true;
    }
}

/**
 * 添加日志到日志容器中
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型: info(默认), success, warning, error
 */
function addLog(message, type = 'info') {
    // 获取日志容器
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;
    
    // 创建日志条目
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
    
    // 将日志条目添加到容器的顶部，而不是底部
    if (logContainer.firstChild) {
        logContainer.insertBefore(logEntry, logContainer.firstChild);
    } else {
        logContainer.appendChild(logEntry);
    }
    
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
        
        // 构建API URL - 确保路径正确
        const baseUrl = getApiBaseUrl();
        
        // 尝试多种可能的API路径格式
        const apiPaths = [
            `/start`,                // 根路径
            `/system/start`,         // 传统路径
            `/api/start`,            // API子路径
            `/api/system/start`      // 完整API路径
        ];
        
        let response = null;
        let successPath = '';
        
        // 尝试各种路径直到成功
        for (const path of apiPaths) {
            // 避免重复的/api前缀
            const apiUrl = `${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}${path}`;
            console.log(`[startBot] 尝试请求API: ${apiUrl}`);
            
            try {
                const tempResponse = await fetch(apiUrl);
                if (tempResponse.ok) {
                    response = tempResponse;
                    successPath = path;
                    console.log(`[startBot] 成功的API路径: ${apiUrl}`);
                    break;
                }
            } catch (error) {
                console.warn(`[startBot] API路径 ${path} 请求失败:`, error);
                // 继续尝试下一个路径
            }
        }
        
        if (!response) {
            throw new Error('所有API路径都请求失败');
        }
        
        // 解析响应数据
        const responseText = await response.text();
        console.log(`[startBot] 原始响应(${successPath}):`, responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[startBot] JSON解析错误:', parseError);
            // 纯文本响应也可能是成功的
            data = { success: true, message: responseText };
        }
        
        console.log('[startBot] 解析后的响应:', data);
        
        if (data && data.success === false) {
            throw new Error(data.message || '启动失败，未知原因');
        }
        
        // 启动成功处理
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) {
            statusEl.textContent = '运行中';
            statusEl.className = 'status-running';
        }
        
        const startBtn = document.getElementById('startButton');
        const stopBtn = document.getElementById('stopButton');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        addLog('MEV机器人已启动', 'success');
        
        // 延迟1秒后刷新数据
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
        
        // 构建API URL - 确保路径正确
        const baseUrl = getApiBaseUrl();
        
        // 尝试多种可能的API路径格式
        const apiPaths = [
            `/stop`,                // 根路径
            `/system/stop`,         // 传统路径
            `/api/stop`,            // API子路径
            `/api/system/stop`      // 完整API路径
        ];
        
        let response = null;
        let successPath = '';
        
        // 尝试各种路径直到成功
        for (const path of apiPaths) {
            // 避免重复的/api前缀
            const apiUrl = `${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}${path}`;
            console.log(`[stopBot] 尝试请求API: ${apiUrl}`);
            
            try {
                const tempResponse = await fetch(apiUrl);
                if (tempResponse.ok) {
                    response = tempResponse;
                    successPath = path;
                    console.log(`[stopBot] 成功的API路径: ${apiUrl}`);
                    break;
                }
            } catch (error) {
                console.warn(`[stopBot] API路径 ${path} 请求失败:`, error);
                // 继续尝试下一个路径
            }
        }
        
        if (!response) {
            throw new Error('所有API路径都请求失败');
        }
        
        // 解析响应数据
        const responseText = await response.text();
        console.log(`[stopBot] 原始响应(${successPath}):`, responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[stopBot] JSON解析错误:', parseError);
            // 纯文本响应也可能是成功的
            data = { success: true, message: responseText };
        }
        
        console.log('[stopBot] 解析后的响应:', data);
        
        if (data && data.success === false) {
            throw new Error(data.message || '停止失败，未知原因');
        }
        
        // 停止成功处理
        const statusEl = document.getElementById('systemStatus');
        if (statusEl) {
            statusEl.textContent = '已停止';
            statusEl.className = 'status-stopped';
        }
        
        const startBtn = document.getElementById('startButton');
        const stopBtn = document.getElementById('stopButton');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        addLog('MEV机器人已停止', 'success');
        
        // 延迟1秒后刷新数据
        setTimeout(() => {
            fetchSystemData(true);
        }, 1000);
    } catch (error) {
        console.error('停止MEV机器人失败:', error);
        addLog(`停止失败: ${error.message}`, 'error');
    }
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
 * @param {number|string} uptimeData - 运行时间数据（秒或已格式化的字符串）
 * @returns {string} - 格式化后的运行时间字符串
 */
function formatUptime(uptimeData) {
    // 如果已经是格式化的字符串，直接返回
    if (typeof uptimeData === 'string') {
        // 已经包含"小时"或"天"的格式化字符串
        if (uptimeData.includes('小时') || uptimeData.includes('天') || uptimeData.includes('分钟')) {
            return uptimeData;
        }
        
        // 尝试将字符串转换为数字
        const seconds = Number(uptimeData);
        if (isNaN(seconds)) {
            console.warn('[formatUptime] 无法解析的uptime字符串:', uptimeData);
            return '0小时 0分钟 0秒';
        }
        
        // 如果转换成功，按秒处理
        return formatSecondsToUptime(seconds);
    }
    
    // 如果是数字，直接按秒处理
    if (typeof uptimeData === 'number') {
        return formatSecondsToUptime(uptimeData);
    }
    
    // 其他类型，返回默认值
    console.warn('[formatUptime] 未知类型的uptime数据:', uptimeData, typeof uptimeData);
    return '0小时 0分钟 0秒';
}

/**
 * 将秒数转换为格式化的运行时间字符串
 * @param {number} seconds - 总秒数
 * @returns {string} - 格式化后的运行时间字符串
 */
function formatSecondsToUptime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return '0小时 0分钟 0秒';
    }
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    // 如果有天数，则显示天和小时
    if (days > 0) {
        return `${days}天 ${hours}小时 ${minutes}分钟`;
    }
    
    // 否则显示小时、分钟和秒
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
 * 格式化数字为中文单位（万、亿）
 * @param {number} number 数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的数字
 */
function formatNumber(number, decimals = 0) {
    // 检查是否为undefined或非数字
    if (number === undefined || number === null || isNaN(number)) {
        console.warn('[formatNumber] 接收到无效数字:', number);
        return '0'; // 返回默认值
    }
    
    // 使用中文的万、亿单位
    if (number >= 100000000) { // 亿
        return `${(number / 100000000).toFixed(2)}亿`;
    } 
    
    if (number >= 10000) { // 万
        return `${(number / 10000).toFixed(2)}万`;
    }
    
    // 如果数字很小，使用科学计数法
    if (number < 0.001 && number !== 0) {
        return number.toExponential(2);
    }
    
    // 其他情况使用标准千位分隔符
    return number.toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * 获取系统日志 - 由于API未实现，暂时使用固定数据
 */
async function fetchSystemLogs() {
    try {
        console.log('[fetchSystemLogs] 开始获取系统日志');
        
        // 由于API不可用，我们生成一些模拟日志
        const mockLogs = [
            { message: '系统启动', type: 'info', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { message: '连接到API服务器', type: 'success', timestamp: new Date(Date.now() - 3500000).toISOString() },
            { message: '开始监控代币', type: 'info', timestamp: new Date(Date.now() - 3400000).toISOString() },
            { message: '检测到新代币: PYTH', type: 'info', timestamp: new Date(Date.now() - 1800000).toISOString() },
            { message: '完成交易: SOL/USDC', type: 'success', timestamp: new Date(Date.now() - 900000).toISOString() }
        ];
        
        // 清空日志容器
        const logContainer = document.getElementById('logContainer');
        if (logContainer) {
            logContainer.innerHTML = '';
            
            // 添加日志到容器
            for (const log of mockLogs) {
                addLog(log.message, log.type || 'info');
            }
        }
        
        console.log('[fetchSystemLogs] 系统日志已更新');
    } catch (error) {
        console.error('[fetchSystemLogs] 错误:', error);
        addLog(`系统日志加载失败: ${error.message}`, 'error');
    }
}

/**
 * 获取池子数据
 * 从/api/pools端点获取数据并更新UI
 */
async function fetchPoolsData() {
    try {
        console.log('[fetchPoolsData] 开始获取池子数据');
        addLog('开始获取池子数据...', 'info');
        
        const apiUrl = `${getApiBaseUrl()}/pools`;
        console.log(`[fetchPoolsData] 请求API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[fetchPoolsData] 收到API响应:', JSON.stringify(data, null, 2));
        
        // 更宽容的数据检查
        let poolsData = [];
        let activePoolsCount = 0;
        let totalPoolsCount = 0;
        
        // 检查是否有统计数据
        if (data && data.stats) {
            console.log('[fetchPoolsData] 使用API返回的统计数据:', JSON.stringify(data.stats, null, 2));
            activePoolsCount = data.stats.active || 0;
            totalPoolsCount = data.stats.total || 0;
            
            // 更新全局systemData对象中的activePools字段
            systemData.activePools = activePoolsCount;
            console.log('[fetchPoolsData] 全局systemData.activePools已更新为:', activePoolsCount);
            addLog(`从API获取到活跃池数: ${activePoolsCount}，总池数: ${totalPoolsCount}`, 'info');
        }
        
        // 尝试从不同格式中获取池子数据
        if (data && data.success && Array.isArray(data.data)) {
            // 标准格式 {success: true, data: [...]}
            poolsData = data.data;
            // 如果没有统计数据，从数组计算
            if (!data.stats) {
                totalPoolsCount = data.count || poolsData.length;
            }
        } else if (data && Array.isArray(data)) {
            // 直接返回数组 [...]
            poolsData = data;
            totalPoolsCount = poolsData.length;
        } else if (data && data.pools && Array.isArray(data.pools)) {
            // 嵌套格式 {pools: [...]}
            poolsData = data.pools;
            totalPoolsCount = poolsData.length;
        } else {
            console.log('[fetchPoolsData] 未能识别的数据格式，使用空数组');
        }
        
        // 清空池子列表
        const poolsList = document.getElementById('poolsList');
        if (poolsList) {
            poolsList.innerHTML = '';
        }
        
        // 检查是否有数据
        if (poolsData.length === 0) {
            console.log('[fetchPoolsData] 没有找到池子数据');
            
            // 显示无数据消息
            if (poolsList) {
                const noDataItem = document.createElement('div');
                noDataItem.className = 'pool-item no-data';
                noDataItem.innerHTML = '<span>暂无池子数据</span>';
                poolsList.appendChild(noDataItem);
            }
        } else {
            console.log(`[fetchPoolsData] 找到 ${poolsData.length} 个池子`);
            
            // 如果没有从API获取统计数据，则从池子数组计算
            if (activePoolsCount === 0) {
                // 计算活跃池子数量
                for (const pool of poolsData) {
                    // 检查池子是否活跃
                    if (pool && pool.isActive) {
                        activePoolsCount++;
                    }
                }
                // 更新全局systemData对象中的activePools字段
                systemData.activePools = activePoolsCount;
                console.log('[fetchPoolsData] 计算得到的活跃池子数:', activePoolsCount);
            }
            
            // 更新池子列表UI
            if (poolsList) {
                for (const pool of poolsData) {
                    // 创建池子显示项
                    const poolItem = document.createElement('div');
                    poolItem.className = 'pool-item';
                    
                    // 池子名称/地址
                    const poolName = pool.name || pool.address || '未知池子';
                    const addressDisplay = pool.address ? 
                        `<span class="pool-address" title="${pool.address}">${shortenAddress(pool.address)}</span>` : '';
                    
                    // 池子状态
                    const statusClass = pool.isActive ? 'active' : 'inactive';
                    const statusText = pool.isActive ? '活跃' : '非活跃';
                    
                    // 池子规模/流动性
                    const liquidityDisplay = pool.liquidity ? 
                        `<span class="pool-liquidity">${formatNumber(pool.liquidity)} SOL</span>` : '';
                    
                    // 构建HTML
                    poolItem.innerHTML = `
                        <div class="pool-info">
                            <span class="pool-name">${poolName}</span>
                            ${addressDisplay}
                        </div>
                        <div class="pool-details">
                            <span class="pool-status ${statusClass}">${statusText}</span>
                            ${liquidityDisplay}
                        </div>
                    `;
                    
                    poolsList.appendChild(poolItem);
                }
            }
        }
        
        // 更新统计数据
        updatePoolStats(activePoolsCount, totalPoolsCount);
        
        console.log('[fetchPoolsData] 池子数据已更新');
        addLog(`已加载最新池子数据: 活跃池数=${activePoolsCount}, 总池数=${totalPoolsCount}`, 'success');
    } catch (error) {
        console.error('[fetchPoolsData] 错误:', error);
        addLog(`池子数据加载失败: ${error.message}`, 'warning');
        
        // 更新统计数据为0
        updatePoolStats(0, 0);
        
        // 显示错误消息
        const poolsList = document.getElementById('poolsList');
        if (poolsList) {
            poolsList.innerHTML = `<div class="pool-item error"><span>加载失败: ${error.message}</span></div>`;
        }
    }
}

/**
 * 更新池子统计数据
 * @param {number} activePools - 活跃池子数量
 * @param {number} totalPools - 总池子数量 
 */
function updatePoolStats(activePools, totalPools) {
    console.log(`[updatePoolStats] 开始更新池子统计数据: 活跃=${activePools}, 总数=${totalPools}`);
    
    // 直接通过ID获取元素，避免使用缓存的引用
    const activePoolsElement = document.getElementById('activePools');
    const totalPoolsElement = document.getElementById('totalPools');
    
    console.log(`[updatePoolStats] 获取到DOM元素: activePoolsElement=${!!activePoolsElement}, totalPoolsElement=${!!totalPoolsElement}`);
    
    // 更新全局systemData对象
    systemData.activePools = activePools;
    console.log(`[updatePoolStats] 已更新systemData.activePools=${systemData.activePools}`);
    
    // 更新UI显示 - 直接设置textContent
    if (activePoolsElement) {
        // 强制转换为字符串
        const displayValue = String(activePools);
        activePoolsElement.textContent = displayValue;
        console.log(`[updatePoolStats] 已设置activePoolsElement.textContent="${displayValue}"`);
        
        // 额外调试 - 检查DOM是否更新
        setTimeout(() => {
            console.log(`[updatePoolStats] 检查DOM更新: activePoolsElement.textContent="${activePoolsElement.textContent}"`);
        }, 100);
    } else {
        console.error('[updatePoolStats] 找不到activePools元素!');
    }
    
    if (totalPoolsElement) {
        // 强制转换为字符串
        const displayValue = String(totalPools);
        totalPoolsElement.textContent = displayValue;
        console.log(`[updatePoolStats] 已设置totalPoolsElement.textContent="${displayValue}"`);
        
        // 额外调试 - 检查DOM是否更新
        setTimeout(() => {
            console.log(`[updatePoolStats] 检查DOM更新: totalPoolsElement.textContent="${totalPoolsElement.textContent}"`);
        }, 100);
    } else {
        console.error('[updatePoolStats] 找不到totalPools元素!');
    }
    
    // 同时也更新elements缓存中的引用
    if (elements.activePools) {
        elements.activePools.textContent = String(activePools);
    }
    if (elements.totalPools) {
        elements.totalPools.textContent = String(totalPools);
    }
    
    console.log(`[updatePoolStats] 更新完成: 活跃池数=${activePools}, 总池数=${totalPools}`);
    addLog(`更新池子统计: 活跃池数=${activePools}, 总池数=${totalPools}`, 'info');
}

/**
 * 获取代币趋势数据
 */
function fetchTokenTrends() {
    // 获取默认选中的时间周期，确保使用API支持的周期值
    const tokenChartContainer = document.getElementById('tokenDiscoveryChart');
    if (tokenChartContainer) {
        const activeBtn = tokenChartContainer.parentElement.querySelector('.btn-outline.active');
        // 使用API中实际存在的时间周期
        const period = activeBtn ? activeBtn.textContent.trim() : '24小时';
        
        console.log(`[fetchTokenTrends] 获取${period}代币趋势`);
        fetchTokenDiscoveryTrend(period);
    }
}

/**
 * 获取利润趋势数据
 */
function fetchProfitTrends() {
    // 获取默认选中的时间周期，确保使用API支持的周期值
    const profitChartContainer = document.getElementById('profitTrendChart');
    if (profitChartContainer) {
        const activeBtn = profitChartContainer.parentElement.querySelector('.btn-outline.active');
        // 使用API中实际存在的时间周期
        const period = activeBtn ? activeBtn.textContent.trim() : '7天';
        
        console.log(`[fetchProfitTrends] 获取${period}利润趋势`);
        fetchProfitTrend(period);
    }
}

/**
 * 绑定事件处理程序
 */
function bindEventHandlers() {
    console.log('绑定事件处理程序...');
    
    try {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn') || document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                console.log('刷新按钮被点击');
                fetchSystemData(true);
                fetchSystemPerformance(); // 刷新CPU和内存使用率
                fetchStatistics();        // 刷新代币和交易统计
                
                // 刷新所有关键数据
                fetchRecentTrades();
                fetchRecentTokens();
                fetchProfitSummary();
            });
            console.log('成功绑定刷新按钮事件');
        }
        
        // 启动按钮
        const startBtn = document.getElementById('startButton');
        if (startBtn) {
            startBtn.addEventListener('click', startBot);
            console.log('成功绑定启动按钮事件');
        }
        
        // 停止按钮
        const stopBtn = document.getElementById('stopButton');
        if (stopBtn) {
            stopBtn.addEventListener('click', stopBot);
            console.log('成功绑定停止按钮事件');
        }
        
        // 清除日志按钮
        const clearLogsBtn = document.getElementById('clearLogsBtn');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', function() {
                const logContainer = document.getElementById('logContainer');
                if (logContainer) {
                    logContainer.innerHTML = '';
                    addLog('日志已清除', 'info');
                }
            });
            console.log('成功绑定清除日志按钮事件');
        }
        
        // 绑定图表时间周期按钮
        bindChartPeriodButtons();
        
        // 设置自动刷新定时器（每30秒刷新一次系统状态）
        setInterval(function() {
            fetchSystemData(false);
            fetchSystemPerformance(); // 定期刷新CPU和内存使用率
        }, 30000);
        
        // 初始化图表
        setTimeout(function() {
            initCharts();
            
            // 延迟获取图表数据，确保图表已正确初始化
            setTimeout(function() {
                fetchTokenTrend('24小时');
                fetchProfitTrend('24小时');
            }, 500);
        }, 1000);
        
        console.log('事件处理程序绑定完成，初始数据加载中...');
        
        // 初始化数据加载
        setTimeout(function() {
            // 获取系统数据
            fetchSystemData(true);
            
            // 获取系统性能数据（CPU和内存）
            fetchSystemPerformance();
            
            // 获取统计数据（代币和交易）
            fetchStatistics();
            
            // 获取交易和代币数据
            fetchRecentTrades();
            fetchRecentTokens();
            
            // 获取利润摘要
            fetchProfitSummary();
            
            addLog('初始数据加载完成', 'success');
        }, 500);
        
        return true;
    } catch (error) {
        console.error('绑定事件处理程序失败:', error);
        return false;
    }
}

/**
 * 获取系统性能数据（CPU和内存使用率）
 */
async function fetchSystemPerformance() {
    try {
        console.log('[fetchSystemPerformance] 开始获取系统性能数据');
        
        const baseUrl = getApiBaseUrl();
        
        // 优先尝试获取完整系统性能数据
        try {
            // 首先尝试/api/stats/system接口，此接口提供完整CPU和内存数据
            const statsUrl = `${baseUrl}/api/stats/system`;
            console.log(`[fetchSystemPerformance] 尝试获取系统性能数据: ${statsUrl}`);
            
            const statsResponse = await fetch(statsUrl);
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('[fetchSystemPerformance] 系统性能数据:', statsData);
                
                // 更新CPU和内存使用率
                updateCpuUsage(statsData);
                updateMemoryUsage(statsData);
                
                console.log('[fetchSystemPerformance] 系统性能数据更新完成');
                return true;
            }
        } catch (statsError) {
            console.warn('[fetchSystemPerformance] 获取完整系统性能数据失败:', statsError);
        }
        
        // 如果获取完整系统数据失败，尝试分别获取CPU和内存数据
        try {
            const statusUrl = `${baseUrl}/api/status`;
            console.log(`[fetchSystemPerformance] 尝试从状态获取系统数据: ${statusUrl}`);
            
            const statusResponse = await fetch(statusUrl);
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                console.log('[fetchSystemPerformance] 状态数据:', statusData);
                
                // 更新CPU和内存使用率
                updateCpuUsage(statusData);
                updateMemoryUsage(statusData);
                return true;
            }
        } catch (statusError) {
            console.warn('[fetchSystemPerformance] 从状态获取系统数据失败:', statusError);
        }
        
        // 如果都获取失败，则显示无数据
        console.error('[fetchSystemPerformance] 所有API尝试都失败');
        const cpuUsageEl = document.querySelector('.cpu-usage');
        const memUsageEl = document.querySelector('.memory-usage');
        
        if (cpuUsageEl) cpuUsageEl.textContent = '无数据';
        if (memUsageEl) memUsageEl.textContent = '无数据';
        
        return false;
    } catch (error) {
        console.error('[fetchSystemPerformance] 获取系统性能数据失败:', error);
        addLog(`获取系统性能数据失败: ${error.message}`, 'warning');
        return false;
    }
}

/**
 * 从API响应中提取并更新CPU使用率
 * @param {Object} data - API响应数据
 */
const updateCpuUsage = (data) => {
    // 获取CPU显示元素
    const cpuUsageEl = document.querySelector('.cpu-usage');
    const cpuBarEl = document.querySelector('.cpu-bar');
    const cpuModelEl = document.querySelector('.cpu-model');
    const cpuCoresEl = document.querySelector('.cpu-cores');
    
    if (!cpuUsageEl) {
        console.error('[updateCpuUsage] 无法找到CPU使用率显示元素');
        return;
    }
    
    // 从不同数据结构中提取CPU使用率、型号和核心数
    let cpuUsage = null;
    let cpuModel = '';
    let cpuCores = '';
    
    if (data?.data?.cpu?.usage !== undefined) {
        cpuUsage = data.data.cpu.usage;
        cpuModel = data.data.cpu.model || '';
        cpuCores = data.data.cpu.cores || '';
    } else if (data?.cpu?.usage !== undefined) {
        cpuUsage = data.cpu.usage;
        cpuModel = data.cpu.model || '';
        cpuCores = data.cpu.cores || '';
    } else if (data?.data?.cpu !== undefined && typeof data.data.cpu === 'number') {
        cpuUsage = data.data.cpu;
    } else if (typeof data?.cpu === 'number') {
        cpuUsage = data.cpu;
    }
    
    // 如果找到CPU使用率，更新显示
    if (cpuUsage !== null) {
        const formattedCpuUsage = typeof cpuUsage === 'number' ? 
            cpuUsage.toFixed(1) : parseFloat(cpuUsage).toFixed(1);
        cpuUsageEl.textContent = `${formattedCpuUsage}%`;
        if (cpuBarEl) {
            const cpuPercentage = Math.min(100, Math.max(0, parseFloat(formattedCpuUsage)));
            cpuBarEl.style.width = `${cpuPercentage}%`;
            if (cpuPercentage < 70) {
                cpuBarEl.className = 'cpu-bar bg-success';
            } else if (cpuPercentage < 90) {
                cpuBarEl.className = 'cpu-bar bg-warning';
            } else {
                cpuBarEl.className = 'cpu-bar bg-danger';
            }
        }
        // 新增：显示型号和核心数
        if (cpuModelEl) cpuModelEl.textContent = cpuModel ? ` 型号：${cpuModel}` : '';
        if (cpuCoresEl) cpuCoresEl.textContent = cpuCores ? ` 核心数：${cpuCores}` : '';
        return;
    }
    
    console.warn('[updateCpuUsage] 无法从响应中提取CPU使用率');
    cpuUsageEl.textContent = '无数据';
    if (cpuBarEl) {
        cpuBarEl.style.width = '0%';
    }
};

/**
 * 从API响应中提取并更新内存使用率
 * @param {Object} data - API响应数据
 */
const updateMemoryUsage = (data) => {
    // 获取内存显示元素
    const memUsageEl = document.querySelector('.memory-usage');
    const memBarEl = document.querySelector('.memory-bar');
    
    if (!memUsageEl) {
        console.error('[updateMemoryUsage] 无法找到内存使用率显示元素');
        return;
    }
    
    console.log('[updateMemoryUsage] 开始解析内存数据:', data);
    
    // 从不同数据结构中提取内存信息
    let memoryUsage = null;      // 使用百分比
    let memoryUsed = null;       // 已使用内存(MB)
    let memoryTotal = null;      // 总内存(MB)
    
    // 尝试从不同的数据结构中提取内存信息
    if (data?.data?.memory?.usage !== undefined) {
        // 从标准API格式获取 - stats/system接口返回格式
        memoryUsage = data.data.memory.usage;
        memoryUsed = data.data.memory.used;
        memoryTotal = data.data.memory.total;
        console.log('[updateMemoryUsage] 从data.data.memory中获取内存数据');
    } else if (data?.memory?.usage !== undefined) {
        // 直接从响应根级别获取
        memoryUsage = data.memory.usage;
        memoryUsed = data.memory.used;
        memoryTotal = data.memory.total;
        console.log('[updateMemoryUsage] 从data.memory中获取内存数据');
    } else if (data?.data?.memory !== undefined && typeof data.data.memory === 'number') {
        // 从简化API格式获取(只有百分比)
        memoryUsage = data.data.memory;
        console.log('[updateMemoryUsage] 从data.data.memory数值中获取内存使用率');
    } else if (typeof data?.memory === 'number') {
        // 直接从根级别获取简化格式
        memoryUsage = data.memory;
        console.log('[updateMemoryUsage] 从data.memory数值中获取内存使用率');
    } else if (data?.data?.system?.memory) {
        // 从system状态API获取
        const memData = data.data.system.memory;
        memoryUsed = memData.used;
        memoryTotal = memData.total;
        if (memoryTotal > 0) {
            memoryUsage = (memoryUsed / memoryTotal) * 100;
        }
        console.log('[updateMemoryUsage] 从data.data.system.memory中获取内存数据');
    } else if (data?.system?.memory) {
        // 直接从根级别获取system状态
        const memData = data.system.memory;
        memoryUsed = memData.used;
        memoryTotal = memData.total;
        if (memoryTotal > 0) {
            memoryUsage = (memoryUsed / memoryTotal) * 100;
        }
        console.log('[updateMemoryUsage] 从data.system.memory中获取内存数据');
    } else if (data?.data?.status?.memory) {
        // 从status接口获取
        memoryUsage = data.data.status.memory;
        console.log('[updateMemoryUsage] 从data.data.status.memory中获取内存使用率');
    } else if (data?.data?.memory) {
        // 直接获取内存值 - 处理状态API返回的情况
        memoryUsage = data.data.memory;
        console.log('[updateMemoryUsage] 从data.data.memory中获取内存使用率');
    }
    
    // 如果只找到了已用和总内存，计算使用率
    if (memoryUsage === null && memoryUsed !== null && memoryTotal !== null && memoryTotal > 0) {
        memoryUsage = (memoryUsed / memoryTotal) * 100;
        console.log(`[updateMemoryUsage] 根据已用/总内存计算使用率: ${memoryUsage.toFixed(1)}%`);
    }
    
    console.log(`[updateMemoryUsage] 提取的内存数据: 使用率=${memoryUsage}%, 已用=${formatMemorySize(memoryUsed)}, 总共=${formatMemorySize(memoryTotal)}`);
    
    // 如果找到内存使用率，更新显示
    if (memoryUsage !== null) {
        // 确保内存使用率是数字并四舍五入到一位小数
        const formattedMemUsage = typeof memoryUsage === 'number' ? 
            memoryUsage.toFixed(1) : parseFloat(memoryUsage).toFixed(1);
        
        // 如果有已用和总内存信息，显示更详细的格式
        if (memoryUsed !== null && memoryTotal !== null) {
            // 将字节转换为适当的单位
            const usedFormatted = formatMemorySize(memoryUsed);
            const totalFormatted = formatMemorySize(memoryTotal);
            memUsageEl.textContent = `${formattedMemUsage}% (${usedFormatted}/${totalFormatted})`;
        } else {
            // 否则只显示百分比
            memUsageEl.textContent = `${formattedMemUsage}%`;
        }
        
        // 更新内存进度条
        if (memBarEl) {
            const memPercentage = Math.min(100, Math.max(0, parseFloat(formattedMemUsage)));
            memBarEl.style.width = `${memPercentage}%`;
            
            // 根据内存使用率设置进度条颜色
            if (memPercentage < 70) {
                memBarEl.className = 'memory-bar bg-success';
            } else if (memPercentage < 90) {
                memBarEl.className = 'memory-bar bg-warning';
            } else {
                memBarEl.className = 'memory-bar bg-danger';
            }
        }
        
        console.log(`[updateMemoryUsage] 内存使用率已更新为: ${memUsageEl.textContent}`);
        return;
    }
    
    console.warn('[updateMemoryUsage] 无法从响应中提取内存使用率');
    memUsageEl.textContent = '无数据';
    if (memBarEl) {
        memBarEl.style.width = '0%';
    }
};

/**
 * 格式化内存大小为人类可读格式
 * @param {number} bytes - 内存字节数
 * @returns {string} 格式化后的内存大小
 */
const formatMemorySize = (size) => {
    if (size === null || size === undefined) {
        return '未知';
    }
    
    // 检查是否为MB单位（小于1GB）
    const mb = size / (1024 * 1024);
    if (mb < 1024) {
        return `${mb.toFixed(1)}MB`;
    }
    
    // 转换到GB
    const gb = mb / 1024;
    return `${gb.toFixed(1)}GB`;
};

/**
 * 获取统计数据（监控代币数、交易数等）
 */
async function fetchStatistics() {
    try {
        console.log('[fetchStatistics] 开始获取统计数据');
        
        const baseUrl = getApiBaseUrl();
        
        // 获取代币统计
        try {
            const tokensApiUrl = `${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}/stats/tokens`;
            console.log(`[fetchStatistics] 请求代币统计: ${tokensApiUrl}`);
            
            const tokensResponse = await fetch(tokensApiUrl);
            if (tokensResponse.ok) {
                const tokensData = await tokensResponse.json();
                console.log('[fetchStatistics] 代币统计数据:', tokensData);
                
                // 更新监控代币数
                updateTokenStats(tokensData.data);
            }
        } catch (tokenError) {
            console.error('[fetchStatistics] 获取代币统计失败:', tokenError);
        }
        
        // 获取交易统计
        try {
            const txApiUrl = `${baseUrl}${baseUrl.endsWith('/api') ? '' : '/api'}/stats/transactions`;
            console.log(`[fetchStatistics] 请求交易统计: ${txApiUrl}`);
            
            const txResponse = await fetch(txApiUrl);
            if (txResponse.ok) {
                const txData = await txResponse.json();
                console.log('[fetchStatistics] 交易统计数据:', txData);
                
                // 更新执行交易数
                updateTransactionStats(txData.data);
            }
        } catch (txError) {
            console.error('[fetchStatistics] 获取交易统计失败:', txError);
        }
        
        console.log('[fetchStatistics] 统计数据更新完成');
        return true;
    } catch (error) {
        console.error('[fetchStatistics] 获取统计数据失败:', error);
        addLog(`获取统计数据失败: ${error.message}`, 'warning');
        return false;
    }
}

/**
 * 更新代币统计信息
 * @param {Object} stats - 代币统计信息
 */
function updateTokenStats(stats) {
    if (!stats) return;
    
    try {
        // 获取监控代币数显示元素
        const monitoredTokensEl = document.querySelector('.stat-card:nth-child(4) .stat-value');
        const todayNewEl = document.querySelector('.stat-card:nth-child(4) .stat-indicator');
        
        if (monitoredTokensEl) {
            const tokenCount = stats.monitored || stats.total || 0;
            monitoredTokensEl.textContent = formatNumber(tokenCount);
            console.log(`[updateTokenStats] 更新监控代币数: ${tokenCount}`);
        }
        
        if (todayNewEl) {
            const todayNew = stats.todayNew || 0;
            todayNewEl.innerHTML = `<i class="ri-arrow-up-line"></i> 今日新增: ${todayNew}`;
            console.log(`[updateTokenStats] 更新今日新增代币: ${todayNew}`);
        }
    } catch (error) {
        console.error('[updateTokenStats] 更新代币统计信息失败:', error);
    }
}

/**
 * 组合API URL，确保URL格式正确
 * @param {string} path - API路径
 * @returns {string} 完整的API URL
 */
function buildApiUrl(path) {
    const baseUrl = getApiBaseUrl();
    // 移除路径前面的斜杠
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // 确保baseUrl的结尾有斜杠
    const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    
    // 组合完整URL
    return `${baseWithSlash}${cleanPath}`;
}

/**
 * 通用API请求函数
 * @param {string} path - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise<Object>} API响应
 */
async function apiRequest(path, options = {}) {
    try {
        const url = buildApiUrl(path);
        console.log(`[apiRequest] 发起请求: ${url}`);
        
        // 默认为GET请求
        const method = options.method || 'GET';
        
        // 构建请求配置
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        // 添加请求体（如果有）
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
        
        // 发起请求
        const response = await fetch(url, config);
        
        // 检查响应状态
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        // 尝试解析JSON响应
        let data;
        try {
            const text = await response.text();
            console.log(`[apiRequest] 原始响应: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.warn(`[apiRequest] JSON解析失败: ${parseError.message}`);
                // 如果不是JSON，返回文本
                return { success: true, data: text };
            }
        } catch (error) {
            console.error(`[apiRequest] 处理响应失败: ${error.message}`);
            throw error;
        }
        
        // 返回解析后的数据
        return data;
    } catch (error) {
        console.error(`[apiRequest] 请求失败 (${path}): ${error.message}`);
        throw error;
    }
}

/**
 * 获取最近交易数据
 */
async function fetchRecentTrades() {
    try {
        console.log('[fetchRecentTrades] 开始获取最近交易数据');
        const baseUrl = getApiBaseUrl();
        
        // 尝试多个可能的API路径
        const apiPaths = [
            `${baseUrl}/api/transactions`,
            `${baseUrl}/transactions`,
            `${baseUrl}/api/trades`,
            `${baseUrl}/trades`
        ];
        
        // 遍历所有可能的路径，直到找到有效的
        for (const apiUrl of apiPaths) {
            try {
                console.log(`[fetchRecentTrades] 尝试请求API: ${apiUrl}`);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    console.warn(`[fetchRecentTrades] API路径 ${apiUrl} 请求失败: ${response.status} ${response.statusText}`);
                    continue; // 尝试下一个路径
                }
                
                const data = await response.json();
                console.log('[fetchRecentTrades] 收到API响应:', data);
                
                // 提取交易数据
                let transactions = [];
                if (data?.success && Array.isArray(data.data)) {
                    transactions = data.data;
                } else if (Array.isArray(data)) {
                    transactions = data;
                } else if (data?.data && typeof data.data === 'object') {
                    transactions = Array.isArray(data.data.transactions) ? data.data.transactions : [];
                }
                
                if (transactions.length > 0) {
                    // 更新交易表格
                    updateRecentTradesTable(transactions);
                    
                    console.log(`[fetchRecentTrades] 成功加载 ${transactions.length} 条交易记录`);
                    addLog(`已加载 ${transactions.length} 条最新交易记录`, 'success');
                    return transactions;
                }
                
                console.warn(`[fetchRecentTrades] API路径 ${apiUrl} 响应格式有效，但未找到交易数据`);
            } catch (pathError) {
                console.warn(`[fetchRecentTrades] API路径 ${apiUrl} 请求出错:`, pathError);
                // 继续尝试下一个路径
            }
        }
        
        // 所有API路径都尝试失败，返回模拟数据
        console.warn('[fetchRecentTrades] 所有API路径都尝试失败，使用模拟数据');
        const mockTrades = generateMockTrades();
        updateRecentTradesTable(mockTrades);
        return mockTrades;
    } catch (error) {
        console.error('[fetchRecentTrades] 获取交易数据失败:', error);
        addLog(`获取交易数据失败: ${error.message}`, 'error');
        
        // 返回模拟数据
        return generateMockTrades();
    }
}

/**
 * 生成模拟交易数据
 * @returns {Array} 模拟交易数据数组
 */
function generateMockTrades() {
    const mockTrades = [
        {
            id: 'TX12345',
            pair: 'SOL/USDC',
            amount: '10.5',
            profit: 0.25,
            timestamp: new Date().toISOString(),
            status: 'success'
        },
        {
            id: 'TX12346',
            pair: 'BONK/SOL',
            amount: '100,000',
            profit: 0.15,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
            status: 'success'
        },
        {
            id: 'TX12347',
            pair: 'RAY/SOL',
            amount: '25.3',
            profit: 0.08,
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1小时前
            status: 'success'
        },
        {
            id: 'TX12348',
            pair: 'ORCA/SOL',
            amount: '18.7',
            profit: 0.05,
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2小时前
            status: 'success'
        },
        {
            id: 'TX12349',
            pair: 'MNGO/SOL',
            amount: '45.2',
            profit: 0.12,
            timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3小时前
            status: 'failed'
        }
    ];
    
    console.log('[generateMockTrades] 生成了5个模拟交易数据');
    addLog('使用模拟交易数据', 'warning');
    systemData.isRealData = false; // 标记数据为模拟数据
    
    return mockTrades;
}

/**
 * 获取最近代币数据
 */
async function fetchRecentTokens() {
    try {
        console.log('[fetchRecentTokens] 开始获取最近代币数据');
        const baseUrl = getApiBaseUrl();
        const apiUrl = `${baseUrl}/api/tokens`;
        
        console.log(`[fetchRecentTokens] 请求API: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[fetchRecentTokens] 收到API响应:', data);
        
        // 提取代币数据
        let tokens = [];
        if (data?.success && Array.isArray(data.data)) {
            tokens = data.data;
        } else if (Array.isArray(data)) {
            tokens = data;
        }
        
        // 更新代币表格
        updateTokensTable(tokens);
        
        console.log(`[fetchRecentTokens] 成功加载 ${tokens.length} 个代币`);
        addLog(`已加载 ${tokens.length} 个最新代币`, 'success');
        
        return true;
    } catch (error) {
        console.error('[fetchRecentTokens] 获取代币数据失败:', error);
        addLog(`获取代币数据失败: ${error.message}`, 'error');
        return false;
    }
}

/**
 * 初始化交易表格
 * @param {Object} elements DOM元素对象
 */
function initTradesTable(elements) {
    console.log('[initTradesTable] 开始初始化交易表格');
    if (!elements.tradesTableBody) {
        console.error('[initTradesTable] 交易表格DOM元素不存在');
        return;
    }
    
    // 清空表格
    elements.tradesTableBody.innerHTML = '';
    
    // 获取最近交易数据
    fetchRecentTrades()
        .then(trades => {
            if (!trades || trades.length === 0) {
                console.log('[initTradesTable] 无交易数据，显示空表格提示');
                elements.tradesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">暂无交易记录</td></tr>';
                return;
            }
            
            console.log(`[initTradesTable] 获取到 ${trades.length} 条交易记录`);
            
            // 更新表格内容
            updateTradesTable(trades, elements);
        })
        .catch(error => {
            console.error('[initTradesTable] 获取交易数据失败:', error);
            elements.tradesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">获取数据失败</td></tr>';
        });
}

/**
 * 更新交易表格内容
 * @param {Array} trades 交易数据数组
 * @param {Object} elements DOM元素对象
 */
function updateTradesTable(trades, elements) {
    if (!elements.tradesTableBody) return;
    
    // 清空表格
    elements.tradesTableBody.innerHTML = '';
    
    // 添加交易记录
    for (const tx of trades) {
        const row = document.createElement('tr');
        
        // 格式化数据
        const profit = Number.parseFloat(tx.profit || 0).toFixed(4);
        const date = new Date(tx.timestamp);
        const formattedDate = formatDateTime(date);
        
        // 添加交易状态样式类
        let statusClass = 'status-pending';
        if (tx.status === 'success') {
            statusClass = 'status-success';
        } else if (tx.status === 'failed') {
            statusClass = 'status-failed';
        }
        
        // 设置行内容
        row.innerHTML = `
            <td><span class="id-label">${tx.id}</span></td>
            <td>${tx.pair}</td>
            <td>${tx.amount}</td>
            <td class="text-success">+${profit} SOL</td>
            <td>${formattedDate}</td>
            <td><span class="${statusClass}">${tx.status}</span></td>
        `;
        
        // 添加行到表格
        elements.tradesTableBody.appendChild(row);
    }
}

/**
 * 初始化代币表格
 * @param {Object} elements DOM元素对象
 */
function initTokensTable(elements) {
    // 加载代币数据
    fetchTokens()
        .then(tokens => {
            // 更新表格
            updateTokensTableV2(tokens, elements);
        })
        .catch(error => {
            console.error('[initTokensTable] 获取代币数据失败:', error);
        });
}

/**
 * 更新代币表格内容
 * @param {Array} tokens 代币数据数组
 * @param {Object} elements DOM元素对象
 */
function updateTokensTableV2(tokens, elements) {
    if (!elements.tokensTableBody) return;
    
    // 清空表格
    elements.tokensTableBody.innerHTML = '';
    
    // 添加代币记录
    for (const token of tokens) {
        const row = document.createElement('tr');
        
        // 格式化数据
        const shortAddress = formatAddress(token.address);
        const date = new Date(token.createdAt || token.timestamp);
        const formattedDate = formatDateTime(date);
        
        // 计算风险等级样式
        let riskClass = 'risk-low';
        let riskText = '低风险';
        
        if (token.riskScore > 60) {
            riskClass = 'risk-high';
            riskText = '高风险';
        } else if (token.riskScore > 30) {
            riskClass = 'risk-medium';
            riskText = '中风险';
        }
        
        // 设置行内容
        row.innerHTML = `
            <td>
                <div class="token-info">
                    <div class="token-name">${token.name}</div>
                    <div class="token-symbol">${token.symbol}</div>
                </div>
            </td>
            <td><span class="address-label" title="${token.address}">${shortAddress}</span></td>
            <td>${formattedDate}</td>
            <td>${formatNumber(token.liquidity)} SOL</td>
            <td><span class="${riskClass}">${riskText} (${token.riskScore})</span></td>
        `;
        
        // 添加行到表格
        elements.tokensTableBody.appendChild(row);
    }
}

/**
 * 初始化系统状态
 * @param {Object} elements DOM元素对象
 */
function initSystemStatus(elements) {
    console.log('[initSystemStatus] 开始初始化系统状态');
    
    // 获取系统状态数据
    fetchSystemStatus()
        .then(data => {
            if (!data) {
                console.error('[initSystemStatus] 无法获取系统状态数据');
                return;
            }
            
            console.log('[initSystemStatus] 获取到系统状态数据:', data);
            
            // 更新系统状态显示
            updateSystemStatusDisplay(data, elements);
        })
        .catch(error => {
            console.error('[initSystemStatus] 获取系统状态失败:', error);
        });
}

/**
 * 获取系统状态数据
 * @returns {Promise<Object>} 系统状态数据
 */
async function fetchSystemStatus() {
    try {
        const apiUrl = `${getApiBaseUrl()}/api/status`;
        console.log(`[fetchSystemStatus] 请求API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[fetchSystemStatus] API响应:', data);
        
        if (!data.success) {
            throw new Error('API返回失败状态');
        }
        
        return data.data;
    } catch (error) {
        console.error('[fetchSystemStatus] 获取系统状态失败:', error);
        return null;
    }
}

/**
 * 更新系统状态显示
 * @param {Object} data 系统状态数据
 * @param {Object} elements DOM元素对象
 */
function updateSystemStatusDisplay(data, elements) {
    if (!data || !elements) return;
    
    try {
        // 更新CPU使用率
        if (elements.cpuUsage) {
            elements.cpuUsage.textContent = `${Number(data.cpu).toFixed(1)}%`;
        }
        
        // 更新内存使用率
        if (elements.memoryUsage) {
            elements.memoryUsage.textContent = `${Number(data.memory).toFixed(1)}%`;
        }
        
        // 更新运行时间
        if (elements.uptime) {
            elements.uptime.textContent = formatUptime(data.uptime);
        }
        
        // 更新利润
        if (elements.profit) {
            elements.profit.textContent = `${Number(data.profit).toFixed(2)} SOL`;
        }
        
        // 更新今日利润
        if (elements.todayProfit) {
            elements.todayProfit.textContent = `${Number(data.todayProfit).toFixed(2)} SOL`;
        }
        
        // 更新本周利润
        if (elements.weeklyProfit) {
            elements.weeklyProfit.textContent = `${Number(data.weeklyProfit).toFixed(2)} SOL`;
        }
        
        // 更新活跃池数量
        if (elements.activePools) {
            elements.activePools.textContent = data.activePools;
        }
        
        // 更新总池数量
        if (elements.totalPools) {
            elements.totalPools.textContent = data.totalPools;
        }
        
        // 更新监控代币数量
        if (elements.monitoredTokens) {
            elements.monitoredTokens.textContent = data.monitoredTokens;
        }
        
        // 更新今日新增代币数量
        if (elements.todayNewTokens) {
            elements.todayNewTokens.textContent = data.todayNewTokens;
        }
        
        // 更新执行交易数量
        if (elements.executedTrades) {
            elements.executedTrades.textContent = data.executedTrades;
        }
        
        // 更新成功率
        if (elements.successRate) {
            elements.successRate.textContent = `${Number(data.successRate).toFixed(1)}%`;
        }
        
        console.log('[updateSystemStatusDisplay] 系统状态更新完成');
    } catch (error) {
        console.error('[updateSystemStatusDisplay] 更新系统状态显示时出错:', error);
    }
}

/**
 * 格式化运行时间
 * @param {number} seconds 秒数
 * @returns {string} 格式化的运行时间
 */
function formatUptime(seconds) {
    if (Number.isNaN(seconds) || seconds < 0) {
        return '0小时0分钟';
    }
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    
    if (days > 0) {
        result += `${days}天`;
    }
    
    if (hours > 0 || days > 0) {
        result += `${hours}小时`;
    }
    
    result += `${minutes}分钟`;
    
    return result;
}

/**
 * 刷新仪表盘数据
 * @param {Object} elements DOM元素对象
 */
function refreshDashboard(elements) {
    console.log('[refreshDashboard] 开始刷新仪表盘数据');
    
    // 刷新系统状态
    fetchSystemStatus()
        .then(data => {
            if (data) {
                updateSystemStatusDisplay(data, elements);
            }
        })
        .catch(error => {
            console.error('[refreshDashboard] 刷新系统状态失败:', error);
        });
    
    // 刷新交易表格
    fetchRecentTrades()
        .then(trades => {
            if (trades && trades.length > 0) {
                updateTradesTable(trades, elements);
            }
        })
        .catch(error => {
            console.error('[refreshDashboard] 刷新交易表格失败:', error);
        });
    
    // 刷新代币表格
    fetchTokens()
        .then(tokens => {
            if (tokens && tokens.length > 0) {
                updateTokensTable(tokens, elements);
            }
        })
        .catch(error => {
            console.error('[refreshDashboard] 刷新代币表格失败:', error);
        });
    
    // 更新最后刷新时间
    const lastUpdatedEl = document.querySelector('.last-updated');
    if (lastUpdatedEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastUpdatedEl.textContent = `最后更新: ${timeStr}`;
    }
}

/**
 * 获取代币数据
 * @returns {Promise<Array>} 代币数据数组
 */
async function fetchTokens() {
    try {
        console.log('[fetchTokens] 开始获取代币数据');
        const baseUrl = getApiBaseUrl();
        
        // 尝试多个可能的API路径
        const apiPaths = [
            `${baseUrl}/api/tokens`,
            `${baseUrl}/tokens`
        ];
        
        // 遍历所有可能的路径，直到找到有效的
        for (const apiUrl of apiPaths) {
            try {
                console.log(`[fetchTokens] 尝试请求API: ${apiUrl}`);
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    console.warn(`[fetchTokens] API路径 ${apiUrl} 请求失败: ${response.status} ${response.statusText}`);
                    continue; // 尝试下一个路径
                }
                
                const data = await response.json();
                console.log('[fetchTokens] 收到API响应:', data);
                
                // 提取代币数据
                let tokens = [];
                if (data?.success && Array.isArray(data.data)) {
                    tokens = data.data;
                } else if (Array.isArray(data)) {
                    tokens = data;
                } else if (data?.data && typeof data.data === 'object') {
                    tokens = Array.isArray(data.data.tokens) ? data.data.tokens : [];
                }
                
                if (tokens.length > 0) {
                    console.log(`[fetchTokens] 成功获取 ${tokens.length} 个代币`);
                    addLog(`已加载 ${tokens.length} 个代币`, 'success');
                    return tokens;
                }
                
                console.warn(`[fetchTokens] API路径 ${apiUrl} 响应格式有效，但未找到代币数据`);
            } catch (pathError) {
                console.warn(`[fetchTokens] API路径 ${apiUrl} 请求出错:`, pathError);
                // 继续尝试下一个路径
            }
        }
        
        // 所有API路径都尝试失败，返回模拟数据
        console.warn('[fetchTokens] 所有API路径都尝试失败，使用模拟数据');
        const mockTokens = generateMockTokens();
        return mockTokens;
    } catch (error) {
        console.error('[fetchTokens] 获取代币数据失败:', error);
        addLog(`获取代币数据失败: ${error.message}`, 'error');
        
        // 返回模拟数据
        return generateMockTokens();
    }
}

/**
 * 生成模拟代币数据
 * @returns {Array} 模拟代币数据数组
 */
function generateMockTokens() {
    const mockTokens = [
        {
            symbol: 'SOL',
            name: 'Solana',
            address: 'So11111111111111111111111111111111111111112',
            riskScore: 1.0,
            timestamp: new Date().toISOString(),
            liquidity: 120000
        },
        {
            symbol: 'USDC',
            name: 'USD Coin',
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            riskScore: 1.5,
            timestamp: new Date().toISOString(),
            liquidity: 50000
        },
        {
            symbol: 'BONK',
            name: 'Bonk',
            address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            riskScore: 5.0,
            timestamp: new Date().toISOString(),
            liquidity: 35000
        },
        {
            symbol: 'RAY',
            name: 'Raydium',
            address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
            riskScore: 3.7,
            timestamp: new Date().toISOString(),
            liquidity: 18000
        },
        {
            symbol: 'ORCA',
            name: 'Orca',
            address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
            riskScore: 3.5,
            timestamp: new Date().toISOString(),
            liquidity: 16500
        }
    ];
    
    console.log('[generateMockTokens] 生成了5个模拟代币数据');
    addLog('使用模拟代币数据', 'warning');
    systemData.isRealData = false; // 标记数据为模拟数据
    
    return mockTokens;
}

// 在文件顶部初始化部分修改
document.addEventListener('DOMContentLoaded', () => {
    console.log('仪表盘页面加载完成，开始初始化...');
    
    // 初始化DOM元素引用
    if (!initElements()) {
        console.error('初始化DOM元素失败，可能影响功能');
        addLog('初始化DOM元素失败', 'error');
    }
    
    // 初始化事件处理
    bindEventHandlers();
    
    // 初始化图表
    setTimeout(() => {
        initCharts();
        
        // 确保图表初始化完成后再加载数据
        setTimeout(() => {
            // 加载图表数据
            fetchProfitTrend('7天');
            fetchTokenTrend('24小时');
        }, 300);
    }, 500);
    
    // 立即检查API状态
    checkApiStatus().then(result => {
        if (result.isAvailable) {
            console.log('✅ 后端API服务正常运行', result);
            addLog('✅ 后端API服务正常运行', 'success');
            
            // API正常，立即加载所有数据
            loadAllData();
        } else {
            console.error('❌ 后端API服务不可用', result);
            addLog('❌ 后端API服务不可用，使用模拟数据', 'error');
            systemData.isRealData = false;
            
            // API不可用，使用模拟数据
            loadMockData();
        }
    });
    
    // 500ms后输出API调试信息
    setTimeout(apiDebugHelper, 500);
});

/**
 * 加载所有实时数据
 */
function loadAllData() {
    console.log('[loadAllData] 开始加载所有实时数据...');
    
    // 并行加载所有数据，避免顺序依赖导致的阻塞
    Promise.allSettled([
        fetchSystemPerformance(),
        fetchSystemStatus(),
        fetchRecentTrades(),
        fetchRecentTokens()
    ]).then(results => {
        let successCount = 0;
        let failCount = 0;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                failCount++;
                console.error(`[loadAllData] 数据加载失败(${index}):`, result.reason);
            }
        });
        
        console.log(`[loadAllData] 数据加载完成：${successCount}成功，${failCount}失败`);
        
        if (successCount > 0) {
            addLog(`已加载${successCount}项数据`, 'success');
        }
        
        if (failCount > 0) {
            addLog(`${failCount}项数据加载失败`, 'warning');
        }
        
        // 无论如何都更新最后更新时间
        updateLastUpdated();
    });
}

/**
 * 加载模拟数据（当API不可用时）
 */
function loadMockData() {
    console.log('[loadMockData] 加载模拟数据...');
    systemData.isRealData = false;
    
    // 更新系统状态
    updateSystemStatus('stopped【M】');
    
    // 生成并显示模拟交易数据
    const mockTrades = generateMockTrades();
    updateTradesTable(mockTrades);
    
    // 生成并显示模拟代币数据
    const mockTokens = generateMockTokens();
    updateTokensTable(mockTokens);
    
    // 更新其他UI元素
    if (elements.cpuUsage) elements.cpuUsage.textContent = '8.5%';
    if (elements.memoryUsage) elements.memoryUsage.textContent = '32.7%';
    if (elements.uptime) elements.uptime.textContent = '0小时0分钟';
    if (elements.profit) elements.profit.textContent = '0.65 SOL';
    if (elements.todayProfit) elements.todayProfit.textContent = '0.15 SOL';
    if (elements.weeklyProfit) elements.weeklyProfit.textContent = '0.65 SOL';
    if (elements.activePools) elements.activePools.textContent = '3';
    if (elements.totalPools) elements.totalPools.textContent = '12';
    if (elements.monitoredTokens) elements.monitoredTokens.textContent = '5';
    if (elements.todayNewTokens) elements.todayNewTokens.textContent = '2';
    if (elements.executedTrades) elements.executedTrades.textContent = '5';
    if (elements.successRate) elements.successRate.textContent = '80.0%';
    
    // 添加模拟数据日志
    addLog('使用模拟数据显示', 'warning');
    updateLastUpdated();
}
