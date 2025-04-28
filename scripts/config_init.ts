import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

const MODULE_NAME = 'ConfigInit';

async function main() {
  try {
    console.log(chalk.blue('开始初始化配置...'));

    // 1. 创建必要的目录
    const dirs = ['logs', 'data', 'backups'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(chalk.green(`创建目录: ${dir}`));
      }
    }

    // 2. 创建配置文件
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envPath = path.join(process.cwd(), '.env');

    if (!fs.existsSync(envExamplePath)) {
      console.log(chalk.yellow('警告: .env.example 文件不存在'));
    } else if (!fs.existsSync(envPath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log(chalk.green('创建 .env 文件'));
    }

    // 3. 设置文件权限
    if (process.platform !== 'win32') {
      execSync('chmod 600 .env');
      execSync('chmod 700 logs data backups');
      console.log(chalk.green('设置文件权限'));
    }

    // 4. 创建白名单和黑名单文件
    const lists = ['whitelist.json', 'blacklist.json'];
    for (const list of lists) {
      const listPath = path.join('data', list);
      if (!fs.existsSync(listPath)) {
        fs.writeJsonSync(listPath, { tokens: [] }, { spaces: 2 });
        console.log(chalk.green(`创建 ${list}`));
      }
    }

    console.log(chalk.green('配置初始化完成！'));
    console.log(chalk.yellow('请编辑 .env 文件设置您的配置参数'));
  } catch (error) {
    console.error(chalk.red('配置初始化失败:'), error);
    process.exit(1);
  }
}

main(); 