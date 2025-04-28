import { MessageOptions } from '../../types/notifications.js';

interface QueuedMessage {
  id: string;
  message: string;
  options: MessageOptions;
  retryCount: number;
  createdAt: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed';
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5秒
  private readonly maxQueueSize: number = 1000;

  constructor() {
    this.startProcessing();
  }

  async enqueue(message: string, options: MessageOptions): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error('Message queue is full');
    }

    const queuedMessage: QueuedMessage = {
      id: this.generateId(),
      message,
      options,
      retryCount: 0,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(queuedMessage);
    console.log(`Message queued: ${queuedMessage.id}`);
  }

  private async startProcessing(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.processing) {
      if (this.queue.length > 0) {
        const message = this.queue[0];
        try {
          message.status = 'processing';
          await this.processMessage(message);
          this.queue.shift(); // 处理成功后移除消息
        } catch (error) {
          console.error(`Failed to process message ${message.id}:`, error);
          message.status = 'failed';
          message.retryCount++;

          if (message.retryCount >= this.maxRetries) {
            console.error(`Message ${message.id} failed after ${this.maxRetries} retries`);
            this.queue.shift(); // 达到最大重试次数后移除消息
          } else {
            // 将消息移到队列末尾等待重试
            this.queue.push(this.queue.shift()!);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          }
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 队列为空时等待1秒
      }
    }
  }

  private async processMessage(message: QueuedMessage): Promise<void> {
    // 这里应该调用实际的发送逻辑
    // 目前只是一个占位实现
    console.log(`Processing message: ${message.id}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    message.status = 'sent';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  stopProcessing(): void {
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueStatus(): QueuedMessage[] {
    return [...this.queue];
  }
} 