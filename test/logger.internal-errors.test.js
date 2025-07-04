import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

describe('Logger Internal Error Handling', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('Formatter Error Handling', () => {
    it('should fall back to JSON formatter when custom formatter throws', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });

      // Replace the simple formatter with one that throws
      logger.formatters.simple = function () {
        throw new Error('Custom formatter error');
      };

      logger.info('test message');

      // Should still produce output using JSON formatter fallback
      assert.strictEqual(getCapturedLogs().length, 1);

      // Should be valid JSON (fallback to JSON formatter)
      const logOutput = getCapturedLogs()[0];
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.msg, 'test message');
        assert.ok(
          parsed.formatterError.includes(
            'Formatter failed: Custom formatter error'
          )
        );
      });
    });

    it('should not crash when formatter returns non-string', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });

      // Replace formatter with one that returns an object instead of string
      logger.formatters.simple = function () {
        return { notAString: true };
      };

      logger.info('test message');

      // Should still produce output (fallback should handle this)
      assert.strictEqual(getCapturedLogs().length, 1);

      // Should be valid JSON from fallback
      const logOutput = getCapturedLogs()[0];
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.msg, 'test message');
      });
    });

    it('should preserve original formatters after error', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });

      // Temporarily break the formatter
      const originalSimple = logger.formatters.simple;
      logger.formatters.simple = function () {
        throw new Error('Temporary error');
      };

      logger.info('first message');

      // Restore the formatter
      logger.formatters.simple = originalSimple;

      logger.info('second message');

      // First message should have used fallback, second should work normally
      assert.strictEqual(getCapturedLogs().length, 2);

      // First log should be JSON (fallback)
      assert.doesNotThrow(() => JSON.parse(getCapturedLogs()[0]));

      // Second log should be simple format
      assert.ok(getCapturedLogs()[1].includes('[INFO ]'));
      assert.ok(getCapturedLogs()[1].includes('second message'));
    });

    it('should handle repeated formatter failures without memory leaks', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });

      // Break the formatter
      logger.formatters.simple = function () {
        throw new Error('Always fails');
      };

      // Log many times
      for (let i = 0; i < 100; i++) {
        logger.info(`message ${i}`);
      }

      // Should have produced 100 fallback logs
      assert.strictEqual(getCapturedLogs().length, 100);

      // All should be valid JSON (fallback format)
      getCapturedLogs().forEach((log) => {
        assert.doesNotThrow(() => JSON.parse(log));
      });
    });
  });
});
