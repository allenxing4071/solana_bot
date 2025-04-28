import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const MODULE_NAME = 'SystemRecover';

async function main() {
  try {
    console.log(chalk.blue('开始系统恢复...'));

    // 1. 检查备份文件
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      console.log(chalk.red('错误: 备份目录不存在'));
      process.exit(1);
    }

    // 2. 获取最新的备份文件
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.tar.gz'))
      .sort()
      .reverse();

    if (backups.length === 0) {
      console.log(chalk.red('错误: 没有找到备份文件'));
      process.exit(1);
    }

    const latestBackup = backups[0];
    const backupPath = path.join(backupDir, latestBackup);
    console.log(chalk.yellow(`使用备份文件: ${latestBackup}`));

    // 3. 解压备份
    if (process.platform !== 'win32') {
      execSync(`tar -xzf ${backupPath} -C ${backupDir}`);
      const backupName = latestBackup.replace('.tar.gz', '');
      const extractedPath = path.join(backupDir, backupName);

      // 4. 恢复配置文件
      const envBackupPath = path.join(extractedPath, '.env');
      if (fs.existsSync(envBackupPath)) {
        fs.copyFileSync(envBackupPath, path.join(process.cwd(), '.env'));
        console.log(chalk.green('配置文件已恢复'));
      }

      // 5. 恢复数据文件
      const dataBackupPath = path.join(extractedPath, 'data');
      if (fs.existsSync(dataBackupPath)) {
        fs.copySync(dataBackupPath, path.join(process.cwd(), 'data'));
        console.log(chalk.green('数据文件已恢复'));
      }

      // 6. 恢复日志文件
      const logsBackupPath = path.join(extractedPath, 'logs');
      if (fs.existsSync(logsBackupPath)) {
        fs.copySync(logsBackupPath, path.join(process.cwd(), 'logs'));
        console.log(chalk.green('日志文件已恢复'));
      }

      // 7. 清理临时文件
      fs.removeSync(extractedPath);
    }

    // 8. 设置文件权限
    if (process.platform !== 'win32') {
      execSync('chmod 600 .env');
      execSync('chmod 700 logs data backups');
      console.log(chalk.green('设置文件权限'));
    }

    console.log(chalk.green('系统恢复完成！'));
    console.log(chalk.yellow('请检查系统状态并重新启动服务'));
  } catch (error) {
    console.error(chalk.red('系统恢复失败:'), error);
    process.exit(1);
  }
}

main(); 