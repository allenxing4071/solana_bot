/**
 * 查询特征提取器
 * 分析用户查询的语言、领域、复杂度等特征
 */

// 语言检测正则表达式
const CHINESE_REGEX = /[\u4e00-\u9fa5]/g;
const ENGLISH_REGEX = /[a-zA-Z]/g;
const CODE_REGEX = /```[a-z]*[\s\S]*?```|\$\$([\s\S]*?)\$\$|`[^`]+`|import |def |function |class |const |var |let |if \(|for \(|while \(|\{\s*[\w]+:|\s*return |SELECT |FROM |WHERE |BEGIN\s+TRANSACTION/i;
const MATH_REGEX = /\$\$([\s\S]*?)\$\$|\\\(.*\\\)|\\\[.*\\\]|[∫∬∮∯∰∱∲∳∂∇√∛∜∝∞≠≈≤≥±⟨⟩⊥∠∟∥∦∧∨∩∪⊂⊃⊆⊇⊕⊗]/;

// 领域关键词
const DOMAIN_KEYWORDS = {
  '编程': ['代码', '函数', '变量', '类', '对象', '接口', '算法', '调试', '程序', '编译', '开发', '工程', '模块', 'bug', '修复', '优化'],
  '创意': ['创意', '故事', '写作', '小说', '诗歌', '创作', '灵感', '想象', '表达', '艺术', '风格', '情感', '人物', '设计', '剧情'],
  '数学': ['数学', '方程', '计算', '函数', '概率', '统计', '证明', '定理', '数列', '向量', '积分', '导数', '线性代数'],
  '翻译': ['翻译', '中英', '英中', '中文', '英文', '英语', '中国语', '对照', '句子结构'],
  '常识': ['解释', '什么是', '介绍', '定义', '概念', '原理', '工作原理', '如何运作', '为什么'],
  '商业': ['商业', '市场', '营销', '策略', '经济', '金融', '企业', '投资', '管理', '分析', '预测', '报告', '计划', '项目', '团队']
};

/**
 * 提取查询的特征
 * @param {string} query 用户查询文本
 * @returns {Object} 查询特征
 */
function extractFeatures(query) {
  if (!query || typeof query !== 'string') {
    return {
      language: 'unknown',
      domain: 'general',
      complexity: 50
    };
  }
  
  // 提取语言特征
  const language = detectLanguage(query);
  
  // 提取领域特征
  const domain = detectDomain(query);
  
  // 计算复杂度
  const complexity = calculateComplexity(query);
  
  return {
    language,
    domain,
    complexity
  };
}

/**
 * 检测查询的主要语言
 * @param {string} text 查询文本
 * @returns {string} 语言类型(中文/英文/混合)
 */
function detectLanguage(text) {
  const chineseChars = (text.match(CHINESE_REGEX) || []).length;
  const englishChars = (text.match(ENGLISH_REGEX) || []).length;
  
  // 计算中英文字符比例
  const totalChars = text.length;
  const chineseRatio = chineseChars / totalChars;
  const englishRatio = englishChars / totalChars;
  
  // 根据比例判断语言
  if (chineseRatio > 0.2) {
    return englishRatio > 0.3 ? 'mixed' : 'chinese';
  } else if (englishRatio > 0.3) {
    return 'english';
  } else {
    return 'unknown';
  }
}

/**
 * 检测查询的领域
 * @param {string} text 查询文本
 * @returns {string} 领域类型
 */
function detectDomain(text) {
  // 代码检测
  if (CODE_REGEX.test(text)) {
    return 'programming';
  }
  
  // 数学检测
  if (MATH_REGEX.test(text)) {
    return 'math';
  }
  
  // 基于关键词的领域检测
  const lowerText = text.toLowerCase();
  
  // 计算每个领域的关键词匹配数
  const domainScores = {};
  
  Object.keys(DOMAIN_KEYWORDS).forEach(domain => {
    const keywords = DOMAIN_KEYWORDS[domain];
    let matchCount = 0;
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    });
    
    // 计算得分 (匹配数 / 关键词总数)
    domainScores[domain] = matchCount / keywords.length;
  });
  
  // 找出得分最高的领域
  let maxScore = 0;
  let detectedDomain = 'general';
  
  Object.keys(domainScores).forEach(domain => {
    if (domainScores[domain] > maxScore) {
      maxScore = domainScores[domain];
      detectedDomain = domain;
    }
  });
  
  // 得分过低时归为通用领域
  return maxScore >= 0.1 ? detectedDomain : 'general';
}

/**
 * 计算查询的复杂度
 * @param {string} text 查询文本
 * @returns {number} 复杂度得分(0-100)
 */
function calculateComplexity(text) {
  // 基本复杂度指标
  let complexity = 0;
  
  // 1. 长度因素 (最高30分)
  const lengthScore = Math.min(text.length / 300 * 30, 30);
  complexity += lengthScore;
  
  // 2. 句子复杂度 (最高40分)
  const sentences = text.split(/[。.!?！？]/g).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / (sentences.length || 1);
  const sentenceScore = Math.min(avgSentenceLength / 40 * 40, 40);
  complexity += sentenceScore;
  
  // 3. 特殊模式 (最高30分)
  let specialPatternScore = 0;
  
  // 代码片段 (+20)
  if (CODE_REGEX.test(text)) {
    specialPatternScore += 20;
  }
  
  // 数学表达式 (+15)
  if (MATH_REGEX.test(text)) {
    specialPatternScore += 15;
  }
  
  // 逗号、分号、括号等复杂标点 (最高10分)
  const complexPunctuations = (text.match(/[,;:()\[\]{}"'，；：（）【】「」""'']/g) || []).length;
  const punctuationScore = Math.min(complexPunctuations / 10 * 10, 10);
  specialPatternScore += punctuationScore;
  
  // 限制特殊模式得分上限
  complexity += Math.min(specialPatternScore, 30);
  
  // 确保复杂度在0-100范围内
  return Math.min(Math.max(Math.round(complexity), 0), 100);
}

module.exports = extractFeatures; 