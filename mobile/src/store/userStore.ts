import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService, userService } from "../services";
import type { User } from "../services/authService";

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricToken: string | null;
  error: string | null;
  currentUser: User | null;
  hasBiometricAuth: boolean;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  loginWithBiometrics: (userId: string) => Promise<void>;
  logout: () => Promise<void>;

  // Biometric actions
  setupBiometrics: () => Promise<void>;
  setBiometricToken: (token: string) => Promise<void>;
  getBiometricToken: () => Promise<string | null>;
  clearBiometricToken: () => Promise<void>;

  // User data actions
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: {
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  updatePushToken: (pushToken: string) => Promise<void>;

  // UI state actions
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Fetch current user data
  fetchCurrentUser: () => Promise<void>;

  // Set biometric availability
  setHasBiometricAuth: (hasAuth: boolean) => void;
}

const BIOMETRIC_TOKEN_KEY = "gitguard_biometric_token";

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      biometricToken: null,
      error: null,
      currentUser: null,
      hasBiometricAuth: false,

      // Auth actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.login({ email, password });

          // Get fresh biometric token after login
          const biometricToken = await AsyncStorage.getItem("biometric_token");

          // Get the previously stored user ID
          const previousUserId = await AsyncStorage.getItem("last_user_id");

          // If user ID changed, we should clear the biometric token in state too
          const shouldClearBiometricToken =
            previousUserId && previousUserId !== user.id && biometricToken;

          if (shouldClearBiometricToken) {
            console.log(
              "UserStore: Different user logged in, clearing biometric token in state"
            );
          } else if (biometricToken) {
            console.log(
              "UserStore: Found biometric token after login, syncing with state"
            );
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            biometricToken: shouldClearBiometricToken
              ? null
              : biometricToken || get().biometricToken,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed",
          });
          throw error;
        }
      },

      register: async (firstName, lastName, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authService.register({
            firstName,
            lastName,
            email,
            password,
          });
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Registration failed",
          });
          throw error;
        }
      },

      loginWithBiometrics: async (userId) => {
        set({ isLoading: true, error: null });
        try {
          console.log(
            "UserStore: Starting biometric login for userId:",
            userId
          );

          // Try to get the token from state first
          let biometricToken = get().biometricToken;
          console.log(
            "UserStore: Biometric token from state:",
            biometricToken ? "available" : "not available"
          );

          // If not in state, try to get from storage
          if (!biometricToken) {
            biometricToken = await AsyncStorage.getItem("biometric_token");
            console.log(
              "UserStore: Biometric token from storage:",
              biometricToken ? "available" : "not available"
            );

            // Store in state for future use if found
            if (biometricToken) {
              set({ biometricToken });
            }
          }

          // Allow loginWithBiometrics to handle the null case and provide better error
          const { user, token } = await authService.loginWithBiometrics(
            userId,
            biometricToken
          );

          console.log("UserStore: Biometric login successful, setting state");
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Ensure biometric user ID is stored for future logins
          await AsyncStorage.setItem("last_user_id", user.id);
        } catch (error) {
          console.error("UserStore: Biometric login error:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Biometric login failed",
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Get biometric token before clearing state
          const biometricToken = get().biometricToken;

          await authService.logout();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            // Keep biometric token for future logins
            biometricToken: biometricToken,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Logout failed",
          });

          // Get biometric token before clearing state
          const biometricToken = get().biometricToken;

          // We still want to clear the state even if the API call fails
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            // Keep biometric token for future logins
            biometricToken: biometricToken,
          });
        }
      },

      // Biometric actions
      setupBiometrics: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log("UserStore: Starting biometric setup...");

          // Check for valid authentication
          const authToken = await AsyncStorage.getItem("auth_token");
          if (!authToken) {
            console.error("UserStore: No auth token found for biometric setup");
            throw new Error("Authentication required. Please log in first.");
          }

          const { token } = await authService.setupBiometrics();
          console.log("UserStore: Biometric setup successful, token received");

          // Update user object with biometricEnabled flag
          if (get().user) {
            const updatedUser = {
              ...get().user,
              biometricEnabled: true,
            } as User;

            // Store the biometric token in AsyncStorage
            await AsyncStorage.setItem("biometric_token", token);
            console.log("UserStore: Biometric token stored in AsyncStorage");

            // Also store the user ID for biometric login
            await AsyncStorage.setItem("last_user_id", updatedUser.id);
            console.log(
              "UserStore: User ID stored for biometric login:",
              updatedUser.id
            );

            // Verify token was stored successfully
            const storedToken = await AsyncStorage.getItem("biometric_token");
            if (!storedToken) {
              console.error("UserStore: Failed to store biometric token");
              throw new Error("Failed to save biometric data");
            }

            try {
              // Update the user profile in the backend
              await userService.updateUserProfile({
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
              });
              console.log("UserStore: User profile updated in backend");
            } catch (profileError) {
              console.error(
                "UserStore: Failed to update profile:",
                profileError
              );
              // Continue despite profile update error
            }

            set({
              biometricToken: token,
              user: updatedUser,
              isLoading: false,
            });
            console.log(
              "UserStore: State updated with biometric token and updated user"
            );
          } else {
            console.error(
              "UserStore: No user logged in during biometric setup"
            );
            throw new Error("No user logged in");
          }
        } catch (error) {
          console.error("UserStore: Biometric setup error:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Biometric setup failed",
          });
          throw error;
        }
      },

      setBiometricToken: async (token: string) => {
        try {
          await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, token);
          set({ biometricToken: token });
        } catch (error) {
          console.error("Error storing biometric token:", error);
          throw new Error("Failed to store biometric token");
        }
      },

      getBiometricToken: async () => {
        try {
          const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);
          return token;
        } catch (error) {
          console.error("Error getting biometric token:", error);
          return null;
        }
      },

      clearBiometricToken: async () => {
        try {
          await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
          set({ biometricToken: null });
        } catch (error) {
          console.error("Error clearing biometric token:", error);
          throw new Error("Failed to clear biometric token");
        }
      },

      setHasBiometricAuth: (hasAuth) => {
        set({ hasBiometricAuth: hasAuth });
      },

      // User data actions
      fetchUserProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const user = await userService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch user profile",
          });
          throw error;
        }
      },

      updateUserProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await userService.updateUserProfile(data);
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update profile",
          });
          throw error;
        }
      },

      updatePushToken: async (pushToken) => {
        set({ isLoading: true, error: null });
        try {
          await userService.updatePushToken(pushToken);
          set({ isLoading: false });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to update push token",
          });
          throw error;
        }
      },

      // UI state actions
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Fetch current user data
      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await axios.get("/users/me");
          set({ currentUser: response.data, isLoading: false });

          // Try to get stored biometric token
          const token = await get().getBiometricToken();
          if (token) {
            set({ biometricToken: token });
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch user profile",
          });
        }
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        biometricToken: state.biometricToken,
      }),
    }
  )
);
