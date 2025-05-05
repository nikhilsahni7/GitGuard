import express from "express";
import { z } from "zod";
import { prisma } from "../index";
import { authenticateJwt, type AuthRequest } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import { validateBiometricApproval } from "../utils/biometricUtils";
import {
  sendAccessApprovedNotification,
  sendAccessRejectedNotification,
  sendApprovalRequestNotification,
} from "../utils/notificationUtils";
import { assignRoleInPermit } from "../utils/permitUtils";

const router = express.Router();

const createRequestSchema = z.object({
  repositoryId: z.string().uuid(),
  roleId: z.string().uuid().optional(),
  requestedActions: z.array(z.string()).optional(),
  reason: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  requiresMultiApproval: z.boolean().optional(),
  approverIds: z.array(z.string().uuid()).optional(),
});

const approveRequestSchema = z.object({
  biometricToken: z.string(),
});

const rejectRequestSchema = z.object({
  reason: z.string().min(1).optional(),
});

/**
 * @route POST /api/access-requests
 * @desc Create a new access request
 * @access Private
 */
router.post("/", authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    const validatedData = createRequestSchema.parse(req.body);

    // Check if repository exists
    const repository = await prisma.repository.findUnique({
      where: { id: validatedData.repositoryId },
      include: {
        owner: {
          select: { id: true },
        },
      },
    });

    if (!repository) {
      throw new ApiError(404, "Repository not found");
    }

    // Check if role exists (if provided)
    if (validatedData.roleId) {
      const role = await prisma.role.findUnique({
        where: { id: validatedData.roleId },
      });

      if (!role) {
        throw new ApiError(404, "Role not found");
      }
    } else if (
      !validatedData.requestedActions ||
      validatedData.requestedActions.length === 0
    ) {
      throw new ApiError(
        400,
        "Either roleId or requestedActions must be provided"
      );
    }

    // Check for existing pending request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        requesterId: req.user.id,
        repositoryId: validatedData.repositoryId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new ApiError(
        400,
        "You already have a pending access request for this repository"
      );
    }

    // Create access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterId: req.user.id,
        repositoryId: validatedData.repositoryId,
        roleId: validatedData.roleId,
        requestedActions: validatedData.requestedActions || [],
        reason: validatedData.reason,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : undefined,
        requiresMultiApproval: validatedData.requiresMultiApproval || false,
        approverIds: validatedData.approverIds || [],
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "ACCESS_REQUEST_CREATED",
        entityType: "access_request",
        entityId: accessRequest.id,
        description: `Access request created for repository "${repository.name}"`,
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
      },
    });

    // Send notification to repository owner
    await sendApprovalRequestNotification(
      accessRequest.id,
      repository.owner.id
    );

    // If multi-approval is required, send notifications to all approvers
    if (
      accessRequest.requiresMultiApproval &&
      accessRequest.approverIds.length > 0
    ) {
      for (const approverId of accessRequest.approverIds) {
        if (approverId !== repository.owner.id) {
          await sendApprovalRequestNotification(accessRequest.id, approverId);
        }
      }
    }

    res.status(201).json({
      message: "Access request created successfully",
      accessRequest,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/access-requests
 * @desc Get all access requests (paginated)
 * @access Private
 */
router.get("/", authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const type = req.query.type as
      | "pending"
      | "approved"
      | "rejected"
      | "all"
      | undefined;

    // Build filter conditions
    const whereConditions: any = {};

    // Filter by status if provided
    if (status) {
      whereConditions.status = status;
    }

    // Filter by type (pending/approved/rejected/all)
    if (type === "pending") {
      whereConditions.status = "PENDING";
    } else if (type === "approved") {
      whereConditions.status = "APPROVED";
    } else if (type === "rejected") {
      whereConditions.status = "REJECTED";
    }

    // Filter by role (requester or approver)
    const role = req.query.role as "requester" | "approver" | undefined;
    if (role === "requester") {
      whereConditions.requesterId = req.user.id;
    } else if (role === "approver") {
      // Fix: Include repository ownership in the approver check
      const userRepositories = await prisma.repository.findMany({
        where: {
          ownerId: req.user.id,
        },
        select: {
          id: true,
        },
      });

      const repositoryIds = userRepositories.map((repo) => repo.id);

      whereConditions.OR = [
        { approverId: req.user.id },
        { approverIds: { has: req.user.id } },
        {
          AND: [{ status: "PENDING" }, { repositoryId: { in: repositoryIds } }],
        },
      ];
    }

    const accessRequests = await prisma.accessRequest.findMany({
      where: whereConditions,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
            description: true,
            gitProvider: true,
            ownerId: true,
          },
        },
        approver: {
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
        createdAt: "desc",
      },
    });

    const totalRequests = await prisma.accessRequest.count({
      where: whereConditions,
    });

    res.status(200).json({
      accessRequests,
      pagination: {
        total: totalRequests,
        page,
        limit,
        pages: Math.ceil(totalRequests / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/access-requests/:id
 * @desc Get access request by ID
 * @access Private
 */
router.get("/:id", authenticateJwt, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated");
    }

    const requestId = req.params.id;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
            description: true,
            gitProvider: true,
            gitRepoUrl: true,
            ownerId: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!accessRequest) {
      throw new ApiError(404, "Access request not found");
    }

    // Check if user is requester, approver, or repository owner
    const isRequester = accessRequest.requesterId === req.user.id;
    const isApprover =
      accessRequest.approverId === req.user.id ||
      accessRequest.approverIds.includes(req.user.id) ||
      accessRequest.repository.ownerId === req.user.id;

    if (!isRequester && !isApprover) {
      throw new ApiError(
        403,
        "You do not have permission to view this access request"
      );
    }

    res.status(200).json({ accessRequest });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/access-requests/:id/approve
 * @desc Approve an access request with biometric verification
 * @access Private
 */
router.post(
  "/:id/approve",
  authenticateJwt,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      const requestId = req.params.id;
      const validatedData = approveRequestSchema.parse(req.body);

      // Validate biometric token
      const isValidBiometric = await validateBiometricApproval(
        requestId,
        req.user.id,
        validatedData.biometricToken
      );

      if (!isValidBiometric) {
        throw new ApiError(401, "Biometric verification failed");
      }

      // Get access request
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          repository: true,
          requester: true,
        },
      });

      if (!accessRequest) {
        throw new ApiError(404, "Access request not found");
      }

      if (accessRequest.status !== "PENDING") {
        throw new ApiError(
          400,
          "This access request has already been processed"
        );
      }

      // Check if user is authorized to approve
      const isRepositoryOwner =
        accessRequest.repository.ownerId === req.user.id;
      const isDesignatedApprover = accessRequest.approverIds.includes(
        req.user.id
      );

      if (!isRepositoryOwner && !isDesignatedApprover) {
        throw new ApiError(
          403,
          "You are not authorized to approve this request"
        );
      }

      // Handle multi-approval logic
      if (accessRequest.requiresMultiApproval) {
        // Update approval count
        const updatedRequest = await prisma.accessRequest.update({
          where: { id: requestId },
          data: {
            approvalCount: { increment: 1 },
          },
        });

        // Create audit log for this approval
        await prisma.auditLog.create({
          data: {
            action: "ACCESS_REQUEST_APPROVAL_STEP",
            entityType: "access_request",
            entityId: accessRequest.id,
            description: `Access request approved by ${req.user.id} (Step ${updatedRequest.approvalCount} of ${accessRequest.approverIds.length + 1})`,
            userId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] || "",
          },
        });

        if (
          updatedRequest.approvalCount >=
          accessRequest.approverIds.length + 1
        ) {
          // All approvals received, proceed with final approval
          await finalizeApproval(
            accessRequest,
            req.user.id,
            req.ip || "",
            req.headers["user-agent"] || ""
          );

          res.status(200).json({
            message: "Access request fully approved",
          });
        } else {
          res.status(200).json({
            message: `Approval recorded (${updatedRequest.approvalCount} of ${accessRequest.approverIds.length + 1})`,
            approvalCount: updatedRequest.approvalCount,
            requiredApprovals: accessRequest.approverIds.length + 1,
          });
        }
      } else {
        // Single approval is sufficient
        await finalizeApproval(
          accessRequest,
          req.user.id,
          req.ip || "",
          req.headers["user-agent"] || ""
        );

        res.status(200).json({
          message: "Access request approved successfully",
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Helper function to finalize approval
 */
const finalizeApproval = async (
  accessRequest: any,
  approverId: string,
  ipAddress: string,
  userAgent: string
) => {
  // Update access request status
  const updatedRequest = await prisma.accessRequest.update({
    where: { id: accessRequest.id },
    data: {
      status: "APPROVED",
      approverId,
      approvedAt: new Date(),
    },
  });

  // Create role assignment
  let roleAssignment;
  if (accessRequest.roleId) {
    roleAssignment = await prisma.roleAssignment.create({
      data: {
        userId: accessRequest.requesterId,
        roleId: accessRequest.roleId,
        repositoryId: accessRequest.repositoryId,
        expiresAt: accessRequest.expiresAt,
      },
    });

    // Register role assignment in Permit.io
    await assignRoleInPermit(
      accessRequest.requesterId,
      roleAssignment.roleId,
      "repository",
      accessRequest.repositoryId
    );
  }

  // Create audit log entry
  await prisma.auditLog.create({
    data: {
      action: "ACCESS_REQUEST_APPROVED",
      entityType: "access_request",
      entityId: accessRequest.id,
      description: `Access request for "${accessRequest.repository.name}" approved`,
      userId: approverId,
      ipAddress,
      userAgent,
      metadata: {
        requesterId: accessRequest.requesterId,
        repositoryId: accessRequest.repositoryId,
        roleId: accessRequest.roleId,
        expiresAt: accessRequest.expiresAt,
        roleAssignmentId: roleAssignment?.id,
      },
    },
  });

  // Send notification to requester
  await sendAccessApprovedNotification(accessRequest.id);
};

/**
 * @route POST /api/access-requests/:id/reject
 * @desc Reject an access request
 * @access Private
 */
router.post(
  "/:id/reject",
  authenticateJwt,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      const requestId = req.params.id;
      const validatedData = rejectRequestSchema.parse(req.body);
      const reason = validatedData.reason;

      // Get access request
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          repository: true,
          requester: true,
        },
      });

      if (!accessRequest) {
        throw new ApiError(404, "Access request not found");
      }

      if (accessRequest.status !== "PENDING") {
        throw new ApiError(
          400,
          "This access request has already been processed"
        );
      }

      // Check if user is authorized to reject
      const isRepositoryOwner =
        accessRequest.repository.ownerId === req.user.id;
      const isDesignatedApprover = accessRequest.approverIds.includes(
        req.user.id
      );

      if (!isRepositoryOwner && !isDesignatedApprover) {
        throw new ApiError(
          403,
          "You are not authorized to reject this request"
        );
      }

      // Update access request status
      const updatedRequest = await prisma.accessRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approverId: req.user.id,
          rejectedAt: new Date(),
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
          repository: {
            select: {
              id: true,
              name: true,
              description: true,
              gitProvider: true,
              gitRepoUrl: true,
              ownerId: true,
            },
          },
        },
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: "ACCESS_REQUEST_REJECTED",
          entityType: "access_request",
          entityId: accessRequest.id,
          description: `Access request for "${accessRequest.repository.name}" rejected`,
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "",
          metadata: {
            rejectionReason: reason,
          },
        },
      });

      // Send notification to requester
      await sendAccessRejectedNotification(accessRequest.id);

      res.status(200).json({
        message: "Access request rejected successfully",
        accessRequest: updatedRequest,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as accessRequestRouter };
