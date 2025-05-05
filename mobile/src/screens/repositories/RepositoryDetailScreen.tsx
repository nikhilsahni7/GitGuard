import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import ErrorMessage from "../../components/ErrorMessage";
import LinearGradientButton from "../../components/LinearGradientButton";
import { MainTabParamList, RepositoryStackParamList } from "../../navigation";
import { AuditLog } from "../../services/auditLogService";
import { RoleAssignment } from "../../services/repositoryService";
import { useAuditLogStore, useRepositoryStore } from "../../store";

type RepositoryDetailScreenRouteProp = RouteProp<
  RepositoryStackParamList,
  "RepositoryDetail"
>;

type RepositoryDetailScreenNavigationProp = StackNavigationProp<
  RepositoryStackParamList & MainTabParamList
>;

const RepositoryDetailScreen = () => {
  const route = useRoute<RepositoryDetailScreenRouteProp>();
  const navigation = useNavigation<RepositoryDetailScreenNavigationProp>();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<"info" | "access" | "audit">(
    "info"
  );

  // Get repository and audit log data from stores
  const {
    currentRepository,
    isLoading: repoLoading,
    error: repoError,
    fetchRepository,
    roleAssignments,
    fetchRoleAssignments,
  } = useRepositoryStore();

  const {
    auditLogs,
    isLoading: auditLoading,
    error: auditError,
    fetchEntityLogs,
  } = useAuditLogStore();

  // Load repository data when component mounts
  useEffect(() => {
    fetchRepository(id);
    fetchRoleAssignments(id);
    fetchEntityLogs("repository", id);
  }, [id, fetchRepository, fetchRoleAssignments, fetchEntityLogs]);

  // Helper function to open repository URL
  const openRepositoryUrl = useCallback(() => {
    if (currentRepository?.gitRepoUrl) {
      Linking.openURL(currentRepository.gitRepoUrl).catch(() => {
        Alert.alert("Error", "Could not open the repository URL");
      });
    }
  }, [currentRepository]);

  // Helper function to request access
  const requestAccess = useCallback(() => {
    navigation.navigate("AccessRequestsTab", {
      screen: "CreateAccessRequest",
      params: { repositoryId: id },
    });
  }, [navigation, id]);

  // Render repository info tab
  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {currentRepository?.description && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {currentRepository.description}
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Git Provider</Text>
          <View style={styles.detailValueContainer}>
            <MaterialCommunityIcons
              name={getProviderIcon(currentRepository?.gitProvider || "GITHUB")}
              size={16}
              color="#FFFFFF"
              style={styles.detailIcon}
            />
            <Text style={styles.detailValue}>
              {formatGitProvider(currentRepository?.gitProvider || "GITHUB")}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>
            {formatDate(currentRepository?.createdAt || "")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Updated</Text>
          <Text style={styles.detailValue}>
            {formatDate(currentRepository?.updatedAt || "")}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Owner</Text>
          <Text style={styles.detailValue}>
            {currentRepository?.owner
              ? `${currentRepository.owner.firstName} ${currentRepository.owner.lastName}`
              : "Unknown"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Organization</Text>
          <Text style={styles.detailValue}>
            {currentRepository?.organization?.name || "None"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <LinearGradientButton
          onPress={openRepositoryUrl}
          text="Open Repository"
          icon="open-outline"
          iconPosition="right"
        />
      </View>
    </View>
  );

  // Render role assignment item
  const renderRoleAssignment = ({ item }: { item: RoleAssignment }) => (
    <CardContainer>
      <View style={styles.roleAssignmentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>
              {item.user.firstName.charAt(0) + item.user.lastName.charAt(0)}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {item.user.firstName} {item.user.lastName}
            </Text>
            <Text style={styles.userEmail}>{item.user.email}</Text>
          </View>
        </View>
        <View
          style={[
            styles.roleBadge,
            { backgroundColor: getRoleColor(item.role.name) },
          ]}
        >
          <Text style={styles.roleText}>{item.role.name}</Text>
        </View>
      </View>

      {item.expiresAt && (
        <View style={styles.expirationContainer}>
          <Ionicons name="time-outline" size={14} color="#FF7B00" />
          <Text style={styles.expirationText}>
            Expires on {formatDate(item.expiresAt)}
          </Text>
        </View>
      )}
    </CardContainer>
  );

  // Render access tab
  const renderAccessTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.accessHeader}>
        <Text style={styles.accessTitle}>
          Access Control{" "}
          <Text style={styles.accessCount}>({roleAssignments.length})</Text>
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={requestAccess}>
          <Text style={styles.addButtonText}>Request Access</Text>
          <Ionicons name="add-circle" size={20} color="#FF7B00" />
        </TouchableOpacity>
      </View>

      {roleAssignments.length > 0 ? (
        <FlatList
          data={roleAssignments}
          renderItem={renderRoleAssignment}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.roleList}
        />
      ) : (
        <View style={styles.emptyAccessContainer}>
          <MaterialCommunityIcons
            name="account-lock"
            size={48}
            color="#626B85"
          />
          <Text style={styles.emptyAccessText}>No access assignments yet</Text>
          <Text style={styles.emptyAccessSubtext}>
            Request access to this repository
          </Text>
          <View style={styles.emptyAccessButton}>
            <LinearGradientButton
              onPress={requestAccess}
              text="Request Access"
              icon="add-circle-outline"
            />
          </View>
        </View>
      )}
    </View>
  );

  // Render audit log item
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => (
    <View style={styles.auditLogItem}>
      <View style={styles.auditLogIconContainer}>
        <View
          style={[
            styles.auditLogIcon,
            { backgroundColor: getAuditLogColor(item.action) },
          ]}
        >
          <Ionicons
            name={getAuditLogIcon(item.action)}
            size={16}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.auditLogLine} />
      </View>
      <View style={styles.auditLogContent}>
        <Text style={styles.auditLogDescription}>{item.description}</Text>
        <View style={styles.auditLogDetails}>
          <Text style={styles.auditLogUser}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.auditLogTime}>
            {formatDateTime(item.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render audit tab
  const renderAuditTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.auditTitle}>
        Audit Logs <Text style={styles.auditCount}>({auditLogs.length})</Text>
      </Text>

      {auditLogs.length > 0 ? (
        <FlatList
          data={auditLogs}
          renderItem={renderAuditLogItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.auditList}
        />
      ) : (
        <View style={styles.emptyAuditContainer}>
          <MaterialCommunityIcons
            name="clipboard-text-clock"
            size={48}
            color="#626B85"
          />
          <Text style={styles.emptyAuditText}>No audit logs yet</Text>
          <Text style={styles.emptyAuditSubtext}>
            Actions on this repository will be logged here
          </Text>
        </View>
      )}
    </View>
  );

  if (repoLoading && !currentRepository) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7B00" />
        <Text style={styles.loadingText}>Loading repository details...</Text>
      </SafeAreaView>
    );
  }

  if (repoError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={repoError} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.repositoryHeader}>
            <View
              style={[
                styles.repoIconContainer,
                {
                  backgroundColor: getProviderColor(
                    currentRepository?.gitProvider || "GITHUB"
                  ),
                },
              ]}
            >
              <MaterialCommunityIcons
                name={getProviderIcon(
                  currentRepository?.gitProvider || "GITHUB"
                )}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.repositoryTitleContainer}>
              <Text style={styles.repositoryName}>
                {currentRepository?.name || "Repository"}
              </Text>
              <Text style={styles.organizationName}>
                {currentRepository?.organization?.name || "Organization"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "info" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("info")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "info" && styles.activeTabButtonText,
              ]}
            >
              Information
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "access" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("access")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "access" && styles.activeTabButtonText,
              ]}
            >
              Access Control
            </Text>
            <Badge style={styles.tabBadge}>{roleAssignments.length}</Badge>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "audit" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("audit")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "audit" && styles.activeTabButtonText,
              ]}
            >
              Audit Logs
            </Text>
            <Badge style={styles.tabBadge}>{auditLogs.length}</Badge>
          </TouchableOpacity>
        </View>

        {activeTab === "info" && renderInfoTab()}
        {activeTab === "access" && renderAccessTab()}
        {activeTab === "audit" && renderAuditTab()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "GITHUB":
      return "github";
    case "GITLAB":
      return "gitlab";
    case "BITBUCKET":
      return "bitbucket";
    default:
      return "git";
  }
};

const getProviderColor = (provider: string) => {
  switch (provider) {
    case "GITHUB":
      return "#24292E";
    case "GITLAB":
      return "#FC6D26";
    case "BITBUCKET":
      return "#2684FF";
    default:
      return "#6741D9";
  }
};

const formatGitProvider = (provider: string) => {
  switch (provider) {
    case "GITHUB":
      return "GitHub";
    case "GITLAB":
      return "GitLab";
    case "BITBUCKET":
      return "Bitbucket";
    default:
      return provider;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRoleColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "administrator":
      return "rgba(255, 123, 0, 0.2)";
    case "contributor":
      return "rgba(0, 170, 255, 0.2)";
    case "viewer":
      return "rgba(103, 65, 217, 0.2)";
    default:
      return "rgba(120, 120, 120, 0.2)";
  }
};

const getAuditLogIcon = (action: string) => {
  if (action.includes("CREATE")) return "add-circle-outline";
  if (action.includes("UPDATE")) return "pencil-outline";
  if (action.includes("DELETE")) return "trash-outline";
  if (action.includes("ACCESS")) return "key-outline";
  if (action.includes("LOGIN")) return "log-in-outline";
  if (action.includes("LOGOUT")) return "log-out-outline";
  if (action.includes("ROLE")) return "people-outline";
  return "document-outline";
};

const getAuditLogColor = (action: string) => {
  if (action.includes("CREATE")) return "#4CAF50";
  if (action.includes("UPDATE")) return "#2196F3";
  if (action.includes("DELETE")) return "#F44336";
  if (action.includes("ACCESS")) return "#FF9800";
  if (action.includes("LOGIN")) return "#9C27B0";
  if (action.includes("LOGOUT")) return "#673AB7";
  if (action.includes("ROLE")) return "#00BCD4";
  return "#607D8B";
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#161A28",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  repositoryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  repoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#24292E",
  },
  repositoryTitleContainer: {
    marginLeft: 16,
  },
  repositoryName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  organizationName: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 2,
    fontFamily: "Inter-Regular",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flexDirection: "row",
  },
  activeTabButton: {
    borderBottomColor: "#FF7B00",
  },
  tabButtonText: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-SemiBold",
  },
  activeTabButtonText: {
    color: "#FF7B00",
  },
  tabBadge: {
    backgroundColor: "#FF7B00",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    fontFamily: "Inter-SemiBold",
  },
  descriptionText: {
    fontSize: 14,
    color: "#CDD5E0",
    lineHeight: 22,
    fontFamily: "Inter-Regular",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2D3548",
  },
  detailLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    maxWidth: "60%",
    textAlign: "right",
  },
  detailValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 8,
  },
  buttonContainer: {
    marginTop: 24,
  },
  accessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  accessTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  accessCount: {
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#FF7B00",
    marginRight: 8,
    fontSize: 14,
    fontFamily: "Inter-SemiBold",
  },
  roleList: {
    paddingBottom: 24,
  },
  roleAssignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2D3548",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter-SemiBold",
  },
  userName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  userEmail: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 123, 0, 0.2)",
  },
  roleText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  expirationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2D3548",
  },
  expirationText: {
    fontSize: 12,
    color: "#FF7B00",
    marginLeft: 4,
    fontFamily: "Inter-Regular",
  },
  emptyAccessContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyAccessText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 16,
    fontFamily: "Inter-SemiBold",
  },
  emptyAccessSubtext: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 8,
    fontFamily: "Inter-Regular",
  },
  emptyAccessButton: {
    marginTop: 24,
    width: "100%",
    maxWidth: 200,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
    fontFamily: "Inter-SemiBold",
  },
  auditCount: {
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  auditList: {
    paddingBottom: 24,
  },
  auditLogItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  auditLogIconContainer: {
    width: 40,
    alignItems: "center",
  },
  auditLogIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4CAF50",
  },
  auditLogLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#2D3548",
    marginTop: 2,
    marginBottom: -8,
    alignSelf: "center",
  },
  auditLogContent: {
    flex: 1,
    backgroundColor: "#1E2435",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2D3548",
  },
  auditLogDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 8,
    fontFamily: "Inter-Regular",
  },
  auditLogDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  auditLogUser: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  auditLogTime: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  emptyAuditContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyAuditText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: 16,
    fontFamily: "Inter-SemiBold",
  },
  emptyAuditSubtext: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 8,
    fontFamily: "Inter-Regular",
  },
});

export default RepositoryDetailScreen;
