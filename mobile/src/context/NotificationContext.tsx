import { useNavigation } from "@react-navigation/native";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// Define a basic navigation type since we can't import the real one (circular dependency)
type BasicNavigation = {
  navigate: (screen: string, params?: any) => void;
};

interface Notification {
  title: string;
  body: string;
  deepLink?: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notification: Notification | null;
  showNotification: (notification: Notification) => void;
  hideNotification: () => void;
  isVisible: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notification: null,
  showNotification: () => {},
  hideNotification: () => {},
  isVisible: false,
});

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigation = useNavigation<BasicNavigation>();

  const showNotification = useCallback((notificationData: Notification) => {
    // First set the notification data
    setNotification(notificationData);

    // Use a small delay to ensure sequential rendering
    setTimeout(() => {
      setIsVisible(true);
    }, 10);
  }, []);

  const hideNotification = useCallback(() => {
    setIsVisible(false);

    // We don't clear the notification data immediately to allow for smooth animation
    setTimeout(() => {
      setNotification(null);
    }, 300);
  }, []);

  const handleNotificationPress = useCallback(() => {
    if (
      notification?.deepLink &&
      notification.deepLink.startsWith("gitguard://")
    ) {
      // Parse the deep link
      const path = notification.deepLink.replace("gitguard://", "");

      // Handle different deep link paths
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

    hideNotification();
  }, [notification, navigation, hideNotification]);

  const contextValue = {
    notification,
    showNotification,
    hideNotification,
    isVisible,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
