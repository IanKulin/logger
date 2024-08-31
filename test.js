import Logger from './logger.js';
const logger = new Logger({ level: 'debug' });

logger.error('Unable to fetch student');
logger.info('Hello from logger');
logger.warn('This is a warning');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info'
logger.level('error');
logger.debug('This is a debug message'); // This won't be logged if level is set to 'info' or higher