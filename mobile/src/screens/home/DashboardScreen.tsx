import { Ionicons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import type {
  AccessRequestStackParamList,
  HomeStackParamList,
  MainTabParamList,
} from "../../navigation";
import { useUserStore } from "../../store/userStore";
import {
  fontScale,
  horizontalScale,
  verticalScale,
} from "../../utils/responsive";

// Define the navigation type for proper typing
type DashboardScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, "Dashboard">,
  CompositeNavigationProp<
    StackNavigationProp<AccessRequestStackParamList>,
    StackNavigationProp<MainTabParamList>
  >
>;

// Mock data for demonstration
const mockPendingRequests = [
  {
    id: "1",
    requester: "John Doe",
    repository: "frontend-app",
    role: "Developer",
    requestedAt: "2h ago",
  },
  {
    id: "2",
    requester: "Jane Smith",
    repository: "backend-api",
    role: "Admin",
    requestedAt: "4h ago",
  },
];

const mockRecentActivity = [
  {
    id: "1",
    user: "Mike Johnson",
    action: "approved access",
    target: "server-infra",
    timestamp: "1h ago",
  },
  {
    id: "2",
    user: "Lisa Chen",
    action: "requested access",
    target: "payment-gateway",
    timestamp: "3h ago",
  },
  {
    id: "3",
    user: "David Kim",
    action: "revoked access",
    target: "user-database",
    timestamp: "5h ago",
  },
];

const quickActions = [
  {
    id: "1",
    title: "Request Access",
    icon: "key-outline",
    backgroundColor: "rgba(255, 123, 0, 0.1)",
    color: "#FF7B00",
  },
  {
    id: "2",
    title: "Add Repository",
    icon: "git-branch",
    backgroundColor: "rgba(0, 170, 255, 0.1)",
    color: "#00AAFF",
  },
  {
    id: "3",
    title: "Manage Users",
    icon: "people-outline",
    backgroundColor: "rgba(103, 65, 217, 0.1)",
    color: "#6741D9",
  },
  {
    id: "4",
    title: "Audit Logs",
    icon: "document-outline",
    backgroundColor: "rgba(46, 204, 113, 0.1)",
    color: "#2ECC71",
  },
];

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user, fetchUserProfile } = useUserStore();
  const { width } = useWindowDimensions();

  // Determine the number of quick action items per row based on screen width
  const quickActionItemsPerRow = width < 360 ? 1 : 2;

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user ? `${user.firstName}` : "User"}
          </Text>
          <Text style={styles.subGreeting}>Welcome to GitGuard</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate("Notifications")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="notifications" size={24} color="#FFFFFF" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View
            style={[
              styles.quickActionsContainer,
              {
                flexDirection: quickActionItemsPerRow === 1 ? "column" : "row",
              },
            ]}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionItem,
                  {
                    backgroundColor: action.backgroundColor,
                    width: quickActionItemsPerRow === 1 ? "100%" : "48%",
                  },
                ]}
                onPress={() => console.log(`${action.title} pressed`)}
              >
                <View
                  style={[
                    styles.quickActionIconContainer,
                    { backgroundColor: action.backgroundColor },
                  ]}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={fontScale(24)}
                    color={action.color}
                  />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pending Approval Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AccessRequests")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {mockPendingRequests.length > 0 ? (
            mockPendingRequests.map((request) => (
              <CardContainer
                key={request.id}
                onPress={() =>
                  navigation.navigate("AccessRequestDetail", { id: request.id })
                }
              >
                <View style={styles.requestItem}>
                  <View style={styles.requestUserIcon}>
                    <Text style={styles.requestUserInitial}>
                      {request.requester.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>
                      {request.requester} requested{" "}
                      <Text style={styles.highlight}>{request.role}</Text>{" "}
                      access
                    </Text>
                    <Text style={styles.requestSubtitle}>
                      Repository:{" "}
                      <Text style={styles.highlight}>{request.repository}</Text>
                    </Text>
                    <Text style={styles.requestTime}>
                      {request.requestedAt}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={fontScale(20)}
                    color="#9DA5BD"
                  />
                </View>
              </CardContainer>
            ))
          ) : (
            <CardContainer>
              <Text style={styles.emptyStateText}>No pending requests</Text>
            </CardContainer>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <CardContainer>
            {mockRecentActivity.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <View style={styles.activityItem}>
                  <View style={styles.activityIconContainer}>
                    <Ionicons
                      name={
                        activity.action.includes("approved")
                          ? "checkmark-circle"
                          : activity.action.includes("revoked")
                            ? "close-circle"
                            : "time"
                      }
                      size={fontScale(20)}
                      color={
                        activity.action.includes("approved")
                          ? "#2ECC71"
                          : activity.action.includes("revoked")
                            ? "#E74C3C"
                            : "#FF7B00"
                      }
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      <Text style={styles.highlight}>{activity.user}</Text>{" "}
                      {activity.action}{" "}
                      <Text style={styles.highlight}>{activity.target}</Text>
                    </Text>
                    <Text style={styles.activityTime}>
                      {activity.timestamp}
                    </Text>
                  </View>
                </View>
                {index < mockRecentActivity.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </CardContainer>
        </View>

        {/* Role Expirations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Role Expirations</Text>

          <CardContainer>
            <View style={styles.expirationHeader}>
              <View style={styles.expirationIconContainer}>
                <Ionicons name="alarm" size={fontScale(24)} color="#FF7B00" />
              </View>
              <View>
                <Text style={styles.expirationTitle}>
                  Admin access to user-auth
                </Text>
                <Text style={styles.expirationTime}>Expires in 2 days</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.expirationAction}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.expirationActionText}>Request Extension</Text>
              <Ionicons
                name="arrow-forward"
                size={fontScale(16)}
                color="#FF7B00"
              />
            </TouchableOpacity>
          </CardContainer>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(16),
  },
  greeting: {
    fontSize: fontScale(24),
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  subGreeting: {
    fontSize: fontScale(14),
    color: "#BDC3D8", // Updated for better visibility
    fontFamily: "Inter-Regular",
  },
  notificationButton: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: "#1E2435",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF7B00",
    position: "absolute",
    top: 10,
    right: 10,
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
  },
  section: {
    marginBottom: verticalScale(24),
    paddingHorizontal: horizontalScale(24),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: verticalScale(16),
    fontFamily: "Inter-SemiBold",
  },
  seeAllText: {
    fontSize: fontScale(14),
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionItem: {
    width: "48%",
    borderRadius: 12,
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  quickActionIconContainer: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(12),
  },
  quickActionText: {
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestUserIcon: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: "rgba(255, 123, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: horizontalScale(12),
  },
  requestUserInitial: {
    fontSize: fontScale(16),
    fontWeight: "bold",
    color: "#FF7B00",
    fontFamily: "Inter-Bold",
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  requestSubtitle: {
    fontSize: fontScale(12),
    color: "#BDC3D8", // Updated for better visibility
    marginTop: verticalScale(4),
    fontFamily: "Inter-Regular",
  },
  requestTime: {
    fontSize: fontScale(12),
    color: "#8F98AD", // Updated for better visibility
    marginTop: verticalScale(4),
    fontFamily: "Inter-Regular",
  },
  highlight: {
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
  emptyStateText: {
    color: "#BDC3D8", // Updated for better visibility
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: verticalScale(12),
  },
  activityIconContainer: {
    width: horizontalScale(32),
    height: verticalScale(32),
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: horizontalScale(12),
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  activityTime: {
    fontSize: fontScale(12),
    color: "#8F98AD", // Updated for better visibility
    marginTop: verticalScale(4),
    fontFamily: "Inter-Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#2D3548",
    marginVertical: verticalScale(8),
  },
  expirationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  expirationIconContainer: {
    width: horizontalScale(40),
    height: verticalScale(40),
    borderRadius: 20,
    backgroundColor: "rgba(255, 123, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: horizontalScale(12),
  },
  expirationTitle: {
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  expirationTime: {
    fontSize: fontScale(12),
    color: "#FF7B00",
    marginTop: verticalScale(4),
    fontFamily: "Inter-Regular",
  },
  expirationAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(12),
  },
  expirationActionText: {
    fontSize: fontScale(14),
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
});

export default DashboardScreen;
