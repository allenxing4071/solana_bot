/**
 * API服务器启动脚本
 */
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const dotenv = require('dotenv');

// 加载环境配置
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// 覆盖某些环境变量
process.env.API_PORT = process.env.API_PORT || '3000';
process.env.SERVICE_PORT = process.env.SERVICE_PORT || '8080';

// 运行API服务器
const apiServer = require('./dist/api/server').default;
const poolMonitor = require('./dist/modules/listener/pool_monitor').default;

console.log(`Starting API server in ${env} mode...`);

// 启动pool监控器，然后启动API服务器
async function main() {
  try {
    // 先启动pool监控器
    console.log('启动流动性池监控器...');
    await poolMonitor.start();
    console.log('流动性池监控器启动成功');
    
    // 然后启动API服务器
    console.log(`启动API服务器，监听端口: ${process.env.API_PORT}...`);
    await apiServer.start();
    console.log(`API服务器已启动，正在监听端口: ${process.env.API_PORT}`);
    
    // 设置进程终止处理
    process.on('SIGINT', async () => {
      console.log('正在关闭服务...');
      try {
        await poolMonitor.stop();
        await apiServer.stop();
        console.log('服务已安全关闭。');
        process.exit(0);
      } catch (error) {
        console.error('关闭服务时出错:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('启动服务失败:', error);
    process.exit(1);
  }
}

// 启动主程序
main();