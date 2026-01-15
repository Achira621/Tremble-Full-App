import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Global error handler middleware
 */
export const errorHandler = (
    err: any,
    _req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
): void => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        message: message,
    });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response<ApiResponse>
): void => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`,
    });
};

/**
 * Custom error class
 */
export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
