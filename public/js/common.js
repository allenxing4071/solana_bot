/**
 * 通用功能模块
 * 提供所有页面共用的功能
 */

// 全局环境配置
window.AppConfig = {
    // 环境设置 (development/production)
    environment: 'development',
    
    // API设置
    api: {
        baseUrl: '',
        timeout: 15000,
        retries: 2
    },
    
    // 数据源设置
    dataSource: {
        useMockData: false,  // 是否使用模拟数据
        supportsPagination: true, // API是否支持分页
        supportsSearch: true, // API是否支持搜索和过滤
    },
    
    // UI设置
    ui: {
        defaultTheme: 'dark',
        animationsEnabled: true,
        toastDuration: 3000
    }
};

// 初始化应用配置
(function initAppConfig() {
    try {
        // 尝试读取环境变量或配置
        const envConfigElement = document.getElementById('env-config');
        if (envConfigElement) {
            const envConfig = JSON.parse(envConfigElement.textContent);
            if (envConfig) {
                // 递归合并配置对象
                mergeConfigs(window.AppConfig, envConfig);
                console.log('已加载环境配置');
            }
        }
        
        // 尝试从sessionStorage加载配置（如果通过URL或API设置）
        const storedConfig = sessionStorage.getItem('app-config');
        if (storedConfig) {
            try {
                const parsedConfig = JSON.parse(storedConfig);
                mergeConfigs(window.AppConfig, parsedConfig);
                console.log('已加载会话配置');
            } catch (e) {
                console.warn('解析会话配置失败:', e);
            }
        }
        
        // 设置全局变量以兼容现有代码
        window.apiSupportsSearchAndFilter = window.AppConfig.dataSource.supportsSearch;
        window.usingMockData = window.AppConfig.dataSource.useMockData;
        
        console.log('应用配置初始化完成:', window.AppConfig);
    } catch (error) {
        console.error('初始化应用配置失败:', error);
    }
})();

/**
 * 递归合并配置对象
 * @param {Object} target 目标对象 
 * @param {Object} source 源对象
 */
function mergeConfigs(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                // 如果是对象，递归合并
                if (!target[key]) target[key] = {};
                mergeConfigs(target[key], source[key]);
            } else {
                // 否则直接赋值
                target[key] = source[key];
            }
        }
    }
}

/**
 * 获取数据源
 * 统一处理真实数据与模拟数据
 * @param {string} endpoint API端点 
 * @param {Object} options 选项
 * @param {Function} mockDataGenerator 模拟数据生成函数
 * @param {number} mockCount 模拟数据数量
 * @returns {Promise<Object>} 响应数据
 */
async function getDataSource(endpoint, options = {}, mockDataGenerator = null, mockCount = 50) {
    try {
        // 如果配置为使用模拟数据，并且提供了模拟数据生成器
        if (window.AppConfig.dataSource.useMockData && typeof mockDataGenerator === 'function') {
            console.info(`使用模拟数据: ${endpoint}`);
            
            // 生成模拟数据
            const mockData = mockDataGenerator(mockCount);
            
            // 如果需要模拟分页
            if (options.page && options.limit && window.AppConfig.dataSource.supportsPagination) {
                const page = options.page || 1;
                const limit = options.limit || 20;
                const totalItems = mockData.length;
                const totalPages = Math.ceil(totalItems / limit);
                
                // 计算分页
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedData = mockData.slice(startIndex, endIndex);
                
                // 模拟API响应结构
                return {
                    success: true,
                    data: paginatedData,
                    count: totalItems,
                    page: page,
                    totalPages: totalPages,
                    limit: limit
                };
            }
            
            // 不需要分页，返回全部模拟数据
            return {
                success: true,
                data: mockData,
                count: mockData.length,
                page: 1,
                totalPages: 1,
                limit: mockData.length
            };
        }
        
        // 使用真实API
        console.info(`请求真实API数据: ${endpoint}`);
        return await apiRequest(endpoint, options);
    } catch (error) {
        console.error('获取数据源失败:', error);
        
        // 如果API请求失败，并且有模拟数据生成器，使用模拟数据作为后备
        if (typeof mockDataGenerator === 'function') {
            console.warn('使用模拟数据作为后备');
            const mockData = mockDataGenerator(mockCount);
            
            return {
                success: true,
                data: mockData,
                count: mockData.length,
                page: 1,
                totalPages: 1,
                limit: mockData.length,
                isBackupData: true
            };
        }
        
        // 如果没有模拟数据生成器，继续抛出错误
        throw error;
    }
}

/**
 * 显示加载状态
 * @param {HTMLElement|string} container 显示加载状态的容器元素或ID
 */
function showLoading(container) {
    // 如果输入是字符串（ID），获取对应元素
    const targetContainer = typeof container === 'string' 
        ? document.getElementById(container) || document.querySelector(container)
        : container;
    
    // 如果未找到容器，使用body
    const containerElement = targetContainer || document.body;
    
    // 创建加载覆盖层
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.id = 'loadingOverlay';
    
    // 创建加载动画
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingOverlay.appendChild(spinner);
    
    // 设置容器相对定位（如果尚未设置）
    if (getComputedStyle(containerElement).position === 'static') {
        containerElement.style.position = 'relative';
    }
    
    // 添加到容器
    containerElement.appendChild(loadingOverlay);
}

/**
 * 隐藏加载状态
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * 显示错误提示
 * @param {string} message 错误信息
 * @param {string} title 错误标题
 */
function showError(message, title = '错误') {
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-title">${title}</div>
        <div class="error-content">${message}</div>
        <button class="error-close">×</button>
    `;
    
    // 添加到页面
    document.body.appendChild(errorDiv);
    
    // 添加关闭按钮事件
    const closeBtn = errorDiv.querySelector('.error-close');
    closeBtn.addEventListener('click', () => {
        errorDiv.remove();
    });
    
    // 3秒后自动消失
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            errorDiv.remove();
        }
    }, 3000);
}

/**
 * 显示成功提示
 * @param {string} message 成功信息
 */
function showSuccess(message) {
    // 创建成功提示元素
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <div class="success-content">${message}</div>
        <button class="success-close">×</button>
    `;
    
    // 添加到页面
    document.body.appendChild(successDiv);
    
    // 添加关闭按钮事件
    const closeBtn = successDiv.querySelector('.success-close');
    closeBtn.addEventListener('click', () => {
        successDiv.remove();
    });
    
    // 2秒后自动消失
    setTimeout(() => {
        if (document.body.contains(successDiv)) {
            successDiv.remove();
        }
    }, 2000);
}

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间（毫秒）
 */
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

/**
 * 更新分页信息
 * @param {number} page 当前页码
 * @param {number} totalPages 总页数
 * @param {number} totalItems 总项目数
 * @param {string} containerSelector 分页容器选择器
 */
function updatePaginationInfo(page, totalPages, totalItems, containerSelector = '.pagination') {
    const paginationContainer = document.querySelector(containerSelector);
    if (!paginationContainer) return;
    
    const paginationInfo = paginationContainer.querySelector('span');
    if (paginationInfo) {
        paginationInfo.textContent = `第 ${page} 页，共 ${totalPages} 页 (${totalItems} 个结果)`;
    }
    
    // 更新翻页按钮状态
    const prevPageBtn = paginationContainer.querySelector('button:first-child');
    const nextPageBtn = paginationContainer.querySelector('button:last-child');
    
    if (prevPageBtn) {
        prevPageBtn.disabled = page <= 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = page >= totalPages;
    }
}

/**
 * 格式化日期时间
 * @param {Date|number|string} date 日期对象、时间戳或日期字符串
 * @param {boolean} includeTime 是否包含时间
 * @returns {string} 格式化后的日期时间
 */
function formatDateTime(date, includeTime = true) {
    if (!date) return '';
    
    // 转换为Date对象
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    // 如果日期无效
    if (isNaN(date.getTime())) {
        return '';
    }
    
    // 格式化日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (!includeTime) {
        return `${year}-${month}-${day}`;
    }
    
    // 格式化时间
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化货币金额
 * @param {number} amount 金额
 * @param {string} currency 货币符号，如$、₿、SOL等
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的金额
 */
function formatCurrency(amount, currency = '$', decimals = 2) {
    if (amount === undefined || amount === null || isNaN(amount)) {
        return `${currency}0.00`;
    }
    
    return `${currency}${Number(amount).toFixed(decimals)}`;
}

/**
 * 截断地址并格式化显示
 * @param {string} address 地址
 * @param {number} start 开头保留的字符数
 * @param {number} end 结尾保留的字符数
 * @returns {string} 格式化后的地址
 */
function formatAddress(address, start = 6, end = 4) {
    if (!address || address.length <= start + end) {
        return address || '';
    }
    
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

/**
 * 切换显示元素
 * @param {string|HTMLElement} selector 元素选择器或元素
 * @param {boolean} show 是否显示
 */
function toggleElement(selector, show) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!element) return;
    
    element.style.display = show ? '' : 'none';
}

/**
 * 设置API服务器基础URL
 * @param {string} baseUrl 基础URL
 */
function setApiBaseUrl(baseUrl) {
    window.apiBaseUrl = baseUrl || '';
}

/**
 * 获取完整的API URL
 * @param {string} endpoint API端点
 * @returns {string} 完整的API URL
 */
function getApiUrl(endpoint) {
    const baseUrl = window.apiBaseUrl || '';
    
    // 如果端点已经是完整的URL，直接返回
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        return endpoint;
    }
    
    // 确保端点以/开头
    if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
    }
    
    return baseUrl + endpoint;
}

/**
 * 发送API请求
 * @param {string} endpoint API端点
 * @param {Object} options 请求选项
 * @returns {Promise<Object>} 响应数据
 */
async function apiRequest(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    
    try {
        const response = await fetch(url, options);
        
        // 检查HTTP状态
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败(${response.status}): ${errorText}`);
        }
        
        // 尝试解析为JSON
        try {
            const data = await response.json();
            return data;
        } catch (parseError) {
            throw new Error('无法解析响应数据: ' + parseError.message);
        }
    } catch (error) {
        console.error('API请求出错:', error);
        throw error;
    }
} 