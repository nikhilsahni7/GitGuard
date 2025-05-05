import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../index";
import { type AuthRequest, authenticateJwt } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import {
  generateBiometricToken,
  verifyBiometricToken,
} from "../utils/biometricUtils";
import { sendPushNotification } from "../utils/notificationUtils";
import { syncUserWithPermit } from "../utils/permitUtils";

const router = express.Router();

// Schema for signup validation
const signupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
});

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Schema for biometric authentication
const biometricSchema = z.object({
  userId: z.string().uuid(),
  token: z.string(),
});

// Helper function to generate JWT token
const generateToken = (id: string, email: string): string => {
  const secret = process.env.JWT_SECRET || "fallback-secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "24h";

  // @ts-ignore: TypeScript has issues with the jwt.sign types
  return jwt.sign({ id, email }, secret, { expiresIn });
};

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post("/signup", async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ApiError(400, "User with this email already exists");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
      },
    });

    // Sync user with Permit.io
    await syncUserWithPermit(user.id);

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "USER_CREATED",
        entityType: "user",
        entityId: user.id,
        description: "User account created",
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
      },
    });

    // Return user data without password
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/login
 * @desc Log in a user
 * @access Public
 */
router.post("/login", async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "USER_LOGIN",
        entityType: "user",
        entityId: user.id,
        description: "User logged in",
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
      },
    });

    // Send welcome push notification if user has a push token
    if (user.pushToken) {
      try {
        await sendPushNotification(
          user.id,
          `Welcome back, ${user.firstName}!`,
          "You have successfully logged in to GitGuard",
          {
            actionType: "welcome_notification",
            timestamp: new Date().toISOString(),
            deepLink: "gitguard://dashboard",
          }
        );
      } catch (notificationError) {
        console.error(
          "Failed to send welcome notification:",
          notificationError
        );
        // Don't fail the login if notification fails
      }
    }

    // Return user data without password
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        biometricEnabled: user.biometricEnabled,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh JWT token
 * @access Private
 */
router.post(
  "/refresh",
  authenticateJwt,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      // Generate new JWT token
      const token = generateToken(req.user.id, req.user.email);

      res.status(200).json({
        message: "Token refreshed successfully",
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/biometric/setup
 * @desc Set up biometric authentication for a user
 * @access Private
 */
router.post(
  "/biometric/setup",
  authenticateJwt,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      // Generate biometric token
      const token = await generateBiometricToken(req.user.id);

      res.status(200).json({
        message: "Biometric authentication set up successfully",
        token,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/auth/biometric/verify
 * @desc Verify biometric authentication
 * @access Public
 */
router.post("/biometric/verify", async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = biometricSchema.parse(req.body);

    // Verify biometric token
    const isValid = await verifyBiometricToken(
      validatedData.userId,
      validatedData.token
    );

    if (!isValid) {
      throw new ApiError(401, "Invalid biometric token");
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        biometricEnabled: true,
        pushToken: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: "BIOMETRIC_LOGIN",
        entityType: "user",
        entityId: user.id,
        description: "User logged in with biometric authentication",
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
      },
    });

    // Send welcome push notification for biometric login
    if (user.pushToken) {
      try {
        // Small delay to ensure the app is ready to receive notifications
        setTimeout(async () => {
          await sendPushNotification(
            user.id,
            `Welcome back, ${user.firstName}!`,
            "You have successfully logged in using biometrics",
            {
              actionType: "biometric_login_notification",
              timestamp: new Date().toISOString(),
              deepLink: "gitguard://dashboard",
            }
          );
        }, 500);
      } catch (notificationError) {
        console.error(
          "Failed to send biometric login notification:",
          notificationError
        );
      }
    }

    res.status(200).json({
      message: "Biometric authentication successful",
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/biometric/disable
 * @desc Disable biometric authentication
 * @access Private
 */
router.post(
  "/biometric/disable",
  authenticateJwt,
  async (req: AuthRequest, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "User not authenticated");
      }

      // Update user to disable biometric authentication
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          biometricEnabled: false,
          biometricToken: null,
        },
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: "BIOMETRIC_DISABLED",
          entityType: "user",
          entityId: req.user.id,
          description: "Biometric authentication disabled",
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "",
        },
      });

      res.status(200).json({
        message: "Biometric authentication disabled successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as authRouter };
