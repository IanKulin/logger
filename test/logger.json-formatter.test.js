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

describe('Logger JSON Formatter', () => {
  before(setupMocks);
  after(restoreMocks);

  describe('Basic JSON Output', () => {
    it('should produce valid JSON output', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('test message');

      assert.strictEqual(getCapturedLogs().length, 1);
      const logOutput = getCapturedLogs()[0];

      // Should be valid JSON
      assert.doesNotThrow(() => {
        JSON.parse(logOutput);
      });
    });

    it('should include all required fields in JSON output', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json', callerLevel: 'info' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();

      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.levelNumber, 2);
      assert.strictEqual(parsed.msg, 'test message');
      assert.strictEqual(typeof parsed.time, 'string');
      assert.strictEqual(typeof parsed.pid, 'number');
      assert.strictEqual(typeof parsed.hostname, 'string');
      assert.ok(parsed.callerFile);
      assert.strictEqual(typeof parsed.callerLine, 'number');
    });

    it('should format timestamp correctly based on time option', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json', time: 'short' });
      logger.info('test message');

      const parsed = getFirstLogAsJSON();
      // Should be short format, not ISO
      assert.ok(parsed.time.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/));
      assert.ok(!parsed.time.includes('T'));
      assert.ok(!parsed.time.includes('Z'));
    });
  });

  describe('JSON Error Handling', () => {
    it('should handle circular references in log entry', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create a circular reference by modifying the logger's formatters
      const originalJsonFormatter = logger.formatters.json;
      logger.formatters.json = function (logEntry) {
        // Add a circular reference to the logEntry
        const circular = { self: null };
        circular.self = circular;
        logEntry.circular = circular;

        // Call the original formatter which should handle the error
        return originalJsonFormatter.call(this, logEntry);
      };

      logger.info('test with circular reference');

      const logOutput = getCapturedLogs()[0];
      // Should be valid JSON despite circular reference
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        // Should contain error information
        assert.ok(parsed.jsonError.includes('JSON stringify failed'));
        assert.strictEqual(parsed.msg, 'test with circular reference');
      });
    });

    it('should handle JSON stringify errors with fallback', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create a problematic object that will cause JSON.stringify to fail
      const problematic = {};
      Object.defineProperty(problematic, 'badProp', {
        get() {
          throw new Error('Property access error');
        },
        enumerable: true,
      });

      // Test the formatter directly with a problematic object
      const problematicLogEntry = {
        level: 'info',
        msg: 'test message',
        problematic: problematic,
      };

      const result = logger.formatters.json(problematicLogEntry);

      // Should produce valid JSON with error info
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(result);
        assert.ok(parsed.jsonError.includes('JSON stringify failed'));
      });
    });

    it('should handle extreme JSON stringify failures', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });

      // Create an object that will fail even the safe fallback
      // by mocking JSON.stringify to always throw
      const originalStringify = JSON.stringify;
      let callCount = 0;

      JSON.stringify = function (...args) {
        callCount++;
        if (callCount <= 2) {
          throw new Error('Mock JSON error');
        }
        return originalStringify.apply(this, args);
      };

      try {
        const result = logger.formatters.json({
          level: 'error',
          msg: 'test message',
        });

        // Should still produce valid JSON string even after multiple failures
        assert.doesNotThrow(() => {
          const parsed = JSON.parse(result);
          assert.strictEqual(parsed.level, 'error');
          assert.strictEqual(parsed.msg, 'test message');
          assert.ok(parsed.jsonError.includes('Multiple JSON errors occurred'));
        });
      } finally {
        JSON.stringify = originalStringify;
      }
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle special characters', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('Special chars: "quotes", \\backslash, \nnewline');

      // Should produce valid JSON despite special characters
      assert.doesNotThrow(() => {
        JSON.parse(getCapturedLogs()[0]);
      });
    });

    it('should handle empty messages', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('');

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.msg, '');
    });

    it('should handle null and undefined arguments', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('Value: %s', null);

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.msg, 'Value: null');
    });

    it('should handle very long messages', () => {
      clearCapturedLogs();
      const longMessage = 'x'.repeat(10000);
      const logger = new Logger({ format: 'json' });
      logger.info(longMessage);

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.msg, longMessage);
    });

    it('should handle objects in messages', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      const obj = { key: 'value', nested: { prop: 123 } };
      logger.info('Object: %j', obj);

      const parsed = getFirstLogAsJSON();
      assert.ok(parsed.msg.includes('{"key":"value","nested":{"prop":123}}'));
    });
  });

  describe('All Log Levels in JSON', () => {
    it('should log error messages with correct level', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.error('error message');

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.level, 'error');
      assert.strictEqual(parsed.levelNumber, 0);
    });

    it('should log warn messages with correct level', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.warn('warn message');

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.level, 'warn');
      assert.strictEqual(parsed.levelNumber, 1);
    });

    it('should log info messages with correct level', () => {
      clearCapturedLogs();
      const logger = new Logger({ format: 'json' });
      logger.info('info message');

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.level, 'info');
      assert.strictEqual(parsed.levelNumber, 2);
    });

    it('should log debug messages with correct level', () => {
      clearCapturedLogs();
      const logger = new Logger({ level: 'debug', format: 'json' });
      logger.debug('debug message');

      const parsed = getFirstLogAsJSON();
      assert.strictEqual(parsed.level, 'debug');
      assert.strictEqual(parsed.levelNumber, 3);
    });
  });
});
