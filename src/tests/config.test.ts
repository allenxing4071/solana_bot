import { AppConfig } from '../core/config.js';
import { ConfigLoader } from '../utils/config_loader.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Configuration Tests', () => {
  let configLoader: ConfigLoader;
  let config: AppConfig;

  beforeAll(async () => {
    configLoader = ConfigLoader.getInstance();
    const configPath = path.join(__dirname, '../../config/production.json');
    config = await configLoader.loadConfig(configPath) as AppConfig;
  });

  test('should load wallet configuration correctly', () => {
    expect(config.wallet).toBeDefined();
    expect(config.wallet.privateKey).toBeDefined();
    expect(config.wallet.maxTransactionAmount).toBeDefined();
    expect(typeof config.wallet.maxTransactionAmount).toBe('number');
  });

  test('should load network configuration correctly', () => {
    expect(config.network).toBeDefined();
    expect(config.network.rpcUrl).toBeDefined();
    expect(config.network.wsUrl).toBeDefined();
    expect(config.network.cluster).toBeDefined();
  });

  test('should load dexes configuration correctly', () => {
    expect(config.dexes).toBeDefined();
    expect(Array.isArray(config.dexes)).toBe(true);
    config.dexes.forEach(dex => {
      expect(dex.name).toBeDefined();
      expect(dex.programId).toBeDefined();
      expect(dex.enabled).toBeDefined();
    });
  });

  test('should load trading configuration correctly', () => {
    expect(config.trading).toBeDefined();
    expect(config.trading.buyStrategy).toBeDefined();
    expect(config.trading.sellStrategy).toBeDefined();
    expect(config.trading.maxTransactionAmount).toBeDefined();
  });

  test('should load security configuration correctly', () => {
    expect(config.security).toBeDefined();
    expect(config.security.tokenValidation).toBeDefined();
    expect(config.security.transactionSafety).toBeDefined();
  });

  test('should load notification configuration correctly', () => {
    expect(config.notification).toBeDefined();
    expect(config.notification.telegram).toBeDefined();
    expect(config.notification.telegram.events).toBeDefined();
  });
}); 