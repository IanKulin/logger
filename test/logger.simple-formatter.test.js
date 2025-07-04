import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
  setTTYMode,
  restoreTTY,
} from './helpers/logger-test-helpers.js';

describe('Logger Simple Formatter', () => {
  before(setupMocks);
  after(() => {
    restoreMocks();
    restoreTTY();
  });

  describe('Basic Simple Format', () => {
    it('should produce simple text format', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('test message');

      assert.strictEqual(getCapturedLogs().length, 1);
      const logOutput = getCapturedLogs()[0];

      // Should contain timestamp, level, caller, and message
      assert.ok(logOutput.includes('[INFO ]'));
      assert.ok(logOutput.includes('test message'));
      // Should contain short timestamp by default
      assert.ok(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
    });

    it('should pad log levels correctly', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple', level: 'debug' });
      logger.error('error msg');
      logger.debug('debug msg');

      const logs = getCapturedLogs();
      assert.ok(logs[0].includes('[ERROR]'));
      assert.ok(logs[1].includes('[DEBUG]'));
    });

    it('should include caller information', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('test message');

      const logOutput = getCapturedLogs()[0];
      // Should contain filename and line number
      assert.ok(logOutput.includes('.js:'));
    });

    it('should format with long timestamp when specified', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple', time: 'long' });
      logger.info('test message');

      const logOutput = getCapturedLogs()[0];

      // Should contain long time format in brackets
      assert.ok(
        logOutput.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
      assert.ok(logOutput.includes('T'));
      assert.ok(logOutput.includes('Z'));
    });
  });

  describe('All Log Levels in Simple Format', () => {
    it('should format error level correctly', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.error('error message');

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('[ERROR]'));
      assert.ok(logOutput.includes('error message'));
    });

    it('should format warn level correctly', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.warn('warn message');

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('[WARN ]'));
      assert.ok(logOutput.includes('warn message'));
    });

    it('should format info level correctly', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('info message');

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('[INFO ]'));
      assert.ok(logOutput.includes('info message'));
    });

    it('should format debug level correctly', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple', level: 'debug' });
      logger.debug('debug message');

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('[DEBUG]'));
      assert.ok(logOutput.includes('debug message'));
    });
  });

  describe('Color Handling', () => {
    it('should include color codes when output is TTY', () => {
      clearCapturedLogs();
      setTTYMode(true);
      const logger = new Logger({ format: 'simple' });
      logger.error('error message');

      const logOutput = getCapturedLogs()[0];
      // Should contain ANSI color codes
      assert.ok(logOutput.includes('\x1b[91m')); // red for error
      assert.ok(logOutput.includes('\x1b[0m')); // reset
    });

    it('should not include color codes when output is redirected', () => {
      clearCapturedLogs();
      setTTYMode(false);
      const logger = new Logger({ format: 'simple' });
      logger.error('error message');

      const logOutput = getCapturedLogs()[0];
      // Should not contain ANSI color codes
      assert.ok(!logOutput.includes('\x1b['));
    });

    it('should use appropriate colors for different levels', () => {
      clearCapturedLogs();
      setTTYMode(true);
      const logger = new Logger({ format: 'simple', level: 'debug' });

      logger.error('error');
      logger.warn('warn');
      logger.info('info');
      logger.debug('debug');

      const logs = getCapturedLogs();

      // Error should be red
      assert.ok(logs[0].includes('\x1b[91m'));
      // Warn should be yellow
      assert.ok(logs[1].includes('\x1b[33m'));
      // Info and debug might have different or no colors, but should have reset codes
      assert.ok(logs[2].includes('\x1b[0m'));
      assert.ok(logs[3].includes('\x1b[0m'));
    });

    it('should respect custom color configuration', () => {
      clearCapturedLogs();
      setTTYMode(true);
      const logger = new Logger({
        format: 'simple',
        colours: {
          error: '\x1b[31m', // different red
          warn: '\x1b[35m', // magenta instead of yellow
        },
      });

      logger.error('error message');
      logger.warn('warn message');

      const logs = getCapturedLogs();
      assert.ok(logs[0].includes('\x1b[31m'));
      assert.ok(logs[1].includes('\x1b[35m'));
    });
  });

  describe('Message Formatting in Simple Mode', () => {
    it('should handle multiple arguments', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('Hello %s, you are %d years old', 'John', 25);

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('Hello John, you are 25 years old'));
    });

    it('should handle special characters', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('Special chars: "quotes", \\backslash, \nnewline');

      const logOutput = getCapturedLogs()[0];
      assert.ok(logOutput.includes('Special chars: "quotes"'));
    });

    it('should handle empty messages', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.info('');

      const logOutput = getCapturedLogs()[0];
      // Should still have the level and timestamp parts
      assert.ok(logOutput.includes('[INFO ]'));
    });
  });

  describe('TTY Detection Integration', () => {
    it('should detect TTY mode changes correctly', () => {
      clearCapturedLogs();

      // Test with TTY
      setTTYMode(true);
      const ttyLogger = new Logger({ format: 'simple' });
      ttyLogger.error('tty error');

      // Test without TTY
      setTTYMode(false);
      const noTtyLogger = new Logger({ format: 'simple' });
      noTtyLogger.error('no tty error');

      const logs = getCapturedLogs();

      // First should have colors, second should not
      assert.ok(logs[0].includes('\x1b['));
      assert.ok(!logs[1].includes('\x1b['));
    });
  });
});
