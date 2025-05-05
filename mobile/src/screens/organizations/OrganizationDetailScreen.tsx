import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LinearGradientButton from "../../components/LinearGradientButton";
import {
  OrganizationStackParamList,
  RepositoryStackParamList,
} from "../../navigation";
import { Repository } from "../../services/organizationService";
import { useAuditLogStore } from "../../store/auditLogStore";
import { useOrganizationStore } from "../../store/organizationStore";

type OrganizationDetailScreenRouteProp = RouteProp<
  OrganizationStackParamList,
  "OrganizationDetail"
>;

type OrganizationDetailScreenNavigationProp = StackNavigationProp<
  OrganizationStackParamList & RepositoryStackParamList
>;

const OrganizationDetailScreen = () => {
  const route = useRoute<OrganizationDetailScreenRouteProp>();
  const navigation = useNavigation<OrganizationDetailScreenNavigationProp>();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState("repositories");
  const refreshing = useRef(false);

  // Get organization from store
  const {
    currentOrganization,
    isLoading: orgLoading,
    error: orgError,
    fetchOrganization,
  } = useOrganizationStore();

  // Get audit logs from store
  const {
    auditLogs,
    isLoading: logsLoading,
    error: logsError,
    fetchEntityLogs,
  } = useAuditLogStore();

  // Load organization and audit logs when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrganization(id);
      if (activeTab === "logs") {
        fetchEntityLogs("organization", id);
      }
    }, [id, fetchOrganization, fetchEntityLogs, activeTab])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;
    Promise.all([
      fetchOrganization(id),
      activeTab === "logs"
        ? fetchEntityLogs("organization", id)
        : Promise.resolve(),
    ]).finally(() => {
      refreshing.current = false;
    });
  }, [id, fetchOrganization, fetchEntityLogs, activeTab]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "logs" && (!auditLogs.length || logsLoading)) {
      fetchEntityLogs("organization", id);
    }
  };

  // Navigate to repository detail
  const handleRepositoryPress = (repoId: string) => {
    navigation.navigate("Repositories", {
      screen: "RepositoryDetail",
      params: { id: repoId },
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get provider icon
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

  // Get provider color
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

  // Render repository item
  const renderRepositoryItem = ({ item }: { item: Repository }) => (
    <CardContainer onPress={() => handleRepositoryPress(item.id)}>
      <View style={styles.repoHeader}>
        <View
          style={[
            styles.repoIcon,
            { backgroundColor: getProviderColor(item.gitProvider) },
          ]}
        >
          <MaterialCommunityIcons
            name={getProviderIcon(item.gitProvider)}
            size={16}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.repoInfo}>
          <Text style={styles.repoName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.repoDescription}>{item.description}</Text>
          )}
        </View>
      </View>
      <View style={styles.repoFooter}>
        <Text style={styles.repoDate}>
          Created: {formatDate(item.createdAt)}
        </Text>
      </View>
    </CardContainer>
  );

  // Render audit log item
  const renderAuditLogItem = ({ item }) => (
    <CardContainer>
      <View style={styles.logHeader}>
        <Text style={styles.logAction}>{item.action}</Text>
        <Text style={styles.logDate}>
          {formatDate(item.createdAt)} {formatTime(item.createdAt)}
        </Text>
      </View>
      <Text style={styles.logDescription}>{item.description}</Text>
      <View style={styles.logUser}>
        <Text style={styles.logUserName}>
          By {item.user.firstName} {item.user.lastName}
        </Text>
      </View>
    </CardContainer>
  );

  // Render repositories tab
  const renderRepositoriesTab = () => {
    if (!currentOrganization?.repositories?.length) {
      return (
        <EmptyState
          icon="git-branch"
          title="No Repositories"
          message="This organization doesn't have any repositories yet"
          action={{
            label: "Create Repository",
            onPress: () =>
              navigation.getParent()?.navigate("Repositories", {
                screen: "CreateRepository",
                params: { organizationId: id },
              }),
          }}
        />
      );
    }

    return (
      <FlatList
        data={currentOrganization.repositories}
        renderItem={renderRepositoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />
    );
  };

  // Render audit logs tab
  const renderLogsTab = () => {
    if (logsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading audit logs...</Text>
        </View>
      );
    }

    if (logsError) {
      return <ErrorMessage message={logsError} />;
    }

    if (!auditLogs.length) {
      return (
        <EmptyState
          icon="document-text-outline"
          title="No Audit Logs"
          message="There are no audit logs for this organization yet"
        />
      );
    }

    return (
      <FlatList
        data={auditLogs}
        renderItem={renderAuditLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />
    );
  };

  if (orgLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading organization...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (orgError) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message={orgError} />
      </SafeAreaView>
    );
  }

  if (!currentOrganization) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorMessage message="Organization not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing.current}
            onRefresh={handleRefresh}
            colors={["#FF7B00"]}
            tintColor="#FF7B00"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.orgIcon}>
            <Text style={styles.orgIconText}>
              {currentOrganization.name.charAt(0)}
            </Text>
          </View>
          <Text style={styles.orgName}>{currentOrganization.name}</Text>
          <Text style={styles.orgDate}>
            Created: {formatDate(currentOrganization.createdAt)}
          </Text>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "repositories" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("repositories")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "repositories" && styles.activeTabButtonText,
              ]}
            >
              Repositories
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "logs" && styles.activeTabButton,
            ]}
            onPress={() => handleTabChange("logs")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === "logs" && styles.activeTabButtonText,
              ]}
            >
              Audit Logs
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "repositories"
          ? renderRepositoriesTab()
          : renderLogsTab()}
      </ScrollView>

      {activeTab === "repositories" && (
        <View style={styles.actionButton}>
          <LinearGradientButton
            onPress={() =>
              navigation.getParent()?.navigate("Repositories", {
                screen: "CreateRepository",
                params: { organizationId: id },
              })
            }
            text="Create Repository"
            icon="add-circle-outline"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  orgIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF7B00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  orgIconText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  orgName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  orgDate: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#1E2435",
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "#2D3548",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9DA5BD",
    fontFamily: "Inter-SemiBold",
  },
  activeTabButtonText: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  repoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  repoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  repoInfo: {
    flex: 1,
  },
  repoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  repoDescription: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
    marginTop: 4,
  },
  repoFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2D3548",
    paddingTop: 12,
  },
  repoDate: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logAction: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  logDate: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  logDescription: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    marginBottom: 12,
  },
  logUser: {
    borderTopWidth: 1,
    borderTopColor: "#2D3548",
    paddingTop: 12,
  },
  logUserName: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  actionButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
  },
});

export default OrganizationDetailScreen;
