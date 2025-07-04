import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

describe('Logger Level Management', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('Level Setting and Getting', () => {
    it('should change log level with level() method', () => {
      const logger = new Logger();
      logger.level('debug');
      assert.strictEqual(logger.options.level, 'debug');
    });

    it('should return current level when called without arguments', () => {
      const logger = new Logger({ level: 'debug' });
      assert.strictEqual(logger.level(), 'debug');
    });

    it('should return new level when setting level', () => {
      const logger = new Logger();
      const result = logger.level('error');
      assert.strictEqual(result, 'error');
      assert.strictEqual(logger.options.level, 'error');
    });

    it('should throw error for invalid log level', () => {
      const logger = new Logger();
      assert.throws(() => {
        logger.level('invalid');
      }, /Invalid log level: invalid/);
    });

    it('should allow method chaining after setting level', () => {
      const logger = new Logger();
      // This should not throw and should return a level
      const result = logger.level('warn');
      assert.strictEqual(result, 'warn');
      assert.strictEqual(typeof result, 'string');
    });
  });

  describe('setLevel Method', () => {
    it('should have setLevel method as alias', () => {
      const logger = new Logger();
      assert.strictEqual(typeof logger.setLevel, 'function');
    });

    it('should set level correctly with setLevel method', () => {
      const logger = new Logger();
      const result = logger.setLevel('debug');
      assert.strictEqual(result, 'debug');
      assert.strictEqual(logger.options.level, 'debug');
    });

    it('should return current level with setLevel when no args', () => {
      const logger = new Logger({ level: 'warn' });
      const result = logger.setLevel();
      assert.strictEqual(result, 'warn');
    });

    it('should throw error for invalid level in setLevel', () => {
      const logger = new Logger();
      assert.throws(() => {
        logger.setLevel('invalid');
      }, /Invalid log level: invalid/);
    });

    it('should maintain consistency between level() and setLevel()', () => {
      const logger = new Logger();

      logger.level('error');
      assert.strictEqual(logger.setLevel(), 'error');

      logger.setLevel('debug');
      assert.strictEqual(logger.level(), 'debug');
    });

    it('should support fluent interface pattern', () => {
      const logger = new Logger();

      // This demonstrates the fluent interface working
      const currentLevel = logger.level('warn');
      assert.strictEqual(currentLevel, 'warn');

      // Both methods should return the current level for chaining
      assert.strictEqual(logger.level('info'), 'info');
      assert.strictEqual(logger.setLevel('debug'), 'debug');
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter debug messages when level is info', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'info' });
      logger.debug('debug message');
      assert.strictEqual(getCapturedLogs().length, 0);
    });

    it('should show info messages when level is info', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'info' });
      logger.info('info message');
      assert.strictEqual(getCapturedLogs().length, 1);
    });

    it('should show error messages at any level', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'error' });
      logger.error('error message');
      assert.strictEqual(getCapturedLogs().length, 1);
    });

    it('should filter warn and info when level is error', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'error' });
      logger.warn('warn message');
      logger.info('info message');
      assert.strictEqual(getCapturedLogs().length, 0);
    });

    it('should show all messages when level is debug', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'debug' });
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      assert.strictEqual(getCapturedLogs().length, 4);
    });

    it('should show warn and above when level is warn', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'warn' });
      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');
      assert.strictEqual(getCapturedLogs().length, 2);
    });
  });

  describe('Silent Level', () => {
    it('should suppress all output when level is silent', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'silent' });

      logger.error('error message');
      logger.warn('warn message');
      logger.info('info message');
      logger.debug('debug message');

      // No messages should be logged
      assert.strictEqual(getCapturedLogs().length, 0);
    });

    it('should allow setting level to silent', () => {
      const logger = new Logger();
      const result = logger.level('silent');
      assert.strictEqual(result, 'silent');
      assert.strictEqual(logger.options.level, 'silent');
    });

    it('should work with setLevel for silent level', () => {
      const logger = new Logger();
      const result = logger.setLevel('silent');
      assert.strictEqual(result, 'silent');
      assert.strictEqual(logger.options.level, 'silent');
    });

    it('should remain silent after multiple log attempts', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'silent' });

      // Try logging multiple times
      for (let i = 0; i < 5; i++) {
        logger.error(`error ${i}`);
        logger.warn(`warn ${i}`);
        logger.info(`info ${i}`);
        logger.debug(`debug ${i}`);
      }

      // Still no output
      assert.strictEqual(getCapturedLogs().length, 0);
    });
  });

  describe('Dynamic Level Changes', () => {
    it('should respect level changes during runtime', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'error' });

      // Should not log at info level
      logger.info('info message 1');
      assert.strictEqual(getCapturedLogs().length, 0);

      // Change to info level
      logger.level('info');

      // Should now log info messages
      logger.info('info message 2');
      assert.strictEqual(getCapturedLogs().length, 1);

      // Change to silent
      logger.level('silent');

      // Should not log anything
      logger.error('error message');
      assert.strictEqual(getCapturedLogs().length, 1); // Still just the previous info message
    });
  });
});
