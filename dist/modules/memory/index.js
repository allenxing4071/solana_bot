"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryExtension = exports.memoryOptimizer = exports.MemoryExtension = exports.MemoryOptimizer = void 0;
const memory_optimizer_1 = __importStar(require("./memory_optimizer"));
exports.memoryOptimizer = memory_optimizer_1.default;
Object.defineProperty(exports, "MemoryOptimizer", { enumerable: true, get: function () { return memory_optimizer_1.MemoryOptimizer; } });
const memory_extension_1 = __importStar(require("./memory_extension"));
exports.memoryExtension = memory_extension_1.default;
Object.defineProperty(exports, "MemoryExtension", { enumerable: true, get: function () { return memory_extension_1.MemoryExtension; } });
// 默认导出内存扩展模块
exports.default = memory_extension_1.default;
