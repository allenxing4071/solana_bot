// 通知事件类型
export type NotificationEvent = 'trade' | 'error' | 'info' | 'warning';

// 通知优先级
export enum NotificationPriority {
  LOW = 'low',
  HIGH = 'high'
}

// 通知消息
export interface NotificationMessage {
  type: NotificationEvent;
  content: string;
  priority: NotificationPriority;
  timestamp: number;
}

// 通知组
export interface NotificationGroup {
  id: string;
  name: string;
  description?: string;
  chatId: string;
  events: NotificationEvent[];
  rules?: string[];
  created_at?: Date;
  updated_at?: Date;
}

// 通知历史
export interface NotificationHistory {
  id?: number;
  type: NotificationEvent;
  content: string;
  priority: NotificationPriority;
  groupId?: string;
  status: 'sent' | 'failed';
  error?: string;
  createdAt: Date;
}

export interface NotificationEventConfig {
  enabled: boolean;
  template: string;
}

export interface TelegramCommandsConfig {
  enabled: boolean;
  adminOnly: boolean;
  allowedUsers: string[];
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  events: Record<NotificationEvent, NotificationEventConfig>;
}

export interface NotificationConfig {
  telegram: TelegramConfig;
}

/**
 * 通知过滤规则接口
 */
export interface NotificationFilterRule {
  id: number;                     // 规则ID
  name: string;                   // 规则名称
  enabled: boolean;               // 是否启用
  event_type: NotificationEvent;  // 通知类型
  priority?: NotificationPriority;
  conditions: FilterCondition[];  // 过滤条件
  action: 'allow' | 'block';      // 动作
  created_at: Date;               // 创建时间
  updated_at: Date;               // 更新时间
}

/**
 * 过滤条件接口
 */
export interface FilterCondition {
  field: string;                  // 字段名
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains';  // 操作符
  value: string | number;         // 值
} 