import {
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NotificationToast from "./src/components/NotificationToast";
import {
  NotificationProvider,
  useNotification,
} from "./src/context/NotificationContext";
import { useInitialAuthCheck } from "./src/hooks/useInitialAuthCheck";
import RootNavigator from "./src/navigation";
import { useUserStore } from "./src/store/userStore";

// Define types for the navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      Auth: undefined;
      Main: undefined;
    }
  }
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Custom theme based on the design provided
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF7B00", // Vibrant orange
    secondary: "#00AAFF", // Blue accent for buttons
    background: "#161A28", // Dark blue/black
    card: "#1E2435", // Slightly lighter than background
    text: "#FFFFFF",
    border: "#2D3548",
    notification: "#FF7B00",
  },
  dark: true,
};

// Paper theme to match React Navigation theme
const paperTheme = {
  colors: {
    primary: "#FF7B00",
    accent: "#00AAFF",
    background: "#161A28",
    surface: "#1E2435",
    text: "#FFFFFF",
    disabled: "#626B85",
    placeholder: "#9DA5BD",
    backdrop: "rgba(0, 0, 0, 0.5)",
    notification: "#FF7B00",
  },
  dark: true,
};

// AppContent component that uses the notification context
const AppContent = () => {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("./assets/fonts/Inter-Regular.ttf"),
    "Inter-SemiBold": require("./assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("./assets/fonts/Inter-Bold.ttf"),
  });

  const updatePushToken = useUserStore((state) => state.updatePushToken);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { notification, showNotification, hideNotification, isVisible } =
    useNotification();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const navigation = useNavigation<any>();

  useInitialAuthCheck();

  // Register for push notifications
  useEffect(() => {
    async function registerForPushNotifications() {
      if (!isAuthenticated) return;

      try {
        console.log("Attempting to register for push notifications...");
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          console.log("Requesting push notification permissions...");
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.log("Failed to get push token for push notification!");
          return;
        }

        try {
          console.log("Getting Expo push token...");

          const { data: token } = await Notifications.getExpoPushTokenAsync({
            projectId: "f16601dd-ce65-450a-b335-f4ceecc2f7d8",
          });

          console.log("Push token obtained:", token);

          // Save the token to the backend
          if (token) {
            console.log("Saving push token to backend...");
            await updatePushToken(token);
            console.log("Push token saved successfully");
          }
        } catch (tokenError) {
          console.log("Error getting push token:", tokenError);
        }

        // For Android, we need to set the notification channel
        if (Platform.OS === "android") {
          console.log("Setting up Android notification channel...");
          Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF7B00",
          });
        }
      } catch (error) {
        console.error("Error registering for push notifications:", error);
      }
    }

    registerForPushNotifications();
  }, [isAuthenticated, updatePushToken]);

  // Set up notification listeners
  useEffect(() => {
    let isMounted = true;

    const setupListeners = setTimeout(() => {
      if (!isMounted) return;

      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          if (!isMounted) return;

          const { title, body, data } = notification.request.content;
          showNotification({
            title: title || "GitGuard Notification",
            body: body || "",
            deepLink: data?.deepLink as string,
            data: data as Record<string, any>,
          });
        });

      Notifications.addNotificationResponseReceivedListener((response) => {
        if (!isMounted) return;

        const { data } = response.notification.request.content;

        if (data?.deepLink) {
          const deepLink = data.deepLink as string;
          handleDeepLink(deepLink);
        }
      });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(setupListeners);

      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [showNotification]);

  // Function to handle deep links
  const handleDeepLink = (deepLink: string) => {
    if (deepLink && deepLink.startsWith("gitguard://")) {
      const path = deepLink.replace("gitguard://", "");

      // Handle navigation based on deep link path
      if (path === "dashboard") {
        navigation.navigate("Main", { screen: "Home" });
      } else if (path === "notifications") {
        navigation.navigate("Main", {
          screen: "Home",
          params: { screen: "Notifications" },
        });
      } else if (path.startsWith("repositories/")) {
        const repoId = path.split("/")[1];
        navigation.navigate("Main", {
          screen: "Repositories",
          params: { screen: "RepositoryDetail", params: { id: repoId } },
        });
      } else if (path.startsWith("approvals/")) {
        const requestId = path.split("/")[1];
        navigation.navigate("Main", {
          screen: "AccessRequests",
          params: { screen: "AccessRequestDetail", params: { id: requestId } },
        });
      }
    }
  };

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Promise.all([]);
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        if (fontsLoaded) {
          await SplashScreen.hideAsync();
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <RootNavigator />
      {notification && isVisible && (
        <NotificationToast
          title={notification.title}
          body={notification.body}
          visible={true}
          onPress={() => {
            if (notification.deepLink) {
              handleDeepLink(notification.deepLink);
            }
            hideNotification();
          }}
          onClose={hideNotification}
        />
      )}
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={theme}>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
});
