import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const MODULE_NAME = 'ConfigUpdate';

async function main() {
  try {
    console.log(chalk.blue('开始更新配置...'));

    // 1. 检查 .env 文件是否存在
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      console.log(chalk.red('错误: .env 文件不存在'));
      console.log(chalk.yellow('请先运行 npm run config:init'));
      process.exit(1);
    }

    // 2. 备份当前配置
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `config-${timestamp}.env`);
    fs.copyFileSync(envPath, backupPath);
    console.log(chalk.green(`配置文件已备份到: ${backupPath}`));

    // 3. 更新配置
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const updatedLines = lines.map(line => {
      if (line.startsWith('#')) return line;
      if (!line.includes('=')) return line;
      
      const [key] = line.split('=');
      const newValue = process.env[key.trim()];
      if (newValue) {
        return `${key}=${newValue}`;
      }
      return line;
    });

    fs.writeFileSync(envPath, updatedLines.join('\n'));
    console.log(chalk.green('配置已更新'));

    // 4. 设置文件权限
    if (process.platform !== 'win32') {
      execSync('chmod 600 .env');
      console.log(chalk.green('设置文件权限'));
    }

    console.log(chalk.green('配置更新完成！'));
  } catch (error) {
    console.error(chalk.red('配置更新失败:'), error);
    process.exit(1);
  }
}

main(); 