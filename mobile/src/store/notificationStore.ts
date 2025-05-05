import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
  deepLink?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,

      fetchNotifications: async () => {
        try {
          set({ isLoading: true, error: null });

          // Fetch notifications from API
          const response = await axios.get("/api/notifications");

          // Update state with fetched notifications
          set({
            notifications: response.data.notifications,
            unreadCount: response.data.notifications.filter(
              (n: Notification) => !n.read
            ).length,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error fetching notifications:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch notifications",
          });
        }
      },

      markAsRead: async (id: string) => {
        try {
          // Optimistically update UI
          const { notifications } = get();
          const updatedNotifications = notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );

          set({
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter((n) => !n.read).length,
          });

          // Update on server
          await axios.post(`/api/notifications/${id}/read`);
        } catch (error) {
          console.error("Error marking notification as read:", error);
          // Revert on error by refetching
          get().fetchNotifications();
        }
      },

      markAllAsRead: async () => {
        try {
          // Optimistically update UI
          const { notifications } = get();
          const updatedNotifications = notifications.map((n) => ({
            ...n,
            read: true,
          }));

          set({ notifications: updatedNotifications, unreadCount: 0 });

          // Update on server
          await axios.post("/api/notifications/read-all");
        } catch (error) {
          console.error("Error marking all notifications as read:", error);
          // Revert on error by refetching
          get().fetchNotifications();
        }
      },

      clearNotifications: async () => {
        try {
          // Update UI
          set({ notifications: [], unreadCount: 0 });

          // Update on server
          await axios.delete("/api/notifications/clear");
        } catch (error) {
          console.error("Error clearing notifications:", error);
          // Revert on error by refetching
          get().fetchNotifications();
        }
      },

      addNotification: (notification: Notification) => {
        const { notifications } = get();

        // Avoid duplicates
        if (notifications.some((n) => n.id === notification.id)) {
          return;
        }

        // Update state with new notification
        set({
          notifications: [notification, ...notifications],
          unreadCount: get().unreadCount + (notification.read ? 0 : 1),
        });
      },
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
