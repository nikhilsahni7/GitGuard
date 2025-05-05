import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "../styles/theme";
import {
  fontScale,
  horizontalScale,
  minTouchSize,
  verticalScale,
} from "../utils/responsive";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = "primary",
  size = "medium",
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${size}Button`]];

    if (fullWidth) {
      baseStyle.push(styles.fullWidth);
    }

    if (disabled) {
      baseStyle.push(styles.disabledButton);
      if (variant === "primary") {
        baseStyle.push({ backgroundColor: colors.primaryDark });
      }
    } else {
      baseStyle.push(styles[`${variant}Button`]);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`]];
    baseStyle.push(styles[`${variant}Text`]);

    if (disabled) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  const getIconColor = () => {
    if (disabled) return colors.text.disabled;

    switch (variant) {
      case "outline":
        return colors.primary;
      case "secondary":
        return colors.text.primary;
      case "danger":
        return colors.text.primary;
      default:
        return colors.text.primary;
    }
  };

  const iconSize =
    size === "small"
      ? fontScale(16)
      : size === "medium"
        ? fontScale(20)
        : fontScale(24);

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      disabled={isLoading || disabled}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "outline" ? colors.primary : colors.text.primary}
          size="small"
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && (
            <Ionicons
              name={leftIcon as any}
              size={iconSize}
              color={getIconColor()}
              style={styles.leftIcon}
            />
          )}

          <Text style={getTextStyle()} numberOfLines={1}>
            {title}
          </Text>

          {rightIcon && (
            <Ionicons
              name={rightIcon as any}
              size={iconSize}
              color={getIconColor()}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: horizontalScale(80),
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  smallButton: {
    paddingVertical: verticalScale(spacing.xs),
    paddingHorizontal: horizontalScale(spacing.md),
    minHeight: Math.max(verticalScale(36), minTouchSize),
  },
  mediumButton: {
    paddingVertical: verticalScale(spacing.sm),
    paddingHorizontal: horizontalScale(spacing.lg),
    minHeight: Math.max(verticalScale(48), minTouchSize),
  },
  largeButton: {
    paddingVertical: verticalScale(spacing.md),
    paddingHorizontal: horizontalScale(spacing.xl),
    minHeight: Math.max(verticalScale(56), minTouchSize),
  },
  primaryButton: {
    backgroundColor: colors.primary,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  secondaryButton: {
    backgroundColor: colors.background.light,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.status.error,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: typography.fontFamily.bold,
    textAlign: "center",
  },
  smallText: {
    fontSize: fontScale(typography.fontSize.sm),
  },
  mediumText: {
    fontSize: fontScale(typography.fontSize.md),
  },
  largeText: {
    fontSize: fontScale(typography.fontSize.lg),
  },
  primaryText: {
    color: colors.text.primary,
  },
  secondaryText: {
    color: colors.text.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.text.primary,
  },
  disabledText: {
    color: colors.text.secondary,
  },
  leftIcon: {
    marginRight: horizontalScale(spacing.xs),
  },
  rightIcon: {
    marginLeft: horizontalScale(spacing.xs),
  },
});

export default Button;
