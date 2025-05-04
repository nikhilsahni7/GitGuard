import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { Resend } from 'resend';
import { prisma } from '../index';
import { ApiError } from '../middleware/errorHandler';

// Initialize Expo SDK
const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a push notification to a user
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {},
  deepLink?: string
) => {
  try {
    // Get user's push token
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true, email: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // If user doesn't have a push token, send an email instead
    if (!user.pushToken) {
      await sendEmail(
        user.email,
        title,
        body
      );
      return;
    }

    // Validate push token
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.warn(`Invalid Expo push token: ${user.pushToken}`);
      return;
    }

    // Create notification message
    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: 'default',
      title,
      body,
      data: {
        ...data,
        deepLink,
      },
    };

    // Send notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Handle ticket receipts
    const receiptIds = tickets
      .filter((ticket): ticket is ExpoPushTicket & { id: string } =>
        'id' in ticket && typeof ticket.id === 'string')
      .map(ticket => ticket.id);

    if (receiptIds.length > 0) {
      const receiptChunks = expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptChunks) {
        try {
          const receipts = await expo.getPushNotificationReceiptsAsync(chunk);

          // Log receipts with errors
          for (const [id, receipt] of Object.entries(receipts)) {
            if (receipt.status === 'error') {
              console.error(`Error sending notification with receipt ID ${id}:`, receipt.message);
            }
          }
        } catch (error) {
          console.error('Error getting notification receipts:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw new ApiError(500, 'Failed to send push notification');
  }
};

/**
 * Send an approval request notification to user
 */
export const sendApprovalRequestNotification = async (
  requestId: string,
  approverUserId: string
) => {
  try {
    // Get request details
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: { firstName: true, lastName: true, email: true },
        },
        repository: {
          select: { name: true },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Access request not found');
    }

    // Create notification title and body
    const title = 'Access Approval Request';
    const body = `${request.requester.firstName} ${request.requester.lastName} requested access to ${request.repository.name}`;

    // Send push notification with deep link to approval screen
    await sendPushNotification(
      approverUserId,
      title,
      body,
      {
        requestId: request.id,
        requesterName: `${request.requester.firstName} ${request.requester.lastName}`,
        repositoryName: request.repository.name,
        reason: request.reason,
      },
      `gitguard://approvals/${request.id}`
    );
  } catch (error) {
    console.error('Failed to send approval request notification:', error);
    throw new ApiError(500, 'Failed to send approval request notification');
  }
};

/**
 * Send an email to a user
 */
export const sendEmail = async (
  email: string,
  subject: string,
  text: string,
  html?: string
) => {
  try {
    const response = await resend.emails.send({
      from: 'GitGuard <notifications@gitguard.example.com>',
      to: email,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    if (!response.data?.id) {
      throw new Error('Failed to send email: No ID returned');
    }

    return response.data.id;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new ApiError(500, 'Failed to send email');
  }
};

/**
 * Send an access request approval notification to user
 */
export const sendAccessApprovedNotification = async (
  requestId: string
) => {
  try {
    // Get request details
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: { id: true, email: true },
        },
        repository: {
          select: { name: true },
        },
        approver: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Access request not found');
    }

    // Create notification title and body
    const title = 'Access Request Approved';
    const body = `Your access request for ${request.repository.name} has been approved by ${request.approver?.firstName} ${request.approver?.lastName}`;

    // Send push notification
    await sendPushNotification(
      request.requester.id,
      title,
      body,
      {
        requestId: request.id,
        repositoryName: request.repository.name,
        approverName: request.approver ? `${request.approver.firstName} ${request.approver.lastName}` : 'System',
      },
      `gitguard://repositories/${request.repositoryId}`
    );

    // Also send an email
    await sendEmail(
      request.requester.email,
      title,
      body
    );
  } catch (error) {
    console.error('Failed to send access approved notification:', error);
    throw new ApiError(500, 'Failed to send access approved notification');
  }
};

/**
 * Send an access request rejection notification to user
 */
export const sendAccessRejectedNotification = async (
  requestId: string
) => {
  try {
    // Get request details
    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: { id: true, email: true },
        },
        repository: {
          select: { name: true },
        },
        approver: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'Access request not found');
    }

    // Create notification title and body
    const title = 'Access Request Rejected';
    const body = `Your access request for ${request.repository.name} has been rejected by ${request.approver?.firstName} ${request.approver?.lastName}`;

    // Send push notification
    await sendPushNotification(
      request.requester.id,
      title,
      body,
      {
        requestId: request.id,
        repositoryName: request.repository.name,
        approverName: request.approver ? `${request.approver.firstName} ${request.approver.lastName}` : 'System',
      }
    );

    // Also send an email
    await sendEmail(
      request.requester.email,
      title,
      body
    );
  } catch (error) {
    console.error('Failed to send access rejected notification:', error);
    throw new ApiError(500, 'Failed to send access rejected notification');
  }
};
