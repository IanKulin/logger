import { format } from 'path';
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