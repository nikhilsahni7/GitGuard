/**
 * Utility functions for formatting and styling
 */

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Get the icon name for a Git provider
 * @param provider - Git provider string (GITHUB, GITLAB, BITBUCKET)
 * @returns Icon name for MaterialCommunityIcons
 */
export const getProviderIcon = (provider: string): string => {
  switch (provider) {
    case "GITHUB":
      return "github";
    case "GITLAB":
      return "gitlab";
    case "BITBUCKET":
      return "bitbucket";
    default:
      return "git";
  }
};

/**
 * Get the color for a Git provider
 * @param provider - Git provider string (GITHUB, GITLAB, BITBUCKET)
 * @returns Hex color code
 */
export const getProviderColor = (provider: string): string => {
  switch (provider) {
    case "GITHUB":
      return "#24292E";
    case "GITLAB":
      return "#FC6D26";
    case "BITBUCKET":
      return "#2684FF";
    default:
      return "#6741D9";
  }
};

/**
 * Get the color for a request status
 * @param status - Status string (PENDING, APPROVED, REJECTED, EXPIRED)
 * @returns Hex color code
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "#FF9800";
    case "APPROVED":
      return "#4CAF50";
    case "REJECTED":
      return "#F44336";
    case "EXPIRED":
      return "#9E9E9E";
    default:
      return "#9E9E9E";
  }
};

/**
 * Get the icon name for a request status
 * @param status - Status string (PENDING, APPROVED, REJECTED, EXPIRED)
 * @returns Icon name for Ionicons
 */
export const getStatusIcon = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "time-outline";
    case "APPROVED":
      return "checkmark-circle";
    case "REJECTED":
      return "close-circle";
    case "EXPIRED":
      return "hourglass-outline";
    default:
      return "help-circle";
  }
};

/**
 * Get the color for a role
 * @param role - Role string (ADMIN, CONTRIBUTOR, VIEWER)
 * @returns Hex color code
 */
export const getRoleColor = (role: string): string => {
  switch (role) {
    case "ADMIN":
      return "#F44336";
    case "CONTRIBUTOR":
      return "#4CAF50";
    case "VIEWER":
      return "#2196F3";
    default:
      return "#9E9E9E";
  }
};

/**
 * Get header animation values
 * @param scrollY - Animated.Value for scroll position
 * @returns Object with animation values
 */
export const getHeaderAnimationValues = (scrollY: any) => {
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 60],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  return { headerHeight, headerOpacity };
};
