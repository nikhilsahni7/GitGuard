import crypto from 'crypto';
import { prisma } from '../index';
import { ApiError } from '../middleware/errorHandler';

/**
 * Generate a new biometric token for a user
 */
export const generateBiometricToken = async (userId: string): Promise<string> => {
  try {
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Update user with the new token
    await prisma.user.update({
      where: { id: userId },
      data: {
        biometricToken: token,
        biometricEnabled: true,
      },
    });

    // Log the biometric setup in audit log
    await prisma.auditLog.create({
      data: {
        action: 'BIOMETRIC_SETUP',
        entityType: 'user',
        entityId: userId,
        description: 'Biometric authentication enabled',
        userId,
      },
    });

    return token;
  } catch (error) {
    console.error('Failed to generate biometric token:', error);
    throw new ApiError(500, 'Failed to generate biometric token');
  }
};

/**
 * Verify a biometric token
 */
export const verifyBiometricToken = async (
  userId: string,
  token: string
): Promise<boolean> => {
  try {
    // Get user's biometric token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { biometricToken: true, biometricEnabled: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!user.biometricEnabled || !user.biometricToken) {
      throw new ApiError(400, 'Biometric authentication not enabled');
    }

    // Compare tokens
    const isValid = user.biometricToken === token;

    // Log the verification attempt in audit log
    await prisma.auditLog.create({
      data: {
        action: 'BIOMETRIC_VERIFICATION',
        entityType: 'user',
        entityId: userId,
        description: isValid
          ? 'Biometric verification successful'
          : 'Biometric verification failed',
        userId,
      },
    });

    return isValid;
  } catch (error) {
    console.error('Failed to verify biometric token:', error);
    throw new ApiError(500, 'Failed to verify biometric token');
  }
};

/**
 * Disable biometric authentication for a user
 */
export const disableBiometricAuth = async (userId: string): Promise<boolean> => {
  try {
    // Update user to disable biometric auth
    await prisma.user.update({
      where: { id: userId },
      data: {
        biometricEnabled: false,
        biometricToken: null,
      },
    });

    // Log the biometric disable in audit log
    await prisma.auditLog.create({
      data: {
        action: 'BIOMETRIC_DISABLED',
        entityType: 'user',
        entityId: userId,
        description: 'Biometric authentication disabled',
        userId,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to disable biometric authentication:', error);
    throw new ApiError(500, 'Failed to disable biometric authentication');
  }
};

/**
 * Validate a biometric approval for an access request
 */
export const validateBiometricApproval = async (
  requestId: string,
  approverId: string,
  token: string
): Promise<boolean> => {
  try {
    // Verify the biometric token
    const isValidToken = await verifyBiometricToken(approverId, token);

    if (!isValidToken) {
      throw new ApiError(401, 'Invalid biometric token');
    }

    // Check if the request exists and the approver is authorized
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!request) {
      throw new ApiError(404, 'Access request not found');
    }

    // Log the biometric approval in audit log
    await prisma.auditLog.create({
      data: {
        action: 'BIOMETRIC_APPROVAL',
        entityType: 'access_request',
        entityId: requestId,
        description: 'Biometric approval for access request',
        userId: approverId,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to validate biometric approval:', error);
    throw new ApiError(500, 'Failed to validate biometric approval');
  }
};
