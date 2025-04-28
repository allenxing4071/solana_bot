import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const MODULE_NAME = 'EmergencyStop';

async function main() {
  try {
    console.log(chalk.red('执行紧急停止...'));

    // 1. 设置紧急停止标志
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const updatedContent = envContent.replace(
        /EMERGENCY_STOP=.*/,
        'EMERGENCY_STOP=true'
      );
      fs.writeFileSync(envPath, updatedContent);
      console.log(chalk.yellow('已设置紧急停止标志'));
    }

    // 2. 停止所有相关进程
    if (process.platform !== 'win32') {
      try {
        execSync('pkill -f "node.*solana-mevbot"');
        console.log(chalk.green('已停止所有相关进程'));
      } catch (error) {
        console.log(chalk.yellow('没有找到运行中的进程'));
      }
    }

    // 3. 备份当前状态
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `emergency-${timestamp}.env`);
    fs.copyFileSync(envPath, backupPath);
    console.log(chalk.green(`当前状态已备份到: ${backupPath}`));

    console.log(chalk.red('紧急停止完成！'));
    console.log(chalk.yellow('请检查系统状态并采取必要的恢复措施'));
  } catch (error) {
    console.error(chalk.red('紧急停止失败:'), error);
    process.exit(1);
  }
}

main(); 