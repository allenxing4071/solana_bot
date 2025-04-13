/**
 * SSH连接脚本
 * 读取.env配置文件并连接到远程服务器
 */

// 导入必要的模块
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('ssh2');
const dotenv = require('dotenv');
const readline = require('node:readline');

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

// 创建日志记录函数
function logMessage(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logEntry);
  
  // 如果配置了日志文件，则写入日志
  if (process.env.SSH_LOG_FILE) {
    fs.appendFileSync(
      path.resolve(process.cwd(), process.env.SSH_LOG_FILE),
      `${logEntry}\n`,
      { flag: 'a' }
    );
  }
}

// 创建交互式命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 连接SSH服务器
 */
function connectSSH() {
  const conn = new Client();
  
  // 连接错误处理
  conn.on('error', (err) => {
    logMessage(`SSH连接错误: ${err.message}`, 'error');
    process.exit(1);
  });
  
  // 准备好连接
  conn.on('ready', () => {
    logMessage(`成功连接到服务器 ${sshConfig.host}`);
    startInteractiveShell(conn);
  });
  
  // 连接到服务器
  try {
    logMessage(`正在连接服务器 ${sshConfig.host}:${sshConfig.port}...`);
    conn.connect(sshConfig);
  } catch (error) {
    logMessage(`SSH连接失败: ${error.message}`, 'error');
    process.exit(1);
  }
}

/**
 * 启动交互式命令行
 * @param {Client} conn - SSH连接客户端
 */
function startInteractiveShell(conn) {
  logMessage('SSH连接已建立，输入命令执行，输入 exit 退出');
  
  // 打开shell会话
  conn.shell((err, stream) => {
    if (err) {
      logMessage(`无法打开Shell会话: ${err.message}`, 'error');
      conn.end();
      process.exit(1);
      return;
    }
    
    // 显示输出
    stream.on('data', (data) => {
      process.stdout.write(data);
    });
    
    stream.on('close', () => {
      logMessage('SSH连接已关闭');
      conn.end();
      process.exit(0);
    });
    
    // 处理用户输入
    process.stdin.on('data', (data) => {
      const command = data.toString().trim();
      
      // 处理退出命令
      if (command === 'exit') {
        logMessage('正在关闭SSH连接...');
        stream.close();
        conn.end();
        return;
      }
      
      // 发送命令到服务器
      stream.write(data);
    });
  });
}

// 执行连接
connectSSH(); 