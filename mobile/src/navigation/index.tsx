import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import { useUserStore } from "../store/userStore";

// Import screens that we've created
import AccessRequestDetailScreen from "../screens/access-requests/AccessRequestDetailScreen";
import AccessRequestsScreen from "../screens/access-requests/AccessRequestsScreen";
import ApproveRequestScreen from "../screens/access-requests/ApproveRequestScreen";
import CreateAccessRequestScreen from "../screens/access-requests/CreateAccessRequestScreen";
import AuditLogDetailScreen from "../screens/audit-logs/AuditLogDetailScreen";
import AuditLogScreen from "../screens/audit-logs/AuditLogScreen";
import BiometricSetupScreen from "../screens/auth/BiometricSetupScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import DashboardScreen from "../screens/home/DashboardScreen";
import NotificationsScreen from "../screens/notifications/NotificationsScreen";
import CreateOrganizationScreen from "../screens/organizations/CreateOrganizationScreen";
import OrganizationDetailScreen from "../screens/organizations/OrganizationDetailScreen";
import OrganizationListScreen from "../screens/organizations/OrganizationListScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import CreateRepositoryScreen from "../screens/repositories/CreateRepositoryScreen";
import RepositoryDetailScreen from "../screens/repositories/RepositoryDetailScreen";
import RepositoryListScreen from "../screens/repositories/RepositoryListScreen";

// Define types for the navigation
export type RootStackParamList = {
  Auth: undefined;
  BiometricSetup: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  RepositoriesTab: undefined;
  OrganizationsTab: undefined;
  AccessRequestsTab: undefined;
  AuditLogsTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
  Notifications: undefined;
};

export type RepositoryStackParamList = {
  RepositoryList: undefined;
  RepositoryDetail: { id: string };
  CreateRepository: { organizationId?: string };
};

export type AccessRequestStackParamList = {
  AccessRequests: undefined;
  AccessRequestDetail: { id: string };
  CreateAccessRequest: { repositoryId?: string } | undefined;
  ApproveRequest: { id: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

export type OrganizationStackParamList = {
  OrganizationList: undefined;
  OrganizationDetail: { id: string };
  CreateOrganization: undefined;
};

export type AuditLogStackParamList = {
  AuditLogs: undefined;
  AuditLogDetail: { id: string };
};

// Create navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const RepositoryStack = createStackNavigator<RepositoryStackParamList>();
const AccessRequestStack = createStackNavigator<AccessRequestStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();
const OrganizationStack = createStackNavigator<OrganizationStackParamList>();
const AuditLogStack = createStackNavigator<AuditLogStackParamList>();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Home Stack Navigator
const HomeNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
};

// Repository Stack Navigator
const RepositoryNavigator = () => {
  return (
    <RepositoryStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <RepositoryStack.Screen
        name="RepositoryList"
        component={RepositoryListScreen}
        options={{ title: "Repositories" }}
      />
      <RepositoryStack.Screen
        name="RepositoryDetail"
        component={RepositoryDetailScreen}
        options={{ title: "Repository Details" }}
      />
      <RepositoryStack.Screen
        name="CreateRepository"
        component={CreateRepositoryScreen}
        options={{ title: "Create Repository" }}
      />
    </RepositoryStack.Navigator>
  );
};

// Access Request Stack Navigator
const AccessRequestNavigator = () => {
  return (
    <AccessRequestStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <AccessRequestStack.Screen
        name="AccessRequests"
        component={AccessRequestsScreen}
        options={{ title: "Access Requests" }}
      />
      <AccessRequestStack.Screen
        name="AccessRequestDetail"
        component={AccessRequestDetailScreen}
        options={{ title: "Request Details" }}
      />
      <AccessRequestStack.Screen
        name="CreateAccessRequest"
        component={CreateAccessRequestScreen}
        options={{ title: "New Request" }}
      />
      <AccessRequestStack.Screen
        name="ApproveRequest"
        component={ApproveRequestScreen}
        options={{ title: "Approve Request" }}
      />
    </AccessRequestStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileNavigator = () => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "My Profile" }}
      />
    </ProfileStack.Navigator>
  );
};

// Organization Stack Navigator
const OrganizationNavigator = () => {
  return (
    <OrganizationStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <OrganizationStack.Screen
        name="OrganizationList"
        component={OrganizationListScreen}
        options={{ title: "Organizations" }}
      />
      <OrganizationStack.Screen
        name="OrganizationDetail"
        component={OrganizationDetailScreen}
        options={{ title: "Organization Details" }}
      />
      <OrganizationStack.Screen
        name="CreateOrganization"
        component={CreateOrganizationScreen}
        options={{ title: "Create Organization" }}
      />
    </OrganizationStack.Navigator>
  );
};

// Audit Log Stack Navigator
const AuditLogNavigator = () => {
  return (
    <AuditLogStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1E2435",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: "#FFFFFF",
        cardStyle: { backgroundColor: "#161A28" },
      }}
    >
      <AuditLogStack.Screen
        name="AuditLogs"
        component={AuditLogScreen}
        options={{ title: "Audit Logs" }}
      />
      <AuditLogStack.Screen
        name="AuditLogDetail"
        component={AuditLogDetailScreen}
        options={{ title: "Log Details" }}
      />
    </AuditLogStack.Navigator>
  );
};

// Main Tab Navigator
const MainNavigator = () => {
  const { colors } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: "#FF7B00",
        tabBarInactiveTintColor: "#9DA5BD",
        tabBarStyle: {
          backgroundColor: "#1E2435",
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingTop: 5,
          paddingBottom: 10,
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "HomeTab") {
            iconName = "home-outline";
          } else if (route.name === "RepositoriesTab") {
            iconName = "git-branch-outline";
          } else if (route.name === "OrganizationsTab") {
            iconName = "people-outline";
          } else if (route.name === "AccessRequestsTab") {
            iconName = "key-outline";
          } else if (route.name === "AuditLogsTab") {
            iconName = "list-outline";
          } else if (route.name === "ProfileTab") {
            iconName = "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <MainTab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{ title: "Home" }}
      />
      <MainTab.Screen
        name="RepositoriesTab"
        component={RepositoryNavigator}
        options={{ title: "Repos" }}
      />
      <MainTab.Screen
        name="OrganizationsTab"
        component={OrganizationNavigator}
        options={{ title: "Orgs" }}
      />
      <MainTab.Screen
        name="AccessRequestsTab"
        component={AccessRequestNavigator}
        options={{ title: "Access" }}
      />
      <MainTab.Screen
        name="AuditLogsTab"
        component={AuditLogNavigator}
        options={{ title: "Audit" }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{ title: "Profile" }}
      />
    </MainTab.Navigator>
  );
};

// Root Navigator
export const RootNavigator = () => {
  // Use authentication state from the store
  const { isAuthenticated, user } = useUserStore();

  // Check if biometric setup is needed (user is authenticated but needs to set up biometrics)
  const needsBiometricSetup = isAuthenticated && user && !user.biometricEnabled;

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: "#161A28" },
        presentation: "card",
        detachPreviousScreen: false,
      }}
    >
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : needsBiometricSetup ? (
        <RootStack.Screen
          name="BiometricSetup"
          component={BiometricSetupScreen}
        />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
};

export default RootNavigator;
