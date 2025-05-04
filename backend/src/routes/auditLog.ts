import express from 'express';
import { prisma } from '../index';
import { type AuthRequest, authenticateJwt } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router = express.Router();

/**
 * @route GET /api/audit-logs
 * @desc Get all audit logs with filtering and pagination
 * @access Private
 */
router.get('/', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Parse pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Parse filter parameters
    const userId = req.query.userId as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const action = req.query.action as string | undefined;
    const fromDate = req.query.fromDate ? new Date(req.query.fromDate as string) : undefined;
    const toDate = req.query.toDate ? new Date(req.query.toDate as string) : undefined;

    // Build where conditions for filtering
    const whereConditions: any = {};

    if (userId) {
      whereConditions.userId = userId;
    }

    if (entityType) {
      whereConditions.entityType = entityType;
    }

    if (entityId) {
      whereConditions.entityId = entityId;
    }

    if (action) {
      whereConditions.action = action;
    }

    // Date range filter
    if (fromDate || toDate) {
      whereConditions.createdAt = {};

      if (fromDate) {
        whereConditions.createdAt.gte = fromDate;
      }

      if (toDate) {
        whereConditions.createdAt.lte = toDate;
      }
    }

    // Query audit logs with filters and pagination
    const auditLogs = await prisma.auditLog.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalLogs = await prisma.auditLog.count({
      where: whereConditions,
    });

    // Return response
    res.status(200).json({
      auditLogs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/audit-logs/:id
 * @desc Get audit log by ID
 * @access Private
 */
router.get('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const logId = req.params.id;

    // Get audit log by ID
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new ApiError(404, 'Audit log not found');
    }

    // Return response
    res.status(200).json({ auditLog });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/audit-logs/entity/:type/:id
 * @desc Get audit logs for a specific entity
 * @access Private
 */
router.get('/entity/:type/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const entityType = req.params.type;
    const entityId = req.params.id;

    // Parse pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Query audit logs for the entity
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalLogs = await prisma.auditLog.count({
      where: {
        entityType,
        entityId,
      },
    });

    // Return response
    res.status(200).json({
      auditLogs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/audit-logs/user/:userId
 * @desc Get audit logs for a specific user
 * @access Private
 */
router.get('/user/:userId', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const userId = req.params.userId;

    // Parse pagination parameters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Query audit logs for the user
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalLogs = await prisma.auditLog.count({
      where: {
        userId,
      },
    });

    // Return response
    res.status(200).json({
      auditLogs,
      pagination: {
        total: totalLogs,
        page,
        limit,
        pages: Math.ceil(totalLogs / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/audit-logs/actions
 * @desc Get all unique action types for filtering
 * @access Private
 */
router.get('/actions/list', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Get all unique action types
    const actions = await prisma.auditLog.findMany({
      select: {
        action: true,
      },
      distinct: ['action'],
      orderBy: {
        action: 'asc',
      },
    });

    const actionList = actions.map((a: any) => a.action);

    // Return response
    res.status(200).json({ actions: actionList });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/audit-logs/entity-types
 * @desc Get all unique entity types for filtering
 * @access Private
 */
router.get('/entity-types/list', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Get all unique entity types
    const entityTypes = await prisma.auditLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ['entityType'],
      orderBy: {
        entityType: 'asc',
      },
    });

    const entityTypeList = entityTypes.map((e: any) => e.entityType);

    // Return response
    res.status(200).json({ entityTypes: entityTypeList });
  } catch (error) {
    next(error);
  }
});

export { router as auditLogRouter };
