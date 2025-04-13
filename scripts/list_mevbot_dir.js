/**
 * 查看solana_MEVbot目录结构脚本
 * 连接服务器并详细列出MEV机器人目录结构
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

// 目标目录
const targetDir = '/home/ubuntu/solana_MEVbot';

// 创建日志记录函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * 连接SSH并获取目录结构
 */
function connectAndListMEVBotDir() {
  const conn = new Client();
  
  // 连接错误处理
  conn.on('error', (err) => {
    console.error(`SSH连接错误: ${err.message}`);
    process.exit(1);
  });
  
  // 准备好连接
  conn.on('ready', () => {
    log(`成功连接到服务器 ${sshConfig.host}`);
    listMEVBotDirectory(conn);
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
 * 列出MEVBot目录结构
 * @param {Client} conn - SSH连接客户端
 */
function listMEVBotDirectory(conn) {
  // 获取主目录信息
  conn.exec(`ls -la ${targetDir}`, (err, stream) => {
    if (err) {
      console.error(`无法访问目录 ${targetDir}: ${err.message}`);
      conn.end();
      return;
    }
    
    console.log(`\n========== ${targetDir} 目录内容 ==========`);
    
    let rootData = '';
    stream.on('data', (chunk) => {
      rootData += chunk.toString();
    });
    
    stream.on('close', () => {
      console.log(rootData);
      
      // 查看子目录结构
      getSubdirectoriesContents(conn);
    });
  });
}

/**
 * 获取子目录内容
 * @param {Client} conn - SSH连接客户端
 */
function getSubdirectoriesContents(conn) {
  // 获取子目录列表
  conn.exec(`find ${targetDir} -maxdepth 1 -type d -not -path "${targetDir}"`, (err, stream) => {
    if (err) {
      console.error(`无法获取子目录列表: ${err.message}`);
      conn.end();
      return;
    }
    
    let dirList = '';
    stream.on('data', (chunk) => {
      dirList += chunk.toString();
    });
    
    stream.on('close', () => {
      const directories = dirList.trim().split('\n').filter(Boolean);
      
      if (directories.length === 0) {
        // 没有子目录，获取文件列表
        getFilesList(conn);
        return;
      }
      
      // 查看文件数量较多的重要子目录
      conn.exec(`find ${targetDir} -type f | grep -v "node_modules" | grep -v ".git" | sort -r | head -n 20`, (err, stream) => {
        if (err) {
          console.error(`无法获取文件列表: ${err.message}`);
          conn.end();
          return;
        }
        
        console.log(`\n========== ${targetDir} 重要文件列表 ==========`);
        
        let fileList = '';
        stream.on('data', (chunk) => {
          fileList += chunk.toString();
        });
        
        stream.on('close', () => {
          console.log(fileList || '未找到文件');
          
          // 查看src目录结构
          const srcDir = `${targetDir}/src`;
          conn.exec(`ls -la ${srcDir} 2>/dev/null || echo "src目录不存在"`, (err, stream) => {
            if (err) {
              console.error(`无法访问src目录: ${err.message}`);
              conn.end();
              return;
            }
            
            console.log(`\n========== ${srcDir} 目录内容 ==========`);
            
            let srcData = '';
            stream.on('data', (chunk) => {
              srcData += chunk.toString();
            });
            
            stream.on('close', () => {
              console.log(srcData);
              
              // 检查配置文件
              checkConfigFiles(conn);
            });
          });
        });
      });
    });
  });
}

/**
 * 获取重要文件列表
 * @param {Client} conn - SSH连接客户端
 */
function getFilesList(conn) {
  conn.exec(`find ${targetDir} -maxdepth 1 -type f | sort`, (err, stream) => {
    if (err) {
      console.error(`无法获取文件列表: ${err.message}`);
      conn.end();
      return;
    }
    
    console.log(`\n========== ${targetDir} 根目录文件列表 ==========`);
    
    let fileList = '';
    stream.on('data', (chunk) => {
      fileList += chunk.toString();
    });
    
    stream.on('close', () => {
      console.log(fileList || '未找到文件');
      checkConfigFiles(conn);
    });
  });
}

/**
 * 检查配置文件
 * @param {Client} conn - SSH连接客户端
 */
function checkConfigFiles(conn) {
  const configFiles = [
    `${targetDir}/.env`,
    `${targetDir}/package.json`,
    `${targetDir}/tsconfig.json` 
  ];
  
  console.log(`\n========== 查看重要配置文件 ==========`);
  
  // 检查package.json
  conn.exec(`cat ${targetDir}/package.json 2>/dev/null || echo "package.json不存在"`, (err, stream) => {
    if (err) {
      console.error(`无法读取package.json: ${err.message}`);
      conn.end();
      return;
    }
    
    console.log(`\n--- package.json ---`);
    
    let packageData = '';
    stream.on('data', (chunk) => {
      packageData += chunk.toString();
    });
    
    stream.on('close', () => {
      console.log(packageData);
      
      // 获取进程状态
      getProcessStatus(conn);
    });
  });
}

/**
 * 获取进程状态
 * @param {Client} conn - SSH连接客户端
 */
function getProcessStatus(conn) {
  conn.exec(`ps aux | grep -v grep | grep -E "node.*solana|pm2"`, (err, stream) => {
    if (err) {
      console.error(`无法获取进程状态: ${err.message}`);
      conn.end();
      return;
    }
    
    console.log(`\n========== 相关进程状态 ==========`);
    
    let processData = '';
    stream.on('data', (chunk) => {
      processData += chunk.toString();
    });
    
    stream.on('close', () => {
      console.log(processData || '未找到相关进程');
      
      // 检查PM2状态
      conn.exec(`pm2 list 2>/dev/null || echo "PM2未运行或未安装"`, (err, stream) => {
        if (err) {
          console.error(`无法获取PM2状态: ${err.message}`);
          conn.end();
          return;
        }
        
        console.log(`\n========== PM2进程列表 ==========`);
        
        let pm2Data = '';
        stream.on('data', (chunk) => {
          pm2Data += chunk.toString();
        });
        
        stream.on('close', () => {
          console.log(pm2Data);
          conn.end();
        });
      });
    });
  });
}

// 执行连接和目录检查
connectAndListMEVBotDir(); 