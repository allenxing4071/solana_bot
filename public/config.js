/**
 * 全局配置文件
 * 将此文件加载在所有页面之前，用于配置应用程序环境
 */
const AppEnvironmentConfig = {
    // 应用环境 (development/testing/production)
    environment: 'production',
    
    // API设置
    api: {
        baseUrl: '',
        timeout: 15000,
        retries: 2
    },
    
    // 数据源设置 - ⚠️ 这里可以根据环境修改
    dataSource: {
        useMockData: false,  // 是否使用模拟数据
        supportsPagination: true, // API是否支持分页和过滤
        supportsSearch: true, // API是否支持搜索和过滤
    },
    
    // UI设置
    ui: {
        defaultTheme: 'dark',
        animationsEnabled: true,
        toastDuration: 3000
    },
    
    // 日志设置
    logging: {
        level: 'debug', // 日志级别 (debug, info, warn, error)
        enableConsole: true, // 是否在控制台输出日志
        enableRemote: false, // 是否发送日志到远程服务器
    }
}; 