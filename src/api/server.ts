/**
 * API服务器模块
 * 提供HTTP接口管理黑名单和白名单
 */

import express from 'express';
import cors from 'cors';
import logger from '../core/logger';
import tokenRoutes from './routes/token_routes';
import systemRoutes from './routes/system_routes';
import poolRoutes from './routes/pool_routes';
import transactionRoutes from './routes/transaction_routes';
import settingsRoutes from './routes/settings_routes';

// 模块名称
const MODULE_NAME = 'ApiServer';

// 默认API端口
const DEFAULT_PORT = 3000;

/**
 * API服务器类
 * 提供HTTP接口，允许管理黑名单和白名单
 */
class ApiServer {
  private app: express.Application;
  private port: number;
  private server: ReturnType<express.Application['listen']> | null = null;
  private isRunning = false;

  /**
   * 构造函数
   * @param port 服务器端口
   */
  constructor(port: number = DEFAULT_PORT) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 使用JSON解析器
    this.app.use(express.json());
    
    // 启用CORS - 增强CORS配置
    this.app.use(cors({
      origin: '*', // 允许所有来源
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // 提供静态文件
    this.app.use(express.static('public'));
    
    // 请求日志中间件
    this.app.use((req, _res, next) => {
      logger.debug(`API请求: ${req.method} ${req.path}`, MODULE_NAME, {
        ip: req.ip,
        query: req.query,
        params: req.params
      });
      next();
    });
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查路由
    this.app.get('/api/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    });
    
    // 使用代币路由模块处理所有代币相关请求
    this.app.use('/api/tokens', tokenRoutes);
    
    // 使用系统路由模块处理系统相关请求
    this.app.use('/api/system', systemRoutes);
    
    // 使用池路由模块处理池相关请求
    this.app.use('/api/pools', poolRoutes);
    
    // 使用交易路由模块处理交易相关请求
    this.app.use('/api/transactions', transactionRoutes);
    
    // 使用设置路由模块处理设置相关请求
    this.app.use('/api/settings', settingsRoutes);
    
    // 增加根路由，提供前端页面
    this.app.get('/', (_req, res) => {
      res.sendFile('index.html', { root: 'public' });
    });
    
    // 错误处理中间件
    this.app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('API错误', MODULE_NAME, { error: err.message, stack: err.stack });
      res.status(500).json({
        error: {
          message: err.message || '服务器内部错误'
        }
      });
    });
  }

  /**
   * 启动服务器
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isRunning) {
        logger.warn('API服务器已经在运行', MODULE_NAME);
        return resolve();
      }
      
      try {
        this.server = this.app.listen(this.port, () => {
          this.isRunning = true;
          logger.info(`API服务器已启动，监听端口 ${this.port}`, MODULE_NAME);
          resolve();
        });
        
        // 处理错误
        this.server.on('error', (error: NodeJS.ErrnoException) => {
          if (error.code === 'EADDRINUSE') {
            logger.error(`端口 ${this.port} 已被占用`, MODULE_NAME);
          } else {
            logger.error('启动API服务器时出错', MODULE_NAME, {
              error: error.message, 
              code: error.code
            });
          }
          this.isRunning = false;
          reject(error);
        });
      } catch (error) {
        logger.error('启动API服务器时出错', MODULE_NAME, { 
          error: error instanceof Error ? error.message : String(error) 
        });
        this.isRunning = false;
        reject(error);
      }
    });
  }

  /**
   * 停止服务器
   */
  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRunning || !this.server) {
        logger.warn('API服务器未运行', MODULE_NAME);
        return resolve();
      }
      
      this.server.close((error) => {
        if (error) {
          logger.error('关闭API服务器时出错', MODULE_NAME, { 
            error: error.message 
          });
          reject(error);
        } else {
          logger.info('API服务器已关闭', MODULE_NAME);
          this.isRunning = false;
          resolve();
        }
      });
    });
  }

  /**
   * 检查服务器是否正在运行
   * @returns 服务器是否正在运行
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }
}

// 创建并导出单例
const apiServer = new ApiServer(
  Number.parseInt(process.env.API_PORT || '3000') || DEFAULT_PORT
);

export default apiServer;

// 如果直接运行此文件，则启动服务器
if (require.main === module) {
  apiServer.start()
    .then(() => {
      console.log(`API服务器已启动，监听端口 ${process.env.API_PORT || 3000}`);
    })
    .catch(error => {
      console.error('启动API服务器失败:', error);
      process.exit(1);
    });
}