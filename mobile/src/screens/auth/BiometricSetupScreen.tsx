import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as LocalAuthentication from "expo-local-authentication";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button from "../../components/Button";
import Card from "../../components/Card";
import GradientBackground from "../../components/GradientBackground";
import { SafeView } from "../../components/SafeView";
import { useUserStore } from "../../store/userStore";
import { colors, spacing, typography } from "../../styles/theme";

const BiometricSetupScreen = () => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("");
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const isMounted = useRef(true);
  const cleanupRef = useRef(false);
  const navigation = useNavigation();

  // Get user store state and actions
  const { user, setupBiometrics, isLoading, error } = useUserStore();

  // Show error alert if there's an error from the user store
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const safeSetBiometricSupported = useCallback((value: boolean) => {
    if (isMounted.current) {
      setIsBiometricSupported(value);
    }
  }, []);

  const safeSetBiometricType = useCallback((value: string) => {
    if (isMounted.current) {
      setBiometricType(value);
    }
  }, []);

  const safeSetIsSetupComplete = useCallback((value: boolean) => {
    if (isMounted.current) {
      setIsSetupComplete(value);
    }
  }, []);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      if (isMounted.current) {
        checkBiometricSupport();
      }
    });

    return () => {
      cleanupRef.current = true;
      isMounted.current = false;
      task.cancel();
    };
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();

      if (!isMounted.current) return;

      safeSetBiometricSupported(compatible);

      if (compatible) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();

        if (!isMounted.current) return;

        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          safeSetBiometricType("Face ID");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          safeSetBiometricType("Fingerprint");
        } else {
          safeSetBiometricType("Biometric");
        }
      }
    } catch (error) {
      console.error("Error checking biometric support:", error);
    }
  };

  const handleSetupBiometric = async () => {
    if (!isMounted.current || cleanupRef.current) return;

    try {
      console.log("BiometricSetupScreen: Starting biometric setup...");

      // Set up biometrics using the user store
      await setupBiometrics();
      console.log(
        "BiometricSetupScreen: Biometric setup completed successfully"
      );

      // Make sure user ID is saved for future biometric logins
      if (user?.id) {
        await AsyncStorage.setItem("last_user_id", user.id);
        console.log(
          "BiometricSetupScreen: User ID saved for biometric login:",
          user.id
        );

        // Ensure biometric flag is enabled in user profile
        if (!user.biometricEnabled) {
          console.log(
            "BiometricSetupScreen: User biometricEnabled flag was not set, updating local state"
          );
          // This is a fallback in case the backend hasn't updated the user object
        }
      } else {
        console.error(
          "BiometricSetupScreen: No user ID available to save for biometric login"
        );
      }

      // Ensure we get the biometric token from AsyncStorage to verify it was saved
      const storedToken = await AsyncStorage.getItem("biometric_token");
      console.log(
        "BiometricSetupScreen: Verified biometric token in storage:",
        !!storedToken
      );

      if (!storedToken) {
        console.error(
          "BiometricSetupScreen: Biometric token not found in storage after setup"
        );
        Alert.alert(
          "Setup Issue",
          "There was a problem saving your biometric data. Please try again."
        );
        return;
      }

      safeSetIsSetupComplete(true);
    } catch (error) {
      // Error is handled in the user store and shown via useEffect
      console.error("BiometricSetupScreen: Biometric setup error:", error);

      // Display a more specific error message to the user
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Display a more user-friendly message
      Alert.alert("Biometric Setup Failed", errorMessage, [
        {
          text: "Try Again",
          onPress: () =>
            console.log("BiometricSetupScreen: User will try again"),
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const handleSkip = () => {
    // Navigate to the main app without setting up biometrics
    navigation.navigate("Main" as never);
  };

  const handleContinue = () => {
    // Navigate to the main app after successful biometric setup
    navigation.navigate("Main" as never);
  };

  return (
    <GradientBackground>
      <SafeView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {biometricType === "Face ID" ? (
              <Ionicons name="scan-outline" size={80} color={colors.primary} />
            ) : (
              <Ionicons name="finger-print" size={80} color={colors.primary} />
            )}
          </View>

          <Text style={styles.title}>
            Set Up {biometricType || "Biometric Authentication"}
          </Text>

          <Card style={styles.descriptionCard}>
            <Text style={styles.description}>
              {isSetupComplete
                ? `Your ${biometricType} has been successfully set up. You can now use it to approve access requests and log in securely.`
                : `Enhance security for critical actions by enabling ${biometricType || "biometric"} authentication. This is required for approving access requests.`}
            </Text>
          </Card>

          {!isBiometricSupported && (
            <Card variant="flat" style={styles.warningContainer}>
              <View style={styles.warningContent}>
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.status.warning}
                />
                <Text style={styles.warningText}>
                  Your device doesn't support biometric authentication.
                </Text>
              </View>
            </Card>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>
                Setting up {biometricType}...
              </Text>
            </View>
          ) : isSetupComplete ? (
            <Button
              title="Continue"
              onPress={handleContinue}
              fullWidth
              style={styles.actionButton}
            />
          ) : (
            <Button
              title={`Set Up ${biometricType || "Biometric Authentication"}`}
              onPress={handleSetupBiometric}
              disabled={!isBiometricSupported}
              fullWidth
              style={styles.actionButton}
              leftIcon={
                biometricType === "Face ID" ? "scan-outline" : "finger-print"
              }
            />
          )}
        </View>
      </SafeView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipButton: {
    padding: spacing.xs,
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: spacing.xxl,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  descriptionCard: {
    marginBottom: spacing.xl,
    backgroundColor: colors.background.medium,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    textAlign: "center",
    fontFamily: typography.fontFamily.regular,
    lineHeight: 22,
  },
  warningContainer: {
    marginBottom: spacing.xl,
    backgroundColor: "rgba(243, 156, 18, 0.1)",
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.regular,
  },
  actionButton: {
    marginTop: spacing.xl,
  },
});

export default BiometricSetupScreen;
