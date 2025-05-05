import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { borderRadius, colors, spacing, typography } from "../styles/theme";
import { fontScale, horizontalScale, verticalScale } from "../utils/responsive";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  secureTextEntry?: boolean;
  containerStyle?: any;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  secureTextEntry,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(!secureTextEntry);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const toggleSecureEntry = () => setIsSecureVisible(!isSecureVisible);

  const getContainerStyle = () => {
    const baseStyle = [styles.inputContainer];

    if (error) {
      baseStyle.push(styles.errorContainer);
    } else if (isFocused) {
      baseStyle.push(styles.focusedContainer);
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={getContainerStyle()}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={fontScale(20)}
            color={error ? colors.status.error : colors.text.secondary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={toggleSecureEntry}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isSecureVisible ? "eye-off-outline" : "eye-outline"}
              size={fontScale(20)}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !secureTextEntry && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={rightIcon as any}
              size={fontScale(20)}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(spacing.md),
    width: "100%",
  },
  label: {
    fontSize: fontScale(typography.fontSize.sm),
    color: colors.text.primary,
    marginBottom: verticalScale(spacing.xs),
    fontFamily: typography.fontFamily.semiBold,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface.input,
    borderWidth: 1,
    borderColor: colors.surface.inputBorder,
    borderRadius: borderRadius.md,
    paddingVertical: verticalScale(spacing.sm),
    paddingHorizontal: horizontalScale(spacing.md),
    minHeight: verticalScale(48),
  },
  focusedContainer: {
    borderColor: colors.primary,
  },
  errorContainer: {
    borderColor: colors.status.error,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontScale(typography.fontSize.md),
    fontFamily: typography.fontFamily.regular,
    padding: 0,
    ...Platform.select({
      android: {
        paddingVertical: 4,
      },
    }),
  },
  leftIcon: {
    marginRight: horizontalScale(spacing.sm),
  },
  rightIcon: {
    marginLeft: horizontalScale(spacing.sm),
    padding: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontScale(typography.fontSize.xs),
    marginTop: verticalScale(spacing.xs),
    fontFamily: typography.fontFamily.regular,
  },
});

export default Input;
