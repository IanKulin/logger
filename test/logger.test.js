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
  describe("Core Functionality", () => {
    it("should instantiate with default options", () => {
      const logger = new Logger();
      assert.strictEqual(logger.options.level, "info");
      assert.strictEqual(logger.options.format, "json");
      assert.deepStrictEqual(logger.options.levels, {
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

    it("should handle caller detection errors gracefully", () => {
      capturedLogs = [];
      const logger = new Logger();

      // Mock Error.prepareStackTrace to throw
      const originalPrepareStackTrace = Error.prepareStackTrace;
      Error.prepareStackTrace = () => {
        throw new Error("Mock error");
      };

      try {
        logger.info("test message");
        // Should still log despite caller detection error
        assert.strictEqual(capturedLogs.length, 1);

        const parsed = JSON.parse(capturedLogs[0]);
        assert.strictEqual(parsed.msg, "test message");
      } finally {
        Error.prepareStackTrace = originalPrepareStackTrace;
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

    it("should fall back to JSON formatter for invalid format", () => {
      capturedLogs = [];
      const logger = new Logger({ format: "invalid" });
      logger.info("test message");

      // Should produce JSON despite invalid format
      assert.doesNotThrow(() => {
        JSON.parse(capturedLogs[0]);
      });
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
});
