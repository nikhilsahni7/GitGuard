import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../styles/theme";

interface NotificationToastProps {
  title: string;
  body: string;
  onPress?: () => void;
  onClose?: () => void;
  visible: boolean;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  title,
  body,
  onPress,
  onClose,
  visible,
  duration = 3000, // Default 3 seconds
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Mount effect
  useEffect(() => {
    // Set mounted flag
    const timeout = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  // Handle visibility changes
  useEffect(() => {
    // Don't run animations until the component is properly mounted
    if (!isMounted) return;

    if (visible) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Set timeout to hide
      timeoutRef.current = setTimeout(() => {
        animateOut();
      }, duration);
    } else {
      animateOut();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, isMounted]);

  // Separate function for animation out
  const animateOut = () => {
    if (!isMounted) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onClose) {
        onClose();
      }
    });
  };

  // Don't render anything until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: insets.top,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color={colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={animateOut}>
          <Ionicons name="close" size={20} color="#9DA5BD" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 8,
  },
  content: {
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    color: "#9DA5BD",
  },
  closeButton: {
    padding: 4,
  },
});

export default NotificationToast;
