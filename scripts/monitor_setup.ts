import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const MODULE_NAME = 'MonitorSetup';

async function main() {
  try {
    console.log(chalk.blue('开始设置监控...'));

    // 1. 创建监控目录
    const monitorDir = path.join(process.cwd(), 'monitor');
    if (!fs.existsSync(monitorDir)) {
      fs.mkdirSync(monitorDir, { recursive: true });
      console.log(chalk.green('创建监控目录'));
    }

    // 2. 创建监控配置文件
    const configPath = path.join(monitorDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      const config = {
        metrics: {
          memory: {
            enabled: true,
            interval: 60000,
            threshold: 0.8
          },
          cpu: {
            enabled: true,
            interval: 60000,
            threshold: 0.8
          },
          network: {
            enabled: true,
            interval: 60000
          },
          disk: {
            enabled: true,
            interval: 300000,
            threshold: 0.9
          }
        },
        alerts: {
          telegram: {
            enabled: false,
            botToken: '',
            chatId: ''
          },
          email: {
            enabled: false,
            smtp: {
              host: '',
              port: 587,
              secure: false,
              auth: {
                user: '',
                pass: ''
              }
            },
            to: ''
          }
        },
        logging: {
          level: 'info',
          file: true,
          console: true
        }
      };

      fs.writeJsonSync(configPath, config, { spaces: 2 });
      console.log(chalk.green('创建监控配置文件'));
    }

    // 3. 创建监控脚本
    const scriptPath = path.join(monitorDir, 'monitor.js');
    if (!fs.existsSync(scriptPath)) {
      const script = `
const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total: total,
    free: free,
    used: used,
    percentage: used / total
  };
}

function getCPUUsage() {
  const cpus = os.cpus();
  let total = 0;
  let idle = 0;

  cpus.forEach(cpu => {
    total += Object.values(cpu.times).reduce((a, b) => a + b);
    idle += cpu.times.idle;
  });

  return {
    total: total,
    idle: idle,
    percentage: 1 - idle / total
  };
}

function getDiskUsage() {
  const stats = fs.statfsSync('/');
  const total = stats.blocks * stats.bsize;
  const free = stats.bfree * stats.bsize;
  const used = total - free;
  return {
    total: total,
    free: free,
    used: used,
    percentage: used / total
  };
}

function checkMetrics() {
  const memory = getMemoryUsage();
  const cpu = getCPUUsage();
  const disk = getDiskUsage();

  if (memory.percentage > config.metrics.memory.threshold) {
    console.log(\`内存使用率过高: \${(memory.percentage * 100).toFixed(2)}%\`);
  }

  if (cpu.percentage > config.metrics.cpu.threshold) {
    console.log(\`CPU 使用率过高: \${(cpu.percentage * 100).toFixed(2)}%\`);
  }

  if (disk.percentage > config.metrics.disk.threshold) {
    console.log(\`磁盘使用率过高: \${(disk.percentage * 100).toFixed(2)}%\`);
  }
}

setInterval(checkMetrics, config.metrics.memory.interval);
      `;

      fs.writeFileSync(scriptPath, script);
      console.log(chalk.green('创建监控脚本'));
    }

    // 4. 设置文件权限
    if (process.platform !== 'win32') {
      execSync('chmod 700 monitor');
      execSync('chmod 600 monitor/config.json');
      execSync('chmod 700 monitor/monitor.js');
      console.log(chalk.green('设置文件权限'));
    }

    console.log(chalk.green('监控设置完成！'));
    console.log(chalk.yellow('请编辑 monitor/config.json 配置监控参数'));
  } catch (error) {
    console.error(chalk.red('监控设置失败:'), error);
    process.exit(1);
  }
}

main(); 