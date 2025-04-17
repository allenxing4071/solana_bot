/**
 * 命令优先级解析器
 * 用于解析用户指定的模型优先级
 */

const { logger } = require('../utils/logger');

class CommandPriorityParser {
    constructor() {
        this.priorityPattern = /^>([a-zA-Z0-9-_.]+)\s+/; // 匹配 >模型名称 格式
    }

    /**
     * 解析指令优先级
     * @param {string} input 用户输入
     * @returns {Object} 解析结果
     */
    parseCommand(input) {
        const match = input.match(this.priorityPattern);
        if (match) {
            logger.log(`检测到优先级指令，指定模型: ${match[1]}`);
            return {
                hasPriority: true,
                specifiedModel: match[1],
                content: input.replace(this.priorityPattern, '')
            };
        }
        return {
            hasPriority: false,
            content: input
        };
    }
}

module.exports = CommandPriorityParser; 