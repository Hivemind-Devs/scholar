const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define custom format
const logFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString}`;
});

/**
 * Creates a logger instance
 */
const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        // Daily rotate file transport
        new DailyRotateFile({
            filename: path.join(logDir, '%DATE%/application-%DATE%.log'),
            datePattern: 'YYYY/MM/DD', // Defines the folder structure: logs/YYYY/MM/DD/application-YYYY-MM-DD.log
            zippedArchive: true,
            maxSize: '10m', // Max size per file
            maxFiles: '14d', // Keep logs for 14 days
            createSymlink: true,
            symlinkName: 'current.log' // Link to the current log file
        })
    ]
});

// Wrapper to match existing simple logger interface if needed, or export winston instance directly
module.exports = {
    log: (message, ...meta) => logger.info(message, ...meta),
    info: (message, ...meta) => logger.info(message, ...meta),
    error: (message, ...meta) => logger.error(message, ...meta),
    warn: (message, ...meta) => logger.warn(message, ...meta),
    debug: (message, ...meta) => logger.debug(message, ...meta),
    // Expose raw winston instance if needed
    instance: logger
};

