import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logLevel = process.env.LOG_LEVEL || 'info';
const logToFile = process.env.LOG_TO_FILE === 'true';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    level: logLevel
  })
];

if (logToFile) {
  const logFilePath = process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs/app.log');
  transports.push(
    new winston.transports.File({
      filename: logFilePath,
      format: logFormat,
      level: logLevel,
      maxsize: 5242880,
      maxFiles: 5
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: transports,
  exitOnError: false
});

export default logger;

export function logTestResult(result) {
  logger.info('Test Result', { result });
}

export function logError(error, context = {}) {
  logger.error('Error occurred', { error: error.message, stack: error.stack, context });
}

export function logComparison(comparison) {
  logger.info('Comparison Result', { comparison });
}