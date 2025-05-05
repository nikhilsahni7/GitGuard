import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { borderRadius, colors, shadows, spacing } from "../styles/theme";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: "default" | "flat" | "elevated";
  padding?: "none" | "small" | "medium" | "large";
}

const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "medium",
  style,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = [styles.card];

    // Add variant styles
    if (variant === "elevated") {
      baseStyle.push(styles.elevated);
    } else if (variant === "flat") {
      baseStyle.push(styles.flat);
    }

    // Add padding
    if (padding !== "none") {
      baseStyle.push(styles[`${padding}Padding`]);
    }

    return baseStyle;
  };

  return (
    <View style={[...getCardStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface.cardBorder,
    overflow: "hidden",
  },
  elevated: {
    ...shadows.medium,
    borderWidth: 0,
  },
  flat: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  nonePadding: {
    padding: 0,
  },
  smallPadding: {
    padding: spacing.sm,
  },
  mediumPadding: {
    padding: spacing.md,
  },
  largePadding: {
    padding: spacing.lg,
  },
});

export default Card;
