import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { ApiError } from './errorHandler';

// Type definition for JWT payload
interface JwtPayload {
  id: string;
  email: string;
}

// Extended Request interface to include user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Middleware to authenticate JWT token
export const authenticateJwt = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(401, 'Authorization header missing');
    }

    // Extract token from Bearer format
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    // Verify JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

    try {
      // Verify token and extract payload
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;

      // Check if user exists in database
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new ApiError(401, 'User not found');
      }

      // Attach user to request object
      req.user = user;

      // Create audit log entry for authenticated API access
      await prisma.auditLog.create({
        data: {
          action: 'API_ACCESS',
          entityType: 'endpoint',
          entityId: req.path,
          description: `${req.method} ${req.path}`,
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || '',
        },
      });

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Invalid token');
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Token expired');
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// Middleware to check if user has biometric authentication enabled
export const requireBiometricAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { biometricEnabled: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.biometricEnabled) {
      throw new ApiError(403, 'Biometric authentication not enabled for this user');
    }

    next();
  } catch (error) {
    next(error);
  }
};
