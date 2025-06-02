import util from "util";
import os from "os";

class Logger {
  constructor(options = {}) {
    this.validateOptions(options);
    this.options = {
      level: "info",
      levels: {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
      },
      colours: {
        error: "\x1b[91m", // red
        warn: "\x1b[33m", // yellow
        info: "\x1b[94m", // hi blue
        debug: "\x1b[37m", // white
        reset: "\x1b[0m",
        ...options.colours, // Merge colours specifically
      },
      format: "json", // default output format
      ...options,
      // Ensure colours are properly merged after the main spread
      colours: {
        error: "\x1b[91m",
        warn: "\x1b[33m",
        info: "\x1b[94m",
        debug: "\x1b[37m",
        reset: "\x1b[0m",
        ...options.colours,
      },
    };

    // Detect if output is redirected to a file
    this.isRedirected = !process.stdout.isTTY;

    // Initialize formatters registry
    this.formatters = {
      json: this.jsonFormatter.bind(this),
      simple: this.simpleFormatter.bind(this),
    };
  }

  validateOptions(options) {
  // Validate level if provided
  if (options.level !== undefined) {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLevels.includes(options.level)) {
      throw new Error(`Invalid log level: ${options.level}. Valid levels are: ${validLevels.join(', ')}`);
    }
  }

  // Validate format if provided
  if (options.format !== undefined) {
    const validFormats = ['json', 'simple'];
    if (!validFormats.includes(options.format)) {
      throw new Error(`Invalid format: ${options.format}. Valid formats are: ${validFormats.join(', ')}`);
    }
  }

  // Validate colours if provided (should be an object)
  if (options.colours !== undefined && typeof options.colours !== 'object') {
    throw new Error('colours option must be an object');
  }

  // Validate levels if provided (should be an object with numeric values)
  if (options.levels !== undefined) {
    if (typeof options.levels !== 'object') {
      throw new Error('levels option must be an object');
    }
    
    for (const [level, value] of Object.entries(options.levels)) {
      if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
        throw new Error(`Level value for '${level}' must be a non-negative integer`);
      }
    }
  }
}

  // JSON log formatter
  jsonFormatter(logEntry) {
    return JSON.stringify(logEntry);
  }

  // Simple text log formatter
  simpleFormatter(logEntry) {
    const levelPadded = logEntry.level.toUpperCase().padEnd(5);
    const caller = logEntry.callerFile
      ? `${logEntry.callerFile.split("/").pop()}:${logEntry.callerLine}`
      : "unknown";

    return `[${logEntry.time}] [${levelPadded}] [${caller}] ${logEntry.msg}`;
  }

  getCallerInfo() {
    const originalFunc = Error.prepareStackTrace;
    let callerFile = "unknown";
    let callerLine = 0;

    try {
      const err = new Error();
      let currentFile;

      Error.prepareStackTrace = function (err, stack) {
        return stack;
      };

      currentFile = err.stack.shift().getFileName();

      while (err.stack.length) {
        const stackFrame = err.stack.shift();
        callerFile = stackFrame.getFileName();

        if (currentFile !== callerFile) {
          callerLine = stackFrame.getLineNumber();
          break;
        }
      }
    } catch (e) {
      console.error("Error retrieving caller info:", e);
      // callerFile and callerLine already set to defaults above
    } finally {
      Error.prepareStackTrace = originalFunc;
    }

    return { callerFile, callerLine };
  }

  log(level, message, ...args) {
    if (this.options.levels[level] > this.options.levels[this.options.level]) {
      return;
    }

    const { callerFile, callerLine } = this.getCallerInfo();

    const logEntry = {
      level,
      levelNumber: this.options.levels[level],
      time: new Date().toISOString(),
      pid: process.pid,
      hostname: os.hostname(),
      msg: util.format(message, ...args),
      callerFile,
      callerLine,
    };

    const colour = this.options.colours[level];
    const resetColour = this.options.colours.reset;

    // Select the appropriate formatter
    const formatter =
      this.formatters[this.options.format] || this.formatters.json;
    const formattedLog = formatter(logEntry);

    // only show colours if logging to console
    if (this.isRedirected) {
      console.log(formattedLog);
    } else {
      console.log(`${colour}${formattedLog}${resetColour}`);
    }
  }

  error(message, ...args) {
    this.log("error", message, ...args);
  }

  warn(message, ...args) {
    this.log("warn", message, ...args);
  }

  info(message, ...args) {
    this.log("info", message, ...args);
  }

  debug(message, ...args) {
    this.log("debug", message, ...args);
  }

  level(newLevel) {
    if (this.options.levels.hasOwnProperty(newLevel)) {
      this.options.level = newLevel;
    } else {
      throw new Error(`Invalid log level: ${newLevel}`);
    }
  }
}

export default Logger;
