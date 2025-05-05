import React from "react";
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface CardContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const CardContainer: React.FC<CardContainerProps> = ({
  children,
  style,
  onPress,
}) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2D3548",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default CardContainer;
