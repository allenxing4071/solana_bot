import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

const MODULE_NAME = 'StatusCheck';

async function main() {
  try {
    console.log(chalk.blue('开始系统状态检查...'));

    // 1. 加载环境变量
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log(chalk.red('错误: .env 文件不存在'));
      process.exit(1);
    }
    dotenv.config({ path: envPath });

    // 2. 检查目录结构
    const dirs = ['logs', 'data', 'backups'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        console.log(chalk.yellow(`警告: ${dir} 目录不存在`));
      } else {
        console.log(chalk.green(`${dir} 目录存在`));
      }
    }

    // 3. 检查配置文件
    const configFiles = ['.env', 'data/whitelist.json', 'data/blacklist.json'];
    for (const file of configFiles) {
      if (!fs.existsSync(file)) {
        console.log(chalk.yellow(`警告: ${file} 文件不存在`));
      } else {
        console.log(chalk.green(`${file} 文件存在`));
      }
    }

    // 4. 检查 Solana 连接
    try {
      const connection = new Connection(process.env.SOLANA_RPC_URL || '');
      const version = await connection.getVersion();
      console.log(chalk.green(`Solana 节点连接正常，版本: ${version}`));
    } catch (error) {
      console.log(chalk.red('Solana 节点连接失败:'), error);
    }

    // 5. 检查钱包地址
    try {
      if (process.env.WALLET_ADDRESS) {
        new PublicKey(process.env.WALLET_ADDRESS);
        console.log(chalk.green('钱包地址格式正确'));
      } else {
        console.log(chalk.yellow('警告: 未设置钱包地址'));
      }
    } catch (error) {
      console.log(chalk.red('钱包地址格式错误:'), error);
    }

    // 6. 检查进程状态
    if (process.platform !== 'win32') {
      try {
        const output = execSync('ps aux | grep "node.*solana-mevbot" | grep -v grep').toString();
        if (output) {
          console.log(chalk.green('发现运行中的进程:'));
          console.log(output);
        } else {
          console.log(chalk.yellow('没有发现运行中的进程'));
        }
      } catch (error) {
        console.log(chalk.yellow('没有发现运行中的进程'));
      }
    }

    // 7. 检查日志文件
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      const logFiles = fs.readdirSync(logsDir);
      if (logFiles.length > 0) {
        console.log(chalk.green('发现日志文件:'));
        logFiles.forEach(file => {
          const stats = fs.statSync(path.join(logsDir, file));
          console.log(`- ${file} (${stats.size} bytes)`);
        });
      } else {
        console.log(chalk.yellow('没有发现日志文件'));
      }
    }

    console.log(chalk.green('系统状态检查完成！'));
  } catch (error) {
    console.error(chalk.red('系统状态检查失败:'), error);
    process.exit(1);
  }
}

main(); 