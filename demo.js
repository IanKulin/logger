import Logger from './lib/logger.js';
const logger = new Logger({ level: 'debug' });

logger.error('Unable to fetch student');
logger.info('Hello from logger');
logger.warn('This is a warning');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
logger.level('error');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info' or higher

const simple_logger = new Logger({ level: 'debug', format: 'simple' });

simple_logger.error('Unable to fetch student');
simple_logger.info('Hello from logger');
simple_logger.warn('This is a warning');
simple_logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
simple_logger.level('error');
simple_logger.debug('This is a debug message'); // This won't be logged if level is set to 'info' or higher

const longLogger = new Logger({ time: 'long', format: 'simple' });
const shortLogger = new Logger({ time: 'short', format: 'simple' });

longLogger.info('This uses long time format');
shortLogger.info('This uses short time format');

// Demonstrate callerLevel functionality
console.log('\n=== Caller Level Demo ===');

// Default callerLevel is 'warn' - only errors and warnings include caller info
const defaultCallerLogger = new Logger({ format: 'simple' });
console.log(
  'Default callerLevel (warn) - only errors and warnings show caller info:'
);
defaultCallerLogger.error('Error with caller info');
defaultCallerLogger.warn('Warning with caller info');
defaultCallerLogger.info('Info without caller info');
defaultCallerLogger.debug('Debug without caller info');

// Set callerLevel to 'error' - only errors include caller info
const errorOnlyLogger = new Logger({ format: 'simple', callerLevel: 'error' });
console.log('\nCallerLevel set to error - only errors show caller info:');
errorOnlyLogger.error('Error with caller info');
errorOnlyLogger.warn('Warning without caller info');
errorOnlyLogger.info('Info without caller info');

// Set callerLevel to 'debug' - all levels include caller info
const allLevelsLogger = new Logger({ format: 'simple', callerLevel: 'debug' });
console.log('\nCallerLevel set to debug - all levels show caller info:');
allLevelsLogger.error('Error with caller info');
allLevelsLogger.warn('Warning with caller info');
allLevelsLogger.info('Info with caller info');
allLevelsLogger.debug('Debug with caller info');

// Set callerLevel to 'silent' - no levels include caller info
const noneLogger = new Logger({ format: 'simple', callerLevel: 'silent' });
console.log('\nCallerLevel set to silent - no levels show caller info:');
noneLogger.error('Error without caller info');
noneLogger.warn('Warning without caller info');
noneLogger.info('Info without caller info');

// Demonstrate file/stream output
import { createWriteStream } from 'fs';
console.log('\n=== File/Stream Output Demo ===');

const fileStream = createWriteStream('delete_me.log');
const fileLogger = new Logger({ level: 'debug', format: 'json', stream: fileStream });
fileLogger.info('This line goes to the file, not console');
fileLogger.error('Stream error example');
fileStream.end(() => console.log('Wrote to delete_me.log'));
