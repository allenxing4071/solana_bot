/**
 * 风险监控配置接口
 */
export interface RiskConfig {
  // 滑点监控配置
  slippage: {
    enabled: boolean;
    thresholds: {
      low: number;    // 低风险阈值
      medium: number; // 中等风险阈值
      high: number;   // 高风险阈值
    };
    checkInterval: number; // 检查间隔（毫秒）
  };
  
  // 余额监控配置
  balance: {
    enabled: boolean;
    thresholds: {
      low: number;    // 低余额警告阈值（SOL）
      medium: number; // 中等余额警告阈值（SOL）
      high: number;   // 高余额警告阈值（SOL）
    };
    checkInterval: number; // 检查间隔（毫秒）
  };
  
  // 交易限额监控配置
  limit: {
    enabled: boolean;
    thresholds: {
      daily: number;  // 每日交易限额（SOL）
      single: number; // 单笔交易限额（SOL）
    };
    resetInterval: number; // 限额重置间隔（毫秒）
  };
}

/**
 * 风险数据接口
 */
export interface RiskData {
  slippage?: {
    current: number;
    token: string;
    timestamp: number;
  };
  
  balance?: {
    current: number;
    timestamp: number;
  };
  
  limit?: {
    daily: {
      used: number;
      remaining: number;
    };
    single: {
      lastAmount: number;
      timestamp: number;
    };
  };
} 