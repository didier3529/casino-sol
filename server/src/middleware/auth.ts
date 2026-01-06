import { Request, Response, NextFunction } from 'express';

// Placeholder auth middleware
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // For now, allow all requests
  next();
};



















