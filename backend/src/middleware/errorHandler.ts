import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err);

  // Log the error to AuditLog for serious errors
  if (err instanceof ApiError && err.statusCode >= 500) {
    try {
      const userId = (req as any).user?.id || 'system';

      prisma.auditLog.create({
        data: {
          action: 'ERROR',
          entityType: 'system',
          entityId: 'error',
          description: err.message,
          metadata: {
            stack: err.stack,
            path: req.path,
            method: req.method,
          },
          userId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      }).catch((e: any) => console.error('Failed to log error to AuditLog', e));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Handle specific error types
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode,
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation error',
        status: 400,
        details: err.errors,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      error: {
        message: 'Database error',
        status: 400,
      },
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
      status: 500,
    },
  });
  return;
};

// Not found handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(error);
};
