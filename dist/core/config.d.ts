/**
 * 配置管理模块
 * 负责加载、解析和提供系统配置参数
 */
import { DexType, StrategyConfig, SecurityConfig } from './types';
/**
 * 网络配置接口
 */
interface NetworkConfig {
    cluster: string;
    rpcUrl: string;
    wsUrl: string;
}
/**
 * 钱包配置接口
 */
interface WalletConfig {
    privateKey: string;
    maxTransactionAmount: number;
}
/**
 * DEX配置接口
 */
interface DexConfig {
    name: DexType;
    programId: string;
    enabled: boolean;
}
/**
 * 监控配置接口
 */
interface MonitoringConfig {
    poolMonitorInterval: number;
    priceCheckInterval: number;
    healthCheckInterval: number;
}
/**
 * 通知配置接口
 */
interface NotificationConfig {
    telegram: {
        enabled: boolean;
        botToken: string | null;
        chatId: string | null;
        events: Record<string, boolean>;
    };
}
/**
 * 日志配置接口
 */
interface LoggingConfig {
    level: string;
    console: boolean;
    file: boolean;
    filename: string;
    maxFiles: number;
    maxSize: string;
}
/**
 * Jito MEV配置接口
 */
interface JitoConfig {
    enabled: boolean;
    tipPercent: number;
    authKeypair: string | null;
}
/**
 * 完整配置接口
 */
export interface AppConfig {
    network: NetworkConfig;
    wallet: WalletConfig;
    dexes: DexConfig[];
    monitoring: MonitoringConfig;
    trading: StrategyConfig;
    security: SecurityConfig;
    notification: NotificationConfig;
    logging: LoggingConfig;
    jitoMev: JitoConfig;
}
export declare const appConfig: {
    network: NetworkConfig;
    wallet: WalletConfig;
    dexes: DexConfig[];
    monitoring: MonitoringConfig;
    trading: StrategyConfig;
    security: SecurityConfig;
    notification: NotificationConfig;
    logging: LoggingConfig;
    jitoMev: JitoConfig;
};
export default appConfig;
