import util from "util";
import os from "os";

class Logger {
  constructor(options = {}) {
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
      },
      ...options,
    };
  }

  getCallerInfo() {
    const originalFunc = Error.prepareStackTrace;
    let callerFile;
    let callerLine;

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
      console.log(e);
    }

    Error.prepareStackTrace = originalFunc;
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
      time: Date.now(),
      pid: process.pid,
      hostname: os.hostname(),
      msg: util.format(message, ...args),
      callerFile,
      callerLine,
    };

    const colour = this.options.colours[level];
    const resetColour = this.options.colours.reset;
    console.log(`${colour}${JSON.stringify(logEntry)}${resetColour}`);
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
