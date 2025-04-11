/**
 * 交易构建器（捕鱼装备制造工坊）
 * 负责构建Solana交易指令
 *
 * 【编程基础概念通俗比喻】
 * 1. 交易构建(Transaction Building) = 捕鱼装备组装：
 *    就像渔船上的工匠为不同捕鱼任务准备合适的网具和工具
 *    例如：buildSwapTransaction()就像根据捕捞目标配置专用渔网
 *
 * 2. 交易指令(Transaction Instruction) = 捕鱼工具组件：
 *    就像构成完整捕鱼装备的各个零件和部件
 *    例如：addPriorityFeeInstruction()就像给渔网添加特殊重物让它更快沉入水中
 *
 * 3. 签名者(Signers) = 捕鱼许可证：
 *    就像证明这次捕捞行动合法性的官方文件和印章
 *    例如：params.wallet就像船长签名的捕捞许可证
 *
 * 4. DEX(Decentralized Exchange) = 不同的捕鱼场所：
 *    就像海洋中不同的捕鱼区域，每个区域有特定的捕鱼规则
 *    例如：Raydium, Orca, Jupiter就像不同的海湾，每个都有特殊的水流和鱼群
 *
 * 5. 滑点(Slippage) = 捕捞损耗容忍度：
 *    就像渔民愿意接受的鱼群逃脱比例
 *    例如：slippageBps就像设定"即使有10%的鱼逃脱也要继续捕捞"的容忍度
 *
 * 【比喻解释】
 * 这个模块就像渔船上的捕鱼装备制造工坊：
 * - 根据不同鱼类特征制作专用渔具（不同DEX的交易）
 * - 精确计算每种渔网的设计参数（交易参数）
 * - 为不同海域的水流特性调整装备（不同DEX的适配）
 * - 确保捕捞装备符合海洋法规（交易验证）
 * - 预估每种装备的捕获效率（价格影响和费用）
 * - 提供完整的装备使用说明（交易结果）
 */
import { PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { DexType, PoolInfo, TokenInfo } from '../../core/types';
/**
 * 代币交换参数接口
 * 定义交换操作所需的各项参数
 *
 * 【比喻解释】
 * 这就像一份捕鱼装备制作清单：
 * - 捕捞地点信息(poolInfo)：在哪片水域捕捞
 * - 用于交换的货币(tokenIn)：用什么作为交换
 * - 目标捕获物(tokenOut)：想要捕获的鱼种
 * - 投入数量(amountIn)：投入多少交换货币
 * - 最低收获量(minAmountOut)：至少要捕获多少才算成功
 * - 损耗容忍度(slippageBps)：能接受多少捕获损失
 * - 捕捞许可(wallet)：谁拥有这次捕捞的权利
 * - 有效期限(deadline)：捕捞行动的有效时间
 * - 推荐人(referrer)：谁推荐了这片渔场
 */
interface SwapParams {
    poolInfo: PoolInfo;
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    amountIn: bigint;
    minAmountOut: bigint;
    slippageBps?: number;
    wallet: Keypair;
    deadline?: number;
    referrer?: PublicKey;
}
/**
 * 交易构建状态接口
 * 定义交易构建过程的结果信息
 *
 * 【比喻解释】
 * 这就像制作完成的捕鱼装备交付单：
 * - 完整捕鱼装备(transaction)：组装好的整套渔具
 * - 授权证明(signers)：使用这套装备的合法证明
 * - 预计捕获量(expectedOutAmount)：预估能捕到的鱼量
 * - 对鱼群的惊扰度(estimatedPriceImpact)：这种装备对鱼群的惊吓程度
 * - 装备成本(estimatedFee)：使用这套装备的消耗成本
 * - 装备缺陷(error)：如果装备有问题，描述具体问题
 */
interface TransactionBuildResult {
    transaction: Transaction;
    signers: Keypair[];
    expectedOutAmount?: bigint;
    estimatedPriceImpact?: number;
    estimatedFee?: number;
    error?: string;
}
/**
 * 交易构建器类
 * 负责构建Solana交易，提供不同DEX的交易构建实现
 *
 * 【比喻解释】
 * 这就像渔船上的捕鱼装备制造工坊：
 * - 拥有与海洋的通讯设备（链接节点）
 * - 掌握不同海域的捕鱼装备设计图（不同DEX交易构建）
 * - 能根据目标鱼种定制最合适的渔具（构建交易）
 * - 精通各种特殊装备的加工技艺（特殊交易指令）
 * - 提供装备使用指南和预期效果（交易结果预测）
 * - 确保所有装备符合海洋法规（交易验证）
 *
 * 【编程语法通俗翻译】
 * class = 专业工坊：一个拥有专业设备和技术的制造车间
 * private = 内部工具：只有工坊内部能使用的专用工具
 */
declare class TransactionBuilder {
    private connection;
    private priorityFee;
    /**
     * 构造函数
     * 初始化交易构建器
     *
     * 【比喻解释】
     * 这就像建立一个捕鱼装备制造工坊：
     * - 安装与海洋通信的设备（初始化连接）
     * - 设置船只加速的燃料配置（优先级费用）
     * - 向船长报告工坊已准备就绪（日志记录）
     *
     * 【编程语法通俗翻译】
     * constructor = 工坊建立：准备和配置专业的制造工坊
     */
    constructor();
    /**
     * 构建代币交换交易
     * 根据指定参数构建交易指令
     *
     * 【比喻解释】
     * 这就像根据捕捞需求定制专用渔具：
     * - 接收详细的捕捞任务需求（交换参数）
     * - 确认在哪片海域进行捕捞（DEX类型）
     * - 根据不同海域的特性选择合适的装备设计（不同DEX构建）
     * - 精心制作完整的捕捞装备（构建交易）
     * - 提供装备使用指南和预期效果（返回结果）
     * - 如果制作过程出现问题，报告具体原因（错误处理）
     *
     * 【编程语法通俗翻译】
     * async = 耗时工艺：制作专业装备需要一定时间
     * try/catch = 安全措施：制作过程中可能出现问题需要妥善处理
     *
     * @param params 交换参数，就像详细的捕捞任务需求
     * @param dexOverride 指定DEX，就像指定必须在某片海域捕捞
     * @returns 交易构建结果，就像制作完成的渔具及使用说明
     */
    buildSwapTransaction(params: SwapParams, dexOverride?: DexType): Promise<TransactionBuildResult>;
    /**
     * 构建Raydium交换交易
     * 专门为Raydium DEX构建交易指令
     *
     * 【比喻解释】
     * 这就像为"宁静海湾"（Raydium）定制专用捕鱼装备：
     * - 记录开始制作特定海域装备（日志记录）
     * - 准备一个全新的装备框架（新建交易）
     * - 附加使用这套装备的合法证明（签名者）
     * - 如果需要加速，添加特殊推进器（优先级费用）
     * - 确认海洋当前状态（获取最新区块）
     * - 按照"宁静海湾"的水流特性组装专用网具（构建指令）
     * - 提供完整的装备使用指南和效果预测（返回结果）
     *
     * 【编程语法通俗翻译】
     * private = 工坊秘方：工坊内部的专有技术
     * async = 精细工艺：需要时间完成的精密制作
     *
     * @param params 交换参数，就像详细的捕捞需求
     * @returns 交易构建结果，就像制作完成的专用渔具
     */
    private buildRaydiumSwap;
    /**
     * 构建Orca交换交易
     * 专门为Orca DEX构建交易指令
     *
     * 【比喻解释】
     * 这就像为"深海暗流"（Orca）定制专用捕鱼装备：
     * - 记录开始制作特定海域装备（日志记录）
     * - 准备一个全新的装备框架（新建交易）
     * - 附加使用这套装备的合法证明（签名者）
     * - 如果需要加速，添加特殊推进器（优先级费用）
     * - 确认海洋当前状态（获取最新区块）
     * - 按照"深海暗流"的水流特性组装专用网具（构建指令）
     * - 提供完整的装备使用指南和效果预测（返回结果）
     *
     * 【编程语法通俗翻译】
     * private = 工坊秘方：工坊内部的专有技术
     * async = 精细工艺：需要时间完成的精密制作
     *
     * @param params 交换参数，就像详细的捕捞需求
     * @returns 交易构建结果，就像制作完成的专用渔具
     */
    private buildOrcaSwap;
    /**
     * 构建Jupiter交换交易
     * @param params 交换参数
     * @returns 交易构建结果
     */
    private buildJupiterSwap;
    /**
     * 添加交易优先级指令
     * @param transaction 交易对象
     */
    private addPriorityFeeInstruction;
    /**
     * 构建代币转账交易
     * @param source 源钱包
     * @param destination 目标钱包
     * @param mint 代币铸造地址
     * @param amount 转账金额
     * @returns 交易构建结果
     */
    buildTokenTransferTransaction(source: Keypair, destination: PublicKey, mint: PublicKey, amount: bigint): Promise<TransactionBuildResult>;
    /**
     * 构建代币授权交易
     * @param owner 拥有者钱包
     * @param spender 被授权者地址
     * @param mint 代币铸造地址
     * @param amount 授权金额
     * @returns 交易构建结果
     */
    buildTokenApproveTransaction(owner: Keypair, spender: PublicKey, mint: PublicKey, amount: bigint): Promise<TransactionBuildResult>;
}
export declare const transactionBuilder: TransactionBuilder;
export default transactionBuilder;
