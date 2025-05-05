export const colors = {
  primary: "#FF7B00",
  primaryLight: "rgba(255, 123, 0, 0.2)",
  primaryDark: "#D36800",

  background: {
    dark: "#161A28",
    medium: "#1E2435",
    light: "#2D3548",
  },

  text: {
    primary: "#FFFFFF",
    secondary: "#BDC3D8",
    disabled: "#8F98AD",
  },

  status: {
    error: "#E74C3C",
    success: "#2ECC71",
    warning: "#F39C12",
    info: "#3498DB",
  },

  surface: {
    card: "#1E2435",
    cardBorder: "#2D3548",
    input: "#1E2435",
    inputBorder: "#2D3548",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  circle: 9999,
};

export const typography = {
  fontFamily: {
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semiBold: "Inter-SemiBold",
    bold: "Inter-Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    display: 36,
  },
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const responsive = {
  fontScale: (size: number) => {
    return size;
  },
  horizontalScale: (size: number) => {
    return size;
  },
  verticalScale: (size: number) => {
    return size;
  },
  isSmallDevice: false,
};

export const layout = {
  containerPadding: spacing.lg,
  screenPadding: spacing.lg,
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  layout,
  responsive,
};
