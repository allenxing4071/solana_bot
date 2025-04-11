/**
 * 生产环境配置文件
 * 将此文件重命名为config.js并部署到生产环境
 */
const AppEnvironmentConfig = {
    // 应用环境 (production)
    environment: 'production',
    
    // API设置
    api: {
        baseUrl: 'https://api.example.com', // 修改为实际的API服务器地址
        timeout: 30000, // 生产环境可以设置更长的超时时间
        retries: 2
    },
    
    // 数据源设置 - 生产环境只使用真实数据
    dataSource: {
        useMockData: false,  // 生产环境禁用模拟数据
        supportsPagination: true,
        supportsSearch: true,
    },
    
    // UI设置
    ui: {
        defaultTheme: 'dark',
        animationsEnabled: true,
        toastDuration: 3000
    },
    
    // 日志设置 - 生产环境减少日志输出
    logging: {
        level: 'error', // 仅记录错误
        enableConsole: true, // 保留控制台日志用于故障排查
        enableRemote: true, // 启用远程日志上报
        remoteEndpoint: 'https://logs.example.com/collect' // 日志收集端点
    }
}; 