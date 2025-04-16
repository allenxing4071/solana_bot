/**
 * 环境配置文件
 * 初始化并标准化环境设置
 */

// 确保环境变量对象存在
window.ENV = window.ENV || {};

// 合并默认设置到现有环境配置中（保留已存在的值）
window.ENV = Object.assign({
    // API相关配置
    API_URL: 'http://localhost:8080',     // API完整URL（包含端口）
    API_PORT: '',                         // 额外的API端口（如果URL中已包含端口则留空）
    
    // 环境设置
    ENVIRONMENT: 'development',           // 环境类型 (development/production)
    USE_MOCK_DATA: false,                 // 是否使用模拟数据
    DEBUG_MODE: true,                     // 调试模式
    SHOW_LOGS: true                       // 是否显示日志
}, window.ENV);

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
window.getApiBaseUrl = function() {
    // 首先使用配置的API_URL
    let baseUrl = window.ENV.API_URL || '';
    
    // 如果URL不以http开头并且不是绝对路径，则添加当前域名
    if (!baseUrl.startsWith('http') && !baseUrl.startsWith('/')) {
        baseUrl = '/' + baseUrl;
    }
    
    if (!baseUrl.startsWith('http')) {
        baseUrl = window.location.origin + baseUrl;
    }
    
    // 添加端口（如果指定了额外端口且URL中不包含端口）
    if (window.ENV.API_PORT && !baseUrl.match(/:\d+/)) {
        baseUrl = baseUrl.replace(/\/$/, '') + ':' + window.ENV.API_PORT;
    }
    
    return baseUrl;
};

// 为了避免命名冲突，将函数暴露到另一个名称
window.utilsGetApiBaseUrl = window.getApiBaseUrl;

// 打印环境信息
if (window.ENV.DEBUG_MODE) {
    console.log('%c[环境配置]', 'color: blue; font-weight: bold', '初始化完成');
    console.log('环境：', window.ENV.ENVIRONMENT);
    console.log('API基础URL：', window.getApiBaseUrl());
    console.log('使用模拟数据：', window.ENV.USE_MOCK_DATA ? '是' : '否');
    console.log('调试模式：', window.ENV.DEBUG_MODE ? '启用' : '禁用');
} 