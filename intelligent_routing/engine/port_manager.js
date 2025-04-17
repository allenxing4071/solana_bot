/**
 * 端口管理系统
 * 基于Llama3的智能端口管理
 */

const { logger } = require('../utils/logger');
const llama3Router = require('./llama3_router');
const net = require('node:net');

class PortManager {
  constructor() {
    this.portRegistry = new Map(); // 端口注册表
    this.projectRegistry = new Map(); // 项目注册表
    this.portRange = {
      development: { start: 3000, end: 3999 },
      testing: { start: 4000, end: 4999 },
      production: { start: 5000, end: 5999 }
    };
    this.reservedPorts = new Map(); // 保留端口映射表
    this.portUsage = new Map(); // 端口使用情况
    this.systemPorts = new Set([ // 系统保留端口
      22,  // SSH
      80,  // HTTP
      443, // HTTPS
      3306, // MySQL
      5432, // PostgreSQL
      27017, // MongoDB
      6379, // Redis
      8080, // 常用代理
      3000, // 常用开发端口
      5000, // Flask默认
      8000, // Django默认
      9000, // PHP-FPM
      11434, // Ollama
      3100, // 智能路由
      3200  // 智能路由辅助
    ]);
    
    // 启动定期检查
    this.startPeriodicCheck();
  }

  /**
   * 启动定期端口检查
   */
  startPeriodicCheck() {
    // 每6小时检查一次
    setInterval(() => {
      this.checkPortUsage();
      this.releaseUnusedPorts();
    }, 6 * 60 * 60 * 1000);
    
    // 每24小时生成一次报告
    setInterval(() => {
      this.generatePortReport();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 检查端口使用情况
   */
  async checkPortUsage() {
    try {
      const usedPorts = await this.getUsedPorts();
      
      // 更新端口使用情况
      for (const [port, process] of usedPorts) {
        this.portUsage.set(port, {
          process,
          lastCheck: Date.now(),
          isSystem: this.systemPorts.has(port)
        });
      }
      
      logger.info('端口使用情况检查完成');
    } catch (error) {
      logger.error('检查端口使用情况失败:', error);
    }
  }

  /**
   * 获取当前使用的端口
   */
  async getUsedPorts() {
    return new Promise((resolve) => {
      const usedPorts = new Map();
      
      // 检查所有可能的端口
      for (let port = 1; port <= 65535; port++) {
        if (this.isPortInUse(port)) {
          usedPorts.set(port, this.getProcessUsingPort(port));
        }
      }
      
      resolve(usedPorts);
    });
  }

  /**
   * 检查端口是否被占用
   */
  isPortInUse(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      
      server.listen(port);
    });
  }

  /**
   * 获取使用端口的进程信息
   */
  getProcessUsingPort(port) {
    // 这里需要根据操作系统实现具体的进程信息获取
    // 在macOS上可以使用lsof命令
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`lsof -i :${port}`, (error, stdout) => {
        if (error) {
          resolve('未知进程');
        } else {
          const lines = stdout.split('\n');
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            resolve({
              pid: parts[1],
              name: parts[0],
              user: parts[2]
            });
          } else {
            resolve('未知进程');
          }
        }
      });
    });
  }

  /**
   * 释放未使用的端口
   */
  async releaseUnusedPorts() {
    const now = Date.now();
    const unusedPorts = [];
    
    for (const [port, info] of this.portUsage) {
      // 如果不是系统端口且超过24小时未使用
      if (!info.isSystem && (now - info.lastCheck) > 24 * 60 * 60 * 1000) {
        unusedPorts.push(port);
      }
    }
    
    for (const port of unusedPorts) {
      await this.releasePort(port);
    }
    
    logger.info(`已释放 ${unusedPorts.length} 个未使用的端口`);
  }

  /**
   * 释放指定端口
   */
  async releasePort(port) {
    try {
      const process = this.portUsage.get(port);
      if (process && process.pid) {
        // 终止进程
        const { exec } = require('child_process');
        exec(`kill -9 ${process.pid}`);
      }
      
      this.portUsage.delete(port);
      logger.info(`端口 ${port} 已释放`);
    } catch (error) {
      logger.error(`释放端口 ${port} 失败:`, error);
    }
  }

  /**
   * 生成端口使用报告
   */
  async generatePortReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalPorts: this.portUsage.size,
      systemPorts: 0,
      reservedPorts: 0,
      unusedPorts: 0,
      details: []
    };
    
    for (const [port, info] of this.portUsage) {
      if (info.isSystem) {
        report.systemPorts++;
      } else if (this.reservedPorts.has(port)) {
        report.reservedPorts++;
      } else {
        report.unusedPorts++;
      }
      
      report.details.push({
        port,
        process: info.process,
        isSystem: info.isSystem,
        lastCheck: new Date(info.lastCheck).toISOString()
      });
    }
    
    logger.info('端口使用报告已生成');
    return report;
  }

  /**
   * 注册新项目
   * @param {Object} projectInfo 项目信息
   * @returns {Promise<Object>} 分配的端口信息
   */
  async registerProject(projectInfo) {
    const { name, environment, description } = projectInfo;
    
    // 使用Llama3分析端口需求
    const portAnalysis = await this.analyzePortRequirements(projectInfo);
    
    // 分配端口
    const allocatedPorts = await this.allocatePorts(portAnalysis);
    
    // 更新注册表
    this.projectRegistry.set(name, {
      ...projectInfo,
      ports: allocatedPorts,
      status: 'active',
      lastUpdate: Date.now()
    });
    
    logger.log(`项目 ${name} 已注册，分配端口:`, allocatedPorts);
    return allocatedPorts;
  }

  /**
   * 分析端口需求
   * @param {Object} projectInfo 项目信息
   * @returns {Promise<Object>} 端口分析结果
   */
  async analyzePortRequirements(projectInfo) {
    const prompt = `分析项目端口需求：
项目名称：${projectInfo.name}
环境：${projectInfo.environment}
描述：${projectInfo.description}

请分析并返回JSON格式的端口需求：
{
  "requiredPorts": [端口列表],
  "recommendedPorts": [推荐端口],
  "dependencies": [依赖服务]
}`;

    const response = await llama3Router.queryLlama3(prompt);
    return JSON.parse(response);
  }

  /**
   * 分配端口
   * @param {Object} portAnalysis 端口分析结果
   * @returns {Promise<Object>} 分配的端口
   */
  async allocatePorts(portAnalysis) {
    const allocatedPorts = {};
    
    for (const port of portAnalysis.requiredPorts) {
      if (await this.isPortAvailable(port)) {
        allocatedPorts[port] = {
          status: 'allocated',
          allocatedAt: Date.now()
        };
      } else {
        // 如果端口被占用，使用Llama3推荐新端口
        const recommendedPort = await this.getRecommendedPort(port);
        allocatedPorts[recommendedPort] = {
          status: 'allocated',
          allocatedAt: Date.now(),
          originalPort: port
        };
      }
    }
    
    return allocatedPorts;
  }

  /**
   * 检查端口是否可用
   * @param {number} port 端口号
   * @returns {Promise<boolean>} 是否可用
   */
  async isPortAvailable(port) {
    try {
      const server = require('net').createServer();
      await new Promise((resolve, reject) => {
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            resolve(false);
          } else {
            reject(err);
          }
        });
        server.once('listening', () => {
          server.close();
          resolve(true);
        });
        server.listen(port);
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * 获取推荐端口
   * @param {number} originalPort 原始端口
   * @returns {Promise<number>} 推荐端口
   */
  async getRecommendedPort(originalPort) {
    const prompt = `原始端口 ${originalPort} 已被占用，请推荐一个可用的替代端口。
考虑因素：
1. 避免常用端口
2. 保持端口号规律性
3. 考虑项目类型和环境

请返回一个可用的端口号。`;

    const response = await llama3Router.queryLlama3(prompt);
    const recommendedPort = Number.parseInt(response, 10);
    
    if (await this.isPortAvailable(recommendedPort)) {
      return recommendedPort;
    }
    
    // 如果推荐端口也被占用，使用下一个可用端口
    return await this.findNextAvailablePort(originalPort);
  }

  /**
   * 查找下一个可用端口
   * @param {number} startPort 起始端口
   * @returns {Promise<number>} 可用端口
   */
  async findNextAvailablePort(startPort) {
    let port = startPort + 1;
    while (port < 65535) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
      port++;
    }
    throw new Error('没有可用的端口');
  }

  /**
   * 获取端口状态
   */
  async getPortStatus(port) {
    const isInUse = await this.isPortInUse(port);
    const isReserved = this.reservedPorts.has(port);
    const isSystem = this.systemPorts.has(port);
    
    return {
      port,
      isInUse,
      isReserved,
      isSystem,
      reservedBy: isReserved ? this.reservedPorts.get(port).project : null,
      lastCheck: this.portUsage.get(port)?.lastCheck
    };
  }
}

module.exports = new PortManager(); 