/**
 * 获取Solana MEV机器人监听数据脚本
 * 连接服务器并获取机器人当前监听的代币和交易信息
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

// 创建日志记录函数
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * 连接SSH并获取监听数据
 */
function connectAndGetMonitorData() {
  const conn = new Client();
  
  // 连接错误处理
  conn.on('error', (err) => {
    console.error(`SSH连接错误: ${err.message}`);
    process.exit(1);
  });
  
  // 准备好连接
  conn.on('ready', () => {
    log(`成功连接到服务器 ${sshConfig.host}`);
    getMonitoringData(conn);
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
 * 获取监控数据
 * @param {Client} conn - SSH连接客户端
 */
function getMonitoringData(conn) {
  log("正在获取监听数据...");
  
  // 1. 首先检查API服务是否在运行
  conn.exec('curl -s http://localhost:3000/api/status', (err, stream) => {
    if (err) {
      console.error(`无法执行命令: ${err.message}`);
      log("尝试获取日志数据...");
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== API服务状态 ==========");
    
    let apiStatusData = '';
    stream.on('data', (chunk) => {
      apiStatusData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      console.log(apiStatusData || "无法获取API状态数据");
      
      // 获取监控中的代币
      getTokensData(conn);
    });
  });
}

/**
 * 获取代币监控数据
 * @param {Client} conn - SSH连接客户端
 */
function getTokensData(conn) {
  conn.exec('curl -s http://localhost:3000/api/tokens', (err, stream) => {
    if (err) {
      console.error(`无法获取代币数据: ${err.message}`);
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== 监控中的代币 ==========");
    
    let tokensData = '';
    stream.on('data', (chunk) => {
      tokensData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      try {
        // 尝试解析和格式化JSON
        const tokensObj = JSON.parse(tokensData);
        console.log(JSON.stringify(tokensObj, null, 2));
      } catch (e) {
        console.log(tokensData || "未监控任何代币或无法获取数据");
      }
      
      // 获取交易数据
      getTransactionsData(conn);
    });
  });
}

/**
 * 获取交易监控数据
 * @param {Client} conn - SSH连接客户端
 */
function getTransactionsData(conn) {
  conn.exec('curl -s http://localhost:3000/api/transactions', (err, stream) => {
    if (err) {
      console.error(`无法获取交易数据: ${err.message}`);
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== 最近交易数据 ==========");
    
    let transactionsData = '';
    stream.on('data', (chunk) => {
      transactionsData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      try {
        // 尝试解析和格式化JSON
        const txObj = JSON.parse(transactionsData);
        console.log(JSON.stringify(txObj, null, 2));
      } catch (e) {
        console.log(transactionsData || "未监控任何交易或无法获取数据");
      }
      
      // 获取流动性池数据
      getPoolsData(conn);
    });
  });
}

/**
 * 获取流动性池数据
 * @param {Client} conn - SSH连接客户端
 */
function getPoolsData(conn) {
  conn.exec('curl -s http://localhost:3000/api/pools', (err, stream) => {
    if (err) {
      console.error(`无法获取流动性池数据: ${err.message}`);
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== 监控中的流动性池 ==========");
    
    let poolsData = '';
    stream.on('data', (chunk) => {
      poolsData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      try {
        // 尝试解析和格式化JSON
        const poolsObj = JSON.parse(poolsData);
        console.log(JSON.stringify(poolsObj, null, 2));
      } catch (e) {
        console.log(poolsData || "未监控任何流动性池或无法获取数据");
      }
      
      // 获取系统状态
      getSystemStatus(conn);
    });
  });
}

/**
 * 获取系统状态
 * @param {Client} conn - SSH连接客户端
 */
function getSystemStatus(conn) {
  conn.exec('curl -s http://localhost:3000/api/system/status', (err, stream) => {
    if (err) {
      console.error(`无法获取系统状态: ${err.message}`);
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== 系统监控状态 ==========");
    
    let statusData = '';
    stream.on('data', (chunk) => {
      statusData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      try {
        // 尝试解析和格式化JSON
        const statusObj = JSON.parse(statusData);
        console.log(JSON.stringify(statusObj, null, 2));
      } catch (e) {
        console.log(statusData || "无法获取系统状态数据");
      }
      
      // 获取内存统计数据
      getMemoryStats(conn);
    });
  });
}

/**
 * 获取内存统计数据
 * @param {Client} conn - SSH连接客户端
 */
function getMemoryStats(conn) {
  conn.exec('curl -s http://localhost:3000/api/memory_stats.json', (err, stream) => {
    if (err) {
      console.error(`无法获取内存统计: ${err.message}`);
      getLogsData(conn);
      return;
    }
    
    console.log("\n========== 内存监控数据 ==========");
    
    let memoryData = '';
    stream.on('data', (chunk) => {
      memoryData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      try {
        // 尝试解析和格式化JSON
        const memObj = JSON.parse(memoryData);
        console.log(JSON.stringify(memObj, null, 2));
      } catch (e) {
        console.log(memoryData || "无法获取内存监控数据");
      }
      
      // 如果API数据获取有困难，尝试从日志获取
      getLogsData(conn);
    });
  });
}

/**
 * 获取日志数据
 * @param {Client} conn - SSH连接客户端
 */
function getLogsData(conn) {
  console.log("\n========== 获取日志数据 ==========");
  
  // 检查日志目录
  conn.exec('ls -la /home/ubuntu/solana_MEVbot/logs', (err, stream) => {
    if (err) {
      console.error(`无法访问日志目录: ${err.message}`);
      console.log("尝试获取PM2日志...");
      getPM2Logs(conn);
      return;
    }
    
    console.log("\n--- 日志文件列表 ---");
    
    let logsData = '';
    stream.on('data', (chunk) => {
      logsData += chunk.toString();
    });
    
    stream.on('close', (code) => {
      console.log(logsData || "日志目录为空");
      
      // 获取最新的监听日志
      conn.exec('find /home/ubuntu/solana_MEVbot/logs -name "*listen*.log" -o -name "monitor*.log" | xargs ls -t | head -1 | xargs tail -n 50', (err, stream) => {
        if (err) {
          console.error(`无法读取监听日志: ${err.message}`);
          getPM2Logs(conn);
          return;
        }
        
        console.log("\n--- 最新监听日志数据 ---");
        
        let listenLogData = '';
        stream.on('data', (chunk) => {
          listenLogData += chunk.toString();
        });
        
        stream.on('close', (code) => {
          console.log(listenLogData || "未找到监听日志数据");
          
          // 尝试获取PM2日志
          getPM2Logs(conn);
        });
      });
    });
  });
}

/**
 * 获取PM2日志
 * @param {Client} conn - SSH连接客户端
 */
function getPM2Logs(conn) {
  conn.exec('pm2 logs --lines 50 solana-mev-api --nostream', (err, stream) => {
    if (err) {
      console.error(`无法获取PM2日志: ${err.message}`);
      conn.end();
      return;
    }
    
    console.log("\n========== PM2服务日志 ==========");
    
    let pm2LogData = '';
    stream.on('data', (chunk) => {
      pm2LogData += chunk.toString();
    });
    
    stream.stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
    
    stream.on('close', (code) => {
      console.log(pm2LogData || "无法获取PM2日志数据");
      
      // 如果PM2命令不工作，尝试直接获取API进程的日志
      if (!pm2LogData.trim() || pm2LogData.includes("not found") || code !== 0) {
        conn.exec('ps aux | grep "node.*api" | grep -v grep', (err, stream) => {
          if (err) {
            console.error(`无法找到API进程: ${err.message}`);
            conn.end();
            return;
          }
          
          console.log("\n========== API进程 ==========");
          
          let processData = '';
          stream.on('data', (chunk) => {
            processData += chunk.toString();
          });
          
          stream.on('close', () => {
            console.log(processData || "未找到API进程");
            conn.end();
          });
        });
      } else {
        conn.end();
      }
    });
  });
}

// 执行连接并获取监听数据
connectAndGetMonitorData(); 