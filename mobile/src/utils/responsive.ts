import { Dimensions, PixelRatio, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

// Base dimensions used for scaling (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// Check if the device is a small screen device
const isSmallDevice = width < 375;

// Scaling functions
const horizontalScale = (size: number) => (width / baseWidth) * size;
const verticalScale = (size: number) => (height / baseHeight) * size;

// Font scaling with a cap to prevent huge fonts on tablets
const fontScale = (size: number) => {
  const scale = Math.min(width / baseWidth, 1.2); // Cap scale at 1.2
  const newSize = size * scale;

  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // For Android, additional adjustment for pixel density
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Helper function to ensure minimum touch target size for accessibility
const minTouchSize = 44; // Apple's recommended minimum touch target size

export {
  fontScale,
  horizontalScale,
  isSmallDevice,
  minTouchSize,
  height as screenHeight,
  width as screenWidth,
  verticalScale,
};
