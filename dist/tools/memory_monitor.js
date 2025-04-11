"use strict";
/**
 * 内存持续监控工具
 * 用于长时间监控系统内存使用情况，并在内存使用超过阈值时发出告警
 *
 * 【执行方式】
 * npm run memory-monitor
 * 或
 * ts-node src/tools/memory_monitor.ts
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
const v8 = __importStar(require("v8"));
const filesize_1 = __importDefault(require("filesize"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:fs/promises"));
const logger_1 = __importDefault(require("../core/logger"));
// 创建专用日志记录器
const logger = (0, logger_1.default)('MemoryMonitor');
// 工具名称
const TOOL_NAME = 'MemoryMonitor';
// 报告保存目录
const REPORTS_DIR = node_path_1.default.join(process.cwd(), 'reports');
/**
 * 内存使用监控
 */
class MemoryMonitor {
    /**
     * 构造函数
     * @param config 监控配置
     */
    constructor(config) {
        // 采样历史
        this.samples = [];
        // 最后保存时间
        this.lastSaveTime = 0;
        // 警告计数
        this.warningCount = 0;
        // 最后GC时间
        this.lastGcTime = 0;
        // 监控定时器
        this.timer = null;
        // 最后一次自动GC的内存释放量
        this.lastGcFreedMemory = 0;
        // 默认配置
        this.config = {
            interval: 5000,
            memoryWarningThreshold: 80,
            heapWarningThreshold: 70,
            autoGcThreshold: 75,
            logRegularSamples: true,
            historySampleSize: 720, // 默认保存720个采样点，按5秒间隔是1小时
            saveInterval: 300 // 5分钟保存一次
        };
        // 合并自定义配置
        if (config) {
            this.config = { ...this.config, ...config };
        }
        this.lastSaveTime = Date.now();
    }
    /**
     * 启动监控
     */
    start() {
        console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║      Solana MEV Bot 内存监控工具已启动            ║
║                                                   ║
║  监控间隔: ${this.config.interval}ms          ║
║  内存警告阈值: ${this.config.memoryWarningThreshold}%                         ║
║  堆警告阈值: ${this.config.heapWarningThreshold}%                          ║
║  自动GC阈值: ${this.config.autoGcThreshold}%                          ║
║                                                   ║
║  按 Ctrl+C 停止监控                              ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
`);
        // 立即采样一次
        this.sampleMemory();
        // 设置定时采样
        this.timer = setInterval(() => {
            this.sampleMemory();
        }, this.config.interval);
        // 设置进程退出处理
        process.on('SIGINT', () => {
            this.stop();
            console.log('\n监控已停止，正在保存报告...');
            this.saveReport()
                .then(filepath => {
                console.log(`报告已保存到: ${filepath}`);
                process.exit(0);
            })
                .catch(error => {
                console.error('保存报告时出错:', error);
                process.exit(1);
            });
        });
    }
    /**
     * 停止监控
     */
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * 采样内存使用情况
     */
    sampleMemory() {
        try {
            // 系统内存信息
            const totalMemory = node_os_1.default.totalmem();
            const freeMemory = node_os_1.default.freemem();
            const usedMemory = totalMemory - freeMemory;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            // 进程内存使用信息
            const processMemory = process.memoryUsage();
            // V8堆统计
            const v8Stats = v8.getHeapStatistics();
            const heapUsage = (v8Stats.used_heap_size / v8Stats.total_heap_size) * 100;
            // 创建采样
            const sample = {
                systemMemoryUsage: memoryUsagePercent,
                systemFreeMemory: freeMemory,
                processRss: processMemory.rss,
                heapTotal: processMemory.heapTotal,
                heapUsed: processMemory.heapUsed,
                heapUsage: heapUsage,
                timestamp: Date.now()
            };
            // 添加到采样历史
            this.samples.push(sample);
            // 限制历史大小
            if (this.samples.length > this.config.historySampleSize) {
                this.samples.shift();
            }
            // 检查是否需要记录常规采样
            if (this.config.logRegularSamples) {
                this.logSample(sample);
            }
            // 检查是否有警告
            this.checkWarnings(sample);
            // 检查是否需要自动执行GC
            this.checkForAutoGc(sample);
            // 检查是否需要保存报告
            this.checkForSave();
        }
        catch (error) {
            console.error('采样内存时出错:', error);
        }
    }
    /**
     * 记录采样
     * @param sample 采样数据
     */
    logSample(sample) {
        const now = new Date(sample.timestamp).toLocaleTimeString();
        console.log(`[${now}] 系统内存: ${sample.systemMemoryUsage.toFixed(1)}% | 堆内存: ${sample.heapUsage.toFixed(1)}% | RSS: ${formatSize(sample.processRss)}`);
    }
    /**
     * 检查警告
     * @param sample 采样数据
     */
    checkWarnings(sample) {
        // 检查系统内存警告
        if (sample.systemMemoryUsage > this.config.memoryWarningThreshold) {
            console.warn(`\n⚠️ 警告: 系统内存使用率达到 ${sample.systemMemoryUsage.toFixed(1)}%，超过警告阈值 ${this.config.memoryWarningThreshold}%`);
            this.warningCount++;
        }
        // 检查堆内存警告
        if (sample.heapUsage > this.config.heapWarningThreshold) {
            console.warn(`\n⚠️ 警告: 堆内存使用率达到 ${sample.heapUsage.toFixed(1)}%，超过警告阈值 ${this.config.heapWarningThreshold}%`);
            this.warningCount++;
        }
    }
    /**
     * 检查是否需要自动执行垃圾回收
     * @param sample 采样数据
     */
    checkForAutoGc(sample) {
        const now = Date.now();
        const gcCooldown = 60000; // 1分钟冷却时间
        // 如果距离上次GC不足冷却时间，则跳过
        if (now - this.lastGcTime < gcCooldown) {
            return;
        }
        // 检查是否达到自动GC阈值
        if (sample.heapUsage > this.config.autoGcThreshold && global.gc) {
            console.log(`\n🧹 堆内存使用率(${sample.heapUsage.toFixed(1)}%)超过自动GC阈值(${this.config.autoGcThreshold}%)，执行垃圾回收...`);
            // 记录GC前的堆使用
            const beforeHeapUsed = sample.heapUsed;
            // 执行垃圾回收
            global.gc();
            // 更新上次GC时间
            this.lastGcTime = now;
            // 获取GC后的内存使用
            const afterMemory = process.memoryUsage();
            // 计算释放的内存
            this.lastGcFreedMemory = beforeHeapUsed - afterMemory.heapUsed;
            // 如果释放了内存，记录日志
            if (this.lastGcFreedMemory > 0) {
                console.log(`✅ 垃圾回收完成，释放了 ${formatSize(this.lastGcFreedMemory)} 内存`);
            }
            else {
                console.log(`✅ 垃圾回收完成，但没有释放明显的内存`);
            }
        }
    }
    /**
     * 检查是否需要保存报告
     */
    checkForSave() {
        const now = Date.now();
        // 如果未设置保存间隔，则跳过
        if (this.config.saveInterval <= 0) {
            return;
        }
        // 检查是否达到保存间隔
        if (now - this.lastSaveTime >= this.config.saveInterval * 1000) {
            this.saveReport()
                .then(filepath => {
                console.log(`\n📊 已自动保存内存报告到: ${filepath}`);
                this.lastSaveTime = now;
            })
                .catch(error => {
                console.error('自动保存报告时出错:', error);
            });
        }
    }
    /**
     * 保存内存报告
     * @returns 保存的文件路径
     */
    async saveReport() {
        // 确保目录存在
        await promises_1.default.mkdir(REPORTS_DIR, { recursive: true });
        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `memory-monitor-${timestamp}.json`;
        const filepath = node_path_1.default.join(REPORTS_DIR, filename);
        // 准备报告数据
        const report = {
            config: this.config,
            summary: this.generateSummary(),
            samples: this.samples,
            warningCount: this.warningCount,
            timestamp: Date.now()
        };
        // 写入文件
        await promises_1.default.writeFile(filepath, JSON.stringify(report, null, 2), 'utf8');
        return filepath;
    }
    /**
     * 生成监控摘要
     */
    generateSummary() {
        if (this.samples.length === 0) {
            return {
                empty: true,
                message: '没有采样数据'
            };
        }
        // 最后一个采样
        const latest = this.samples[this.samples.length - 1];
        // 计算平均值
        let totalSystemMemory = 0;
        let totalHeapUsage = 0;
        let maxSystemMemory = 0;
        let maxHeapUsage = 0;
        for (const sample of this.samples) {
            totalSystemMemory += sample.systemMemoryUsage;
            totalHeapUsage += sample.heapUsage;
            maxSystemMemory = Math.max(maxSystemMemory, sample.systemMemoryUsage);
            maxHeapUsage = Math.max(maxHeapUsage, sample.heapUsage);
        }
        const avgSystemMemory = totalSystemMemory / this.samples.length;
        const avgHeapUsage = totalHeapUsage / this.samples.length;
        return {
            startTime: this.samples[0].timestamp,
            endTime: latest.timestamp,
            duration: (latest.timestamp - this.samples[0].timestamp) / 1000, // 秒
            sampleCount: this.samples.length,
            latest: {
                systemMemoryUsage: latest.systemMemoryUsage,
                heapUsage: latest.heapUsage,
                processRss: latest.processRss,
                timestamp: latest.timestamp
            },
            average: {
                systemMemoryUsage: avgSystemMemory,
                heapUsage: avgHeapUsage
            },
            maximum: {
                systemMemoryUsage: maxSystemMemory,
                heapUsage: maxHeapUsage
            },
            warningCount: this.warningCount,
            lastGcFreedMemory: this.lastGcFreedMemory
        };
    }
}
/**
 * 格式化大小为可读字符串
 * @param size 字节数
 * @returns 格式化后的字符串
 */
function formatSize(size) {
    return (0, filesize_1.default)(size);
}
/**
 * 主函数
 */
function main() {
    try {
        // 解析命令行参数
        const args = process.argv.slice(2);
        // 默认配置
        const config = {};
        // 解析参数
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--interval' && i + 1 < args.length) {
                config.interval = parseInt(args[++i], 10);
            }
            else if (args[i] === '--memory-threshold' && i + 1 < args.length) {
                config.memoryWarningThreshold = parseInt(args[++i], 10);
            }
            else if (args[i] === '--heap-threshold' && i + 1 < args.length) {
                config.heapWarningThreshold = parseInt(args[++i], 10);
            }
            else if (args[i] === '--gc-threshold' && i + 1 < args.length) {
                config.autoGcThreshold = parseInt(args[++i], 10);
            }
            else if (args[i] === '--save-interval' && i + 1 < args.length) {
                config.saveInterval = parseInt(args[++i], 10);
            }
            else if (args[i] === '--history-size' && i + 1 < args.length) {
                config.historySampleSize = parseInt(args[++i], 10);
            }
            else if (args[i] === '--quiet') {
                config.logRegularSamples = false;
            }
            else if (args[i] === '--help') {
                printHelp();
                process.exit(0);
            }
        }
        // 创建监控实例
        const monitor = new MemoryMonitor(config);
        // 启动监控
        monitor.start();
    }
    catch (error) {
        console.error('启动内存监控时出错:', error);
        process.exit(1);
    }
}
/**
 * 打印帮助信息
 */
function printHelp() {
    console.log(`
内存监控工具使用说明:

选项:
  --interval <毫秒>         设置监控间隔，默认5000毫秒
  --memory-threshold <百分比> 设置系统内存警告阈值，默认80%
  --heap-threshold <百分比>  设置堆内存警告阈值，默认70%
  --gc-threshold <百分比>    设置自动垃圾回收阈值，默认75%
  --save-interval <秒>      设置报告保存间隔，默认300秒，0表示不自动保存
  --history-size <数量>      设置保留的采样历史数量，默认720个点
  --quiet                   不在控制台输出常规采样
  --help                    显示此帮助信息

示例:
  npm run memory-monitor -- --interval 10000 --memory-threshold 85 --quiet
  npm run memory-monitor -- --gc-threshold 80 --save-interval 600
  `);
}
// 检查运行环境
if (!global.gc && process.argv.indexOf('--expose-gc') === -1) {
    console.warn('\n⚠️ 警告: 未启用 --expose-gc 选项，无法手动触发垃圾回收');
    console.warn('为获得完整功能，请使用以下命令运行:');
    console.warn('node --expose-gc memory-monitor.js\n');
}
// 执行主函数
if (require.main === module) {
    main();
}
//# sourceMappingURL=memory_monitor.js.map