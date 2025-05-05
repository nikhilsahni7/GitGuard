import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import api from "../services/api";
import { useUserStore } from "../store/userStore";
import { getBiometricToken } from "../utils/biometricUtils";

/**
 * A hook that checks and validates the authentication state on app startup.
 * - Validates biometric tokens
 * - Ensures tokens match user IDs
 * - Cleans up invalid authentication state
 */
export const useInitialAuthCheck = () => {
  const { user, setBiometricToken } = useUserStore();

  useEffect(() => {
    const validateAuthState = async () => {
      console.log("Validating authentication state on app startup...");

      try {
        // Check if we have user ID and biometric token
        const storedUserId = await AsyncStorage.getItem("last_user_id");
        const biometricToken = await getBiometricToken();
        const authToken = await AsyncStorage.getItem("auth_token");
        const currentUserId = user?.id;

        console.log("Auth check - Stored user ID:", storedUserId);
        console.log("Auth check - Current user ID:", currentUserId);
        console.log(
          "Auth check - Biometric token available:",
          !!biometricToken
        );
        console.log("Auth check - Auth token available:", !!authToken);

        // If user ID has changed, clear biometric token
        if (
          storedUserId &&
          currentUserId &&
          storedUserId !== currentUserId &&
          biometricToken
        ) {
          console.log(
            "Auth check - User ID mismatch, clearing biometric token"
          );
          await AsyncStorage.removeItem("biometric_token");
          setBiometricToken("");

          // Update stored user ID to match current user
          await AsyncStorage.setItem("last_user_id", currentUserId);
        }

        // If we have auth token and a user with biometricEnabled flag but no biometric token, try to fetch it
        if (
          authToken &&
          user?.biometricEnabled &&
          !biometricToken &&
          currentUserId
        ) {
          console.log(
            "Auth check - User has biometricEnabled flag but no token, attempting to fetch from server"
          );

          try {
            // Set auth token in headers
            api.defaults.headers.common["Authorization"] =
              `Bearer ${authToken}`;

            // Call biometric setup endpoint
            const response = await api.post("/auth/biometric/setup");

            if (response.data && response.data.token) {
              console.log(
                "Auth check - Successfully fetched biometric token from server"
              );
              await AsyncStorage.setItem(
                "biometric_token",
                response.data.token
              );
              setBiometricToken(response.data.token);
            }
          } catch (setupError) {
            console.error(
              "Auth check - Failed to fetch biometric token:",
              setupError
            );
            // Non-critical error, continue without token
          }
        }

        // If we have a valid biometric token and it's not in the store, sync it
        if (
          biometricToken &&
          !user?.biometricEnabled &&
          storedUserId === currentUserId
        ) {
          console.log("Auth check - Syncing biometric token to state");
          setBiometricToken(biometricToken);
        }

        console.log("Auth check complete");
      } catch (error) {
        console.error("Error validating auth state:", error);
      }
    };

    if (user) {
      validateAuthState();
    }
  }, [user, setBiometricToken]);
};

export default useInitialAuthCheck;
