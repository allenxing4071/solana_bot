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
function getApiBaseUrl() {
    // 确保环境变量对象存在
    if (!window.ENV) {
        console.warn('[getApiBaseUrl] 环境变量未定义，使用默认API URL');
        window.ENV = {
            API_URL: 'http://localhost:8080/api',
            ENVIRONMENT: 'development',
            USE_MOCK_DATA: true
        };
    }
    
    // 返回API地址，如果不存在则使用默认值
    return window.ENV.API_URL || 'http://localhost:8080/api';
}

/**
 * 检查API服务是否正常运行
 * @returns {Promise<boolean>} API是否可用
 */
async function checkApiStatus() {
    try {
        console.log('[checkApiStatus] 开始检查API状态...');
        const apiUrl = getApiBaseUrl();
        
        // 使用状态检查接口
        const statusEndpoint = `${apiUrl}/status`;
        console.log(`[checkApiStatus] 请求状态检查: ${statusEndpoint}`);
        
        // 设置超时，避免长时间等待
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(statusEndpoint, {
            signal: controller.signal,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        // 如果服务器响应正常
        if (response.ok) {
            console.log('[checkApiStatus] API服务正常运行');
            return true;
        } else {
            console.warn(`[checkApiStatus] API服务响应异常: ${response.status} ${response.statusText}`);
            return false;
        }
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

// DOM元素缓存
const elements = {
    cpuUsage: document.querySelector('.cpu-usage'),
    cpuBar: document.getElementById('cpuBar'),
    cpuCores: document.querySelector('.stat-card:first-child .stat-indicator'),
    memoryUsage: document.querySelector('.memory-usage'),
    memoryBar: document.getElementById('memoryBar'),
    memoryTotal: document.getElementById('memoryTotal'),
    uptime: document.querySelector('.uptime'),
    totalProfit: document.getElementById('totalProfit'),
    monitoredTokens: document.getElementById('monitoredTokens'),
    activePools: document.getElementById('activePools'),
    totalPools: document.getElementById('totalPools'),
    executedTrades: document.getElementById('executedTrades'),
    tradesTableBody: document.getElementById('tradesTableBody'),
    tokensTableBody: document.getElementById('tokensTableBody'),
    logContainer: document.getElementById('logContainer'),
    lastUpdated: document.querySelector('.last-updated'),
    refreshBtn: document.getElementById('refreshBtn'),
    tokenDiscoveryChart: document.getElementById('tokenDiscoveryChart'),
    profitTrendChart: document.getElementById('profitTrendChart'),
    startBtn: document.getElementById('startBtn'),
    stopBtn: document.getElementById('stopBtn'),
    statusIndicator: document.querySelector('.status-dot'),
    statusText: document.querySelector('.status-text')
};

// 全局变量
const charts = {
    tokenDiscoveryChart: null,
    profitTrendChart: null
};

// 使用const而不是let，因为我们只初始化一次
const systemData = {
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
    isRealData: !window.ENV.USE_MOCK_DATA,  // 根据全局配置判断是否为真实数据
    totalMemory: 0  // 新增totalMemory字段
};

/**
 * 防抖函数 - 限制函数在一定时间内只执行一次
 * @param {Function} func - 需要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 包装后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，开始初始化...');
    
    // 首先立即检查DOM元素
    console.log('检查关键DOM元素:');
    console.log('activePools元素:', document.getElementById('activePools'));
    console.log('totalPools元素:', document.getElementById('totalPools'));
    
    // 添加测试函数，手动设置池数据，确认DOM更新是否正常
    window.testPoolStats = function(active, total) {
        console.log(`[测试] 手动设置池数据: 活跃=${active}, 总数=${total}`);
        const activeEl = document.getElementById('activePools');
        const totalEl = document.getElementById('totalPools');
        
        if (activeEl) activeEl.textContent = active;
        if (totalEl) totalEl.textContent = total;
        
        console.log('DOM设置后的值:');
        console.log('activePools.textContent =', activeEl ? activeEl.textContent : 'null');
        console.log('totalPools.textContent =', totalEl ? totalEl.textContent : 'null');
        
        addLog(`测试设置池数据: 活跃=${active}, 总数=${total}`, 'info');
    };
    
    // 在浏览器控制台显示测试指南
    console.log('%c调试说明: 在控制台输入 testPoolStats(32, 45) 手动测试池数显示', 'color: green; font-weight: bold;');
    
    // 绑定刷新数据按钮事件
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshDataBtn = document.getElementById('refreshData');
    
    // 尝试绑定刷新按钮，支持两种可能的ID
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('刷新按钮被点击');
            fetchSystemData(true);
            fetchPoolsData(); // 同时刷新池数据
        });
        console.log('成功绑定refreshBtn按钮事件');
    } else if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', () => {
            console.log('刷新按钮被点击');
            fetchSystemData(true);
            fetchPoolsData(); // 同时刷新池数据
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
    
    // 初始清除按钮
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            const logContainer = document.getElementById('logContainer');
            if (logContainer) {
                logContainer.innerHTML = '';
                addLog('日志已清除', 'info');
            }
        });
    }
    
    // 使用IntersectionObserver实现懒加载图表
    const observerOptions = {
        root: null, // 使用视口作为参考
        rootMargin: '0px',
        threshold: 0.1 // 当元素有10%进入视口时触发
    };
    
    const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartElement = entry.target;
                const chartType = chartElement.getAttribute('data-chart-type');
                
                console.log(`[懒加载] 图表 ${chartType} 进入视口，开始初始化`);
                
                // 取消观察该元素，避免重复初始化
                observer.unobserve(chartElement);
                
                // 使用统一的图表初始化函数
                setTimeout(() => {
                    initCharts();
                    
                    // 获取相应的趋势数据
                    if (chartType === 'token-discovery') {
                        fetchTokenTrends();
                    } else if (chartType === 'profit-trend') {
                        fetchProfitTrends();
                    }
                }, 50);
            }
        });
    }, observerOptions);
    
    // 绑定图表时间周期按钮 - 确保在页面加载完成后绑定
    bindChartPeriodButtons();
    
    // 最优先获取池数据
    console.log('开始获取池数据 - 优先级高');
    fetchPoolsData();
    
    // 初始化关键数据
    fetchSystemData();
    
    // 获取并观察图表容器
    const tokenChartContainer = document.getElementById('tokenDiscoveryChart');
    const profitChartContainer = document.getElementById('profitTrendChart');
    
    if (tokenChartContainer) {
        tokenChartContainer.setAttribute('data-chart-type', 'token-discovery');
        lazyLoadObserver.observe(tokenChartContainer);
    }
    
    if (profitChartContainer) {
        profitChartContainer.setAttribute('data-chart-type', 'profit-trend');
        lazyLoadObserver.observe(profitChartContainer);
    }
    
    // 初始化非图表数据
    fetchRecentTrades();
    fetchRecentTokens();
    fetchProfitSummary();
    
    // 设置自动刷新（每30秒刷新一次数据）
    setInterval(() => {
        fetchSystemData();
        fetchPoolsData(); // 同时刷新池数据
    }, 30000);
    
    // 添加屏幕尺寸变化监听，以便响应式调整UI
    window.addEventListener('resize', debounce(() => {
        if (charts.tokenDiscoveryChart) {
            charts.tokenDiscoveryChart.resize();
        }
        if (charts.profitTrendChart) {
            charts.profitTrendChart.resize();
        }
    }, 250));
    
    // 最后再次确认池数据已更新
    setTimeout(() => {
        console.log('最终检查池数据:');
        console.log('systemData.activePools =', systemData.activePools);
        console.log('activePools.textContent =', document.getElementById('activePools')?.textContent);
        console.log('totalPools.textContent =', document.getElementById('totalPools')?.textContent);
        
        // 如果数据没有正确显示，再次尝试获取
        if (document.getElementById('activePools')?.textContent === '0' || 
            document.getElementById('activePools')?.textContent === '--') {
            console.log('%c检测到池数据未正确显示，重新获取', 'color: red; font-weight: bold');
            fetchPoolsData();
        }
    }, 3000);
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

            // 准备初始数据 - 使用空数据
            const initialDays = [];
            const initialProfits = [];

            // 将初始空数据保存到systemData中
            systemData.profitTrend = [];

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
        } catch (chartError) {
            console.error('利润趋势图初始化失败:', chartError);
        }
        
        // 图表初始化完成后再次绑定时间周期按钮
        setTimeout(() => {
            bindChartPeriodButtons();
            console.log('图表初始化后重新绑定时间周期按钮');
        }, 100);
    } catch (error) {
        console.error('初始化图表失败:', error);
        addLog(`初始化图表失败: ${error.message}`, 'error');
    }
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
 * @param {string} period - 时间周期 (24小时, 7天, 30天)
 */
async function fetchProfitTrend(period) {
    try {
        addLog(`正在获取${period}利润趋势...`, 'info');
        
        // 构建API URL
        const apiUrl = `${getApiBaseUrl()}/profit-trends`;
        console.log(`[fetchProfitTrend] 请求API: ${apiUrl}`);
        
        // 发起API请求
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        // 解析响应数据
        const data = await response.json();
        console.log('[fetchProfitTrend] 收到API响应:', data);
        
        // 提取对应时间周期的数据
        let trendData = [];
        
        if (data.success && data.data && data.data[period]) {
            trendData = data.data[period];
            console.log(`[fetchProfitTrend] 提取${period}数据:`, trendData);
        } else {
            console.warn(`[fetchProfitTrend] API响应中找不到${period}的数据`);
        }
        
        // 更新系统数据中的趋势数据
        systemData.profitTrend = trendData;
        
        // 更新图表数据
        if (charts.profitTrendChart) {
            const labels = trendData.map(item => item.date);
            const data = trendData.map(item => Number(item.value));
            
            charts.profitTrendChart.data.labels = labels;
            charts.profitTrendChart.data.datasets[0].data = data;
            charts.profitTrendChart.update();
            console.log(`利润趋势图(${period})更新成功，数据点数: ${trendData.length}`);
        } else {
            console.error('利润趋势图未初始化，重新初始化图表');
            initCharts(); // 如果图表不存在则重新初始化
        }
        
        addLog(`${period}利润趋势加载完成`, 'info');
    } catch (error) {
        console.error(`获取${period}利润趋势失败:`, error);
        addLog(`获取${period}利润趋势失败: ${error.message}`, 'error');
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
        console.log('[fetchSystemData] 开始获取系统数据...');
        
        // 构建API URL
        const apiStatusUrl = `${getApiBaseUrl()}/system/status`;
        const apiSystemInfoUrl = `${getApiBaseUrl()}/system/info`;
        
        console.log(`[fetchSystemData] 请求状态API: ${apiStatusUrl}`);
        console.log(`[fetchSystemData] 请求系统信息API: ${apiSystemInfoUrl}`);
        
        // 并行请求状态和系统信息
        const [statusResponse, systemInfoResponse] = await Promise.all([
            fetch(apiStatusUrl),
            fetch(apiSystemInfoUrl)
        ]);
        
        if (!statusResponse.ok) {
            throw new Error(`状态API请求失败: ${statusResponse.status} ${statusResponse.statusText}`);
        }
        
        if (!systemInfoResponse.ok) {
            throw new Error(`系统信息API请求失败: ${systemInfoResponse.status} ${systemInfoResponse.statusText}`);
        }
        
        const statusData = await statusResponse.json();
        const systemInfoData = await systemInfoResponse.json();
        
        console.log('[fetchSystemData] 状态数据:', statusData);
        console.log('[fetchSystemData] 系统信息数据:', systemInfoData);
        
        // 合并数据
        const systemInfo = {
            status: statusData.status || 'unknown',
            uptime: statusData.uptime || 0,
            cpu: parseFloat(statusData.cpu_usage) || 0,
            memory: parseFloat(statusData.memory_usage) || 0,
            profit: 0, // 从其他API获取
            monitoredTokens: 0, // 从其他API获取
            activePools: 0, // 从其他API获取
            executedTrades: 0, // 从其他API获取
            cpu_cores: systemInfoData.cpu?.cores || 0,
            cpu_model: systemInfoData.cpu?.model || '',
            totalMemory: systemInfoData.memory?.total || 0  // 新增totalMemory字段
        };
        
        // 如果API直接返回totalMemory字段，优先使用
        if (statusData.totalMemory) {
            systemInfo.totalMemory = statusData.totalMemory;
            console.log('[fetchSystemData] 直接使用API返回的totalMemory:', statusData.totalMemory);
        }
        
        // 标记为真实数据
        systemInfo.isRealData = true;
        
        // 更新系统数据
        updateDashboard(systemInfo);
        
        if (showLoading) {
            addLog('系统数据刷新完成', 'info');
        }
        
        // 更新最后更新时间
        updateLastUpdated();
    } catch (error) {
        console.error('[fetchSystemData] 获取系统数据失败:', error);
        addLog(`获取系统数据失败: ${error.message}`, 'error');
        
        // 更新最后更新时间
        updateLastUpdated();
    }
}

/**
 * 获取最近交易记录
 */
async function fetchRecentTrades() {
    console.log('[fetchRecentTrades] 开始获取交易数据');
    
    try {
        // 构建API URL
        const apiUrl = `${getApiBaseUrl()}/transactions`;
        console.log(`[fetchRecentTrades] 请求API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        let transactions = [];
        let data;
        
        try {
            data = await response.json();
            console.log('[fetchRecentTrades] 收到API响应:', data);
        } catch (parseError) {
            console.error('[fetchRecentTrades] JSON解析错误:', parseError);
            throw new Error('无法解析API响应');
        }
        
        if (!data) {
            throw new Error('API返回空数据');
        }
        // 响应本身是数组
        else if (Array.isArray(data)) {
            transactions = data;
        }
        // data字段是数组
        else if (data.data && Array.isArray(data.data)) {
            transactions = data.data;
            
            // 检查是否有交易统计信息
            if (data.stats) {
                // 更新执行交易数
                updateTransactionStats(data.stats);
            }
        }
        // data.transactions字段是数组
        else if (data.data && data.data.transactions && Array.isArray(data.data.transactions)) {
            transactions = data.data.transactions;
        }
        // 单独的transactions字段是数组
        else if (data.transactions && Array.isArray(data.transactions)) {
            transactions = data.transactions;
        }
        // 其他未知格式，抛出错误
        else {
            console.warn('[fetchRecentTrades] 未能识别的API响应格式:', data);
            throw new Error('未知的API响应格式');
        }
        
        console.log('[fetchRecentTrades] 交易数据:', transactions);
        
        // 验证和转换交易数据，确保包含所需的字段
        transactions = transactions.map(tx => {
            // 创建新对象，避免修改原始数据
            return {
                id: tx.id || '未知ID',
                pair: tx.pair || `${tx.token || '未知'}/未知`,
                amount: tx.amount !== undefined ? tx.amount : 0,
                profit: tx.profit !== undefined ? tx.profit : 0,
                time: tx.time || (tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : '未知时间'),
                status: tx.status || 'pending'
            };
        });
        
        // 取前10条记录
        const recentTrades = transactions.length > 0 
            ? (transactions.length > 10 ? transactions.slice(0, 10) : transactions)
            : [];
        
        // 更新UI
        updateTradesTable(recentTrades);
        console.log('[fetchRecentTrades] 交易数据已更新到UI');
        addLog('已加载最新交易数据', 'success');
    } catch (error) {
        console.error('[fetchRecentTrades] 错误:', error);
        addLog(`交易数据加载失败: ${error.message}`, 'error');
        // 最后的安全措施
        if (elements.tradesTableBody) {
            elements.tradesTableBody.innerHTML = '<tr><td colspan="6" class="text-center">暂无交易数据</td></tr>';
        }
    }
}

/**
 * 更新交易统计信息
 * @param {Object} stats - 交易统计信息
 */
function updateTransactionStats(stats) {
    if (!stats) return;
    
    try {
        // 获取执行交易数显示元素
        const executedTradesElement = document.querySelector('.stat-card:nth-child(6) .stat-value');
        const successRateElement = document.querySelector('.stat-card:nth-child(6) .stat-indicator');
        
        if (executedTradesElement && stats.total !== undefined) {
            executedTradesElement.textContent = formatNumber(stats.total);
        }
        
        if (successRateElement && stats.success_rate !== undefined) {
            successRateElement.innerHTML = `<i class="ri-arrow-up-line"></i> 成功率: ${stats.success_rate}%`;
        }
    } catch (error) {
        console.error('[updateTransactionStats] 更新交易统计信息失败:', error);
    }
}

/**
 * 获取最近发现的代币数据
 */
async function fetchRecentTokens() {
    try {
        console.log('[fetchRecentTokens] 开始获取代币数据');
        
        // 构建API URL
        const apiUrl = `${getApiBaseUrl()}/tokens`;
        console.log(`[fetchRecentTokens] 请求API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        let tokens = [];
        let data;
        
        try {
            data = await response.json();
            console.log('[fetchRecentTokens] 收到API响应:', data);
        } catch (parseError) {
            console.error('[fetchRecentTokens] JSON解析错误:', parseError);
            throw new Error('无法解析API响应');
        }
        
        if (!data) {
            throw new Error('API返回空数据');
        }
        // 响应本身是数组
        else if (Array.isArray(data)) {
            tokens = data;
        }
        // data字段是数组
        else if (data.data && Array.isArray(data.data)) {
            tokens = data.data;
            
            // 检查是否有代币统计信息
            if (data.stats) {
                // 更新代币统计信息
                updateTokenStats(data.stats);
            }
        }
        // data.tokens字段是数组
        else if (data.data && data.data.tokens && Array.isArray(data.data.tokens)) {
            tokens = data.data.tokens;
        }
        // 单独的tokens字段是数组
        else if (data.tokens && Array.isArray(data.tokens)) {
            tokens = data.tokens;
        }
        // 其他未知格式，抛出错误
        else {
            console.warn('[fetchRecentTokens] 未能识别的API响应格式:', data);
            throw new Error('未知的API响应格式');
        }
        
        console.log('[fetchRecentTokens] 代币数据:', tokens);
        
        // 验证tokens数组的每个元素
        tokens = tokens.filter(token => {
            // 确保是对象
            if (!token || typeof token !== 'object') {
                console.warn('[fetchRecentTokens] 跳过无效代币数据:', token);
                return false;
            }
            return true;
        }).map(token => {
            // 转换时间戳从秒到毫秒
            let processedToken = { ...token };
            
            // 时间戳处理：将discoveredAt从秒转为毫秒
            if (token.discoveredAt && typeof token.discoveredAt === 'number') {
                processedToken.discoveredAt = token.discoveredAt * 1000;
            }
            
            // 风险等级处理：将字符串风险等级转为数值
            const riskMap = { '低': 1.0, '中': 5.0, '高': 9.0 };
            if (token.risk && typeof token.risk === 'string') {
                processedToken.riskScore = riskMap[token.risk] || 0;
            }
            
            return processedToken;
        });
        
        // 按时间倒序排序（新的在前）
        tokens.sort((a, b) => {
            const dateA = a.discoveredAt ? new Date(a.discoveredAt) : new Date(0);
            const dateB = b.discoveredAt ? new Date(b.discoveredAt) : new Date(0);
            return dateB - dateA; // 降序排列（新的在前）
        });
        
        // 限制显示的数量
        const recentTokens = tokens.slice(0, 10);
        
        // 更新UI
        updateTokensTable(recentTokens);
        
        console.log('[fetchRecentTokens] 代币数据已更新到UI');
        addLog('已加载最新代币数据', 'success');
    } catch (error) {
        console.error('[fetchRecentTokens] 错误:', error);
        addLog(`代币数据加载失败: ${error.message}`, 'error');
        
        // 出错时显示错误提示
        if (elements.tokensTableBody) {
            elements.tokensTableBody.innerHTML = '<tr><td colspan="5" class="text-center">暂无代币数据</td></tr>';
        }
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
        const monitoredTokensElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
        const todayNewElement = document.querySelector('.stat-card:nth-child(4) .stat-indicator');
        
        if (monitoredTokensElement && stats.total !== undefined) {
            monitoredTokensElement.textContent = formatNumber(stats.total);
        }
        
        if (todayNewElement && stats.today_new !== undefined) {
            todayNewElement.innerHTML = `<i class="ri-arrow-up-line"></i> 今日新增: ${stats.today_new}`;
        }
    } catch (error) {
        console.error('[updateTokenStats] 更新代币统计信息失败:', error);
    }
}

/**
 * 获取利润摘要数据
 * 直接从profit/summary API获取数据
 */
async function fetchProfitSummary() {
    try {
        console.log('[fetchProfitSummary] 开始获取利润摘要数据');
        
        // 使用正确的profit/summary端点
        const apiUrl = `${getApiBaseUrl()}/profit/summary`;
        console.log(`[fetchProfitSummary] 请求API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[fetchProfitSummary] 收到API响应:', data);
        
        if (!data || !data.success) {
            throw new Error('API返回无效数据');
        }
        
        // 从API直接获取收益数据
        const profitData = data.data || {};
        
        // 获取收益值（如果不存在则默认为0）
        const totalProfit = profitData.total || 0;
        const todayProfit = profitData.today || 0;
        const weekProfit = profitData.week || 0;
        
        console.log(`[fetchProfitSummary] 收益数据: 总利润=${totalProfit}, 今日利润=${todayProfit}, 本周利润=${weekProfit}`);
        
        // 更新UI - 总利润
        const totalProfitElement = document.getElementById('totalProfit');
        if (totalProfitElement) {
            totalProfitElement.textContent = `${formatNumber(totalProfit)} SOL`;
        }
        
        // 更新UI - 今日利润
        const todayProfitElement = document.getElementById('todayProfit');
        if (todayProfitElement) {
            todayProfitElement.textContent = `${formatNumber(todayProfit)} SOL`;
        }
        
        // 更新UI - 本周利润
        const weekProfitElement = document.getElementById('weekProfit');
        if (weekProfitElement) {
            weekProfitElement.textContent = `${formatNumber(weekProfit)} SOL`;
        }
        
        console.log('[fetchProfitSummary] 利润数据已更新');
        addLog('已加载最新利润数据', 'success');
    } catch (error) {
        console.error('[fetchProfitSummary] 错误:', error);
        addLog(`利润数据加载失败: ${error.message}`, 'warning');
        
        // 出错时设置为0
        const totalProfitElement = document.getElementById('totalProfit');
        if (totalProfitElement) {
            totalProfitElement.textContent = '0 SOL';
        }
        
        const todayProfitElement = document.getElementById('todayProfit');
        if (todayProfitElement) {
            todayProfitElement.textContent = '0 SOL';
        }
        
        const weekProfitElement = document.getElementById('weekProfit');
        if (weekProfitElement) {
            weekProfitElement.textContent = '0 SOL';
        }
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
    const mockPrefix = systemData.isRealData === false ? '【M】' : '';
    
    // 更新状态指标
    if (elements.cpuUsage) {
        elements.cpuUsage.textContent = `${mockPrefix}${systemData.cpu.toFixed(1)}%`;
    }
    if (elements.cpuBar) {
        elements.cpuBar.style.width = `${systemData.cpu}%`;
    }
    
    // 更新CPU核心数
    if (elements.cpuCores) {
        try {
            // 优先使用API返回的cpu_cores字段
            if (systemData.cpu_cores !== undefined) {
                elements.cpuCores.textContent = `${mockPrefix}${systemData.cpu_cores}核心`;
                console.log('[updateDashboard] 显示真实CPU核心数:', systemData.cpu_cores);
            } 
            // 如果有CPU型号信息，显示型号和核心数
            else if (systemData.cpu_model) {
                elements.cpuCores.textContent = `${mockPrefix}${systemData.cpu_model}`;
                console.log('[updateDashboard] 显示CPU型号:', systemData.cpu_model);
            }
            // 保持默认显示
        } catch (error) {
            console.error('[updateDashboard] 更新CPU核心信息出错:', error);
        }
    }
    
    if (elements.memoryUsage) {
        elements.memoryUsage.textContent = `${mockPrefix}${systemData.memory.toFixed(1)}%`;
    }
    if (elements.memoryBar) {
        elements.memoryBar.style.width = `${systemData.memory}%`;
    }
    // 更新总内存信息
    if (elements.memoryTotal) {
        try {
            // 优先使用API返回的totalMemory字段
            if (systemData.totalMemory) {
                elements.memoryTotal.textContent = `${mockPrefix}${systemData.totalMemory}`;
                console.log('[updateDashboard] 显示总内存:', systemData.totalMemory);
            } else {
                elements.memoryTotal.textContent = '内存'; // 默认显示
            }
        } catch (error) {
            console.error('[updateDashboard] 更新总内存信息出错:', error);
        }
    }
    
    // 更新运行时间 - 优化处理各种格式的uptime
    if (elements.uptime) {
        try {
            elements.uptime.textContent = `${mockPrefix}${formatUptime(systemData.uptime)}`;
            console.log('[updateDashboard] 成功格式化并显示uptime:', systemData.uptime);
        } catch (error) {
            console.error('[updateDashboard] 格式化uptime时出错:', error);
            // 显示原始数据，避免界面显示出错
            elements.uptime.textContent = `${mockPrefix}${systemData.uptime || '未知'}`;
        }
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
    updateCharts(systemData);
}

/**
 * 更新系统状态图表数据
 * @param {Object} systemData 系统数据
 */
function updateCharts(systemData) {
    try {
        console.log('[updateCharts] 开始更新图表数据', systemData);
        
        // 更新代币发现趋势图
        try {
            console.log('[updateCharts] 更新代币发现趋势图', systemData.tokenDiscoveryTrend);
            
            let labels = [];
            let data = [];
            
            // 处理API返回的代币趋势数据（确保适应不同格式）
            if (systemData.tokenDiscoveryTrend && Array.isArray(systemData.tokenDiscoveryTrend) && systemData.tokenDiscoveryTrend.length > 0) {
                // 第一种格式: [{hour: '00', count: 5}, {hour: '01', count: 8}, ...]
                if ('hour' in systemData.tokenDiscoveryTrend[0]) {
                    labels = systemData.tokenDiscoveryTrend.map(item => item.hour);
                    data = systemData.tokenDiscoveryTrend.map(item => item.count);
                }
                // 第二种格式: [{x: '00', y: 5}, {x: '01', y: 8}, ...]
                else if ('x' in systemData.tokenDiscoveryTrend[0]) {
                    labels = systemData.tokenDiscoveryTrend.map(item => item.x);
                    data = systemData.tokenDiscoveryTrend.map(item => item.y);
                }
            } 
            // 如果没有有效数据，保持图表当前数据不变
            
            if (labels.length > 0 && data.length > 0) {
                console.log('[updateCharts] 处理后的标签和数据:', labels, data);
                
                if (charts.tokenDiscoveryChart) {
                    charts.tokenDiscoveryChart.data.labels = labels;
                    charts.tokenDiscoveryChart.data.datasets[0].data = data;
                    charts.tokenDiscoveryChart.update();
                    console.log('[updateCharts] 代币发现趋势图更新成功');
                } else {
                    console.error('[updateCharts] 代币发现趋势图未初始化，尝试重新初始化');
                    initCharts(); // 如果图表不存在则重新初始化
                }
            } else {
                console.log('[updateCharts] 代币发现趋势图数据为空，保持当前显示');
            }
        } catch (tokenChartError) {
            console.error('[updateCharts] 更新代币趋势图失败:', tokenChartError);
        }
        
        // 更新利润趋势图
        try {
            console.log('[updateCharts] 更新利润趋势图', systemData.profitTrend);
            
            let labels = [];
            let data = [];
            
            // 处理API返回的利润趋势数据（确保适应不同格式）
            if (systemData.profitTrend && Array.isArray(systemData.profitTrend) && systemData.profitTrend.length > 0) {
                // 第一种格式: [{date: '周一', value: 0.3}, {date: '周二', value: 0.5}, ...]
                if ('date' in systemData.profitTrend[0]) {
                    labels = systemData.profitTrend.map(item => item.date);
                    data = systemData.profitTrend.map(item => item.value);
                }
                // 第二种格式: [{x: '周一', y: 0.3}, {x: '周二', y: 0.5}, ...]
                else if ('x' in systemData.profitTrend[0]) {
                    labels = systemData.profitTrend.map(item => item.x);
                    data = systemData.profitTrend.map(item => item.y);
                }
            }
            // 如果没有有效数据，保持图表当前数据不变
            
            if (labels.length > 0 && data.length > 0) {
                console.log('[updateCharts] 处理后的标签和数据:', labels, data);
                
                if (charts.profitTrendChart) {
                    charts.profitTrendChart.data.labels = labels;
                    charts.profitTrendChart.data.datasets[0].data = data;
                    charts.profitTrendChart.update();
                    console.log('[updateCharts] 利润趋势图更新成功');
                } else {
                    console.error('[updateCharts] 利润趋势图未初始化，尝试重新初始化');
                    initCharts(); // 如果图表不存在则重新初始化
                }
            } else {
                console.log('[updateCharts] 利润趋势图数据为空，保持当前显示');
            }
        } catch (profitChartError) {
            console.error('[updateCharts] 更新利润趋势图失败:', profitChartError);
        }
    } catch (error) {
        console.error('[updateCharts] 更新图表失败:', error);
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
        
        // 确保所有必要的属性都存在，设置默认值
        const id = trade.id || '未知交易ID';
        const pair = trade.pair || '未知交易对';
        const amount = trade.amount !== undefined ? trade.amount : '0';
        const profit = trade.profit !== undefined ? trade.profit : '0';
        const time = trade.time || '未知时间';
        const status = trade.status || 'pending';
        
        // 设置状态类名
        let statusClass = '';
        switch (status) {
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
            <td>${id}</td>
            <td>${pair}</td>
            <td>${amount}</td>
            <td>${profit}</td>
            <td>${time}</td>
            <td class="${statusClass}">${formatStatus(status)}</td>
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
        // 确保riskScore存在
        const riskScore = token.riskScore !== undefined ? token.riskScore : 0;
        
        if (riskScore < 3) {
            riskClass = 'text-success';
        } else if (riskScore < 7) {
            riskClass = 'text-warning';
        } else {
            riskClass = 'text-error';
        }
        
        // 确保所有必要的属性都存在
        const name = token.name || '未知代币';
        const address = token.address || '地址未知';
        const discoveredAt = token.discoveredAt || new Date().toISOString();
        // 确保liquidity有效，否则传递0给formatNumber
        const liquidity = token.liquidity !== undefined && token.liquidity !== null && !Number.isNaN(Number(token.liquidity)) 
            ? token.liquidity 
            : 0;
        
        // 获取风险等级文本
        let riskText = '';
        if (riskScore < 3) {
            riskText = '低';
        } else if (riskScore < 7) {
            riskText = '中';
        } else {
            riskText = '高';
        }
        
        // 如果API返回了原始的风险等级文本，优先使用
        if (token.risk && typeof token.risk === 'string') {
            riskText = token.risk;
        }
        
        row.innerHTML = `
            <td>${name}</td>
            <td>${formatAddress(address)}</td>
            <td>${formatDateTime(discoveredAt)}</td>
            <td>$${formatNumber(liquidity)}</td>
            <td class="${riskClass}">${riskScore.toFixed(1)} ${riskText}</td>
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
 * 格式化数字（添加千位分隔符）
 * @param {number} number - 需要格式化的数字
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字
 */
function formatNumber(number, decimals = 0) {
    // 检查是否为undefined或非数字
    if (number === undefined || number === null || isNaN(number)) {
        console.warn('[formatNumber] 接收到无效数字:', number);
        return '0'; // 返回默认值
    }
    
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
