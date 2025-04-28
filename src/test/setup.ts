import { beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';

declare global {
  var vi: {
    fn: () => MockInstance;
    clearAllMocks: () => void;
    resetAllMocks: () => void;
  };
}

// 设置其他全局配置
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.resetAllMocks();
}); 