// 🌟 项目功能全览与完成度 - 结构化数据
export interface Feature {
  id: string;
  name: string;
  description: string;
  status: string;
  suggestion: string;
}

export const features: Feature[] = [
  {
    id: 'listener',
    name: '监听与事件捕获',
    description: '监听DEX合约事件，支持多DEX，WebSocket+轮询双机制。',
    status: '✅ 已实现，支持多种事件监听，具备备用机制。',
    suggestion: '可扩展更多DEX适配与事件类型，提升兼容性和实时性。'
  },
  {
    id: 'token-analyze',
    name: '代币分析与验证',
    description: '代币白/黑名单管理，安全评分，流动性与风险分析，元数据获取。',
    status: '✅ 已实现，支持多维度分析与验证。',
    suggestion: '引入更多链上/链下数据源，丰富安全因子，提升误报/漏报率。'
  },
  {
    id: 'trade',
    name: '交易模块',
    description: '交易构建、优化、执行与确认，支持错误处理和重试。',
    status: '✅ 已实现，支持多种交易场景与异常处理。',
    suggestion: '可引入更智能的滑点/手续费优化，支持更多交易类型（如批量、闪电贷等）。'
  },
  {
    id: 'strategy',
    name: '策略与风控',
    description: '多策略支持（止盈/止损/追踪止损）、资金分配、风险管理、自适应策略切换。',
    status: '✅ 已实现，策略框架灵活，支持扩展。',
    suggestion: '增加策略回测与自动调优，支持AI/机器学习策略。'
  },
  {
    id: 'monitor',
    name: '性能与健康监控',
    description: '系统健康监控、性能指标收集、异常检测与告警、API健康检查。',
    status: '✅ 已实现，API/系统/内存/性能多维监控。',
    suggestion: '可增加外部监控对接（如Prometheus）、更细粒度的指标与自愈机制。'
  },
  {
    id: 'memory',
    name: '内存与资源优化',
    description: '自动内存管理、垃圾回收、内存泄漏检测、资源限制与紧急清理。',
    status: '✅ 已实现，支持主动与被动优化。',
    suggestion: '可增加内存消耗点可视化、自动调参与历史趋势分析。'
  },
  {
    id: 'analysis',
    name: '数据分析与报告',
    description: '市场趋势分析、策略评估、收益与风险报告、自动生成定期报告。',
    status: '✅ 已实现，接口丰富，支持多维度分析。',
    suggestion: '可增加可视化报表、外部导出（如Excel/PDF）、自定义分析模板。'
  },
  {
    id: 'api',
    name: 'API服务与前端',
    description: 'RESTful API，支持代币、系统、池、交易、设置、统计等多路由，前端页面支持。',
    status: '✅ 已实现，API结构清晰，支持静态前端。',
    suggestion: 'API文档自动生成（如Swagger），前端UI/UX优化，增加权限与认证机制。'
  },
  {
    id: 'log',
    name: '日志与告警',
    description: '多级别日志、模块化记录、异常告警、操作审计。',
    status: '✅ 已实现，日志体系完善。',
    suggestion: '可对接外部日志平台，支持日志聚合与检索。'
  },
  {
    id: 'config',
    name: '配置与类型系统',
    description: '类型安全的配置加载、环境区分、动态热加载。',
    status: '✅ 已实现，已完全 ESM 化与类型对齐。',
    suggestion: '支持配置热更新、分布式配置中心对接。'
  }
];

// Telegram 菜单生成工具
import { Markup } from 'telegraf';

export function getMainMenu() {
  return Markup.inlineKeyboard(
    features.map(f => [Markup.button.callback(f.name, `feature_${f.id}`)]).concat([
      [Markup.button.callback('🌟 项目功能总览', 'feature_overview')]
    ])
  );
}

export function getFeatureDetailMenu(featureId: string) {
  const feature = features.find(f => f.id === featureId);
  if (!feature) return Markup.inlineKeyboard([[Markup.button.callback('返回主菜单', 'main_menu')]]);
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔙 返回主菜单', 'main_menu')]
  ]);
}

export function getFeatureDetailText(featureId: string) {
  const feature = features.find(f => f.id === featureId);
  if (!feature) return '未找到该功能点。';
  return `【${feature.name}】\n\n- 完成度：${feature.status}\n- 介绍：${feature.description}\n- 改进建议：${feature.suggestion}`;
}

export function getOverviewText() {
  return '🌟 项目功能全览与完成度\n\n' + features.map(f => `- ${f.name}：${f.status}`).join('\n');
} 