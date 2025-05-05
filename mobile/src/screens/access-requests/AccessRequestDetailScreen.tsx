import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AccessRequestActionButtons from "../../components/AccessRequestActionButtons";
import CardContainer from "../../components/CardContainer";
import ErrorMessage from "../../components/ErrorMessage";
import { AccessRequestStackParamList } from "../../navigation";
import { useAccessRequestStore } from "../../store";
import { useUserStore } from "../../store/userStore";

type AccessRequestDetailScreenRouteProp = RouteProp<
  AccessRequestStackParamList,
  "AccessRequestDetail"
>;

type AccessRequestDetailScreenNavigationProp =
  StackNavigationProp<AccessRequestStackParamList>;

const AccessRequestDetailScreen = () => {
  const route = useRoute<AccessRequestDetailScreenRouteProp>();
  const navigation = useNavigation<AccessRequestDetailScreenNavigationProp>();
  const { id } = route.params;

  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Get access request and user data from stores
  const {
    currentAccessRequest,
    isLoading,
    error,
    fetchAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
  } = useAccessRequestStore();
  const { currentUser, biometricToken } = useUserStore();

  // Load access request when screen is mounted
  useEffect(() => {
    fetchAccessRequest(id).catch((error) => {
      if (error?.response?.status === 403) {
        // Set a specific error for permission issues
        setPermissionError(
          "You don't have permission to view this access request."
        );
      }
    });
    checkBiometricAvailability();
  }, [id, fetchAccessRequest]);

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(available && enrolled);
  };

  // Get provider icon based on git provider
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

  // Get provider color based on git provider
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

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format date and time for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if current user is an approver for this request
  const isApprover = () => {
    if (!currentAccessRequest || !currentUser) return false;

    const isRepoOwner =
      currentAccessRequest.repository?.ownerId === currentUser.id;
    const isExplicitApprover =
      currentAccessRequest.approverIds &&
      currentAccessRequest.approverIds.includes(currentUser.id);

    console.log("Access Request ID:", currentAccessRequest.id);
    console.log("Current User ID:", currentUser.id);
    console.log("Is Repository Owner:", isRepoOwner);
    console.log("Is Explicit Approver:", isExplicitApprover);
    console.log("Request Status:", currentAccessRequest.status);

    return isRepoOwner || isExplicitApprover;
  };

  // Check if request is pending
  const isPending = useCallback(() => {
    return currentAccessRequest?.status === "PENDING";
  }, [currentAccessRequest]);

  // Render action buttons for pending requests
  const renderActionButtons = useCallback(() => {
    if (!isPending() || !isApprover() || !currentAccessRequest) {
      return null;
    }

    return (
      <AccessRequestActionButtons
        accessRequestId={id}
        biometricToken={biometricToken}
        onComplete={() => {
          // Refresh the request
          fetchAccessRequest(id);
        }}
      />
    );
  }, [
    id,
    isPending,
    isApprover,
    biometricToken,
    currentAccessRequest,
    fetchAccessRequest,
  ]);

  // Render status badge
  const renderStatusBadge = () => {
    if (!currentAccessRequest) return null;

    let statusText = currentAccessRequest.status;
    let statusIcon = "help-circle-outline";
    let color = getStatusColor(currentAccessRequest.status);

    switch (currentAccessRequest.status) {
      case "PENDING":
        statusIcon = "time-outline";
        break;
      case "APPROVED":
        statusIcon = "checkmark-circle-outline";
        break;
      case "REJECTED":
        statusIcon = "close-circle-outline";
        break;
      case "EXPIRED":
        statusIcon = "hourglass-outline";
        break;
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
        <Ionicons
          name={statusIcon}
          size={18}
          color={color}
          style={styles.statusIcon}
        />
        <Text style={[styles.statusText, { color }]}>{statusText}</Text>
      </View>
    );
  };

  // Add this method to render an approval notice
  const renderApprovalStatus = () => {
    if (!currentAccessRequest) return null;

    if (currentAccessRequest.status === "PENDING") {
      const canApprove = isApprover();

      console.log("renderApprovalStatus: Can approve:", canApprove);

      if (canApprove) {
        return (
          <View style={styles.approvalNotice}>
            <Text style={styles.approvalNoticeTitle}>
              Waiting for your approval
            </Text>
            <Text style={styles.approvalNoticeText}>
              As an admin or designated approver, you can approve or reject this
              request.
            </Text>
            <TouchableOpacity
              style={styles.approvalButton}
              onPress={() => navigation.navigate("ApproveRequest", { id: id })}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.approvalButtonText}>Review Request</Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View style={styles.pendingNotice}>
            <Text style={styles.pendingNoticeTitle}>Request pending</Text>
            <Text style={styles.pendingNoticeText}>
              Your request is waiting for approval from repository
              administrators.
            </Text>
          </View>
        );
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7B00" />
        <Text style={styles.loadingText}>Loading access request...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    // Show a special UI for permission errors
    if (permissionError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.permissionErrorContainer}>
            <Ionicons name="lock-closed" size={64} color="#F44336" />
            <Text style={styles.permissionErrorTitle}>Permission Denied</Text>
            <Text style={styles.permissionErrorMessage}>{permissionError}</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Back to Requests</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} />
      </SafeAreaView>
    );
  }

  if (!currentAccessRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Access request not found." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Access Request</Text>
          {renderStatusBadge()}
        </View>

        <CardContainer>
          <View style={styles.repositorySection}>
            <View
              style={[
                styles.repositoryIcon,
                {
                  backgroundColor: getProviderColor(
                    currentAccessRequest.repository.gitProvider
                  ),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getProviderIcon(
                  currentAccessRequest.repository.gitProvider
                )}
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.repositoryDetails}>
              <Text style={styles.repositoryName}>
                {currentAccessRequest.repository.name}
              </Text>
              <Text style={styles.repositoryDescription}>
                {currentAccessRequest.repository.description ||
                  "No description"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requester</Text>
              <Text style={styles.detailValue}>
                {currentAccessRequest.requester.firstName}{" "}
                {currentAccessRequest.requester.lastName}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>
                {currentAccessRequest.requester.email}
              </Text>
            </View>

            {currentAccessRequest.roleId && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {currentAccessRequest.roleId.substring(0, 8)}...
                  </Text>
                </View>
              </View>
            )}

            {currentAccessRequest.requestedActions &&
              currentAccessRequest.requestedActions.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested Actions</Text>
                  <View style={styles.actionsList}>
                    {currentAccessRequest.requestedActions.map(
                      (action, index) => (
                        <View key={index} style={styles.actionBadge}>
                          <Text style={styles.actionBadgeText}>{action}</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Multi-Approval</Text>
              <Text style={styles.detailValue}>
                {currentAccessRequest.requiresMultiApproval ? "Yes" : "No"}
              </Text>
            </View>

            {currentAccessRequest.expiresAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Expires</Text>
                <Text style={styles.detailValue}>
                  {formatDate(currentAccessRequest.expiresAt)}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(currentAccessRequest.createdAt)}
              </Text>
            </View>

            {currentAccessRequest.approvedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approved</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(currentAccessRequest.approvedAt)}
                </Text>
              </View>
            )}

            {currentAccessRequest.rejectedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejected</Text>
                <Text style={styles.detailValue}>
                  {formatDateTime(currentAccessRequest.rejectedAt)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.reasonSection}>
            <Text style={styles.reasonLabel}>Reason for Request</Text>
            <Text style={styles.reasonText}>{currentAccessRequest.reason}</Text>
          </View>
        </CardContainer>

        {renderApprovalStatus()}

        {renderActionButtons()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#161A28",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
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
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter-SemiBold",
  },
  repositorySection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  repositoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  repositoryDetails: {
    flex: 1,
  },
  repositoryName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
  },
  repositoryDescription: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#2D3548",
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    textAlign: "right",
    maxWidth: "60%",
  },
  roleBadge: {
    backgroundColor: "rgba(24, 144, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    color: "#1890FF",
    fontFamily: "Inter-Medium",
  },
  actionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  actionBadge: {
    backgroundColor: "rgba(64, 169, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
    marginBottom: 4,
  },
  actionBadgeText: {
    fontSize: 12,
    color: "#40A9FF",
    fontFamily: "Inter-Medium",
  },
  reasonSection: {
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  approvalNotice: {
    backgroundColor: "#FF9800",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  approvalNoticeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Inter-Bold",
  },
  approvalNoticeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  approvalButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  approvalButtonText: {
    fontSize: 14,
    color: "#FF9800",
    fontFamily: "Inter-SemiBold",
    marginLeft: 8,
  },
  pendingNotice: {
    backgroundColor: "#FF9800",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  pendingNoticeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Inter-Bold",
  },
  pendingNoticeText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  permissionErrorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionErrorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
    fontFamily: "Inter-Bold",
  },
  permissionErrorMessage: {
    fontSize: 16,
    color: "#9DA5BD",
    textAlign: "center",
    marginVertical: 16,
    fontFamily: "Inter-Regular",
  },
  backButton: {
    backgroundColor: "#FF7B00",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
});

export default AccessRequestDetailScreen;
