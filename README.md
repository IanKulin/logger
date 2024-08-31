# logger [![NPM version](https://img.shields.io/npm/v/@iankulin/logger.svg?style=flat)](https://www.npmjs.com/package/@iankulin/logger) [![NPM total downloads](https://img.shields.io/npm/dt/@iankulin/logger.svg?style=flat)](https://npmjs.org/package/@iankulin/logger)

> console.log utility with colours

## Install

Install with [npm](https://www.npmjs.com/):

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