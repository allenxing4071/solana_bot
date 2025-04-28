import { MarketNotification } from '../../types/notifications.js';
import { RiskNotification } from '../../types/notifications.js';
import { SystemNotification } from '../../types/notifications.js';
import { TradeNotification } from '../../types/notifications.js';

export type Notification = MarketNotification | RiskNotification | SystemNotification | TradeNotification;

export class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: Notification) => void)[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public addListener(listener: (notification: Notification) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (notification: Notification) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public notify(notification: Notification): void {
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
} 