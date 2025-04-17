// 数据库导出到Excel工具
const sqlite3 = require('sqlite3').verbose(); // 使用 verbose 模式获取更详细的错误信息
const XLSX = require('xlsx');
const fs = require('node:fs');
const path = require('node:path');

// --- 配置 ---
const dbPath = path.join(__dirname, '..', 'intelligent_routing', 'data', 'routing_data.db'); // 数据库文件路径
const outputExcelPath = path.join(__dirname, '..', 'reports', 'database_export.xlsx'); // 输出Excel文件路径
const reportsDir = path.dirname(outputExcelPath);

// 确保 reports 目录存在
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
    console.log(`创建目录：${reportsDir}`);
}

// --- 数据库连接和导出逻辑 ---
console.log(`正在连接数据库：${dbPath}`);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error(`数据库连接错误: ${err.message}`);
        console.error('请确保数据库文件路径正确，并且文件存在。路径：', dbPath);
        return;
    }
    console.log('数据库连接成功。');

    // 获取所有表名
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';", [], (err, tables) => {
        if (err) {
            console.error(`获取表名错误: ${err.message}`);
            db.close();
            return;
        }

        if (tables.length === 0) {
            console.log('数据库中没有找到用户表。');
            db.close();
            return;
        }

        const tableNames = tables.map(t => t.name);
        console.log(`找到以下表: ${tableNames.join(', ')}`);

        // 创建新的 Excel 工作簿
        const wb = XLSX.utils.book_new();
        let tablesProcessed = 0;

        // 遍历每个表并导出数据
        // 使用 for...of 循环代替 forEach
        (async () => { // 使用 async IIFE (立即执行的异步函数表达式) 来处理异步操作
            for (const tableName of tableNames) {
                console.log(`正在导出表: ${tableName}...`);
                const sql = `SELECT * FROM ${tableName}`;

                try {
                    // 使用 Promise 包装 db.all 以便使用 async/await
                    const rows = await new Promise((resolve, reject) => {
                        db.all(sql, [], (err, rows) => {
                            if (err) {
                                reject(new Error(`查询表 ${tableName} 数据错误: ${err.message}`));
                            } else {
                                resolve(rows);
                            }
                        });
                    });

                    if (rows.length > 0) {
                        const headers = Object.keys(rows[0]);
                        const sheetData = [headers, ...rows.map(row => headers.map(header => row[header]))];
                        const ws = XLSX.utils.aoa_to_sheet(sheetData);
                        XLSX.utils.book_append_sheet(wb, ws, tableName);
                        console.log(`表 ${tableName} (${rows.length} 行) 导出成功。`);
                    } else {
                        console.log(`表 ${tableName} 为空，将创建一个空标签页。`);
                        const ws = XLSX.utils.aoa_to_sheet([[`表 ${tableName} 为空`]]);
                        XLSX.utils.book_append_sheet(wb, ws, tableName);
                    }
                } catch (queryError) {
                    console.error(queryError.message);
                }

                tablesProcessed++;
            } // for...of 循环结束

            // 当所有表都处理完毕后 (移出循环)
            if (tablesProcessed === tableNames.length) {
              console.log('所有表处理完毕，正在生成 Excel 文件...');
              try {
                  XLSX.writeFile(wb, outputExcelPath);
                  console.log(`Excel文件已成功生成：${outputExcelPath}`);
              } catch (writeError) {
                  console.error(`写入 Excel 文件时出错: ${writeError.message}`);
              }

              // 关闭数据库连接 (移到异步函数末尾)
              db.close((closeErr) => {
                  if (closeErr) {
                      console.error(`关闭数据库连接时出错: ${closeErr.message}`);
                  }
                  console.log('数据库连接已关闭。');
              });
            }
        })(); // 立即执行 async 函数
    });
}); 