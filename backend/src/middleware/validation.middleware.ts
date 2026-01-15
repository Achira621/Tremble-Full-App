import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

// Validation error handler
export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Run all validations
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        // Format errors
        const extractedErrors: any[] = [];
        errors.array().forEach((err: any) => {
            extractedErrors.push({
                field: err.path || err.param,
                message: err.msg,
            });
        });

        res.status(400).json({
            success: false,
            error: 'Validation failed',
            errors: extractedErrors,
        });
    };
};
