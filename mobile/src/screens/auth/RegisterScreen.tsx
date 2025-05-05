import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
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
import type { AuthStackParamList } from "../../navigation";
import { useUserStore } from "../../store/userStore";
import { colors, spacing, typography } from "../../styles/theme";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Register"
>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get register function and loading state from user store
  const { register, isLoading, error } = useUserStore();

  // Show error alert if there's an error from the user store
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    try {
      // Register user using the user store which will call the backend
      await register(firstName, lastName, email, password);

      // After successful registration, prompt user to set up biometrics
      setTimeout(() => {
        Alert.alert(
          "Set Up Biometric Authentication",
          "Would you like to set up biometric authentication for faster login?",
          [
            {
              text: "Not Now",
              style: "cancel",
            },
            {
              text: "Set Up",
              onPress: () => {
                // Navigate to Root and then to BiometricSetup
                navigation.navigate("Login");
                (navigation.getParent() as any)?.navigate("BiometricSetup");
              },
            },
          ]
        );
      }, 500);
    } catch (error) {
      // Error is handled in the user store and shown via useEffect
      console.error("Registration error:", error);
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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Please fill in your details to register
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.nameContainer}>
                <View style={styles.halfInput}>
                  <Input
                    label="First Name"
                    icon="person-outline"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    autoCapitalize="words"
                    error={errors.firstName}
                  />
                </View>

                <View style={styles.halfInput}>
                  <Input
                    label="Last Name"
                    icon="person-outline"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    autoCapitalize="words"
                    error={errors.lastName}
                  />
                </View>
              </View>

              <Input
                label="Email"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <Input
                label="Password"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                autoCapitalize="none"
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                icon="lock-closed-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
                error={errors.confirmPassword}
              />

              <Button
                title={isLoading ? "Creating Account..." : "Create Account"}
                isLoading={isLoading}
                disabled={isLoading}
                fullWidth
                onPress={handleRegister}
                style={styles.registerButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.accountText}>
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  <Text style={styles.loginText}>Login</Text>
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
    marginTop: spacing.md,
    alignItems: "center",
    position: "relative",
    paddingBottom: spacing.lg,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: spacing.xs,
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: "bold",
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginTop: spacing.xl,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
  form: {
    width: "100%",
  },
  nameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    width: "48%",
  },
  registerButton: {
    marginTop: spacing.lg,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  accountText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
  },
  loginText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
  },
});

export default RegisterScreen;
