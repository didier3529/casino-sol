import { Request, Response, NextFunction } from 'express';

// Placeholder validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};



















