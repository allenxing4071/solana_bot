/**
 * 环境配置文件
 * 初始化并标准化环境设置
 */

// 确保环境变量对象存在
window.ENV = window.ENV || {};

// 初始化默认环境设置
window.ENV = {
    // API相关配置
    API_URL: 'http://localhost',          // API基本URL
    API_PORT: '8080',                     // API端口
    API_PREFIX: '/api',                   // API路径前缀
    
    // 环境设置
    ENVIRONMENT: 'development',           // 环境类型 (development/production)
    USE_MOCK_DATA: false,                 // 是否使用模拟数据
    DEBUG_MODE: true,                     // 调试模式
    SHOW_LOGS: true                       // 是否显示日志
};

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
window.getApiBaseUrl = function() {
    // 组合API基础URL
    let baseUrl = window.ENV.API_URL;
    
    // 添加端口（如果存在）
    if (window.ENV.API_PORT) {
        baseUrl = baseUrl.replace(/\/$/, '') + ':' + window.ENV.API_PORT;
    }
    
    // 添加API前缀（如果存在并且baseUrl不以之结尾）
    if (window.ENV.API_PREFIX && !baseUrl.endsWith(window.ENV.API_PREFIX)) {
        baseUrl = baseUrl.replace(/\/$/, '') + window.ENV.API_PREFIX;
    }
    
    return baseUrl;
};

// 为了避免命名冲突，将函数暴露到另一个名称
window.utilsGetApiBaseUrl = window.getApiBaseUrl;

// 打印环境信息
if (window.ENV.DEBUG_MODE) {
    console.log('[环境配置] 初始化完成：', window.ENV);
    console.log('[环境配置] API基础URL：', window.getApiBaseUrl());
} 