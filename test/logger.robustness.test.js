import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';
import {
  setupMocks,
  restoreMocks,
  getCapturedLogs,
  clearCapturedLogs,
} from './helpers/logger-test-helpers.js';

describe('Logger Robustness', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('Edge Cases and Data Handling', () => {
    it('should not crash on logging errors', () => {
      clearCapturedLogs();
      const logger = new Logger();

      // This should not throw
      assert.doesNotThrow(() => {
        logger.info('test message');
      });
    });

    it('should handle undefined and null messages gracefully', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // These should not crash
      assert.doesNotThrow(() => {
        logger.info(undefined);
        logger.info(null);
      });

      const logs = getCapturedLogs();
      assert.strictEqual(logs.length, 2);

      const parsed1 = JSON.parse(logs[0]);
      const parsed2 = JSON.parse(logs[1]);

      assert.strictEqual(parsed1.msg, 'undefined');
      assert.strictEqual(parsed2.msg, 'null');
    });

    it('should handle extremely large messages', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      const hugeMessage = 'x'.repeat(100000);

      assert.doesNotThrow(() => {
        logger.info(hugeMessage);
      });

      const parsed = JSON.parse(getCapturedLogs()[0]);
      assert.strictEqual(parsed.msg, hugeMessage);
    });

    it('should handle circular objects in message formatting', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      const circular = { name: 'test' };
      circular.self = circular;

      assert.doesNotThrow(() => {
        logger.info('Circular: %j', circular);
      });

      // Should still log something
      assert.strictEqual(getCapturedLogs().length, 1);
    });
  });

  describe('Performance and Memory', () => {
    it('should handle rapid consecutive logging without issues', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      assert.doesNotThrow(() => {
        for (let i = 0; i < 1000; i++) {
          logger.info(`rapid message ${i}`);
        }
      });

      assert.strictEqual(getCapturedLogs().length, 1000);
    });

    it('should handle repeated logging operations efficiently', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'simple' });

      const startTime = Date.now();

      // Log a reasonable number of messages
      for (let i = 0; i < 500; i++) {
        logger.info(`performance test message ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      assert.ok(duration < 5000, `Logging took too long: ${duration}ms`);
      assert.strictEqual(getCapturedLogs().length, 500);
    });

    it('should handle mixed format types in rapid succession', () => {
      clearCapturedLogs();
      const jsonLogger = new Logger({ format: 'json' });
      const simpleLogger = new Logger({ format: 'simple' });

      assert.doesNotThrow(() => {
        for (let i = 0; i < 50; i++) {
          jsonLogger.info(`json message ${i}`);
          simpleLogger.info(`simple message ${i}`);
        }
      });

      assert.strictEqual(getCapturedLogs().length, 100);
    });
  });

  describe('Complex Data Structures', () => {
    it('should handle deeply nested objects', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      const deepObject = {
        level1: { level2: { level3: { level4: { value: 'deep' } } } },
      };

      assert.doesNotThrow(() => {
        logger.info('Deep object: %j', deepObject);
      });

      assert.strictEqual(getCapturedLogs().length, 1);
    });

    it('should handle arrays with mixed data types', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      const mixedArray = [
        1,
        'string',
        { obj: true },
        [1, 2, 3],
        null,
        undefined,
      ];

      assert.doesNotThrow(() => {
        logger.info('Mixed array: %j', mixedArray);
      });

      assert.strictEqual(getCapturedLogs().length, 1);
    });

    it('should handle special characters and unicode', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      const specialMessage = 'Special chars: \n\t\r\\"\'🚀 Unicode: こんにちは';

      assert.doesNotThrow(() => {
        logger.info(specialMessage);
      });

      const parsed = JSON.parse(getCapturedLogs()[0]);
      assert.strictEqual(parsed.msg, specialMessage);
    });
  });
});
