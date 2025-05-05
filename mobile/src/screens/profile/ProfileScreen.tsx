import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import Input from "../../components/Input";
import ScreenHeader from "../../components/ScreenHeader";
import { useUserStore } from "../../store/userStore";
import { colors, spacing, typography } from "../../styles/theme";
import { isBiometricAvailable } from "../../utils/biometricUtils";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {
    user,
    logout,
    updateUserProfile,
    fetchUserProfile,
    setupBiometrics,
    isLoading,
    error,
  } = useUserStore();

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Check if biometrics are available
  useEffect(() => {
    const checkBiometrics = async () => {
      const available = await isBiometricAvailable();
      setBiometricsAvailable(available);
    };

    checkBiometrics();
  }, []);

  // Show error alert if there's an error from the user store
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  // Load user profile when screen mounts
  useEffect(() => {
    fetchUserProfile().catch((error) => {
      console.error("Error fetching profile:", error);
    });
  }, [fetchUserProfile]);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile({ firstName, lastName });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    // Reset form fields to current user values
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
    setIsEditing(false);
  };

  const handleSetupBiometrics = async () => {
    if (!biometricsAvailable) {
      Alert.alert(
        "Not Available",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    try {
      // Navigate to dedicated biometric setup screen
      navigation.navigate("BiometricSetup" as any);
    } catch (error) {
      console.error("Error setting up biometrics:", error);
      Alert.alert("Error", "Failed to set up biometric authentication.");
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title="Profile"
          rightComponent={
            !isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {user ? (
            <>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user.firstName[0]}
                  {user.lastName[0]}
                </Text>
              </View>

              {isEditing ? (
                <View style={styles.editForm}>
                  <Input
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    autoCapitalize="words"
                    icon="person-outline"
                  />

                  <Input
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    autoCapitalize="words"
                    icon="person-outline"
                  />

                  <View style={styles.buttonRow}>
                    <Button
                      title="Cancel"
                      variant="outline"
                      onPress={handleCancel}
                      style={styles.cancelButton}
                      disabled={isLoading}
                    />

                    <Button
                      title={isLoading ? "Saving..." : "Save Changes"}
                      onPress={handleSaveProfile}
                      isLoading={isLoading}
                      disabled={isLoading}
                      style={styles.saveButton}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.name}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.email}>{user.email}</Text>

                  <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={colors.text.secondary}
                      />
                      <Text style={styles.infoText}>{user.email}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.biometricRow}>
                      <View style={styles.biometricInfo}>
                        <Ionicons
                          name="finger-print-outline"
                          size={20}
                          color={colors.text.secondary}
                        />
                        <Text style={styles.infoText}>
                          Biometric Authentication:{" "}
                          <Text
                            style={{
                              color: user.biometricEnabled
                                ? colors.status.success
                                : colors.text.secondary,
                            }}
                          >
                            {user.biometricEnabled ? "Enabled" : "Disabled"}
                          </Text>
                        </Text>
                      </View>
                      {!user.biometricEnabled && biometricsAvailable && (
                        <TouchableOpacity
                          style={styles.setupButton}
                          onPress={handleSetupBiometrics}
                        >
                          <Text style={styles.setupButtonText}>Setup</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Card>

                  {!user.biometricEnabled && biometricsAvailable && (
                    <Button
                      title="Set Up Biometric Authentication"
                      variant="secondary"
                      leftIcon="finger-print"
                      onPress={handleSetupBiometrics}
                      style={styles.biometricButton}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <Text style={styles.placeholderText}>Loading profile...</Text>
          )}

          <Button
            title="Logout"
            variant="danger"
            leftIcon="log-out-outline"
            onPress={handleLogout}
            disabled={isLoading}
            style={styles.logoutButton}
          />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.display,
    color: colors.primary,
    fontWeight: "bold",
    fontFamily: typography.fontFamily.bold,
  },
  name: {
    fontSize: typography.fontSize.xxl,
    color: colors.text.primary,
    fontWeight: "bold",
    marginBottom: spacing.xs,
    textAlign: "center",
    fontFamily: typography.fontFamily.bold,
  },
  email: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: "center",
    fontFamily: typography.fontFamily.regular,
  },
  infoCard: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  biometricInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.md,
    marginLeft: spacing.md,
    fontFamily: typography.fontFamily.regular,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.cardBorder,
  },
  editForm: {
    width: "100%",
    marginVertical: spacing.lg,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  saveButton: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  logoutButton: {
    marginTop: "auto",
    width: "100%",
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
  },
  biometricButton: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  setupButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  setupButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
});

export default ProfileScreen;
