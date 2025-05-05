import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fontScale, horizontalScale } from "../utils/responsive";

interface LinearGradientButtonProps {
  onPress: () => void;
  text: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  gradient?: string[];
  width?: number | string;
  height?: number;
  textSize?: number;
  textColor?: string;
  borderRadius?: number;
  iconPosition?: "left" | "right";
}

const LinearGradientButton: React.FC<LinearGradientButtonProps> = ({
  onPress,
  text,
  loading = false,
  disabled = false,
  icon,
  gradient = ["#FF7B00", "#FF5C00"],
  width = "100%",
  height = 56,
  textSize = 16,
  textColor = "#FFFFFF",
  borderRadius = 12,
  iconPosition = "left",
}) => {
  return (
    <TouchableOpacity
      style={[styles.buttonContainer, { width: width as any, height }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <LinearGradient
        colors={disabled ? ["#2D3548", "#2D3548"] : (gradient as any)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradient,
          {
            borderRadius,
            opacity: disabled ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.buttonContent}>
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <>
              {icon && iconPosition === "left" && (
                <Ionicons
                  name={icon as any}
                  size={fontScale(textSize + 4)}
                  color={textColor}
                  style={styles.leftIcon}
                />
              )}
              <Text
                style={[
                  styles.buttonText,
                  {
                    fontSize: fontScale(textSize),
                    color: textColor,
                    textShadowColor: "rgba(0, 0, 0, 0.3)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                    letterSpacing: 0.5,
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {text}
              </Text>
              {icon && iconPosition === "right" && (
                <Ionicons
                  name={icon as any}
                  size={fontScale(textSize + 4)}
                  color={textColor}
                  style={styles.rightIcon}
                />
              )}
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    shadowColor: "#FF7B00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  gradient: {
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: horizontalScale(16),
  },
  buttonText: {
    fontFamily: "Inter-SemiBold",
    textAlign: "center",
    fontWeight: "600",
  },
  leftIcon: {
    marginRight: horizontalScale(8),
  },
  rightIcon: {
    marginLeft: horizontalScale(8),
  },
});

export default LinearGradientButton;
