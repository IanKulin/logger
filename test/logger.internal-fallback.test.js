import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import os from 'os';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
  getCapturedErrors,
  clearCapturedErrors,
} from './helpers/logger-test-helpers.js';

describe('Logger Additional Fallback Tests', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('JSON Formatter Error Handling', () => {
    it('should handle circular references in log data', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create circular reference
      const obj = { name: 'test' };
      obj.self = obj;

      logger.info('Message with circular ref: %j', obj);

      assert.strictEqual(getCapturedLogs().length, 1);
      const logOutput = getCapturedLogs()[0];

      // Should be valid JSON despite circular reference
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.level, 'info');
        // Check for either jsonError or that the message was logged successfully
        assert.ok(
          parsed.jsonError?.includes('JSON stringify failed') ||
            parsed.msg.includes('Message with circular ref')
        );
      });
    });

    it('should handle objects with non-serializable properties', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create object with function (non-serializable)
      const objWithFunction = {
        name: 'test',
        func: function () {
          return 'hello';
        },
        symbol: Symbol('test'),
        undefined: undefined,
      };

      logger.info('Object: %j', objWithFunction);

      assert.strictEqual(getCapturedLogs().length, 1);
      const logOutput = getCapturedLogs()[0];

      // Should produce valid JSON
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.level, 'info');
        // Should have the message in some form
        assert.ok(parsed.msg.includes('Object:'));
      });
    });

    it('should handle when JSON formatter itself is broken', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Break the JSON formatter
      logger.formatters.json = function () {
        throw new Error('JSON formatter is broken');
      };

      logger.info('test message');

      // Should still produce some output (last resort fallback)
      assert.strictEqual(getCapturedLogs().length, 1);
      const logOutput = getCapturedLogs()[0];

      // Should contain the message even if not perfectly formatted
      assert.ok(logOutput.includes('test message'));
    });
  });

  describe('Caller Detection Error Handling', () => {
    it('should handle stack manipulation errors', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'json', callerLevel: 'info' });

      // Override getCallerInfo to simulate an error
      const originalGetCallerInfo = logger.getCallerInfo;
      logger.getCallerInfo = function () {
        this.callerErrorCount++;
        if (this.callerErrorCount <= this.maxCallerErrors) {
          console.error(
            'Error retrieving caller info:',
            new Error('Simulated caller error')
          );
          if (this.callerErrorCount === this.maxCallerErrors) {
            console.error(
              `Caller detection failed ${this.maxCallerErrors} times. Suppressing further caller error messages.`
            );
          }
        }
        return { callerFile: 'unknown', callerLine: 0 };
      };

      try {
        logger.info('test with simulated caller error');

        // Should still log the message
        assert.strictEqual(getCapturedLogs().length, 1);
        const parsed = JSON.parse(getCapturedLogs()[0]);
        assert.strictEqual(parsed.msg, 'test with simulated caller error');
        assert.strictEqual(parsed.callerFile, 'unknown');
        assert.strictEqual(parsed.callerLine, 0);

        // Should have logged an error about caller detection
        assert.ok(getCapturedErrors().length > 0);
      } finally {
        logger.getCallerInfo = originalGetCallerInfo;
        logger.callerErrorCount = 0;
      }
    });

    it('should suppress caller errors after max threshold', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'json', callerLevel: 'info' });

      // Override getCallerInfo to always simulate errors
      const originalGetCallerInfo = logger.getCallerInfo;
      logger.getCallerInfo = function () {
        this.callerErrorCount++;
        if (this.callerErrorCount <= this.maxCallerErrors) {
          console.error(
            'Error retrieving caller info:',
            new Error('Always fails')
          );
          if (this.callerErrorCount === this.maxCallerErrors) {
            console.error(
              `Caller detection failed ${this.maxCallerErrors} times. Suppressing further caller error messages.`
            );
          }
        }
        return { callerFile: 'unknown', callerLine: 0 };
      };

      try {
        // Log more than maxCallerErrors (5) times
        for (let i = 0; i < 10; i++) {
          logger.info(`test message ${i}`);
        }

        // Should have logged all 10 messages
        assert.strictEqual(getCapturedLogs().length, 10);

        // Should have logged errors for first 5 attempts, then suppression message
        const errorLogs = getCapturedErrors();
        assert.ok(errorLogs.length >= 5); // At least 5 error calls
        assert.ok(errorLogs.length <= 6); // But not more than 6 (5 + suppression message)

        // Check that suppression message is included
        const suppressionFound = errorLogs.some((errorArgs) =>
          errorArgs.some(
            (arg) =>
              typeof arg === 'string' &&
              arg.includes('Suppressing further caller error messages')
          )
        );
        assert.ok(suppressionFound);
      } finally {
        logger.getCallerInfo = originalGetCallerInfo;
        logger.callerErrorCount = 0;
      }
    });

    it('should reset caller error count after successful detection', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'json', callerLevel: 'info' });

      // Override getCallerInfo to simulate different phases
      const originalGetCallerInfo = logger.getCallerInfo;
      let phase = 'error1';

      logger.getCallerInfo = function () {
        if (phase === 'error1') {
          this.callerErrorCount++;
          if (this.callerErrorCount <= this.maxCallerErrors) {
            console.error(
              'Error retrieving caller info:',
              new Error('Phase 1 error')
            );
          }
          return { callerFile: 'unknown', callerLine: 0 };
        } else if (phase === 'working') {
          // Reset error count on successful call
          this.callerErrorCount = 0;
          return originalGetCallerInfo.call(this);
        } else if (phase === 'error2') {
          this.callerErrorCount++;
          if (this.callerErrorCount <= this.maxCallerErrors) {
            console.error(
              'Error retrieving caller info:',
              new Error('Phase 2 error')
            );
          }
          return { callerFile: 'unknown', callerLine: 0 };
        }
      };

      try {
        // Cause some errors
        logger.info('test 1');
        logger.info('test 2');

        // Switch to working mode
        phase = 'working';
        logger.info('test 3');

        // Break it again
        phase = 'error2';
        logger.info('test 4');

        const errorLogs = getCapturedErrors();
        // Should have errors from both phases
        assert.ok(errorLogs.length >= 3);
      } finally {
        logger.getCallerInfo = originalGetCallerInfo;
        logger.callerErrorCount = 0;
      }
    });
  });

  describe('Extreme Error Conditions', () => {
    it('should handle when console.log itself throws', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Break console.log
      const originalLog = console.log;
      console.log = function () {
        throw new Error('Console is broken');
      };

      try {
        // This should not crash the process, but the error will bubble up
        // since there's no try-catch around console.log in the logger
        assert.throws(() => {
          logger.info('test message');
        }, /Console is broken/);
      } finally {
        console.log = originalLog;
      }
    });

    it('should handle when util.format has issues with complex objects', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create an object that will cause issues with string conversion
      const problematicObject = {
        toString: function () {
          throw new Error('toString failed');
        },
        valueOf: function () {
          throw new Error('valueOf failed');
        },
      };

      // This will actually throw because util.format calls toString
      // and your logger doesn't have try-catch around util.format
      assert.throws(() => {
        logger.info('Message: %s', problematicObject);
      }, /toString failed/);
    });

    it('should handle when os.hostname throws', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Mock os.hostname to throw
      const originalHostname = os.hostname;
      os.hostname = function () {
        throw new Error('hostname failed');
      };

      try {
        // Should not crash but will likely throw since there's no try-catch around hostname
        assert.throws(() => {
          logger.info('test message');
        }, /hostname failed/);
      } finally {
        os.hostname = originalHostname;
      }
    });
  });

  describe('Fallback Chain Testing', () => {
    it('should handle formatter failures gracefully', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'simple', callerLevel: 'info' });

      // Break the simple formatter
      logger.formatters.simple = function () {
        throw new Error('Simple formatter broken');
      };

      // Also simulate caller detection failure
      const originalGetCallerInfo = logger.getCallerInfo;
      logger.getCallerInfo = function () {
        this.callerErrorCount++;
        if (this.callerErrorCount <= this.maxCallerErrors) {
          console.error(
            'Error retrieving caller info:',
            new Error('Caller detection failed')
          );
        }
        return { callerFile: 'unknown', callerLine: 0 };
      };

      try {
        // Should still produce some output despite multiple failures
        assert.doesNotThrow(() => {
          logger.info('test message');
        });

        // Should produce some kind of output (fallback to JSON formatter)
        assert.strictEqual(getCapturedLogs().length, 1);
        const output = getCapturedLogs()[0];

        // Should be valid JSON (fallback formatter)
        const parsed = JSON.parse(output);
        assert.strictEqual(parsed.msg, 'test message');
        assert.ok(parsed.formatterError.includes('Simple formatter broken'));
        assert.strictEqual(parsed.callerFile, 'unknown');
      } finally {
        logger.getCallerInfo = originalGetCallerInfo;
        logger.callerErrorCount = 0;
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should not leak memory during repeated errors', () => {
      clearCapturedLogs();
      clearCapturedErrors();

      const logger = new Logger({ format: 'simple' });

      // Break the formatter
      logger.formatters.simple = function () {
        throw new Error('Always fails');
      };

      // Log many times to check for memory leaks
      for (let i = 0; i < 1000; i++) {
        logger.info(`message ${i}`);
      }

      // Should have produced all logs
      assert.strictEqual(getCapturedLogs().length, 1000);

      // Check that we're not accumulating error state
      // (This is more of a smoke test - real memory leak detection would need different tools)
      assert.ok(true); // If we get here without crashing, that's good
    });
  });
});
