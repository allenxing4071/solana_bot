import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const MODULE_NAME = 'Backup';

async function main() {
  try {
    console.log(chalk.blue('开始备份...'));

    // 1. 创建备份目录
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(backupDir, backupName);

    // 2. 备份配置文件
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, path.join(backupPath, '.env'));
      console.log(chalk.green('配置文件已备份'));
    }

    // 3. 备份数据文件
    const dataDir = path.join(process.cwd(), 'data');
    if (fs.existsSync(dataDir)) {
      fs.copySync(dataDir, path.join(backupPath, 'data'));
      console.log(chalk.green('数据文件已备份'));
    }

    // 4. 备份日志文件
    const logsDir = path.join(process.cwd(), 'logs');
    if (fs.existsSync(logsDir)) {
      fs.copySync(logsDir, path.join(backupPath, 'logs'));
      console.log(chalk.green('日志文件已备份'));
    }

    // 5. 压缩备份
    if (process.platform !== 'win32') {
      execSync(`tar -czf ${backupPath}.tar.gz -C ${backupDir} ${backupName}`);
      fs.removeSync(backupPath);
      console.log(chalk.green('备份已压缩'));
    }

    console.log(chalk.green('备份完成！'));
    console.log(chalk.yellow(`备份文件: ${backupPath}.tar.gz`));
  } catch (error) {
    console.error(chalk.red('备份失败:'), error);
    process.exit(1);
  }
}

main(); 