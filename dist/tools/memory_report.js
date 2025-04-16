"use strict";
/**
 * 内存使用报告生成工具
 * 用于检查系统内存使用情况并生成详细报告
 *
 * 【执行方式】
 * npm run memory-report
 * 或
 * ts-node src/tools/memory_report.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_os_1 = __importDefault(require("node:os"));
const v8 = __importStar(require("node:v8"));
const filesize_1 = __importDefault(require("filesize"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
// 工具名称常量
const MODULE_NAME = 'MemoryReport';
// 报告保存目录
const REPORTS_DIR = node_path_1.default.join(process.cwd(), 'reports');
/**
 * 格式化大小为可读字符串
 * @param size 字节数
 * @returns 格式化后的字符串
 */
function formatSize(size) {
    return filesize_1.default.filesize(size);
}
/**
 * 收集内存使用统计
 * @returns 内存使用统计数据
 */
function collectMemoryStats() {
    // 系统内存信息
    const totalMemory = node_os_1.default.totalmem();
    const freeMemory = node_os_1.default.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    // 进程内存使用信息
    const processMemory = process.memoryUsage();
    // V8堆统计
    const v8Stats = v8.getHeapStatistics();
    // 计算内存使用趋势 (0-100，越高表示内存压力越大)
    const memoryPressure = (v8Stats.used_heap_size / v8Stats.heap_size_limit) * 100;
    return {
        system: {
            total: totalMemory,
            free: freeMemory,
            used: usedMemory,
            usagePercent: memoryUsagePercent
        },
        process: {
            heapTotal: processMemory.heapTotal,
            heapUsed: processMemory.heapUsed,
            external: processMemory.external,
            rss: processMemory.rss
        },
        v8: {
            heapSizeLimit: v8Stats.heap_size_limit,
            totalHeapSize: v8Stats.total_heap_size,
            usedHeapSize: v8Stats.used_heap_size,
            mallocedMemory: v8Stats.malloced_memory,
            peakMallocedMemory: v8Stats.peak_malloced_memory,
            usageTrend: memoryPressure
        },
        timestamp: Date.now()
    };
}
/**
 * 生成详细内存报告
 * @param stats 内存统计数据
 * @returns 格式化的内存报告字符串
 */
function generateDetailedReport(stats) {
    const date = new Date(stats.timestamp).toLocaleString();
    return `
============================================
       系统内存使用报告 - ${date}
============================================

系统内存:
  总内存:      ${formatSize(stats.system.total)}
  已用内存:    ${formatSize(stats.system.used)} (${stats.system.usagePercent.toFixed(2)}%)
  空闲内存:    ${formatSize(stats.system.free)}

进程内存:
  RSS (常驻集):        ${formatSize(stats.process.rss)}
  堆内存总量:          ${formatSize(stats.process.heapTotal)}
  堆内存使用:          ${formatSize(stats.process.heapUsed)}
  外部内存:            ${formatSize(stats.process.external)}

V8 堆统计:
  堆内存上限:          ${formatSize(stats.v8.heapSizeLimit)}
  总堆大小:            ${formatSize(stats.v8.totalHeapSize)}
  已用堆大小:          ${formatSize(stats.v8.usedHeapSize)}
  已分配内存:          ${formatSize(stats.v8.mallocedMemory)}
  内存分配峰值:        ${formatSize(stats.v8.peakMallocedMemory)}

内存压力评估:
  内存使用趋势:        ${stats.v8.usageTrend.toFixed(2)}%
  
  状态评估:            ${getMemoryHealthStatus(stats)}

============================================
  内存检测由 Solana MEV Bot 内存优化系统提供
============================================
`.trim();
}
/**
 * 获取内存健康状态评估
 * @param stats 内存统计
 * @returns 状态描述
 */
function getMemoryHealthStatus(stats) {
    const { usageTrend } = stats.v8;
    if (usageTrend < 30) {
        return '良好 - 内存使用处于安全水平';
    }
    if (usageTrend < 60) {
        return '正常 - 内存使用在合理范围内';
    }
    if (usageTrend < 80) {
        return '警告 - 内存使用较高，建议关注';
    }
    return '危险 - 内存使用接近上限，建议优化';
}
/**
 * 保存报告到文件
 * @param report 报告内容
 * @returns 保存的文件路径
 */
async function saveReportToFile(report) {
    // 确保目录存在
    await promises_1.default.mkdir(REPORTS_DIR, { recursive: true });
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `memory-report-${timestamp}.txt`;
    const filepath = node_path_1.default.join(REPORTS_DIR, filename);
    // 写入文件
    await promises_1.default.writeFile(filepath, report, 'utf8');
    return filepath;
}
/**
 * 主函数
 */
async function main() {
    try {
        console.log('正在收集内存使用数据...');
        // 手动触发垃圾回收（如果可用）
        if (global.gc) {
            console.log('执行垃圾回收以获取准确数据...');
            global.gc();
        }
        // 收集内存统计
        const stats = collectMemoryStats();
        // 生成报告
        const report = generateDetailedReport(stats);
        // 保存报告
        const filepath = await saveReportToFile(report);
        // 输出报告
        console.log(`\n${report}\n`);
        console.log(`报告已保存到: ${filepath}`);
    }
    catch (error) {
        console.error('生成内存报告时出错:', error);
        process.exit(1);
    }
}
// 执行主函数
if (require.main === module) {
    main();
}
//# sourceMappingURL=memory_report.js.map