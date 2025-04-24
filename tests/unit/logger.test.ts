import logger from '../../src/core/logger';
import * as winston from 'winston';

// 模拟winston库
jest.mock('winston', () => {
  const mocked = {
    format: {
      timestamp: jest.fn().mockReturnValue({}),
      colorize: jest.fn().mockReturnValue({}),
      printf: jest.fn().mockReturnValue({}),
      combine: jest.fn().mockReturnValue({}),
      json: jest.fn().mockReturnValue({}),
      errors: jest.fn().mockReturnValue({})
    },
    createLogger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      http: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      add: jest.fn()
    }),
    transports: {
      Console: jest.fn(),
      DailyRotateFile: jest.fn()
    },
    addColors: jest.fn()
  };
  return mocked;
});

describe('Logger', () => {
  let mockedWinstonLogger: any;

  beforeEach(() => {
    // 在每个测试前重置winston的mock状态
    jest.clearAllMocks();
    mockedWinstonLogger = (winston.createLogger as jest.Mock)();
  });

  test('should create a logger with correct configuration', () => {
    expect(winston.createLogger).toHaveBeenCalled();
    expect(winston.format.combine).toHaveBeenCalled();
    expect(winston.transports.Console).toHaveBeenCalled();
  });

  test('should log debug messages correctly', () => {
    const message = 'Test debug message';
    const module = 'TestModule';
    const meta = { test: 'data' };

    logger.debug(message, module, meta);

    expect(mockedWinstonLogger.debug).toHaveBeenCalledWith(message, { module, meta });
  });

  test('should log info messages correctly', () => {
    const message = 'Test info message';
    const module = 'TestModule';
    const meta = { test: 'data' };

    logger.info(message, module, meta);

    expect(mockedWinstonLogger.info).toHaveBeenCalledWith(message, { module, meta });
  });

  test('should log warning messages correctly', () => {
    const message = 'Test warning message';
    const module = 'TestModule';
    const meta = { test: 'data' };

    logger.warn(message, module, meta);

    expect(mockedWinstonLogger.warn).toHaveBeenCalledWith(message, { module, meta });
  });

  test('should log error messages correctly with Error object', () => {
    const message = 'Test error message';
    const module = 'TestModule';
    const error = new Error('Test error');

    logger.error(message, module, error);

    expect(mockedWinstonLogger.error).toHaveBeenCalledWith(message, {
      module,
      stack: error.stack,
      meta: {
        name: error.name,
        message: error.message
      }
    });
  });

  test('should log error messages correctly with meta data', () => {
    const message = 'Test error message';
    const module = 'TestModule';
    const meta = { test: 'data' };

    logger.error(message, module, meta);

    expect(mockedWinstonLogger.error).toHaveBeenCalledWith(message, { module, meta });
  });

  test('should log HTTP messages correctly', () => {
    const message = 'Test HTTP message';
    const requestId = 'req123';
    const module = 'TestModule';
    const meta = { test: 'data' };

    logger.http(message, requestId, module, meta);

    expect(mockedWinstonLogger.http).toHaveBeenCalledWith(message, { module, requestId, meta });
  });
}); 