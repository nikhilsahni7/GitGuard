import React from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getHeaderAnimationValues } from "../utils/formatters";
import ErrorMessage from "./ErrorMessage";

/**
 * Animated header component for list screens
 */
interface AnimatedHeaderProps {
  title: string;
  subtitle: string;
  scrollY: Animated.Value;
  error?: string;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title,
  subtitle,
  scrollY,
  error,
}) => {
  const { headerHeight, headerOpacity } = getHeaderAnimationValues(scrollY);

  return (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </Animated.View>

      {error && <ErrorMessage message={error} />}
    </>
  );
};

/**
 * Loading state component for when data is being fetched
 */
interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF7B00" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

/**
 * Footer loading component for pagination
 */
interface FooterLoaderProps {
  isLoading: boolean;
  isEmpty: boolean;
}

export const FooterLoader: React.FC<FooterLoaderProps> = ({
  isLoading,
  isEmpty,
}) => {
  if (!isLoading || isEmpty) return null;

  return (
    <View style={styles.footerContainer}>
      <ActivityIndicator size="small" color="#FF7B00" />
      <Text style={styles.footerText}>Loading more...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    color: "#9DA5BD",
    fontSize: 16,
    marginTop: 12,
    fontFamily: "Inter-Regular",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
  },
  footerText: {
    color: "#9DA5BD",
    marginLeft: 8,
    fontFamily: "Inter-Regular",
  },
});
