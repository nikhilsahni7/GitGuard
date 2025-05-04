import express from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { type AuthRequest, authenticateJwt } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { checkPermission } from '../utils/permitUtils';

const router = express.Router();

// Schema for creating organization
const createOrgSchema = z.object({
  name: z.string().min(1),
});

// Schema for updating organization
const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
});

/**
 * @route POST /api/organizations
 * @desc Create a new organization
 * @access Private
 */
router.post('/', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const validatedData = createOrgSchema.parse(req.body);

    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_CREATED',
        entityType: 'organization',
        entityId: organization.id,
        description: `Organization "${organization.name}" created`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(201).json({
      message: 'Organization created successfully',
      organization,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/organizations
 * @desc Get all organizations (paginated)
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

    const organizations = await prisma.organization.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalOrganizations = await prisma.organization.count();

    res.status(200).json({
      organizations,
      pagination: {
        total: totalOrganizations,
        page,
        limit,
        pages: Math.ceil(totalOrganizations / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/organizations/:id
 * @desc Get organization by ID
 * @access Private
 */
router.get('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const organizationId = req.params.id;

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        repositories: {
          select: {
            id: true,
            name: true,
            description: true,
            gitProvider: true,
            createdAt: true,
          },
        },
        roles: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    res.status(200).json({ organization });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/organizations/:id
 * @desc Update organization
 * @access Private
 */
router.put('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const organizationId = req.params.id;
    const validatedData = updateOrgSchema.parse(req.body);

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    // Check permission with Permit.io
    const hasPermission = await checkPermission(
      req.user.id,
      'admin',
      'organization',
      organizationId
    );

    if (!hasPermission) {
      throw new ApiError(403, 'You do not have permission to update this organization');
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: validatedData,
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_UPDATED',
        entityType: 'organization',
        entityId: updatedOrganization.id,
        description: `Organization "${updatedOrganization.name}" updated`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Organization updated successfully',
      organization: updatedOrganization,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/organizations/:id
 * @desc Delete organization
 * @access Private
 */
router.delete('/:id', authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    const organizationId = req.params.id;

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ApiError(404, 'Organization not found');
    }

    // Check permission with Permit.io
    const hasPermission = await checkPermission(
      req.user.id,
      'admin',
      'organization',
      organizationId
    );

    if (!hasPermission) {
      throw new ApiError(403, 'You do not have permission to delete this organization');
    }

    // Delete organization
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: 'ORGANIZATION_DELETED',
        entityType: 'organization',
        entityId: organizationId,
        description: `Organization "${organization.name}" deleted`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      },
    });

    res.status(200).json({
      message: 'Organization deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export { router as organizationRouter };
