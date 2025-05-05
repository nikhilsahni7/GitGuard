import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DefaultTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradientButton from "../../components/LinearGradientButton";
import { AccessRequestStackParamList } from "../../navigation";
import { repositoryService } from "../../services/repositoryService";
import { useAccessRequestStore } from "../../store";
import { useRepositoryStore } from "../../store/repositoryStore";
import { useUserStore } from "../../store/userStore";
import {
  fontScale,
  horizontalScale,
  verticalScale,
} from "../../utils/responsive";

type CreateAccessRequestScreenRouteProp = RouteProp<
  AccessRequestStackParamList,
  "CreateAccessRequest"
>;

type CreateAccessRequestScreenNavigationProp =
  StackNavigationProp<AccessRequestStackParamList>;

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface RoleOption {
  label: string;
  value: string;
}

// Custom theme for text inputs
const inputTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF7B00",
    background: "#1E2435",
    text: "#FFFFFF",
    placeholder: "#BDC3D8",
    surface: "#1E2435",
    accent: "#FF7B00",
    disabled: "#2D3548",
    error: "#E74C3C",
  },
  roundness: 8,
  dark: true,
};

const CreateAccessRequestScreen = () => {
  const route = useRoute<CreateAccessRequestScreenRouteProp>();
  const navigation = useNavigation<CreateAccessRequestScreenNavigationProp>();
  const { repositoryId } = route.params || {};

  // States
  const [roleId, setRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [requiresMultiApproval, setRequiresMultiApproval] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");

  // Get stores
  const { currentRepository, fetchRepository } = useRepositoryStore();
  const { createAccessRequest, error: accessRequestError } =
    useAccessRequestStore();
  const { currentUser } = useUserStore();

  // Load repository data if repositoryId is provided
  useEffect(() => {
    if (repositoryId) {
      // Use ignorePermissionError=true to get basic repository info even for repos requiring permission
      fetchRepository(repositoryId, true).catch((error) => {
        console.error("Error fetching repository:", error);

        if (error?.response?.status === 403) {
          // For 403 errors, show a specific message but don't block the form
          setError(
            "Limited repository information available due to permission restrictions."
          );
        } else {
          // For other errors, show a generic message
          Alert.alert(
            "Repository Info",
            "Limited repository information available. You can still request access."
          );
        }
      });
    }
  }, [repositoryId, fetchRepository]);

  // Fetch available roles when the repository is loaded
  useEffect(() => {
    if (currentRepository) {
      // Fetch available roles from the backend using our repositoryService
      const fetchRoles = async () => {
        try {
          setIsLoadingRoles(true);
          const repoId = currentRepository.id || repositoryId;
          if (!repoId) {
            console.warn("No repository ID available");
            setDefaultRoles();
            return;
          }

          const response = await repositoryService.getRepositoryRoles(repoId);

          if (response.roles && Array.isArray(response.roles)) {
            const mappedRoles = response.roles.map((role) => ({
              label: role.name,
              value: role.id,
            }));
            setAvailableRoles(mappedRoles);

            if (mappedRoles.length > 0 && !selectedRole) {
              // Auto-select the first role when roles are loaded
              setSelectedRole(mappedRoles[0]);
              setRoleId(mappedRoles[0].value);
            }
          } else {
            console.warn(
              "No roles returned from the server for this repository"
            );
            // Fallback to default roles
            setDefaultRoles();
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
          // Fallback to default roles
          setDefaultRoles();
        } finally {
          setIsLoadingRoles(false);
        }
      };

      fetchRoles();
    }
  }, [currentRepository, repositoryId]);

  // Helper function to set default roles if API fails
  const setDefaultRoles = () => {
    const defaultRoles = [
      { label: "Viewer", value: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
      { label: "Contributor", value: "3fa85f64-5717-4562-b3fc-2c963f66afa7" },
      { label: "Admin", value: "3fa85f64-5717-4562-b3fc-2c963f66afa8" },
    ];
    setAvailableRoles(defaultRoles);
    if (!selectedRole && defaultRoles.length > 0) {
      setSelectedRole(defaultRoles[0]);
      setRoleId(defaultRoles[0].value);
    }
  };

  // Show error if any
  useEffect(() => {
    if (accessRequestError) {
      Alert.alert("Error", accessRequestError);
    }
  }, [accessRequestError]);

  const handleSelectRole = (role: RoleOption) => {
    setSelectedRole(role);
    setRoleId(role.value);
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    setExpiresAt(currentDate);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Basic validation
      if (!repositoryId && !currentRepository?.id) {
        setError("No repository selected");
        setIsSubmitting(false);
        return;
      }

      if (!roleId) {
        setError("Please select a role");
        setIsSubmitting(false);
        return;
      }

      if (!reason.trim()) {
        setError("Please provide a reason for your request");
        setIsSubmitting(false);
        return;
      }

      // Create the request payload
      const requestData = {
        repositoryId: (currentRepository?.id || repositoryId) as string,
        roleId, // Use the selected roleId
        reason: reason.trim(),
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        requiresMultiApproval,
      };

      console.log("Submitting access request:", requestData);

      // Submit the request
      const accessRequest = await createAccessRequest(requestData);

      console.log("Access request created successfully:", accessRequest);

      // Show success message
      Alert.alert(
        "Success",
        "Your access request has been submitted successfully",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("AccessRequests"),
          },
        ]
      );
    } catch (err: any) {
      console.error("Error creating access request:", err);
      let errorMessage = "An error occurred while submitting the request.";

      if (err.response) {
        console.error(`Status: ${err.response.status}`);
        console.error(`Data: ${JSON.stringify(err.response.data)}`);

        // Get more detailed error info
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 403) {
          errorMessage =
            "You don't have permission to create an access request for this repository.";
        } else if (err.response.status === 404) {
          errorMessage =
            "The access requests endpoint was not found. Server may be misconfigured.";
        } else if (err.response.status === 500) {
          errorMessage =
            "The server encountered an error while processing your request.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render role selection
  const renderRoleOptions = () => {
    if (isLoadingRoles) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading available roles...</Text>
        </View>
      );
    }

    if (availableRoles.length === 0) {
      return (
        <View style={styles.noRolesMessage}>
          <Text style={styles.noRolesText}>
            No roles available for this repository.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.roleOptionsContainer}>
        {availableRoles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleOption,
              selectedRole?.value === role.value && styles.selectedRoleOption,
            ]}
            onPress={() => handleSelectRole(role)}
          >
            <View style={styles.roleContent}>
              <Text
                style={[
                  styles.roleLabel,
                  selectedRole?.value === role.value &&
                    styles.selectedRoleLabel,
                ]}
              >
                {role.label}
              </Text>
              <MaterialCommunityIcons
                name={
                  selectedRole?.value === role.value
                    ? "checkbox-marked-circle"
                    : "checkbox-blank-circle-outline"
                }
                size={fontScale(24)}
                color={
                  selectedRole?.value === role.value ? "#FF7B00" : "#BDC3D8"
                }
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Request Access</Text>
          <Text style={styles.subtitle}>
            Request access to repository resources
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="alert-circle"
              size={fontScale(20)}
              color="#F44336"
              style={styles.errorIcon}
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {currentRepository ? (
          <View style={styles.repoCard}>
            <View style={styles.repoHeader}>
              <MaterialCommunityIcons
                name={getProviderIcon(currentRepository.gitProvider)}
                size={fontScale(24)}
                color="#FF7B00"
              />
              <Text style={styles.repoName}>{currentRepository.name}</Text>
            </View>
            {currentRepository.description &&
              !currentRepository.description.includes(
                "You don't have access"
              ) && (
                <Text style={styles.repoDescription}>
                  {currentRepository.description}
                </Text>
              )}
            {currentRepository.description &&
              currentRepository.description.includes(
                "You don't have access"
              ) && (
                <Text style={styles.permissionNeededText}>
                  You need permission to access this repository. Please provide
                  a reason for your request.
                </Text>
              )}
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              {repositoryId
                ? "Loading repository information..."
                : "No repository selected"}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Select Role</Text>
          {renderRoleOptions()}

          <Text style={styles.inputLabel}>Reason for request</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={reason}
              onChangeText={setReason}
              style={styles.input}
              mode="outlined"
              placeholder="Explain why you need access to this repository"
              placeholderTextColor="#8F98AD"
              multiline
              numberOfLines={4}
              theme={inputTheme}
              outlineColor="#2D3548"
              activeOutlineColor="#FF7B00"
              textColor="#FFFFFF"
              selectionColor="#FF7B00"
              underlineColor="transparent"
              underlineColorAndroid="transparent"
            />
          </View>

          <Text style={styles.inputLabel}>Expires At (Optional)</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showDatePickerModal}
          >
            <Text style={styles.datePickerValue}>
              {expiresAt ? formatDate(expiresAt) : "No expiration date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && Platform.OS !== "web" && (
            <View>
              {Platform.OS === "android" ? (
                <Button
                  title="Set Date"
                  onPress={() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 30); // Default to 30 days from now
                    onChange(null, date);
                  }}
                />
              ) : (
                <View style={styles.iOSPicker}>
                  <Button
                    title="Cancel"
                    onPress={() => setShowDatePicker(false)}
                  />
                  <Button
                    title="Set Date"
                    onPress={() => {
                      const date = new Date();
                      date.setDate(date.getDate() + 30); // Default to 30 days from now
                      onChange(null, date);
                    }}
                  />
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => setRequiresMultiApproval(!requiresMultiApproval)}
          >
            <View
              style={[
                styles.switchTrack,
                {
                  backgroundColor: requiresMultiApproval
                    ? "#FF7B00"
                    : "#2D3548",
                },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    transform: [
                      {
                        translateX: requiresMultiApproval ? 22 : 2,
                      },
                    ],
                  },
                ]}
              />
            </View>
            <Text style={styles.switchLabel}>Require multiple approvers</Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <LinearGradientButton
              onPress={handleSubmit}
              text={isSubmitting ? "Submitting..." : "Submit Request"}
              loading={isSubmitting}
              disabled={
                isSubmitting || !repositoryId || !roleId || !reason.trim()
              }
              height={56}
              textSize={16}
            />
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: horizontalScale(24),
    paddingTop: verticalScale(24),
    marginBottom: verticalScale(24),
  },
  title: {
    fontSize: fontScale(28),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  repoCard: {
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: horizontalScale(16),
    marginHorizontal: horizontalScale(24),
    marginBottom: verticalScale(24),
  },
  repoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(8),
  },
  repoName: {
    fontSize: fontScale(18),
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: horizontalScale(12),
    fontFamily: "Inter-SemiBold",
  },
  repoDescription: {
    fontSize: fontScale(14),
    color: "#BDC3D8",
    fontFamily: "Inter-Regular",
  },
  permissionNeededText: {
    fontSize: fontScale(14),
    color: "#BDC3D8",
    fontFamily: "Inter-Regular",
    marginTop: verticalScale(12),
  },
  placeholderContainer: {
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: horizontalScale(16),
    marginHorizontal: horizontalScale(24),
    marginBottom: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: fontScale(16),
    color: "#BDC3D8",
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  form: {
    paddingHorizontal: horizontalScale(24),
  },
  inputLabel: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    marginBottom: verticalScale(12),
  },
  roleOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: verticalScale(20),
  },
  roleOption: {
    backgroundColor: "#1E2435",
    borderRadius: 8,
    padding: horizontalScale(12),
    marginRight: horizontalScale(8),
    marginBottom: verticalScale(8),
    borderWidth: 1,
    borderColor: "#2D3548",
    minWidth: horizontalScale(120),
  },
  selectedRoleOption: {
    backgroundColor: "rgba(255, 123, 0, 0.1)",
    borderColor: "#FF7B00",
  },
  roleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleLabel: {
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    marginRight: horizontalScale(8),
  },
  selectedRoleLabel: {
    color: "#FF7B00",
    fontWeight: "600",
  },
  inputWrapper: {
    marginBottom: verticalScale(20),
  },
  input: {
    backgroundColor: "#1E2435",
    fontSize: fontScale(16),
    minHeight: verticalScale(120),
    color: "#FFFFFF",
    textAlignVertical: "top",
    borderWidth: 0,
  },
  datePickerButton: {
    backgroundColor: "#1E2435",
    borderColor: "#2D3548",
    borderWidth: 1,
    borderRadius: 8,
    padding: horizontalScale(16),
    marginBottom: verticalScale(20),
    height: verticalScale(56),
    justifyContent: "center",
  },
  datePickerValue: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  iOSPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#1E2435",
    padding: horizontalScale(16),
    marginBottom: verticalScale(20),
    borderRadius: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(24),
  },
  switchTrack: {
    width: horizontalScale(44),
    height: verticalScale(24),
    borderRadius: 12,
    padding: 2,
  },
  switchThumb: {
    width: horizontalScale(20),
    height: verticalScale(20),
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  switchLabel: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    marginLeft: horizontalScale(12),
    fontFamily: "Inter-Regular",
  },
  buttonContainer: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(40),
  },
  noRolesMessage: {
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: horizontalScale(16),
    marginBottom: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
  },
  noRolesText: {
    fontSize: fontScale(16),
    color: "#BDC3D8",
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
  },
  loadingText: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    marginLeft: horizontalScale(8),
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 8,
    padding: horizontalScale(12),
    marginHorizontal: horizontalScale(24),
    marginBottom: verticalScale(16),
  },
  errorIcon: {
    marginRight: horizontalScale(8),
  },
  errorText: {
    color: "#F44336",
    fontSize: fontScale(14),
    flex: 1,
    fontFamily: "Inter-Regular",
  },
});

export default CreateAccessRequestScreen;
