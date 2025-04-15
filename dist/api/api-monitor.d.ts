/**
 * API监控页面路由
 * 为API服务器添加API监控界面路由
 */
import type { Application } from 'express';
/**
 * 设置API监控路由
 * @param app - Express应用实例
 */
declare function setupAPIMonitorRoute(app: Application): void;
export default setupAPIMonitorRoute;
