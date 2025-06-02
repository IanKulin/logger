# logger [![NPM version](https://img.shields.io/npm/v/@iankulin/logger.svg?style=flat)](https://www.npmjs.com/package/@iankulin/logger) [![NPM total downloads](https://img.shields.io/npm/dt/@iankulin/logger.svg?style=flat)](https://npmjs.org/package/@iankulin/logger)

> Flexible console logging utility with colors, and multiple output formats

## Features

- **Multiple log levels**: silent, error, warn, info, debug
- **Flexible output formats**: JSON or simple text
- **Caller detection**: Automatically identifies source file and line number
- **Color support**: Automatic TTY detection with colored output
- **ESM only**: Modern ES module support

## Install

Install with [npm](https://npmjs.org/package/@iankulin/logger):

```sh
$ npm install @iankulin/logger
```

## Quick Start

```js
import Logger from "@iankulin/logger";

const logger = new Logger();
logger.info('Hello from logger');
logger.error('Something went wrong');
```

## Usage Examples

### Basic Logging

```js
import Logger from "@iankulin/logger";
const logger = new Logger({ level: 'info' });

logger.error('Critical error occurred');
logger.warn('This is a warning');
logger.info('Informational message');
logger.debug('Debug info'); // Won't be shown (level is 'info')
```

### Log Levels

The logger supports five log levels (from most to least verbose):

- `silent` - Suppresses all output
- `error` - Only error messages
- `warn` - Error and warning messages
- `info` - Error, warning, and info messages (default)
- `debug` - All messages

```js
const logger = new Logger({ level: 'debug' });

// All of these will be logged
logger.error('Error message');
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message');

// Change level dynamically
logger.level('error');
logger.info('This will not be logged');

// Get current level
console.log(logger.level()); // 'error'

// Alternative setter method
logger.setLevel('warn');
```

### Output Formats

#### JSON Format (Default)
```js
const logger = new Logger({ format: 'json' });
logger.info('Hello world');
```
```json
{"level":"info","levelNumber":2,"time":"2025-06-02T12:00:00.000Z","pid":12345,"hostname":"my-computer","msg":"Hello world","callerFile":"file:///path/to/file.js","callerLine":3}
```

#### Simple Format
```js
const logger = new Logger({ format: 'simple' });
logger.error('Something failed');
```
```
[2025-06-02T12:00:00.000Z] [ERROR] [app.js:15] Something failed
```

### Message Formatting

The logger uses Node.js `util.format()` for message formatting:

```js
const logger = new Logger();

logger.info('User %s has %d points', 'Alice', 150);
logger.warn('Object: %j', { key: 'value', count: 42 });
logger.error('Processing failed at %s', new Date().toISOString());
```

### Silent Mode

Completely suppress all logging output:

```js
const logger = new Logger({ level: 'silent' });

// None of these will produce any output
logger.error('Critical error');
logger.info('Info message');
```

### Custom Colors

```js
const logger = new Logger({
  colours: {
    error: '\x1b[31m',  // Red
    warn: '\x1b[93m',   // Bright yellow
    info: '\x1b[36m',   // Cyan
    debug: '\x1b[90m'   // Dark gray
  }
});
```

## Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `level` | string | `'info'` | Minimum log level to output (`'silent'`, `'error'`, `'warn'`, `'info'`, `'debug'`) |
| `format` | string | `'json'` | Output format (`'json'` or `'simple'`) |
| `colours` | object | See below | Color codes for each log level |
| `levels` | object | See below | Custom level names and numeric values |

### Default Colors

```js
{
  error: '\x1b[91m',   // Bright red
  warn: '\x1b[33m',    // Yellow  
  info: '\x1b[94m',    // Bright blue
  debug: '\x1b[37m',   // White
  reset: '\x1b[0m'     // Reset
}
```

### Default Levels

```js
{
  silent: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}
```

## API Reference

### Constructor

```js
new Logger(options?)
```

Creates a new logger instance with optional configuration.

### Methods

#### `logger.error(message, ...args)`
Logs an error message.

#### `logger.warn(message, ...args)`
Logs a warning message.

#### `logger.info(message, ...args)`
Logs an informational message.

#### `logger.debug(message, ...args)`
Logs a debug message.

#### `logger.level(newLevel?)`
- **Get**: `logger.level()` - Returns current log level
- **Set**: `logger.level('debug')` - Sets log level and returns new level

#### `logger.setLevel(newLevel?)`
Alias for `logger.level()`. More explicit method for setting log levels.

### Properties

#### `logger.options`
Access to the current configuration options.

#### `logger.formatters`
Object containing available formatters (`json`, `simple`). Can be extended with custom formatters.

## Error Handling

The logger includes robust error handling:

- **Caller detection failures**: Falls back to default values without breaking
- **JSON formatting errors**: Automatically handles circular references and non-serializable data
- **Custom formatter errors**: Falls back to JSON format with error information
- **Loop detection**: Prevents infinite error reporting from caller detection

## Examples

### Production Logging
```js
import Logger from "@iankulin/logger";

const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json'
});

export default logger;
```

### Development Logging
```js
import Logger from "@iankulin/logger";

const logger = new Logger({
  level: 'debug',
  format: 'simple'
});

logger.debug('Starting application');
logger.info('Server listening on port 3000');
```

### Test Environment
```js
import Logger from "@iankulin/logger";

// Suppress all logging during tests
const logger = new Logger({ level: 'silent' });
```

## Requirements

- Node.js 18.0.0 or higher
- ES modules support

## License

[MIT](LICENSE)

## Versions

- **1.0.0** - Production release
- **0.1.6** - Added tests, improved error handling, caller detection loop prevention, `silent` logging level
- **0.1.5** - Initial release