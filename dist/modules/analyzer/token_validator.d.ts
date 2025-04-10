/**
 * 代币验证器
 * 负责验证代币的合法性和安全性，包括白名单/黑名单检查
 */
import { PublicKey } from '@solana/web3.js';
import type { TokenInfo } from '../../core/types';
/**
 * 代币验证结果接口
 */
interface TokenValidationResult {
    isValid: boolean;
    token: TokenInfo;
    reason?: string;
    riskScore?: number;
    isWhitelisted?: boolean;
    isBlacklisted?: boolean;
}
/**
 * 代币验证器
 * 负责检查代币是否符合交易条件，包括白名单/黑名单校验
 */
declare class TokenValidator {
    private whitelist;
    private blacklist;
    private blacklistPatterns;
    private tokenFilters;
    private lastLoadTime;
    private readonly RELOAD_INTERVAL;
    /**
     * 构造函数
     */
    constructor();
    /**
     * 加载代币白名单和黑名单
     */
    loadTokenLists(): Promise<void>;
    /**
     * 加载白名单
     * @param tokens 白名单代币条目
     */
    private loadWhitelist;
    /**
     * 加载黑名单
     * @param tokens 黑名单代币条目
     * @param patterns 黑名单模式
     */
    private loadBlacklist;
    /**
     * 检查是否需要重新加载代币列表
     */
    private checkAndReloadIfNeeded;
    /**
     * 验证代币
     * @param token 代币信息
     * @param liquidityUsd 流动性（美元）
     * @returns 验证结果
     */
    validateToken(token: TokenInfo, liquidityUsd?: number): Promise<TokenValidationResult>;
    /**
     * 异步更新代币信息
     * @param token 代币信息
     * @returns 更新后的代币信息
     */
    enrichTokenInfo(token: TokenInfo): Promise<TokenInfo>;
    /**
     * 检查代币是否在白名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在白名单中
     */
    isWhitelisted(mintAddress: string | PublicKey): boolean;
    /**
     * 检查代币是否在黑名单中
     * @param mintAddress 代币Mint地址
     * @returns 是否在黑名单中
     */
    isBlacklisted(mintAddress: string | PublicKey): boolean;
    /**
     * 获取已知的代币信息
     * @param mintAddress 代币Mint地址
     * @returns 代币信息或null
     */
    getKnownToken(mintAddress: string | PublicKey): TokenInfo | null;
}
export declare const tokenValidator: TokenValidator;
export default tokenValidator;
