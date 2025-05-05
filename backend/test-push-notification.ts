import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { Expo, type ExpoPushMessage } from "expo-server-sdk";

dotenv.config();

const prisma = new PrismaClient();

async function testPushNotification() {
  try {
    console.log("🔔 Starting push notification test...");

    // Get the first user with a push token
    const user = await prisma.user.findFirst({
      where: {
        pushToken: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        pushToken: true,
      },
    });

    if (!user || !user.pushToken) {
      console.error("❌ No users found with push tokens");
      return;
    }

    console.log(
      `📱 Found user: ${user.firstName} ${user.lastName} (${user.email})`
    );
    console.log(`🔑 Push token: ${user.pushToken}`);

    // Initialize Expo SDK
    const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

    // Check if token is valid
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`❌ Invalid push token format: ${user.pushToken}`);
      return;
    }

    // Create a notification message
    const message: ExpoPushMessage = {
      to: user.pushToken,
      sound: "default",
      title: "HELLO NIKHIL",
      body: "YAH THIS WORKS ",
      // adding more fancy stuff here
      priority: "high",
      badge: 1,
      subtitle: "Push notification test",
      categoryId: "notification",
      channelId: "default",
      expiration: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      ttl: 3600, // Time to live: 1 hour
      mutableContent: true,
      data: {
        userId: user.id,
        timestamp: new Date().toISOString(),
        actionType: "test_notification",
        deepLink: "gitguard://notifications",
        imageUrl: "https://picsum.photos/200/300", // Image URL in data for custom handling
      },
    };

    console.log("📤 Sending notification...");
    console.log(message);

    // Send notification
    const chunks = expo.chunkPushNotifications([message]);

    for (const chunk of chunks) {
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log("🎫 Tickets:", tickets);

        // Check for errors
        for (const ticket of tickets) {
          if (ticket.status === "error") {
            console.error(`❌ Error sending notification:`, ticket);
          }
        }
      } catch (error) {
        console.error("❌ Error sending push notification chunk:", error);
      }
    }

    console.log("✅ Push notification test completed");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPushNotification()
  .then(() => {
    console.log("🎉 Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
