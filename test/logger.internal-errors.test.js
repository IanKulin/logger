import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
  getCapturedErrors,
  clearCapturedErrors,
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

  describe('Caller Detection Error Handling', () => {
    it('should return default values when caller detection fails completely', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'json' });

      // Mock Error constructor to create an error with no usable stack
      const originalError = Error;
      global.Error = class extends originalError {
        constructor(...args) {
          super(...args);
          // Create a stack that will cause the detection to fail
          this.stack = null;
        }
      };

      try {
        logger.info('test message');

        // Restore everything before assertions
        global.Error = originalError;

        const parsed = JSON.parse(getCapturedLogs()[0]);
        assert.strictEqual(parsed.callerFile, 'unknown');
        assert.strictEqual(parsed.callerLine, 0);
        assert.strictEqual(parsed.msg, 'test message');
      } finally {
        global.Error = originalError;
      }
    });

    it('should suppress caller error messages after threshold', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'json' });

      // Mock Error constructor to create errors with no usable stack
      const originalError = Error;
      global.Error = class extends originalError {
        constructor(...args) {
          super(...args);
          // Set stack to something that will cause the parsing to fail
          Object.defineProperty(this, 'stack', {
            get() {
              throw new Error('Stack access failed');
            },
          });
        }
      };

      try {
        // Call logger 7 times to exceed the threshold (5)
        for (let i = 0; i < 7; i++) {
          logger.info(`test message ${i + 1}`);
        }

        // Restore everything before assertions
        global.Error = originalError;

        // Should have logged 7 messages despite caller errors
        assert.strictEqual(getCapturedLogs().length, 7);

        // Should have exactly 6 console.error calls
        assert.strictEqual(getCapturedErrors().length, 6);
      } finally {
        global.Error = originalError;
      }
    });

    it('should handle stack trace parsing errors gracefully', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Mock Error to return a malformed stack
      const originalError = Error;
      global.Error = class extends originalError {
        constructor(...args) {
          super(...args);
          this.stack = 'Not a valid stack trace format';
        }
      };

      try {
        logger.info('test message');

        global.Error = originalError;

        const parsed = JSON.parse(getCapturedLogs()[0]);
        // Should fall back to defaults
        assert.strictEqual(parsed.callerFile, 'unknown');
        assert.strictEqual(parsed.callerLine, 0);
        assert.strictEqual(parsed.msg, 'test message');
      } finally {
        global.Error = originalError;
      }
    });
  });
});
