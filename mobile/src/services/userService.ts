import api from "./api";
import type { User } from "./authService";

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  pushToken?: string | null;
}

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get("/users/me");
    return response.data.user;
  } catch (error) {
    throw handleUserError(error);
  }
};

// Update user profile
export const updateUserProfile = async (
  profileData: UserProfileUpdate
): Promise<User> => {
  try {
    const response = await api.put("/users/me", profileData);
    return response.data.user;
  } catch (error) {
    throw handleUserError(error);
  }
};

// Update push notification token
export const updatePushToken = async (pushToken: string): Promise<void> => {
  try {
    await api.put("/users/push-token", { pushToken });
  } catch (error) {
    throw handleUserError(error);
  }
};

// Get user by ID (for admins or privileged users)
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data.user;
  } catch (error) {
    throw handleUserError(error);
  }
};

// Get all users (paginated, for admins)
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/users", {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    throw handleUserError(error);
  }
};

// Helper function to handle user-related errors
const handleUserError = (error: any): Error => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMessage =
      error.response.data?.message || "User operation failed";
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
