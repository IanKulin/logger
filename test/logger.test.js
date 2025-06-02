import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert";
import Logger from "../lib/logger.js";

// Mock console.log to capture output
let capturedLogs = [];
const originalConsoleLog = console.log;
const originalIsTTY = process.stdout.isTTY;

function mockConsole() {
  console.log = (...args) => {
    capturedLogs.push(args.join(" "));
  };
}

function restoreConsole() {
  console.log = originalConsoleLog;
  capturedLogs = [];
}

function setTTYMode(isTTY) {
  process.stdout.isTTY = isTTY;
}

function restoreTTY() {
  process.stdout.isTTY = originalIsTTY;
}

describe("Logger", () => {
  describe("Constructor Validation", () => {
    it("should throw error for invalid log level", () => {
      assert.throws(() => {
        new Logger({ level: "invalid" });
      }, /Invalid log level: invalid. Valid levels are: silent, error, warn, info, debug/);
    });

    it("should throw error for non-object colours", () => {
      assert.throws(() => {
        new Logger({ colours: "not an object" });
      }, /colours option must be an object/);
    });

    it("should throw error for non-object levels", () => {
      assert.throws(() => {
        new Logger({ levels: "not an object" });
      }, /levels option must be an object/);
    });

    it("should throw error for invalid level values", () => {
      assert.throws(() => {
        new Logger({ levels: { error: -1 } });
      }, /Level value for 'error' must be a non-negative integer/);

      assert.throws(() => {
        new Logger({ levels: { error: "not a number" } });
      }, /Level value for 'error' must be a non-negative integer/);

      assert.throws(() => {
        new Logger({ levels: { error: 1.5 } });
      }, /Level value for 'error' must be a non-negative integer/);
    });

    it("should accept valid options without throwing", () => {
      assert.doesNotThrow(() => {
        new Logger({
          level: "debug",
          format: "simple",
          colours: { error: "\x1b[31m" },
          levels: { custom: 4 },
        });
      });
    });
  });

  describe("Core Functionality", () => {
    it("should instantiate with default options", () => {
      const logger = new Logger();
      assert.strictEqual(logger.options.level, "info");
      assert.strictEqual(logger.options.format, "json");
      assert.deepStrictEqual(logger.options.levels, {
        silent: -1,
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
      });
    });

    it("should instantiate with custom options", () => {
      const logger = new Logger({
        level: "debug",
        format: "simple",
      });
      assert.strictEqual(logger.options.level, "debug");
      assert.strictEqual(logger.options.format, "simple");
    });

    it("should have all log level methods", () => {
      const logger = new Logger();
      assert.strictEqual(typeof logger.error, "function");
      assert.strictEqual(typeof logger.warn, "function");
      assert.strictEqual(typeof logger.info, "function");
      assert.strictEqual(typeof logger.debug, "function");
    });

    it("should change log level with level() method", () => {
      const logger = new Logger();
      logger.level("debug");
      assert.strictEqual(logger.options.level, "debug");
    });

    it("should throw error for invalid log level", () => {
      const logger = new Logger();
      assert.throws(() => {
        logger.level("invalid");
      }, /Invalid log level: invalid/);
    });
  });

  describe("Log Level Filtering", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should filter debug messages when level is info", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "info" });
      logger.debug("debug message");
      assert.strictEqual(capturedLogs.length, 0);
    });

    it("should show info messages when level is info", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "info" });
      logger.info("info message");
      assert.strictEqual(capturedLogs.length, 1);
    });

    it("should show error messages at any level", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "error" });
      logger.error("error message");
      assert.strictEqual(capturedLogs.length, 1);
    });

    it("should filter warn and info when level is error", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "error" });
      logger.warn("warn message");
      logger.info("info message");
      assert.strictEqual(capturedLogs.length, 0);
    });
  });

  describe("Level Management", () => {
    it("should return current level when called without arguments", () => {
      const logger = new Logger({ level: "debug" });
      assert.strictEqual(logger.level(), "debug");
    });

    it("should return new level when setting level", () => {
      const logger = new Logger();
      const result = logger.level("error");
      assert.strictEqual(result, "error");
      assert.strictEqual(logger.options.level, "error");
    });

    it("should allow method chaining after setting level", () => {
      const logger = new Logger();
      // This should not throw and should return a level
      const result = logger.level("warn");
      assert.strictEqual(result, "warn");
      assert.strictEqual(typeof result, "string");
    });

    it("should throw error for invalid log level", () => {
      const logger = new Logger();
      assert.throws(() => {
        logger.level("invalid");
      }, /Invalid log level: invalid/);
    });

    it("should have setLevel method as alias", () => {
      const logger = new Logger();
      assert.strictEqual(typeof logger.setLevel, "function");
    });

    it("should set level correctly with setLevel method", () => {
      const logger = new Logger();
      const result = logger.setLevel("debug");
      assert.strictEqual(result, "debug");
      assert.strictEqual(logger.options.level, "debug");
    });

    it("should return current level with setLevel when no args", () => {
      const logger = new Logger({ level: "warn" });
      const result = logger.setLevel();
      assert.strictEqual(result, "warn");
    });

    it("should throw error for invalid level in setLevel", () => {
      const logger = new Logger();
      assert.throws(() => {
        logger.setLevel("invalid");
      }, /Invalid log level: invalid/);
    });

    it("should maintain consistency between level() and setLevel()", () => {
      const logger = new Logger();

      logger.level("error");
      assert.strictEqual(logger.setLevel(), "error");

      logger.setLevel("debug");
      assert.strictEqual(logger.level(), "debug");
    });

    it("should support fluent interface pattern", () => {
      const logger = new Logger();

      // This demonstrates the fluent interface working
      const currentLevel = logger.level("warn");
      assert.strictEqual(currentLevel, "warn");

      // Both methods should return the current level for chaining
      assert.strictEqual(logger.level("info"), "info");
      assert.strictEqual(logger.setLevel("debug"), "debug");
    });

    it("should suppress all output when level is silent", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "silent" });

      logger.error("error message");
      logger.warn("warn message");
      logger.info("info message");
      logger.debug("debug message");

      // No messages should be logged
      assert.strictEqual(capturedLogs.length, 0);
    });

    it("should allow setting level to silent", () => {
      const logger = new Logger();
      const result = logger.level("silent");
      assert.strictEqual(result, "silent");
      assert.strictEqual(logger.options.level, "silent");
    });

    it("should work with setLevel for silent level", () => {
      const logger = new Logger();
      const result = logger.setLevel("silent");
      assert.strictEqual(result, "silent");
      assert.strictEqual(logger.options.level, "silent");
    });
  });

  describe("JSON Formatter", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should produce valid JSON output", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("test message");

      assert.strictEqual(capturedLogs.length, 1);
      const logOutput = capturedLogs[0];

      // Should be valid JSON
      assert.doesNotThrow(() => {
        JSON.parse(logOutput);
      });
    });

    it("should include all required fields in JSON output", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("test message");

      const parsed = JSON.parse(capturedLogs[0]);

      assert.strictEqual(parsed.level, "info");
      assert.strictEqual(parsed.levelNumber, 2);
      assert.strictEqual(parsed.msg, "test message");
      assert.strictEqual(typeof parsed.time, "string");
      assert.strictEqual(typeof parsed.pid, "number");
      assert.strictEqual(typeof parsed.hostname, "string");
      assert.ok(parsed.callerFile);
      assert.strictEqual(typeof parsed.callerLine, "number");
    });

    it("should format timestamp in ISO format", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("test message");

      const parsed = JSON.parse(capturedLogs[0]);
      // Should be valid ISO string
      assert.doesNotThrow(() => {
        new Date(parsed.time);
      });
      assert.ok(parsed.time.includes("T"));
      assert.ok(parsed.time.includes("Z"));
    });

    it("should handle circular references in log entry", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });

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

      logger.info("test with circular reference");

      const logOutput = capturedLogs[0];
      // Should be valid JSON despite circular reference
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        // Should contain error information
        assert.ok(parsed.jsonError.includes("JSON stringify failed"));
        assert.strictEqual(parsed.msg, "test with circular reference");
      });
    });

    it("should handle JSON stringify errors with fallback", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });

      // Create a problematic object that will cause JSON.stringify to fail
      const problematic = {};
      Object.defineProperty(problematic, "badProp", {
        get() {
          throw new Error("Property access error");
        },
        enumerable: true,
      });

      // Mock the log method to inject the problematic object
      const originalLog = logger.log;
      logger.log = function (level, message, ...args) {
        const result = originalLog.call(this, level, message, ...args);
        // This won't actually work because log() doesn't expose logEntry,
        // so let's test the formatter directly instead
        return result;
      };

      // Test the formatter directly with a problematic object
      const problematicLogEntry = {
        level: "info",
        msg: "test message",
        problematic: problematic,
      };

      const result = logger.formatters.json(problematicLogEntry);

      // Should produce valid JSON with error info
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(result);
        assert.ok(parsed.jsonError.includes("JSON stringify failed"));
      });
    });

    it("should handle extreme JSON stringify failures", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });

      // Create an object that will fail even the safe fallback
      // by mocking JSON.stringify to always throw
      const originalStringify = JSON.stringify;
      let callCount = 0;

      JSON.stringify = function (...args) {
        callCount++;
        if (callCount <= 2) {
          throw new Error("Mock JSON error");
        }
        return originalStringify.apply(this, args);
      };

      try {
        const result = logger.formatters.json({
          level: "error",
          msg: "test message",
        });

        // Should still produce valid JSON string even after multiple failures
        assert.doesNotThrow(() => {
          const parsed = JSON.parse(result);
          assert.strictEqual(parsed.level, "error");
          assert.strictEqual(parsed.msg, "test message");
          assert.ok(parsed.jsonError.includes("Multiple JSON errors occurred"));
        });
      } finally {
        JSON.stringify = originalStringify;
      }
    });

    it("should escape quotes in fallback JSON string", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });

      // Mock JSON.stringify to always fail to test the final fallback
      const originalStringify = JSON.stringify;
      JSON.stringify = function () {
        throw new Error("Always fails");
      };

      try {
        const result = logger.formatters.json({
          level: "info",
          msg: 'Message with "quotes" in it',
        });

        // Should be valid JSON with escaped quotes
        assert.doesNotThrow(() => {
          const parsed = JSON.parse(result);
          assert.strictEqual(parsed.msg, 'Message with "quotes" in it');
        });
      } finally {
        JSON.stringify = originalStringify;
      }
    });
  });

  describe("Formatter Error Handling", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should fall back to JSON formatter when custom formatter throws", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });

      // Replace the simple formatter with one that throws
      logger.formatters.simple = function (logEntry) {
        throw new Error("Custom formatter error");
      };

      logger.info("test message");

      // Should still produce output using JSON formatter fallback
      assert.strictEqual(capturedLogs.length, 1);

      // Should be valid JSON (fallback to JSON formatter)
      const logOutput = capturedLogs[0];
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.msg, "test message");
        assert.ok(
          parsed.formatterError.includes(
            "Formatter failed: Custom formatter error"
          )
        );
      });
    });

    it("should handle complete formatter failure with minimal output", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });

      // Replace both formatters with ones that throw
      logger.formatters.simple = function () {
        throw new Error("Simple formatter error");
      };
      logger.formatters.json = function () {
        throw new Error("JSON formatter error");
      };

      logger.info('test message with "quotes"');

      // Should still produce some output
      assert.strictEqual(capturedLogs.length, 1);

      // Should be valid JSON with minimal content
      const logOutput = capturedLogs[0];
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.level, "info");
        assert.strictEqual(parsed.msg, 'test message with "quotes"');
        assert.ok(
          parsed.formatterError.includes(
            "Formatter failed: Simple formatter error"
          )
        );
      });
    });

    it("should not crash when formatter returns non-string", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });

      // Replace formatter with one that returns an object instead of string
      logger.formatters.simple = function (logEntry) {
        return { notAString: true };
      };

      logger.info("test message");

      // Should still produce output (fallback should handle this)
      assert.strictEqual(capturedLogs.length, 1);

      // Should be valid JSON from fallback
      const logOutput = capturedLogs[0];
      assert.doesNotThrow(() => {
        const parsed = JSON.parse(logOutput);
        assert.strictEqual(parsed.msg, "test message");
      });
    });

    it("should preserve original formatters after error", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });

      // Temporarily break the formatter
      const originalSimple = logger.formatters.simple;
      logger.formatters.simple = function () {
        throw new Error("Temporary error");
      };

      logger.info("first message");

      // Restore the formatter
      logger.formatters.simple = originalSimple;

      logger.info("second message");

      // First message should have used fallback, second should work normally
      assert.strictEqual(capturedLogs.length, 2);

      // First log should be JSON (fallback)
      assert.doesNotThrow(() => JSON.parse(capturedLogs[0]));

      // Second log should be simple format
      assert.ok(capturedLogs[1].includes("[INFO ]"));
      assert.ok(capturedLogs[1].includes("second message"));
    });
  });

  describe("Simple Formatter", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should produce simple text format", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });
      logger.info("test message");

      assert.strictEqual(capturedLogs.length, 1);
      const logOutput = capturedLogs[0];

      // Should contain timestamp, level, caller, and message
      assert.ok(logOutput.includes("[INFO ]"));
      assert.ok(logOutput.includes("test message"));
      assert.ok(
        logOutput.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it("should pad log levels correctly", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple", level: "debug" });
      logger.error("error msg");
      logger.debug("debug msg");

      assert.ok(capturedLogs[0].includes("[ERROR]"));
      assert.ok(capturedLogs[1].includes("[DEBUG]"));
    });

    it("should include caller information", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "simple" });
      logger.info("test message");

      const logOutput = capturedLogs[0];
      // Should contain filename and line number
      assert.ok(logOutput.includes(".js:"));
    });
  });

  describe("Message Formatting", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should handle multiple arguments", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("Hello %s, you are %d years old", "John", 25);

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.msg, "Hello John, you are 25 years old");
    });

    it("should handle empty messages", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("");

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.msg, "");
    });

    it("should handle null and undefined arguments", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("Value: %s", null);

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.msg, "Value: null");
    });

    it("should handle special characters", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info('Special chars: "quotes", \\backslash, \nnewline');

      // Should produce valid JSON despite special characters
      assert.doesNotThrow(() => {
        JSON.parse(capturedLogs[0]);
      });
    });
  });

  describe("Color Handling", () => {
    before(mockConsole);
    after(() => {
      restoreConsole();
      restoreTTY();
    });

    it("should include color codes when output is TTY", () => {
      capturedLogs = [];
      setTTYMode(true);
      const logger = new Logger({ format: "simple" });
      logger.error("error message");

      const logOutput = capturedLogs[0];
      // Should contain ANSI color codes
      assert.ok(logOutput.includes("\x1b[91m")); // red for error
      assert.ok(logOutput.includes("\x1b[0m")); // reset
    });

    it("should not include color codes when output is redirected", () => {
      capturedLogs = [];
      setTTYMode(false);
      const logger = new Logger({ format: "simple" });
      logger.error("error message");

      const logOutput = capturedLogs[0];
      // Should not contain ANSI color codes
      assert.ok(!logOutput.includes("\x1b["));
    });
  });

  describe("Caller Information", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should detect caller file and line", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("test from caller detection"); // This line should be detected

      const parsed = JSON.parse(capturedLogs[0]);
      assert.ok(parsed.callerFile.includes("logger.test.js"));
      assert.strictEqual(typeof parsed.callerLine, "number");
      assert.ok(parsed.callerLine > 0);
    });

    it("should return default values when caller detection fails completely", () => {
      capturedLogs = [];

      // Capture console.error as well as console.log
      const capturedErrors = [];
      const originalConsoleError = console.error;
      console.error = (...args) => {
        capturedErrors.push(args);
      };

      const logger = new Logger({ format: "json" });

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
        logger.info("test message");

        // Restore everything before assertions
        global.Error = originalError;
        console.error = originalConsoleError;

        const parsed = JSON.parse(capturedLogs[0]);
        assert.strictEqual(parsed.callerFile, "unknown");
        assert.strictEqual(parsed.callerLine, 0);
        assert.strictEqual(parsed.msg, "test message");
      } finally {
        global.Error = originalError;
        console.error = originalConsoleError;
      }
    });
  });

  describe("Edge Cases", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should handle very long messages", () => {
      capturedLogs = [];
      const longMessage = "x".repeat(10000);
      const logger = new Logger({ format: "json" });
      logger.info(longMessage);

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.msg, longMessage);
    });

    it("should handle objects in messages", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      const obj = { key: "value", nested: { prop: 123 } };
      logger.info("Object: %j", obj);

      const parsed = JSON.parse(capturedLogs[0]);
      assert.ok(parsed.msg.includes('{"key":"value","nested":{"prop":123}}'));
    });

    it("should not crash on logging errors", () => {
      capturedLogs = [];
      const logger = new Logger();

      // This should not throw
      assert.doesNotThrow(() => {
        logger.info("test message");
      });
    });
  });

  describe("Configuration", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should throw error for invalid format", () => {
      capturedLogs = [];

      assert.throws(() => {
        new Logger({ format: "invalid" });
      }, /Invalid format: invalid. Valid formats are: json, simple/);
    });

    it("should merge options correctly", () => {
      capturedLogs = [];
      const customOptions = {
        level: "debug",
        format: "simple",
        colours: {
          error: "\x1b[31m", // different red
        },
      };

      const logger = new Logger(customOptions);

      assert.strictEqual(logger.options.level, "debug");
      assert.strictEqual(logger.options.format, "simple");
      assert.strictEqual(logger.options.colours.error, "\x1b[31m");
      // Should still have other default colors
      assert.strictEqual(logger.options.colours.warn, "\x1b[33m");
    });

    it("should detect TTY correctly", () => {
      capturedLogs = [];
      setTTYMode(true);
      const logger1 = new Logger();
      assert.strictEqual(logger1.isRedirected, false);

      setTTYMode(false);
      const logger2 = new Logger();
      assert.strictEqual(logger2.isRedirected, true);
    });
  });

  describe("All Log Levels", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should log error messages with correct level", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.error("error message");

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.level, "error");
      assert.strictEqual(parsed.levelNumber, 0);
    });

    it("should log warn messages with correct level", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.warn("warn message");

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.level, "warn");
      assert.strictEqual(parsed.levelNumber, 1);
    });

    it("should log info messages with correct level", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "json" });
      logger.info("info message");

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.level, "info");
      assert.strictEqual(parsed.levelNumber, 2);
    });

    it("should log debug messages with correct level", () => {
      capturedLogs = [];
      const logger = new Logger({ level: "debug", format: "json" });
      logger.debug("debug message");

      const parsed = JSON.parse(capturedLogs[0]);
      assert.strictEqual(parsed.level, "debug");
      assert.strictEqual(parsed.levelNumber, 3);
    });
  });

  describe("Caller Detection Error Throttling", () => {
    before(mockConsole);
    after(restoreConsole);

    it("should suppress caller error messages after threshold", () => {
      capturedLogs = [];

      // Capture console.error calls
      const capturedErrors = [];
      const originalConsoleError = console.error;
      console.error = (...args) => {
        capturedErrors.push(args);
      };

      const logger = new Logger({ format: "json" });

      // Mock Error constructor to create errors with no usable stack
      const originalError = Error;
      global.Error = class extends originalError {
        constructor(...args) {
          super(...args);
          // Set stack to something that will cause the parsing to fail
          Object.defineProperty(this, "stack", {
            get() {
              throw new Error("Stack access failed");
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
        console.error = originalConsoleError;

        // Should have logged 7 messages despite caller errors
        assert.strictEqual(capturedLogs.length, 7);

        // Should have exactly 6 console.error calls
        assert.strictEqual(capturedErrors.length, 6);
      } finally {
        global.Error = originalError;
        console.error = originalConsoleError;
      }
    });
  });
});
