# logger [![NPM version](https://img.shields.io/npm/v/@iankulin/logger.svg?style=flat)](https://www.npmjs.com/package/@iankulin/logger) [![NPM total downloads](https://img.shields.io/npm/dt/@iankulin/logger.svg?style=flat)](https://npmjs.org/package/@iankulin/logger)

> console.log utility with colours

## Install

Install with [npm](https://npmjs.org/package/@iankulin/logger):

```sh
$ npm install @iankulin/logger
```

## Usage

Expects ESM, not common js imports

```js
import Logger from "@iankulin/logger";
const logger = new Logger({ level: 'info' });

logger.error('Unable to fetch student');
logger.info('Hello from logger');
logger.warn('This is a warning');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
logger.level('error');
logger.debug('This is a debug message'); // won't be logged as level is now set to 'error'
```
```
{"level":"debug","levelNumber":3,"time":"2025-03-03T11:14:08.802Z","pid":84492,"hostname":"iankulins-MacBook-Air.local","msg":"This is a debug message","callerFile":"file:///Users/iankulin/Developer/web/logger/test.js","callerLine":8}
```

By default, the output is JSON containing the PID, hostname, and full path to the source. If you prefer a simpler output format, pass this in the constructor:

```js
import Logger from "@iankulin/logger";
const simple_logger = new Logger({ level: 'debug', format: 'simple' });

simple_logger.error('Unable to fetch student');
```
```
[2025-03-03T11:14:08.802Z] [ERROR] [test.js:14] Unable to fetch student
```

## Changelog
0.1.5 Initial
0.1.6 Tests, better error handling, loop detection

