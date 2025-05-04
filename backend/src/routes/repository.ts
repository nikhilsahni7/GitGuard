import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticateJwt, type AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { checkPermission, createResourceInPermit } from '../utils/permitUtils';

const router = express.Router();

// Schema for creating repository
const createRepoSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  gitProvider: z.enum(['GITHUB', 'GITLAB', 'BITBUCKET']),
  gitRepoUrl: z.string().url(),
  organizationId: z.string().uuid(),
});

// Schema for updating repository
const updateRepoSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  gitRepoUrl: z.string().url().optional(),
});

/**
 * @route POST /api/repositories
 * @desc Create a new repository
 * @access Private
 */
router.post('/', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const validatedData = createRepoSchema.parse(req.body);

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: validatedData.organizationId },
    });

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    // Create repository
    const repository = await prisma.repository.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        gitProvider: validatedData.gitProvider,
        gitRepoUrl: validatedData.gitRepoUrl,
        organizationId: validatedData.organizationId,
        ownerId: req.user.id,
      },
    });

    // Register repository as a resource in Permit.io
    await createResourceInPermit(
      `repository:${repository.id}`,
      repository.name,
      {
        view: {},
        clone: {},
        push: {},
        admin: {},
        delete: {},
      }
    );

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'REPOSITORY_CREATED',
        entityType: 'repository',
        entityId: repository.id,
        description: `Repository "${repository.name}" created`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(201).json({
      message: 'Repository created successfully',
      repository,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/repositories
 * @desc Get all repositories (paginated)
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
    const organizationId = req.query.organizationId as string | undefined;

    // Build filter conditions
    const whereConditions: any = {};
    if (organizationId) {
      whereConditions.organizationId = organizationId;
    }

    const repositories = await prisma.repository.findMany({
      where: whereConditions,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalRepositories = await prisma.repository.count({
      where: whereConditions,
    });

    res.status(200).json({
      repositories,
      pagination: {
        total: totalRepositories,
        page,
        limit,
        pages: Math.ceil(totalRepositories / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/repositories/:id
 * @desc Get repository by ID
 * @access Private
 */
router.get('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const repositoryId = req.params.id;

    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        roleAssignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            role: true,
          },
        },
        accessRequests: {
          where: {
            status: 'PENDING',
          },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found');
    }

    // Check permission with Permit.io
    const hasViewPermission = await checkPermission(
      req.user.id,
      'view',
      'repository',
      repositoryId
    );

    if (!hasViewPermission && repository.ownerId !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to view this repository');
    }

    res.status(200).json({ repository });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/repositories/:id
 * @desc Update repository
 * @access Private
 */
router.put('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const repositoryId = req.params.id;
    const validatedData = updateRepoSchema.parse(req.body);

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found');
    }

    // Check permission with Permit.io
    const hasAdminPermission = await checkPermission(
      req.user.id,
      'admin',
      'repository',
      repositoryId
    );

    if (!hasAdminPermission && repository.ownerId !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to update this repository');
    }

    // Update repository
    const updatedRepository = await prisma.repository.update({
      where: { id: repositoryId },
      data: validatedData,
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'REPOSITORY_UPDATED',
        entityType: 'repository',
        entityId: updatedRepository.id,
        description: `Repository "${updatedRepository.name}" updated`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Repository updated successfully',
      repository: updatedRepository,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/repositories/:id
 * @desc Delete repository
 * @access Private
 */
router.delete('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const repositoryId = req.params.id;

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found');
    }

    // Check permission with Permit.io
    const hasDeletePermission = await checkPermission(
      req.user.id,
      'delete',
      'repository',
      repositoryId
    );

    if (!hasDeletePermission && repository.ownerId !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to delete this repository');
    }

    // Delete repository
    await prisma.repository.delete({
      where: { id: repositoryId },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'REPOSITORY_DELEPTED',
        entityType: 'repository',
        entityId: repositoryId,
        description: `Repository "${repository.name}" deleted`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Repository deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/repositories/:id/role-assignments
 * @desc Get role assignments for a repository
 * @access Private
 */
router.get('/:id/role-assignments', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const repositoryId = req.params.id;

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: repositoryId },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found');
    }

    // Check permission with Permit.io
    const hasViewPermission = await checkPermission(
      req.user.id,
      'view',
      'repository',
      repositoryId
    );

    if (!hasViewPermission && repository.ownerId !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to view this repository');
    }

    // Get role assignments
    const roleAssignments = await prisma.roleAssignment.findMany({
      where: {
        repositoryId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ roleAssignments });
  } catch (error) {
    next(error);
  }
});

export { router as repositoryRouter };
