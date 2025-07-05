import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import Logger from '../lib/logger.js';

describe('Logger util.format functionality', () => {
  let outputs = [];
  let originalWrite;

  beforeEach(() => {
    outputs = [];
    originalWrite = process.stdout.write;
    process.stdout.write = (chunk) => {
      outputs.push(chunk.toString());
      return true;
    };
  });

  afterEach(() => {
    process.stdout.write = originalWrite;
  });

  describe('Format specifiers', () => {
    it('should handle %s string formatting', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('User %s logged in', 'john');

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'User john logged in');
    });

    it('should handle %d number formatting', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('User has %d points', 100);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'User has 100 points');
    });

    it('should handle %i integer formatting', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Value: %i', 42.7);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Value: 42');
    });

    it('should handle %f float formatting', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Price: %f', 19.99);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Price: 19.99');
    });

    it('should handle %j JSON formatting', () => {
      const logger = new Logger({ format: 'json' });
      const obj = { name: 'test', value: 42 };
      logger.info('Config: %j', obj);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Config: {"name":"test","value":42}');
    });

    it('should handle %% literal percentage', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Progress: 50%% complete');

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Progress: 50%% complete');
    });
  });

  describe('Multiple format specifiers', () => {
    it('should handle multiple format specifiers', () => {
      const logger = new Logger({ format: 'json' });
      logger.info(
        'User %s has %d points and %f%% completion',
        'alice',
        150,
        75.5
      );

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(
        output.msg,
        'User alice has 150 points and 75.5% completion'
      );
    });

    it('should handle mixed format specifiers with JSON', () => {
      const logger = new Logger({ format: 'json' });
      const config = { debug: true, port: 3000 };
      logger.info(
        'Server %s running on port %d with config %j',
        'api',
        8080,
        config
      );

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(
        output.msg,
        'Server api running on port 8080 with config {"debug":true,"port":3000}'
      );
    });
  });

  describe('Multiple arguments without format specifiers', () => {
    it('should handle multiple arguments without format specifiers', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Message', 'arg1', 'arg2', 123);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Message arg1 arg2 123');
    });

    it('should handle mixed objects and primitives', () => {
      const logger = new Logger({ format: 'json' });
      const obj = { key: 'value' };
      logger.info('Data:', obj, 42, true);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, "Data: { key: 'value' } 42 true");
    });
  });

  describe('Edge cases', () => {
    it('should handle more format specifiers than arguments', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Hello %s, you are %d years old', 'John');

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Hello John, you are %d years old');
    });

    it('should handle more arguments than format specifiers', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Hello %s', 'John', 'extra', 'args', 123);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Hello John extra args 123');
    });

    it('should handle null and undefined values', () => {
      const logger = new Logger({ format: 'json' });
      logger.info('Values: %s %s %d', null, undefined, null);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Values: null undefined 0');
    });

    it('should handle arrays and objects without %j', () => {
      const logger = new Logger({ format: 'json' });
      const arr = [1, 2, 3];
      const obj = { a: 1 };
      logger.info('Data %s and %s', arr, obj);

      const output = JSON.parse(outputs[0]);
      assert.strictEqual(output.msg, 'Data [ 1, 2, 3 ] and { a: 1 }');
    });
  });

  describe('Simple format output', () => {
    it('should format messages correctly in simple format', () => {
      const logger = new Logger({ format: 'simple' });
      logger.info('User %s has %d points', 'bob', 200);

      const output = outputs[0];
      assert.match(output, /User bob has 200 points/);
    });

    it('should handle JSON formatting in simple format', () => {
      const logger = new Logger({ format: 'simple' });
      const data = { status: 'active', count: 5 };
      logger.warn('Status: %j', data);

      const output = outputs[0];
      assert.match(output, /Status: {"status":"active","count":5}/);
    });
  });

  describe('Error handling in util.format', () => {
    it('should handle objects that throw during toString', () => {
      const logger = new Logger({ format: 'json' });
      const problematicObj = {
        toString() {
          throw new Error('toString failed');
        },
      };

      try {
        logger.info('Object: %s', problematicObj);
      } catch (error) {
        assert.strictEqual(error.message, 'toString failed');
      }
    });

    it('should handle circular references with %j', () => {
      const logger = new Logger({ format: 'json' });
      const circular = { name: 'test' };
      circular.self = circular;

      logger.info('Circular: %j', circular);

      const output = JSON.parse(outputs[0]);
      assert.match(output.msg, /Circular: \[Circular\]/);
    });
  });
});
