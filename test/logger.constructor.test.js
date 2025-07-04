import { describe, it } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';

describe('Logger Constructor', () => {
  describe('Constructor Validation', () => {
    it('should throw error for invalid log level', () => {
      assert.throws(() => {
        new Logger({ level: 'invalid' });
      }, /Invalid log level: invalid. Valid levels are: silent, error, warn, info, debug/);
    });

    it('should throw error for invalid format', () => {
      assert.throws(() => {
        new Logger({ format: 'invalid' });
      }, /Invalid format: invalid. Valid formats are: json, simple/);
    });

    it('should throw error for invalid time option', () => {
      assert.throws(() => {
        new Logger({ time: 'invalid' });
      }, /Invalid time: invalid. Valid times are: long, short/);
    });

    it('should throw error for invalid callerLevel', () => {
      assert.throws(() => {
        new Logger({ callerLevel: 'invalid' });
      }, /Invalid callerLevel: invalid. Valid levels are: silent, error, warn, info, debug/);
    });

    it('should throw error for non-object colours', () => {
      assert.throws(() => {
        new Logger({ colours: 'not an object' });
      }, /colours option must be an object/);
    });

    it('should throw error for non-object levels', () => {
      assert.throws(() => {
        new Logger({ levels: 'not an object' });
      }, /levels option must be an object/);
    });

    it('should throw error for invalid level values', () => {
      assert.throws(() => {
        new Logger({ levels: { error: -1 } });
      }, /Level value for 'error' must be a non-negative integer/);

      assert.throws(() => {
        new Logger({ levels: { error: 'not a number' } });
      }, /Level value for 'error' must be a non-negative integer/);

      assert.throws(() => {
        new Logger({ levels: { error: 1.5 } });
      }, /Level value for 'error' must be a non-negative integer/);
    });

    it('should accept valid options without throwing', () => {
      assert.doesNotThrow(() => {
        new Logger({
          level: 'debug',
          format: 'simple',
          time: 'long',
          callerLevel: 'error',
          colours: { error: '\x1b[31m' },
          levels: { custom: 4 },
        });
      });
    });
  });

  describe('Default Options', () => {
    it('should instantiate with default options', () => {
      const logger = new Logger();
      assert.strictEqual(logger.options.level, 'info');
      assert.strictEqual(logger.options.format, 'json');
      assert.strictEqual(logger.options.time, 'short');
      assert.strictEqual(logger.options.callerLevel, 'warn');
      assert.deepStrictEqual(logger.options.levels, {
        silent: -1,
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
      });
    });

    it('should instantiate with custom options', () => {
      const logger = new Logger({
        level: 'debug',
        format: 'simple',
        time: 'long',
        callerLevel: 'error',
      });
      assert.strictEqual(logger.options.level, 'debug');
      assert.strictEqual(logger.options.format, 'simple');
      assert.strictEqual(logger.options.time, 'long');
      assert.strictEqual(logger.options.callerLevel, 'error');
    });

    it('should merge options correctly', () => {
      const customOptions = {
        level: 'debug',
        format: 'simple',
        time: 'long',
        colours: {
          error: '\x1b[31m', // different red
        },
      };

      const logger = new Logger(customOptions);

      assert.strictEqual(logger.options.level, 'debug');
      assert.strictEqual(logger.options.format, 'simple');
      assert.strictEqual(logger.options.time, 'long');
      assert.strictEqual(logger.options.colours.error, '\x1b[31m');
      // Should still have other default colors
      assert.strictEqual(logger.options.colours.warn, '\x1b[33m');
    });
  });

  describe('Method Availability', () => {
    it('should have all log level methods', () => {
      const logger = new Logger();
      assert.strictEqual(typeof logger.error, 'function');
      assert.strictEqual(typeof logger.warn, 'function');
      assert.strictEqual(typeof logger.info, 'function');
      assert.strictEqual(typeof logger.debug, 'function');
    });

    it('should have level management methods', () => {
      const logger = new Logger();
      assert.strictEqual(typeof logger.level, 'function');
      assert.strictEqual(typeof logger.setLevel, 'function');
    });
  });

  describe('TTY Detection', () => {
    const originalIsTTY = process.stdout.isTTY;

    function setTTYMode(isTTY) {
      process.stdout.isTTY = isTTY;
    }

    function restoreTTY() {
      process.stdout.isTTY = originalIsTTY;
    }

    it('should detect TTY correctly', () => {
      setTTYMode(true);
      const logger1 = new Logger();
      assert.strictEqual(logger1.isRedirected, false);

      setTTYMode(false);
      const logger2 = new Logger();
      assert.strictEqual(logger2.isRedirected, true);

      restoreTTY();
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with all existing constructor patterns', () => {
      // No options
      assert.doesNotThrow(() => {
        new Logger();
      });

      // Partial options
      assert.doesNotThrow(() => {
        new Logger({ level: 'debug' });
      });

      // Full options (without time)
      assert.doesNotThrow(() => {
        new Logger({
          level: 'warn',
          format: 'simple',
          colours: { error: '\x1b[31m' },
          levels: { custom: 5 },
        });
      });
    });
  });
});
