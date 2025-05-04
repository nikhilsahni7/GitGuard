import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { type AuthRequest, authenticateJwt } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { syncUserWithPermit } from '../utils/permitUtils';

const router = express.Router();

// Schema for updating user profile
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  pushToken: z.string().optional().nullable(),
});

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        biometricEnabled: true,
        pushToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put('/me', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const validatedData = updateProfileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        biometricEnabled: true,
        pushToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Sync updated user with Permit.io
    await syncUserWithPermit(updatedUser.id);

    // Create audit log entry for profile update
    await prisma.auditLog.create({
      data: {
        action: 'PROFILE_UPDATED',
        entityType: 'user',
        entityId: updatedUser.id,
        description: 'User profile updated',
        userId: updatedUser.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/users/push-token
 * @desc Update user's push notification token
 * @access Private
 */
router.put('/push-token', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const { pushToken } = req.body;

    if (!pushToken) {
      throw new ApiError(400, 'Push token is required');
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { pushToken },
    });

    // Create audit log entry for push token update
    await prisma.auditLog.create({
      data: {
        action: 'PUSH_TOKEN_UPDATED',
        entityType: 'user',
        entityId: req.user.id,
        description: 'Push notification token updated',
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Push notification token updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID (for admins)
 * @access Private
 */
router.get('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const userId = req.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        biometricEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users
 * @desc Get all users (paginated)
 * @access Private
 */
router.get('/', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        biometricEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalUsers = await prisma.user.count();

    res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        pages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };
