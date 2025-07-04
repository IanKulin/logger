import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
  getFirstLogAsJSON,
} from './helpers/logger-test-helpers.js';

describe('Logger Time Formatting', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('Default Time Format', () => {
    it('should default to short time format', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      // Short format should be YYYY-MM-DD HH:MM (without seconds)
      assert.ok(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
      assert.ok(!parsed.time.includes('T'));
      assert.ok(!parsed.time.includes('Z'));
      assert.ok(!parsed.time.includes('.'));
    });

    it('should include time option in logger options', () => {
      const shortLogger = new Logger({ time: 'short' });
      const longLogger = new Logger({ time: 'long' });
      const defaultLogger = new Logger();

      assert.strictEqual(shortLogger.options.time, 'short');
      assert.strictEqual(longLogger.options.time, 'long');
      assert.strictEqual(defaultLogger.options.time, 'short'); // default
    });
  });

  describe('Short Time Format', () => {
    it("should format time as short when time option is 'short'", () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'short', format: 'json' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      // Short format: YYYY-MM-DD HH:MM
      assert.ok(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
      assert.strictEqual(parsed.time.length, 16);
    });

    it('should work with simple formatter and short time', () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'short', format: 'simple' });
      logger.info('test message');

      const logOutput = getCapturedLogs()[0];

      // Should contain short time format in brackets
      assert.ok(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
      assert.ok(!logOutput.includes('T'));
      assert.ok(!logOutput.includes('Z'));
    });

    it('should truncate time correctly in short format', () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'short', format: 'json' });

      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      // Short format should not have seconds or milliseconds
      assert.ok(
        !parsed.time.includes(':') || parsed.time.split(':').length === 2
      );
      assert.ok(!parsed.time.includes('.'));

      // Should be exactly 16 characters: YYYY-MM-DD HH:MM
      assert.strictEqual(parsed.time.length, 16);
    });
  });

  describe('Long Time Format', () => {
    it("should format time as long ISO string when time is 'long'", () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'long', format: 'json' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      // Long format should be full ISO string
      assert.ok(parsed.time.includes('T'));
      assert.ok(parsed.time.includes('Z'));
      assert.ok(parsed.time.includes('.'));

      // Should be valid ISO string
      assert.doesNotThrow(() => {
        new Date(parsed.time);
      });

      // Should match ISO format pattern
      assert.ok(
        parsed.time.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      );
    });

    it('should work with simple formatter and long time', () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'long', format: 'simple' });
      logger.info('test message');

      const logOutput = getCapturedLogs()[0];

      // Should contain long time format in brackets
      assert.ok(
        logOutput.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
      assert.ok(logOutput.includes('T'));
      assert.ok(logOutput.includes('Z'));
    });

    it('should preserve time precision in long format', () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'long', format: 'json' });

      const startTime = Date.now();
      logger.info('test message');
      const endTime = Date.now();

      const parsed = getFirstLogAsJSON();
      const logTime = new Date(parsed.time).getTime();

      // Log time should be within the test execution window
      assert.ok(logTime >= startTime);
      assert.ok(logTime <= endTime);

      // Should have millisecond precision
      assert.ok(parsed.time.includes('.'));
    });
  });

  describe('Time Format Consistency', () => {
    it('should use consistent time format across multiple log calls', () => {
      clearCapturedLogs();
      const logger = new Logger({ time: 'short', format: 'json' });

      logger.info('first message');
      logger.warn('second message');

      const logs = getCapturedLogs();
      const parsed1 = JSON.parse(logs[0]);
      const parsed2 = JSON.parse(logs[1]);

      // Both should use short format
      assert.ok(parsed1.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
      assert.ok(parsed2.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
    });
  });

  describe('Time Option Validation', () => {
    it('should validate time option in constructor', () => {
      // Valid options should not throw
      assert.doesNotThrow(() => {
        new Logger({ time: 'long' });
      });

      assert.doesNotThrow(() => {
        new Logger({ time: 'short' });
      });

      // Invalid option should throw
      assert.throws(() => {
        new Logger({ time: 'medium' });
      }, /Invalid time: medium. Valid times are: long, short/);

      assert.throws(() => {
        new Logger({ time: 'invalid' });
      }, /Invalid time: invalid. Valid times are: long, short/);
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain existing behavior for existing code', () => {
      clearCapturedLogs();

      // Code that doesn't specify time option should work as before
      const logger = new Logger({ format: 'json', level: 'info' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      // Should still have all expected fields
      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.msg, 'test message');
      assert.strictEqual(typeof parsed.time, 'string');
      assert.strictEqual(typeof parsed.pid, 'number');
      assert.strictEqual(typeof parsed.hostname, 'string');

      // Time should be in short format (new default)
      assert.ok(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
    });

    it('should not break existing simple formatter tests', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });
      logger.warn('warning message');

      const logOutput = getCapturedLogs()[0];

      // Should still contain expected elements
      assert.ok(logOutput.includes('[WARN ]'));
      assert.ok(logOutput.includes('warning message'));
      assert.ok(logOutput.includes('.js:'));

      // Should use short time format (new default)
      assert.ok(logOutput.match(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/));
    });
  });
});
