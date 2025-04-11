/**
 * 内存优化系统模块索引文件
 * 提供内存管理和优化相关的所有功能
 *
 * 【比喻解释】
 * 就像渔船的空间管理中心入口：
 * - 提供不同的内存管理工具和服务
 * - 统一导出所有内存相关的功能
 * - 方便系统其他部分引用和使用
 */
import memoryOptimizer, { MemoryOptimizer, MemoryOptimizerConfig, MemoryStats, MemoryConsumer } from './memory_optimizer';
import memoryExtension, { MemoryExtension, MemoryExtensionConfig } from './memory_extension';
export { MemoryOptimizer, MemoryOptimizerConfig, MemoryStats, MemoryConsumer, MemoryExtension, MemoryExtensionConfig };
export { memoryOptimizer, memoryExtension };
export default memoryExtension;
