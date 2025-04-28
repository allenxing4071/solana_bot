import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const MODULE_NAME = 'DBInit';

async function main() {
  try {
    console.log(chalk.blue('开始初始化数据库...'));

    // 1. 创建数据库目录
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(chalk.green('创建数据库目录'));
    }

    // 2. 初始化数据库
    const dbPath = path.join(dbDir, 'solana_bot.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // 3. 创建表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        address TEXT PRIMARY KEY,
        symbol TEXT,
        name TEXT,
        decimals INTEGER,
        total_supply TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        signature TEXT UNIQUE,
        token_address TEXT,
        type TEXT,
        amount TEXT,
        price TEXT,
        value TEXT,
        fee TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      );

      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT,
        price TEXT,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      );

      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token_address TEXT,
        amount TEXT,
        avg_price TEXT,
        current_price TEXT,
        profit_loss TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (token_address) REFERENCES tokens (address)
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(chalk.green('数据库表创建完成'));

    // 4. 插入默认设置
    await db.run(`
      INSERT OR REPLACE INTO settings (key, value) VALUES
      ('max_transaction_amount', '5.0'),
      ('daily_transaction_limit', '50.0'),
      ('risk_score_threshold', '50'),
      ('emergency_stop', 'false');
    `);

    console.log(chalk.green('默认设置插入完成'));

    // 5. 创建索引
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_token_address ON transactions (token_address);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
      CREATE INDEX IF NOT EXISTS idx_prices_token_address ON prices (token_address);
      CREATE INDEX IF NOT EXISTS idx_prices_created_at ON prices (created_at);
      CREATE INDEX IF NOT EXISTS idx_positions_token_address ON positions (token_address);
    `);

    console.log(chalk.green('索引创建完成'));

    // 6. 关闭数据库连接
    await db.close();

    // 7. 设置文件权限
    if (process.platform !== 'win32') {
      const { execSync } = require('child_process');
      execSync(`chmod 600 ${dbPath}`);
      console.log(chalk.green('设置文件权限'));
    }

    console.log(chalk.green('数据库初始化完成！'));
  } catch (error) {
    console.error(chalk.red('数据库初始化失败:'), error);
    process.exit(1);
  }
}

main(); 