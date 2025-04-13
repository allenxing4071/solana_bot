/**
 * 服务器目录结构查看脚本
 * 连接服务器并列出后端目录结构
 */

// 导入必要的模块
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('ssh2');
const dotenv = require('dotenv');

// 加载.env文件
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// 提取SSH配置参数
const sshConfig = {
  host: process.env.SSH_HOST || '18.215.154.7',
  username: process.env.SSH_USER || 'ubuntu',
  port: Number.parseInt(process.env.SSH_PORT || '22', 10),
  privateKey: fs.readFileSync(path.resolve(process.cwd(), process.env.SSH_KEY_PATH || 'sol-bot-key.pem')),
  readyTimeout: Number.parseInt(process.env.SSH_TIMEOUT || '10000', 10)
};

// 需要检查的目录列表
const directoriesToCheck = [
  '/home/ubuntu',                  // 用户主目录
  '/var/www',                      // Web应用常见目录
  '/opt',                          // 可选应用程序包目录
  '/srv',                          // 服务数据目录
  '/home/ubuntu/solana-mevbot',    // 可能的项目目录
  '/home/ubuntu/app',              // 可能的应用目录
];

// 创建日志记录函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * 连接SSH并获取目录结构
 */
function connectAndListDirectories() {
  const conn = new Client();
  
  // 连接错误处理
  conn.on('error', (err) => {
    console.error(`SSH连接错误: ${err.message}`);
    process.exit(1);
  });
  
  // 准备好连接
  conn.on('ready', () => {
    log(`成功连接到服务器 ${sshConfig.host}`);
    listDirectories(conn);
  });
  
  // 连接到服务器
  try {
    log(`正在连接服务器 ${sshConfig.host}:${sshConfig.port}...`);
    conn.connect(sshConfig);
  } catch (error) {
    console.error(`SSH连接失败: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 列出目录结构
 * @param {Client} conn - SSH连接客户端
 */
function listDirectories(conn) {
  let completedChecks = 0;
  
  // 列出用户主目录内容（更详细）
  conn.exec('ls -la /home/ubuntu', (err, stream) => {
    if (err) {
      console.error(`无法执行命令: ${err.message}`);
      return;
    }
    
    console.log('\n========== 用户主目录内容 ==========');
    
    let data = '';
    stream.on('data', (chunk) => {
      data += chunk.toString();
    });
    
    stream.on('close', () => {
      console.log(data);
      
      // 查找项目根目录
      conn.exec('find /home/ubuntu -maxdepth 2 -type d -name "solana*" -o -name "mev*"', (err, stream) => {
        if (err) {
          console.error(`无法搜索项目目录: ${err.message}`);
          return;
        }
        
        console.log('\n========== 可能的项目目录 ==========');
        
        let projectData = '';
        stream.on('data', (chunk) => {
          projectData += chunk.toString();
        });
        
        stream.on('close', () => {
          console.log(projectData || '未找到明显的项目目录');
          
          // 如果找到了项目目录，检查内部结构
          if (projectData.trim()) {
            const projectDir = projectData.trim().split('\n')[0];
            
            conn.exec(`ls -la ${projectDir}`, (err, stream) => {
              if (err) {
                console.error(`无法列出项目目录: ${err.message}`);
                return;
              }
              
              console.log(`\n========== 项目目录内容 (${projectDir}) ==========`);
              
              let dirData = '';
              stream.on('data', (chunk) => {
                dirData += chunk.toString();
              });
              
              stream.on('close', () => {
                console.log(dirData);
                conn.end();
              });
            });
          } else {
            // 检查Web目录
            conn.exec('ls -la /var/www 2>/dev/null || echo "目录不存在或无权访问"', (err, stream) => {
              if (err) {
                console.error(`无法列出Web目录: ${err.message}`);
                return;
              }
              
              console.log('\n========== Web目录内容 ==========');
              
              let webData = '';
              stream.on('data', (chunk) => {
                webData += chunk.toString();
              });
              
              stream.on('close', () => {
                console.log(webData);
                conn.end();
              });
            });
          }
        });
      });
    });
  });
}

// 执行连接和目录检查
connectAndListDirectories(); 