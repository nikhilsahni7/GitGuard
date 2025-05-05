import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import LinearGradientButton from "./LinearGradientButton";

interface EmptyStateProps {
  icon: string;
  iconSet?: "ionicons" | "material";
  title: string;
  subtitle?: string;
  message?: string; // Keep for backwards compatibility
  action?:
    | React.ReactNode
    | {
        label: string;
        onPress: () => void;
      };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconSet = "ionicons",
  title,
  subtitle,
  message,
  action,
}) => {
  // Use subtitle if provided, otherwise use message for backwards compatibility
  const displayMessage = subtitle || message || "";

  const renderIcon = () => {
    if (iconSet === "material") {
      return <MaterialCommunityIcons name={icon} size={64} color="#626B85" />;
    }
    return <Ionicons name={icon as any} size={64} color="#626B85" />;
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{displayMessage}</Text>
      {action && (
        <View style={styles.actionContainer}>
          {typeof action === "object" && "label" in action ? (
            <LinearGradientButton
              onPress={action.onPress}
              text={action.label}
            />
          ) : (
            action
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 16,
    fontFamily: "Inter-SemiBold",
  },
  message: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Inter-Regular",
  },
  actionContainer: {
    marginTop: 24,
    width: "100%",
    maxWidth: 240,
  },
});

export default EmptyState;
