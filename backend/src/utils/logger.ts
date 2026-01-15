import winston from 'winston';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Custom format for better readability
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

export const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports: [
        // Console transport for development and Vercel
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
    exitOnError: false,
});

export default logger;
