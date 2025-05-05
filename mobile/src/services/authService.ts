import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { authenticateWithBiometrics } from "../utils/biometricUtils";
import api from "./api";

// Define API_URL directly here instead of importing it from api.ts to break the cycle
const API_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.7:4000/api";

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  biometricEnabled?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Register a new user
export const register = async (
  userData: RegisterData
): Promise<AuthResponse> => {
  try {
    const response = await api.post("/auth/signup", userData);

    // Store token
    await AsyncStorage.setItem("auth_token", response.data.token);

    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Login with email and password
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    // Check if there's a stored user ID (from previous biometric login)
    const storedUserId = await AsyncStorage.getItem("last_user_id");
    const storedBiometricToken = await AsyncStorage.getItem("biometric_token");

    // Make the login API call
    const response = await api.post("/auth/login", credentials);

    // Store token
    await AsyncStorage.setItem("auth_token", response.data.token);

    // Check if the user ID has changed (different user logging in)
    if (
      storedUserId &&
      storedBiometricToken &&
      storedUserId !== response.data.user.id
    ) {
      console.log(
        "Login: Different user logging in, clearing previous biometric data"
      );
      // Different user is logging in, clear previous biometric data
      await AsyncStorage.removeItem("biometric_token");
      console.log("Login: Removed biometric token for previous user");
    }

    // Store current user ID for future reference
    await AsyncStorage.setItem("last_user_id", response.data.user.id);
    console.log("Login: Updated last_user_id to:", response.data.user.id);

    // If user has biometricEnabled but no token in storage, fetch it from server
    if (response.data.user.biometricEnabled && !storedBiometricToken) {
      try {
        console.log(
          "Login: User has biometrics enabled but no token, fetching from server"
        );
        // Use the authentication token we just received to set up biometrics
        api.defaults.headers.common["Authorization"] =
          `Bearer ${response.data.token}`;

        // Check if we need to verify with local biometrics first
        const needsLocalVerification = process.env.NODE_ENV !== "test"; // Skip in test environment

        if (needsLocalVerification) {
          console.log(
            "Login: Verifying with local biometrics before fetching token"
          );
          const biometricSuccess = await authenticateWithBiometrics(
            "Verify your identity to enable biometric login"
          );

          if (!biometricSuccess) {
            console.log(
              "Login: Local biometric verification failed, skipping token fetch"
            );
            return response.data;
          }
        }

        const biometricResponse = await api.post("/auth/biometric/setup");
        if (biometricResponse.data && biometricResponse.data.token) {
          console.log(
            "Login: Successfully fetched biometric token from server"
          );
          await AsyncStorage.setItem(
            "biometric_token",
            biometricResponse.data.token
          );
        }
      } catch (biometricError) {
        console.error(
          "Login: Failed to fetch biometric token:",
          biometricError
        );
        // This is non-critical, so we continue without the biometric token
      }
    }

    return response.data;
  } catch (error) {
    throw handleAuthError(error);
  }
};

// Login with biometrics
export const loginWithBiometrics = async (
  userId: string,
  biometricToken: string | null
): Promise<AuthResponse> => {
  try {
    console.log("Starting biometric login process...");
    console.log("User ID:", userId);
    console.log("Biometric token available:", !!biometricToken);

    // Validate user ID
    if (!userId) {
      console.error("No user ID provided for biometric login");
      throw new Error("User ID is required for biometric login");
    }

    // Try to get biometric token from storage if not provided
    if (!biometricToken) {
      console.log("No biometric token provided, retrieving from storage...");
      biometricToken = await AsyncStorage.getItem("biometric_token");
      console.log("Retrieved token from storage:", !!biometricToken);

      if (!biometricToken) {
        console.log("No biometric token found in storage");
        throw new Error(
          "Biometric authentication is not set up. Please log in with your credentials first."
        );
      }
    }

    // Verify with biometrics locally before making API call
    const authSuccess = await authenticateWithBiometrics(
      "Verify your identity to log in"
    );

    if (!authSuccess) {
      console.log("Local biometric authentication failed");
      throw new Error(
        "Biometric verification failed. Please try again or use email and password."
      );
    }

    console.log("Local biometric authentication successful");
    console.log("Sending verification request to backend...");

    try {
      // Verify with backend
      const response = await api.post("/auth/biometric/verify", {
        userId,
        token: biometricToken,
      });
      console.log("Backend verification successful");

      // Store token
      await AsyncStorage.setItem("auth_token", response.data.token);

      // Store the user ID for future biometric login
      await AsyncStorage.setItem("last_user_id", userId);

      return response.data;
    } catch (apiError: any) {
      console.error("Backend verification failed:", apiError);

      if (apiError.response?.status === 401) {
        // Try one more time with credentials stored in the token
        try {
          console.log(
            "Attempting direct token verification without auth header"
          );
          const directResponse = await axios.post(
            `${API_URL}/auth/biometric/verify`,
            {
              userId,
              token: biometricToken,
            }
          );

          console.log("Direct token verification successful");

          // Store token
          await AsyncStorage.setItem("auth_token", directResponse.data.token);

          // Store the user ID for future biometric login
          await AsyncStorage.setItem("last_user_id", userId);

          return directResponse.data;
        } catch (directError) {
          console.error("Direct token verification also failed:", directError);
        }
      }

      throw new Error(
        "Failed to verify with server. Please try logging in with email and password."
      );
    }
  } catch (error) {
    console.error("Biometric login error:", error);
    throw handleAuthError(error);
  }
};

// Set up biometric authentication
export const setupBiometrics = async (): Promise<{ token: string }> => {
  try {
    // First ensure we have a valid auth token
    const authToken = await AsyncStorage.getItem("auth_token");
    console.log("setupBiometrics: Auth token available:", !!authToken);

    if (!authToken) {
      console.error("setupBiometrics: No auth token found");
      throw new Error("Authentication required. Please log in first.");
    }

    // Explicitly set the authorization header for the API call
    api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    console.log("setupBiometrics: Set Authorization header for API call");

    // Authenticate the user locally with biometrics
    console.log("setupBiometrics: Starting local biometric authentication");
    const authSuccess = await authenticateWithBiometrics(
      "Set up biometric authentication"
    );

    if (!authSuccess) {
      console.error("setupBiometrics: Local biometric authentication failed");
      throw new Error("Biometric authentication failed");
    }

    console.log("setupBiometrics: Local biometric authentication successful");
    console.log("setupBiometrics: Making API call to /auth/biometric/setup");

    try {
      // Get token from backend with explicit Authorization header
      const response = await api.post(
        "/auth/biometric/setup",
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const biometricToken = response.data.token;
      console.log(
        "setupBiometrics: API call successful, token received:",
        !!biometricToken
      );

      if (!biometricToken) {
        console.error(
          "setupBiometrics: Server did not return a valid biometric token"
        );
        throw new Error("Server did not return a valid biometric token");
      }

      // Store biometric token
      console.log("setupBiometrics: Storing biometric token in AsyncStorage");
      await AsyncStorage.setItem("biometric_token", biometricToken);

      // Verify it was stored correctly
      const storedToken = await AsyncStorage.getItem("biometric_token");
      if (!storedToken) {
        console.error(
          "setupBiometrics: Failed to store biometric token in AsyncStorage"
        );
        throw new Error("Failed to store biometric token");
      }

      console.log(
        "setupBiometrics: Successfully stored biometric token in AsyncStorage"
      );
      return response.data;
    } catch (apiError: any) {
      console.error(
        "setupBiometrics: API call failed:",
        apiError.response?.status,
        apiError.response?.data
      );

      // Get detailed error information from the API response if available
      let errorMessage =
        "Failed to set up biometric authentication on the server";
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      }

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("setupBiometrics: Error:", error);
    throw handleAuthError(error);
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    // Save biometric token for future use
    const biometricToken = await AsyncStorage.getItem("biometric_token");
    const lastUserId = await AsyncStorage.getItem("last_user_id");

    // Clear only authentication tokens but preserve biometric data
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("refresh_token");

    if (biometricToken && lastUserId) {
      console.log("Preserving biometric token and user ID for future logins");
    }
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    return !!token;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
};

// Get the stored auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("auth_token");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Helper function to handle auth errors
const handleAuthError = (error: any): Error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMessage =
      error.response.data?.message || "Authentication failed";
    return new Error(errorMessage);
  } else if (error.request) {
    // The request was made but no response was received
    return new Error("No response from server. Please check your connection.");
  } else {
    // Something happened in setting up the request that triggered an Error
    return error instanceof Error
      ? error
      : new Error("An unknown error occurred");
  }
};
