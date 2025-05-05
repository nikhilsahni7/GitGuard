import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

// Check if biometric authentication is available on the device
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error("Error checking biometric availability:", error);
    return false;
  }
};

// Get the type of biometric authentication available
export const getBiometricType = async (): Promise<string> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return "Face ID";
    } else if (
      types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
    ) {
      return "Fingerprint";
    } else {
      return "Biometric";
    }
  } catch (error) {
    console.error("Error getting biometric type:", error);
    return "Biometric";
  }
};

// Authenticate user with biometrics
export const authenticateWithBiometrics = async (
  promptMessage = "Authenticate to continue"
): Promise<boolean> => {
  try {
    console.log(
      "biometricUtils: Starting authentication with prompt:",
      promptMessage
    );

    // Check if biometric hardware is available
    const compatible = await LocalAuthentication.hasHardwareAsync();
    console.log("biometricUtils: Hardware available:", compatible);

    if (!compatible) {
      console.log("biometricUtils: Device does not support biometrics");
      throw new Error("Biometric authentication not supported on this device");
    }

    // Check if the device has biometrics enrolled
    const hasEnrolledBiometrics = await LocalAuthentication.isEnrolledAsync();
    console.log(
      "biometricUtils: Has enrolled biometrics:",
      hasEnrolledBiometrics
    );

    if (!hasEnrolledBiometrics) {
      console.log("biometricUtils: No biometrics enrolled on device");
      throw new Error(
        "No biometrics enrolled on this device. Please set up Touch ID/Face ID in your device settings."
      );
    }

    console.log("biometricUtils: Prompting user with message:", promptMessage);

    // Authenticate with biometrics
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use password instead",
      disableDeviceFallback: false, // Allow device PIN/password fallback
      cancelLabel: "Cancel",
    });

    console.log(
      "biometricUtils: Authentication result:",
      JSON.stringify({
        success: authResult.success,
        error: authResult.error,
        warning: authResult.warning,
      })
    );

    if (!authResult.success) {
      console.log(
        "biometricUtils: Authentication failed with reason:",
        authResult.error
      );
    }

    return authResult.success;
  } catch (error) {
    console.error(
      "biometricUtils: Error authenticating with biometrics:",
      error
    );
    return false;
  }
};

// Get stored biometric token
export const getBiometricToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem("biometric_token");
    console.log("getBiometricToken: token retrieved:", !!token);

    // Validate token format
    if (token && token.length < 10) {
      console.warn(
        "getBiometricToken: retrieved token appears invalid (too short)"
      );
      return null;
    }

    return token;
  } catch (error) {
    console.error("Error getting biometric token:", error);
    return null;
  }
};

// Store biometric token
export const storeBiometricToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem("biometric_token", token);
  } catch (error) {
    console.error("Error storing biometric token:", error);
    throw error;
  }
};

// Clear biometric token
export const clearBiometricToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("biometric_token");
  } catch (error) {
    console.error("Error clearing biometric token:", error);
    throw error;
  }
};
