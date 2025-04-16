/**
 * API服务器模块
 * 提供HTTP接口管理黑名单和白名单
 */
/**
 * API服务器类
 * 提供HTTP接口，允许管理黑名单和白名单
 */
declare class ApiServer {
    private app;
    private port;
    private server;
    private isRunning;
    /**
     * 构造函数
     * @param port 服务器端口
     */
    constructor(port?: number);
    /**
     * 设置中间件
     */
    private setupMiddleware;
    /**
     * 设置路由
     */
    private setupRoutes;
    /**
     * 设置模拟数据路由
     * 这些路由仅用于API监控页面显示，提供示例数据
     */
    private setupMockDataRoutes;
    /**
     * 启动服务器
     */
    start(): Promise<void>;
    /**
     * 停止服务器
     */
    stop(): Promise<void>;
    /**
     * 检查服务器是否正在运行
     * @returns 服务器是否正在运行
     */
    isServerRunning(): boolean;
}
declare const apiServer: ApiServer;
export default apiServer;
