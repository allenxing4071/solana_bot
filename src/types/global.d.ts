/**
 * 全局类型定义
 */

// 扩展Error类型确保typescript能正确识别error对象转换
interface Error {
  message: string;
  name: string;
  stack?: string;
}

// 确保logger不会对unknown类型产生编译错误
declare namespace NodeJS {
  interface Global {
    // 允许将任何类型转换为Record<string, unknown>
    [key: string]: unknown;
  }
} 