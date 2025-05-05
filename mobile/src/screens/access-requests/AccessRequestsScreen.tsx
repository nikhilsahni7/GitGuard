import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LinearGradientButton from "../../components/LinearGradientButton";
import {
  AccessRequestStackParamList,
  RepositoryStackParamList,
} from "../../navigation";
import { AccessRequest } from "../../services/accessRequestService";
import { useAccessRequestStore } from "../../store";

type AccessRequestsScreenNavigationProp = StackNavigationProp<
  AccessRequestStackParamList & RepositoryStackParamList
>;

// Filter options
const statusOptions = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

// Role options
const roleOptions = [
  { id: "all", label: "All Roles" },
  { id: "requester", label: "My Requests" },
  { id: "approver", label: "To Approve" },
];

const AccessRequestsScreen = () => {
  const navigation = useNavigation<AccessRequestsScreenNavigationProp>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const refreshing = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Get access requests from store
  const { accessRequests, isLoading, error, fetchAccessRequests, pagination } =
    useAccessRequestStore();

  // Load access requests when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log(
        `Fetching access requests with filters: status=${statusFilter}, role=${roleFilter}`
      );
      // When "To Approve" filter is selected, explicitly set status to "pending"
      const type =
        roleFilter === "approver"
          ? "pending"
          : statusFilter === "all"
            ? undefined
            : statusFilter;
      const role = roleFilter === "all" ? undefined : roleFilter;

      setPermissionError(null);

      fetchAccessRequests(1, 20, undefined, type as any, role as any).catch(
        (err) => {
          if (err?.response?.status === 403) {
            setPermissionError(
              "You don't have permission to view these access requests."
            );
          }
        }
      );
    }, [fetchAccessRequests, statusFilter, roleFilter])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;
    setPermissionError(null);

    // When "To Approve" filter is selected, explicitly set status to "pending"
    const type =
      roleFilter === "approver"
        ? "pending"
        : statusFilter === "all"
          ? undefined
          : statusFilter;
    const role = roleFilter === "all" ? undefined : roleFilter;

    fetchAccessRequests(1, 20, undefined, type as any, role as any)
      .catch((err) => {
        if (err?.response?.status === 403) {
          setPermissionError(
            "You don't have permission to view these access requests."
          );
        }
      })
      .finally(() => {
        refreshing.current = false;
      });
  }, [fetchAccessRequests, statusFilter, roleFilter]);

  // Handle end of list reached for pagination
  const handleEndReached = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      // When "To Approve" filter is selected, explicitly set status to "pending"
      const type =
        roleFilter === "approver"
          ? "pending"
          : statusFilter === "all"
            ? undefined
            : statusFilter;
      const role = roleFilter === "all" ? undefined : roleFilter;

      fetchAccessRequests(
        pagination.page + 1,
        pagination.limit,
        undefined,
        type as any,
        role as any
      );
    }
  }, [isLoading, pagination, fetchAccessRequests, statusFilter, roleFilter]);

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
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "#FF9800";
      case "APPROVED":
        return "#4CAF50";
      case "REJECTED":
        return "#F44336";
      case "EXPIRED":
        return "#9E9E9E";
      default:
        return "#9E9E9E";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "time-outline";
      case "APPROVED":
        return "checkmark-circle";
      case "REJECTED":
        return "close-circle";
      case "EXPIRED":
        return "hourglass-outline";
      default:
        return "help-circle";
    }
  };

  // Handle filter selection
  const handleStatusFilter = (status: string) => {
    console.log(`Setting status filter to: ${status}`);
    setStatusFilter(status);
  };

  const handleRoleFilter = (role: string) => {
    console.log(`Setting role filter to: ${role}`);

    if (role === "approver") {
      console.log(
        "Switching to APPROVER view - will show pending requests requiring approval"
      );
    } else if (role === "requester") {
      console.log("Switching to REQUESTER view - will show your requests");
    } else {
      console.log("Switching to ALL ROLES view");
    }

    setRoleFilter(role);
  };

  // Handler for creating a new access request
  const handleCreateAccessRequest = () => {
    navigation.navigate("CreateAccessRequest", {});
  };

  // Handle request item press - navigate to details
  const handleRequestPress = (requestId: string) => {
    console.log(`Navigating to request details for ID: ${requestId}`);
    navigation.navigate("AccessRequestDetail", { id: requestId });
  };

  // Handle approve button press
  const handleApprovePress = (requestId: string) => {
    console.log(`Navigating to approval screen for request ID: ${requestId}`);
    navigation.navigate("ApproveRequest", { id: requestId });
  };

  // Render access request item
  const renderAccessRequestItem = ({ item }: { item: AccessRequest }) => (
    <CardContainer onPress={() => handleRequestPress(item.id)}>
      <View style={styles.requestHeader}>
        <View style={styles.repositoryInfo}>
          {item.repository ? (
            <>
              <View
                style={[
                  styles.repositoryIcon,
                  {
                    backgroundColor: getProviderColor(
                      item.repository.gitProvider
                    ),
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getProviderIcon(item.repository.gitProvider)}
                  size={16}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.repositoryName}>{item.repository.name}</Text>
            </>
          ) : (
            <Text style={styles.repositoryName}>Unknown Repository</Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
            style={styles.statusIcon}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {item.roleId && (
        <View style={styles.roleInfo}>
          <Text style={styles.roleInfoLabel}>Requested Role:</Text>
          <View style={styles.roleInfoBadge}>
            <Text style={styles.roleInfoBadgeText}>
              {item.roleId && item.roleId.length > 10
                ? item.roleId.substring(0, 8) + "..."
                : "Custom Access"}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>Reason:</Text>
        <Text style={styles.reasonText}>
          {item.reason.length > 100
            ? `${item.reason.substring(0, 100)}...`
            : item.reason}
        </Text>
      </View>

      <View style={styles.requestFooter}>
        <View style={styles.requestInfo}>
          {item.requester && (
            <Text style={styles.requestInfoText}>
              By {item.requester.firstName} {item.requester.lastName}
            </Text>
          )}
          <Text style={styles.requestInfoText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {item.status === "PENDING" && roleFilter === "approver" && (
          <TouchableOpacity
            style={styles.approveButton}
            onPress={() => handleApprovePress(item.id)}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={20}
              color="#4CAF50"
              style={styles.approveIcon}
            />
            <Text style={styles.approveButtonText}>Approve/Reject</Text>
          </TouchableOpacity>
        )}
      </View>
    </CardContainer>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading access requests...</Text>
        </View>
      );
    }

    if (permissionError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.errorTitle}>Permission Error</Text>
          <Text style={styles.errorMessage}>{permissionError}</Text>
          <TouchableOpacity
            style={styles.createAccessButton}
            onPress={handleCreateAccessRequest}
          >
            <Text style={styles.createAccessButtonText}>Request Access</Text>
          </TouchableOpacity>
        </View>
      );
    }

    let title = "No access requests found";
    let subtitle = "There are no access requests matching your filters.";
    let icon = "document-outline";
    let iconSet = "ionicons";

    if (roleFilter === "requester") {
      title = "No access requests";
      subtitle =
        "You haven't requested any access yet. Tap the button below to create a request.";
      icon = "file-plus-outline";
      iconSet = "material";
    } else if (roleFilter === "approver") {
      title = "No pending approvals";
      subtitle = "There are no access requests awaiting your approval.";
      icon = "checkmark-circle-outline";
    }

    return (
      <EmptyState
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconSet={iconSet as "ionicons" | "material"}
        action={
          roleFilter === "requester" ? (
            <LinearGradientButton
              title="Create Access Request"
              onPress={handleCreateAccessRequest}
              style={styles.createButton}
            />
          ) : null
        }
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
        <Text style={styles.headerTitle}>Access Requests</Text>
        <Text style={styles.headerSubtitle}>
          {roleFilter === "approver"
            ? "Requests waiting for your approval"
            : roleFilter === "requester"
              ? "Your requests for access"
              : "Manage repository access requests"}
        </Text>
      </Animated.View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Status</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={statusFilter === item.id}
              onPress={() => handleStatusFilter(item.id)}
              style={[
                styles.filterChip,
                statusFilter === item.id && styles.activeFilterChip,
              ]}
              textStyle={[
                styles.filterChipText,
                statusFilter === item.id && styles.activeFilterChipText,
              ]}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Role</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={roleOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={roleFilter === item.id}
              onPress={() => handleRoleFilter(item.id)}
              style={[
                styles.filterChip,
                roleFilter === item.id && styles.activeFilterChip,
                item.id === "approver" && styles.approverFilterChip,
                roleFilter === "approver" &&
                  item.id === "approver" &&
                  styles.activeApproverFilterChip,
              ]}
              textStyle={[
                styles.filterChipText,
                roleFilter === item.id && styles.activeFilterChipText,
                item.id === "approver" && styles.approverFilterChipText,
                roleFilter === "approver" &&
                  item.id === "approver" &&
                  styles.activeApproverFilterChipText,
              ]}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {error && !permissionError && <ErrorMessage message={error} />}
    </>
  );

  // Render footer for FlatList (loading indicator for pagination)
  const renderFooter = () => {
    if (!isLoading || accessRequests.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FF7B00" />
        <Text style={styles.footerText}>Loading more requests...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.addButtonContainer}>
        <LinearGradientButton
          onPress={() => navigation.navigate("CreateAccessRequest", {})}
          text="Request Access"
          icon="add-circle-outline"
        />
      </View>

      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={accessRequests}
        renderItem={renderAccessRequestItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing.current}
            onRefresh={handleRefresh}
            colors={["#FF7B00"]}
            tintColor="#FF7B00"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

// Helper functions
const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "GITHUB":
      return "github";
    case "GITLAB":
      return "gitlab";
    case "BITBUCKET":
      return "bitbucket";
    default:
      return "git";
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case "GITHUB":
      return "#24292E";
    case "GITLAB":
      return "#FC6D26";
    case "BITBUCKET":
      return "#2684FF";
    default:
      return "#6741D9";
  }
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
    paddingBottom: 100,
  },
  filterContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  filterList: {
    flexDirection: "row",
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#1E2435",
    borderColor: "#2D3548",
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: "rgba(255, 123, 0, 0.2)",
    borderColor: "#FF7B00",
  },
  filterChipText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  activeFilterChipText: {
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  repositoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  repositoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  repositoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter-SemiBold",
  },
  reasonContainer: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 4,
    fontFamily: "Inter-Regular",
  },
  reasonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  requestInfo: {
    flex: 1,
  },
  requestInfoText: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
  },
  approveButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    fontFamily: "Inter-SemiBold",
  },
  approveIcon: {
    marginRight: 8,
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
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  roleInfo: {
    marginBottom: 12,
  },
  roleInfoLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 4,
    fontFamily: "Inter-Regular",
  },
  roleInfoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#1E2435",
  },
  roleInfoBadgeText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
  },
  errorContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    fontFamily: "Inter-Bold",
  },
  errorMessage: {
    fontSize: 16,
    color: "#9DA5BD",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    fontFamily: "Inter-Regular",
  },
  createAccessButton: {
    backgroundColor: "#FF7B00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createAccessButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  approverFilterChip: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderColor: "rgba(76, 175, 80, 0.4)",
    borderWidth: 1,
  },
  approverFilterChipText: {
    color: "#4CAF50",
    fontFamily: "Inter-Medium",
  },
  activeApproverFilterChip: {
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  activeApproverFilterChipText: {
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
});

export default AccessRequestsScreen;
