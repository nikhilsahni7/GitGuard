import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import {
  Notification,
  useNotificationStore,
} from "../../store/notificationStore";

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const refreshing = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Get notifications from store
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotificationStore();

  // Load notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;
    fetchNotifications().finally(() => {
      refreshing.current = false;
    });
  }, [fetchNotifications]);

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      markAsRead(notification.id);

      // Navigate based on deep link if available
      if (notification.deepLink) {
        const path = notification.deepLink.replace("gitguard://", "");

        if (path === "dashboard") {
          navigation.navigate("Home" as any);
        } else if (path.startsWith("repositories/")) {
          const repoId = path.split("/")[1];
          navigation.navigate(
            "Repositories" as any,
            {
              screen: "RepositoryDetail",
              params: { id: repoId },
            } as any
          );
        } else if (path.startsWith("approvals/")) {
          const requestId = path.split("/")[1];
          navigation.navigate(
            "AccessRequests" as any,
            {
              screen: "AccessRequestDetail",
              params: { id: requestId },
            } as any
          );
        }
      }
    },
    [markAsRead, navigation]
  );

  // Animation values for the header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 60],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.8}
    >
      <CardContainer>
        <View style={styles.notificationItem}>
          <View
            style={[styles.notificationDot, { opacity: item.read ? 0 : 1 }]}
          />
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.body}</Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </CardContainer>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        icon="notifications"
        title="No Notifications"
        message="You don't have any notifications yet"
      />
    );
  };

  // Render header
  const renderHeader = () => (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${
                unreadCount !== 1 ? "s" : ""
              }`
            : "You're all caught up!"}
        </Text>
      </Animated.View>

      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => markAllAsRead()}
          >
            <Ionicons name="checkmark-done" size={16} color="#9DA5BD" />
            <Text style={styles.actionButtonText}>Mark all as read</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => clearNotifications()}
          >
            <Ionicons name="trash-outline" size={16} color="#9DA5BD" />
            <Text style={styles.actionButtonText}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {error && <ErrorMessage message={error} />}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing.current}
            onRefresh={handleRefresh}
            colors={["#FF7B00"]}
            tintColor="#FF7B00"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  headerContainer: {
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  listContainer: {
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF7B00",
    marginTop: 8,
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
  },
  notificationBody: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 8,
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: "#626B85",
    fontFamily: "Inter-Regular",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: "#9DA5BD",
    marginLeft: 6,
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
});

export default NotificationsScreen;
