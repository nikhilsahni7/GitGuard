import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import ErrorMessage from "../../components/ErrorMessage";
import { AccessRequestStackParamList } from "../../navigation";
import { useAccessRequestStore } from "../../store";
import { useUserStore } from "../../store/userStore";

type ApproveRequestScreenRouteProp = RouteProp<
  AccessRequestStackParamList,
  "ApproveRequest"
>;

type ApproveRequestScreenNavigationProp =
  StackNavigationProp<AccessRequestStackParamList>;

const ApproveRequestScreen = () => {
  const route = useRoute<ApproveRequestScreenRouteProp>();
  const navigation = useNavigation<ApproveRequestScreenNavigationProp>();
  const { id } = route.params;

  const [rejectionReason, setRejectionReason] = useState("");
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Get access request and biometric token from stores
  const {
    currentAccessRequest,
    isLoading,
    error,
    fetchAccessRequest,
    approveAccessRequest,
    rejectAccessRequest,
  } = useAccessRequestStore();

  const { biometricToken } = useUserStore();

  // Load access request when component mounts
  useEffect(() => {
    console.log(`Loading access request details for ID: ${id}`);
    fetchAccessRequest(id)
      .then((response) => {
        console.log(
          "Access request loaded successfully:",
          currentAccessRequest?.id,
          currentAccessRequest?.status
        );
      })
      .catch((err) => {
        console.error("Error fetching access request:", err);
        if (err?.response?.status) {
          console.error(`Status code: ${err.response.status}`);
        }
        if (err?.response?.data) {
          console.error(`Error data: ${JSON.stringify(err.response.data)}`);
        }
        Alert.alert(
          "Error",
          "Could not load access request details. " +
            (err?.response?.data?.message || err.message || "Unknown error")
        );
      });

    // Check if biometric authentication is available
    checkBiometricAvailability();
  }, [id, fetchAccessRequest]);

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    const available = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(available && enrolled);
    console.log(`Biometric authentication available: ${available && enrolled}`);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiration date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get provider icon
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

  // Get provider color
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

  // Handle biometric authentication and approval
  const handleApprove = useCallback(async () => {
    console.log("Starting approval process...");
    if (!currentAccessRequest) {
      Alert.alert("Error", "No access request found to approve.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get biometric token directly from AsyncStorage
      const storedBiometricToken =
        await AsyncStorage.getItem("biometric_token");
      console.log(
        "Retrieved biometric token for approval:",
        !!storedBiometricToken
      );

      if (!storedBiometricToken && !biometricToken) {
        Alert.alert(
          "Authentication Error",
          "No biometric token available. Please set up biometric authentication in your profile settings first.",
          [
            {
              text: "OK",
              onPress: () => setIsSubmitting(false),
            },
          ]
        );
        return;
      }

      // Use the token from AsyncStorage or from UserStore
      const tokenToUse = storedBiometricToken || biometricToken;

      // If biometrics are available, authenticate
      if (biometricAvailable) {
        console.log("Attempting biometric authentication...");
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to approve access request",
          fallbackLabel: "Enter password",
        });

        if (result.success) {
          console.log("Biometric authentication successful");
          if (tokenToUse) {
            await approveWithToken(tokenToUse);
          } else {
            Alert.alert(
              "Error",
              "No valid biometric token found. Please set up biometric authentication first."
            );
            setIsSubmitting(false);
          }
        } else {
          console.log("Biometric authentication failed");
          Alert.alert(
            "Authentication Failed",
            "Please try again to approve the access request."
          );
          setIsSubmitting(false);
        }
      } else {
        console.log(
          "Biometric authentication not available, showing prompt..."
        );
        // If there's no biometric option, ask the user if they want to proceed
        Alert.alert(
          "Biometric Authentication Not Available",
          "Your device doesn't support biometric authentication or you haven't set it up. Would you like to proceed with approval anyway?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsSubmitting(false);
              },
            },
            {
              text: "Proceed",
              onPress: () => {
                if (tokenToUse) {
                  approveWithToken(tokenToUse);
                } else {
                  Alert.alert(
                    "Error",
                    "No authentication token available. Please set up biometric authentication first."
                  );
                  setIsSubmitting(false);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Approval process error:", error);
      Alert.alert(
        "Error",
        "An error occurred during the approval process. Please try again."
      );
      setIsSubmitting(false);
    }
  }, [
    currentAccessRequest,
    biometricToken,
    biometricAvailable,
    approveAccessRequest,
    navigation,
  ]);

  // Helper function to approve with a token
  const approveWithToken = async (token: string) => {
    try {
      console.log(
        `Approving access request ${id} with token...`,
        `Request status: ${currentAccessRequest?.status}`
      );

      if (!currentAccessRequest) {
        Alert.alert("Error", "No access request data available");
        setIsSubmitting(false);
        return;
      }

      if (currentAccessRequest.status !== "PENDING") {
        Alert.alert(
          "Error",
          `This request cannot be approved because its status is ${currentAccessRequest.status}`
        );
        setIsSubmitting(false);
        return;
      }

      await approveAccessRequest(id, token);
      Alert.alert("Success", "The access request has been approved.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("AccessRequests"),
        },
      ]);
    } catch (error: any) {
      console.error("Approval error:", error);
      let errorMessage = "An error occurred during approval";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", `${errorMessage}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle rejection form
  const toggleRejection = () => {
    setIsRejecting(!isRejecting);
  };

  // Handle rejection
  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      Alert.alert(
        "Reason Required",
        "Please provide a reason for rejecting this request."
      );
      return;
    }

    if (!currentAccessRequest) {
      Alert.alert("Error", "No access request data available");
      return;
    }

    if (currentAccessRequest.status !== "PENDING") {
      Alert.alert(
        "Error",
        `This request cannot be rejected because its status is ${currentAccessRequest.status}`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      console.log(
        `Rejecting access request ${id} with reason: ${rejectionReason}`
      );
      await rejectAccessRequest(id, rejectionReason);
      Alert.alert("Success", "The access request has been rejected.", [
        {
          text: "OK",
          onPress: () => navigation.navigate("AccessRequests"),
        },
      ]);
    } catch (error: any) {
      console.error("Rejection error:", error);
      let errorMessage = "An error occurred during rejection";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", `${errorMessage}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    id,
    rejectionReason,
    rejectAccessRequest,
    navigation,
    currentAccessRequest,
  ]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>
            Loading access request details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={error} />
      </SafeAreaView>
    );
  }

  if (!currentAccessRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Access request not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Approve Request</Text>
          <Text style={styles.subtitle}>Review and approve access request</Text>
        </View>

        <CardContainer>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Request Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <Ionicons
                name={
                  currentAccessRequest.status === "PENDING"
                    ? "time-outline"
                    : currentAccessRequest.status === "APPROVED"
                      ? "checkmark-circle-outline"
                      : "close-circle-outline"
                }
                size={16}
                color={
                  currentAccessRequest.status === "PENDING"
                    ? "#FF9800"
                    : currentAccessRequest.status === "APPROVED"
                      ? "#4CAF50"
                      : "#F44336"
                }
                style={styles.statusIcon}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      currentAccessRequest.status === "PENDING"
                        ? "#FF9800"
                        : currentAccessRequest.status === "APPROVED"
                          ? "#4CAF50"
                          : "#F44336",
                  },
                ]}
              >
                {currentAccessRequest.status}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested By</Text>
            <Text style={styles.infoValue}>
              {currentAccessRequest.requester
                ? `${currentAccessRequest.requester.firstName} ${currentAccessRequest.requester.lastName}`
                : "Unknown User"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Requested</Text>
            <Text style={styles.infoValue}>
              {formatDate(currentAccessRequest.createdAt)}
            </Text>
          </View>

          {currentAccessRequest.expiresAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expires At</Text>
              <Text style={styles.infoValue}>
                {formatDate(currentAccessRequest.expiresAt)}
              </Text>
            </View>
          )}

          {currentAccessRequest.requiresMultiApproval && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Multi-Approval</Text>
              <Text style={styles.infoValue}>
                Required ({currentAccessRequest.approvalCount}/
                {currentAccessRequest.approverIds.length + 1})
              </Text>
            </View>
          )}
        </CardContainer>

        <CardContainer>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Repository</Text>
          </View>

          {currentAccessRequest.repository && (
            <>
              <View style={styles.repositoryHeader}>
                <View
                  style={[
                    styles.repoIcon,
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
                <Text style={styles.repositoryName}>
                  {currentAccessRequest.repository.name}
                </Text>
              </View>

              {currentAccessRequest.repository.description && (
                <Text style={styles.repositoryDescription}>
                  {currentAccessRequest.repository.description}
                </Text>
              )}
            </>
          )}
        </CardContainer>

        <CardContainer>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Access Details</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {currentAccessRequest.roleId || "Custom Access"}
            </Text>
          </View>

          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason for Request:</Text>
            <Text style={styles.reasonText}>{currentAccessRequest.reason}</Text>
          </View>
        </CardContainer>

        {currentAccessRequest.status === "PENDING" && (
          <View style={styles.actionContainer}>
            {isRejecting ? (
              <View style={styles.rejectionContainer}>
                <TextInput
                  label="Reason for Rejection"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  style={styles.rejectReasonInput}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  theme={{
                    colors: {
                      primary: "#F44336",
                      background: "#1E2435",
                      text: "#FFFFFF",
                      placeholder: "#9DA5BD",
                    },
                  }}
                />

                <View style={styles.rejectionButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={toggleRejection}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmRejectButton}
                    onPress={handleReject}
                    disabled={isSubmitting || !rejectionReason.trim()}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.confirmRejectButtonText}>
                        Reject Request
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.approvalButtons}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={toggleRejection}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close-circle" size={20} color="#F44336" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={handleApprove}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  },
  loadingText: {
    color: "#9DA5BD",
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter-Regular",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  infoValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    textAlign: "right",
    maxWidth: "60%",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  repositoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  repoIcon: {
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
  repositoryDescription: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 8,
    fontFamily: "Inter-Regular",
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 8,
    fontFamily: "Inter-Regular",
  },
  reasonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  approvalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 67, 54, 0.3)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  rejectButtonText: {
    color: "#F44336",
    marginLeft: 8,
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  approveButtonText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  rejectionContainer: {
    marginBottom: 16,
  },
  rejectReasonInput: {
    marginBottom: 16,
    backgroundColor: "#1E2435",
    fontSize: 16,
  },
  rejectionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2D3548",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  confirmRejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F44336",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  confirmRejectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
});

export default ApproveRequestScreen;
