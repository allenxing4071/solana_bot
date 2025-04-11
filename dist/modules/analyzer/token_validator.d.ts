/**
 * 代币验证器(鱼类安全检测系统)
 * 负责验证代币的合法性和安全性，包括白名单/黑名单检查
 *
 * 【编程基础概念通俗比喻】
 * 1. 验证器 = 渔船上的鱼类检测仪:
 *    就像渔船上用来区分安全和危险鱼类的专业设备
 *    例如：validateToken() 就像是"鱼类安全扫描"功能
 *
 * 2. 白名单/黑名单 = 已知安全/危险鱼类图鉴:
 *    记录了已知的安全鱼类和危险鱼类信息
 *    例如：whitelist 就像是"优质鱼类图鉴"，blacklist 就像是"有毒鱼类警示录"
 *
 * 3. 模式匹配 = 鱼类特征识别:
 *    根据鱼的外观特征来识别潜在危险
 *    例如：blacklistPatterns 就像是"危险鱼类特征数据库"
 *
 * 4. 代币信息 = 鱼类档案:
 *    记录每种鱼的详细信息和特性
 *    例如：TokenInfo 就像是"鱼类百科信息卡"
 *
 * 【比喻解释】
 * 这个模块就像渔船上的鱼类检验站：
 * - 负责检查捕获的每条鱼是否安全可食(代币是否可交易)
 * - 维护着已知安全鱼类和危险鱼类的名录(白名单和黑名单)
 * - 能够识别某些危险鱼类的共同特征(模式匹配)
 * - 定期更新鱼类图鉴(重新加载名单)，保持信息最新
 */
import { PublicKey } from '@solana/web3.js';
import type { TokenInfo } from '../../core/types';
/**
 * 代币验证结果接口
 *
 * 【比喻解释】
 * 就像鱼类检验后的检测报告：
 * - 包含这条鱼是否安全可食(isValid)
 * - 鱼的基本信息(token)
 * - 如果不安全，标明具体原因(reason)
 * - 安全风险评分(riskScore)
 * - 是否是已知的优质鱼种(isWhitelisted)
 * - 是否是已知的危险鱼种(isBlacklisted)
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
 *
 * 【比喻解释】
 * 这就像渔船上的鱼类安全检测站：
 * - 维护着安全和危险鱼类的完整档案(白名单和黑名单)
 * - 能够按照多种标准评估鱼的安全性(验证规则)
 * - 定期更新鱼类知识库(自动重新加载)
 * - 为捕获的每条鱼提供详细的安全报告(验证结果)
 *
 * 【编程语法通俗翻译】
 * class = 一种完整设备：包含多个相关功能的整套系统
 * private = 内部组件：设备内部的零件，外部无法直接操作
 * Map = 索引表：快速查找的名录本，通过ID直接找到对应信息
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
     *
     * 【比喻解释】
     * 就像鱼类检测站的初始化和首次启动：
     * - 加载所有已知的鱼类安全数据
     * - 确保设备准备就绪可以开始工作
     */
    constructor();
    /**
     * 加载代币白名单和黑名单
     *
     * 【比喻解释】
     * 就像更新渔船的鱼类图鉴数据库：
     * - 从存储中读取最新的鱼类信息
     * - 确保优质鱼类图鉴(白名单)是最新的
     * - 更新危险鱼类警示录(黑名单)
     * - 记录此次更新的时间，方便定期检查
     *
     * 【编程语法通俗翻译】
     * async = 需要等待的任务：像是派人去取最新的图鉴，需要等他回来
     * try/catch = 安全操作：尝试完成任务，但准备好处理可能出现的问题
     * fs.existsSync = 检查是否存在：确认图鉴书是否在书架上
     */
    loadTokenLists(): Promise<void>;
    /**
     * 加载白名单
     * @param tokens 白名单代币条目
     *
     * 【比喻解释】
     * 就像更新优质鱼类图鉴：
     * - 清空旧的图鉴内容
     * - 添加每种已知安全鱼类的详细信息
     * - 记录总共有多少种安全鱼类
     */
    private loadWhitelist;
    /**
     * 加载黑名单
     * @param tokens 黑名单代币条目
     * @param patterns 黑名单模式
     *
     * 【比喻解释】
     * 就像更新危险鱼类警示录：
     * - 清空旧的警示录内容
     * - 添加每种已知危险鱼类的信息
     * - 更新危险鱼类的识别特征库
     * - 记录总共有多少种危险鱼类和识别特征
     */
    private loadBlacklist;
    /**
     * 检查是否需要重新加载代币列表
     *
     * 【比喻解释】
     * 就像定期检查鱼类图鉴是否需要更新：
     * - 查看上次更新图鉴的时间
     * - 如果已经过了预设的更新周期，则获取最新版本
     * - 确保渔船总是使用最新的鱼类安全信息
     */
    private checkAndReloadIfNeeded;
    /**
     * 验证代币
     * @param token 代币信息
     * @param liquidityUsd 流动性(美元)
     * @returns 验证结果
     *
     * 【比喻解释】
     * 就像检验捕获的鱼是否安全可食：
     * - 先检查是否是已知的优质鱼种(白名单)
     * - 再检查是否是已知的危险鱼种(黑名单)
     * - 分析鱼的各项指标(流动性、价格等)
     * - 生成一份详细的安全报告
     *
     * 【编程语法通俗翻译】
     * await = 耐心等待：某些检查需要时间，必须等结果出来才能继续
     * return = 出具报告：完成所有检查后，提供最终的安全评估结果
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
declare const tokenValidator: TokenValidator;
export default tokenValidator;
