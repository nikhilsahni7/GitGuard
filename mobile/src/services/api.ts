import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { getAuthToken } from "./authService";

// Get API URL from environment or use default
const API_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://192.168.1.7:4000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

//
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;


      console.log(`API: Making request to ${config.baseURL}${config.url}`);
    } else {

      console.warn(`API: No auth token available for request to ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("API: Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common error responses
api.interceptors.response.use(
  (response) => {
    // Log successful auth-related responses
    if (response.config.url?.includes("/auth/")) {
      console.log(
        `API: Successful response from ${response.config.url}, status ${response.status}`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log all API errors
    console.error(
      `API Error: ${error.config.url} (${error.response?.status}): ${error.response?.data?.message || error.message}`
    );

    // If 401 Unauthorized error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("API: Attempting to refresh token after 401 error");
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        if (refreshToken) {
          console.log("API: Refresh token available, attempting token refresh");
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          const { token } = response.data;
          console.log("API: Successfully refreshed token");

          // Update stored token
          await AsyncStorage.setItem("auth_token", token);

          // Update auth header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          console.log("API: No refresh token available");
        }
      } catch (refreshError) {
        console.error("API: Token refresh failed:", refreshError);
        // If token refresh fails, clear tokens and reject
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("refresh_token");
      }
    }

    // Handle common errors like authentication errors
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        // Handle unauthorized errors
        console.log("Authentication required - redirect to login");
        // Navigate to login (to be implemented)
      }

      if (status === 403) {
        console.log("Access forbidden - handling gracefully");

        // Enhance error message for repositories and access requests
        if (error.config.url?.includes("/repositories/")) {
          // For repository access issues
          error.message =
            "You don't have permission to view this repository. Please request access.";
          console.warn(
            `User doesn't have permission to view repository ${error.config.url.split("/repositories/")[1]}`
          );
        } else if (error.config.url?.includes("/access-requests/")) {
          // For access request issues
          error.message =
            "You don't have permission to view this access request.";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
