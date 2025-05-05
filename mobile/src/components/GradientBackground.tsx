import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../styles/theme";

interface GradientBackgroundProps {
  children: React.ReactNode;
  intensity?: "light" | "medium" | "dark";
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  intensity = "medium",
}) => {
  // Define color gradients based on intensity
  const getGradientColors = () => {
    switch (intensity) {
      case "light":
        return [
          colors.background.dark,
          colors.background.medium,
          `${colors.primary}40`, // 25% opacity
        ];
      case "dark":
        return [
          colors.background.dark,
          colors.background.dark,
          `${colors.primary}60`, // 37% opacity
        ];
      default: // medium
        return [
          colors.background.dark,
          colors.background.medium,
          `${colors.primary}50`, // 31% opacity
        ];
    }
  };

  // Define gradient locations based on intensity
  const getGradientLocations = () => {
    switch (intensity) {
      case "light":
        return [0, 0.75, 1];
      case "dark":
        return [0, 0.65, 1];
      default: // medium
        return [0, 0.7, 1];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={getGradientLocations()}
        style={styles.gradient}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default GradientBackground;
