// Excel报告生成工具
// 使用 xlsx 库生成 .xlsx 文件
const XLSX = require('xlsx');
const fs = require('node:fs');
const path = require('node:path');

// --- 报告数据 ---
// (和 PDF 报告内容一致)
const reportData = [
    ['智能路由系统报告'], // 标题 (合并单元格处理稍后进行)
    [], // 空行
    ['生成日期：', new Date().toLocaleDateString('zh-CN')],
    [], // 空行
    ['系统概述'], // Section Title
    ['智能路由系统是一个基于多模型协作的高效路由平台。系统使用Llama3作为核心路由引擎，通过分析用户查询和历史数据，实现智能模型选择和上下文管理。'],
    [], // 空行
    ['主要功能'], // Section Title
    ['1. 智能模型选择'],
    ['   - 基于查询内容的语义分析'],
    ['   - 考虑模型专长和历史表现'],
    ['   - 动态负载均衡'],
    ['2. 上下文管理'],
    ['   - 多轮对话记忆'],
    ['   - 用户偏好学习'],
    ['   - 会话状态追踪'],
    ['3. 性能监控'],
    ['   - 响应时间统计'],
    ['   - 准确率评估'],
    ['   - 资源使用监控'],
    [], // 空行
    ['系统性能指标'], // Section Title
    ['- 平均响应时间：', '200ms'],
    ['- 路由准确率：', '95%'],
    ['- 用户满意度：', '4.8/5.0'],
    ['- 系统稳定性：', '99.9%'],
    [], // 空行
    ['未来展望'], // Section Title
    ['1. 引入更多高性能模型'],
    ['2. 优化上下文管理机制'],
    ['3. 增强用户偏好学习能力'],
    ['4. 提升系统整体性能'],
];

// --- Excel 文件生成逻辑 ---

// 创建 reports 目录（如果不存在）
const reportsDir = 'reports';
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// 创建工作簿和工作表
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(reportData); // 从数组数组创建工作表

// --- 样式和格式调整 (可选，但可以使报告更美观) ---

// 1. 设置列宽 (例如，让第一列宽一点)
ws['!cols'] = [{ wch: 60 }]; // 设置第一列宽度为60字符

// 2. 合并标题单元格 (例如，标题跨越两列)
// 注意：xlsx库的合并单元格需要定义范围
if (!ws['!merges']) ws['!merges'] = [];
ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }); // 合并 A1 到 B1

// 3. 设置标题居中加粗 (需要更复杂的样式设置，这里仅作示例)
// const titleCellStyle = { font: { bold: true }, alignment: { horizontal: 'center' } };
// ws['A1'].s = titleCellStyle; // 应用样式到 A1 (注意：xlsx社区版对复杂样式支持有限)


// 将工作表添加到工作簿
XLSX.utils.book_append_sheet(wb, ws, '智能路由报告'); // 工作表命名为 "智能路由报告"

// 定义输出文件路径
const outputPath = path.join(reportsDir, 'intelligent_routing_report.xlsx');

// 写入文件
XLSX.writeFile(wb, outputPath);

console.log(`Excel报告已生成：${outputPath}`); 