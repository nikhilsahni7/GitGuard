import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import GradientBackground from "../../components/GradientBackground";
import Input from "../../components/Input";
import { useNotification } from "../../context/NotificationContext";
import type { AuthStackParamList } from "../../navigation";
import { useUserStore } from "../../store/userStore";
import { colors, spacing, typography } from "../../styles/theme";
import {
  getBiometricToken,
  isBiometricAvailable,
} from "../../utils/biometricUtils";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [storedBiometricId, setStoredBiometricId] = useState<string | null>(
    null
  );

  // Get user store actions and state
  const { login, loginWithBiometrics, isLoading, error } = useUserStore();
  const savedUserId = useUserStore((state) => state.user?.id);
  const hasBiometrics = useUserStore((state) => state.user?.biometricEnabled);
  const { showNotification } = useNotification();

  const isMounted = useRef(true);

  // Check if biometrics are available
  useEffect(() => {
    const checkBiometrics = async () => {
      console.log("Checking biometrics availability...");
      const available = await isBiometricAvailable();
      console.log("Biometrics available:", available);

      if (isMounted.current) {
        setBiometricsAvailable(available);

        // Check for stored user ID
        const storedToken = await getBiometricToken();
        console.log("Stored biometric token:", storedToken);

        if (storedToken) {
          // We have a biometric token, so get the last user ID from AsyncStorage
          const lastUserId = await AsyncStorage.getItem("last_user_id");
          console.log("Last user ID:", lastUserId);
          setStoredBiometricId(lastUserId);
        }
      }
    };

    checkBiometrics();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Show error alert if there's an error from the user store
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      // This will call our backend through the user store
      await login(email, password);

      // Save user ID for biometric login
      const userId = useUserStore.getState().user?.id;
      if (userId) {
        await AsyncStorage.setItem("last_user_id", userId);

        // Show welcome toast notification
        showNotification({
          title: `Welcome, ${useUserStore.getState().user?.firstName || "User"}!`,
          body: "You have successfully logged in to GitGuard",
          deepLink: "gitguard://dashboard",
        });
      }
    } catch (error) {
      // Error is already handled in the user store and shown via useEffect
      console.error("Login error:", error);
    }
  };

  const navigateToProfileForSetup = () => {
    // First login with credentials
    Alert.alert(
      "Login Required",
      "Please log in with your credentials first, then you will be able to set up biometric authentication.",
      [
        {
          text: "OK",
          onPress: () => {
            // Focus the email input
            if (email.trim() === "" || password.trim() === "") {
              // Draw attention to the credentials fields
              setErrors({
                email: email.trim() === "" ? "Email is required" : "",
                password: password.trim() === "" ? "Password is required" : "",
              });
            }
          },
        },
      ]
    );
  };

  const handleBiometricLogin = async () => {
    console.log("Biometric login button pressed");

    // Check if biometrics are available on the device
    if (!biometricsAvailable) {
      Alert.alert(
        "Biometric Login",
        "Biometric authentication is not available on this device."
      );
      return;
    }

    try {
      // Get the last user ID
      const lastUserId = await AsyncStorage.getItem("last_user_id");
      console.log("Last user ID from storage:", lastUserId);

      if (!lastUserId) {
        Alert.alert(
          "Biometric Login",
          "Please log in with your credentials first before using biometric login."
        );
        return;
      }

      // Check if biometric token exists
      const biometricToken = await getBiometricToken();
      console.log("Retrieved biometric token:", !!biometricToken);

      if (!biometricToken) {
        // Prompt user to set up biometrics in their profile
        Alert.alert(
          "Biometric Setup Required",
          "Biometric authentication is not set up. Would you like to set it up now?",
          [
            {
              text: "Not Now",
              style: "cancel",
            },
            {
              text: "Set Up",
              onPress: navigateToProfileForSetup,
            },
          ]
        );
        return;
      }

      // We have both user ID and token, proceed with biometric login
      console.log("Attempting biometric login with userId:", lastUserId);
      await loginWithBiometrics(lastUserId);
    } catch (error) {
      console.error("Biometric login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      // Special handling for specific error messages
      if (errorMessage.includes("Biometric authentication is not set up")) {
        Alert.alert(
          "Biometric Setup Required",
          "Please log in with your credentials first, then set up biometric authentication in your profile settings.",
          [
            {
              text: "OK",
              onPress: navigateToProfileForSetup,
            },
          ]
        );
      } else {
        Alert.alert("Login Error", errorMessage);
      }
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>GitGuard</Text>
              <Text style={styles.subtitle}>
                Advanced Repository Access Control
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
                error={errors.email}
              />

              <Input
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
                error={errors.password}
              />

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() =>
                  Alert.alert(
                    "Feature Coming Soon",
                    "Password reset will be available in a future update."
                  )
                }
                disabled={isLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <Button
                title={isLoading ? "Logging in..." : "Login"}
                isLoading={isLoading}
                disabled={isLoading}
                fullWidth
                onPress={handleLogin}
                style={styles.loginButton}
              />

              <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <Button
                title="Login with Biometrics"
                variant="secondary"
                fullWidth
                leftIcon="finger-print"
                onPress={handleBiometricLogin}
                disabled={isLoading}
                style={styles.biometricButton}
              />

              <View style={styles.registerContainer}>
                <Text style={styles.noAccountText}>
                  Don't have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                  disabled={isLoading}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Text style={styles.registerText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginTop: spacing.xxl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.display,
    fontWeight: "bold",
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
    textAlign: "center",
  },
  form: {
    width: "100%",
    paddingTop: spacing.lg,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
  loginButton: {
    marginBottom: spacing.lg,
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface.cardBorder,
  },
  orText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginHorizontal: spacing.md,
  },
  biometricButton: {
    marginBottom: spacing.lg,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  noAccountText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  registerText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
});

export default LoginScreen;
