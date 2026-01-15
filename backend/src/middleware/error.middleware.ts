import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class
export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new AppError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val: any) => val.message)
            .join(', ');
        error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new AppError(message, 401);
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = new AppError('File too large', 400);
        } else {
            error = new AppError(err.message, 400);
        }
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.statusCode === 500 ? 'Service Temporarily Unavailable (Under Construction)' : (error.message || 'Server Error'),
        message: 'The app is currently being updated. Please try again shortly.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
