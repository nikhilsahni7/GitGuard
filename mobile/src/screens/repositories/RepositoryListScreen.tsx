import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { CompositeNavigationProp } from "@react-navigation/native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LinearGradientButton from "../../components/LinearGradientButton";
import type {
  MainTabParamList,
  RepositoryStackParamList,
} from "../../navigation";
import type { Repository } from "../../services/repositoryService";
import { useRepositoryStore } from "../../store";
import {
  fontScale,
  horizontalScale,
  verticalScale,
} from "../../utils/responsive";

// Define the navigation type for proper typing
type RepositoryListScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<RepositoryStackParamList, "RepositoryList">,
  StackNavigationProp<MainTabParamList>
>;

// Filter categories
const filterOptions = [
  { id: "all", label: "All" },
  { id: "github", label: "GitHub" },
  { id: "gitlab", label: "GitLab" },
  { id: "bitbucket", label: "Bitbucket" },
];

// Access level filter options
const accessLevelOptions = [
  { id: "all", label: "All Access" },
  { id: "admin", label: "Admin" },
  { id: "contributor", label: "Contributor" },
  { id: "viewer", label: "Viewer" },
];

const RepositoryListScreen = () => {
  const navigation = useNavigation<RepositoryListScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProviderFilter, setActiveProviderFilter] = useState("all");
  const [activeAccessFilter, setActiveAccessFilter] = useState("all");
  const refreshing = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();

  // Get repositories from store - using individual selectors to avoid object recreation
  const repositories = useRepositoryStore((state) => state.repositories);
  const isLoading = useRepositoryStore((state) => state.isLoading);
  const error = useRepositoryStore((state) => state.error);
  const roleAssignments = useRepositoryStore((state) => state.roleAssignments);
  const pagination = useRepositoryStore((state) => state.pagination);
  const fetchRepositories = useRepositoryStore(
    (state) => state.fetchRepositories
  );
  const fetchAllRepositories = useRepositoryStore(
    (state) => state.fetchAllRepositories
  );

  // Load repositories when the screen is focused
  useFocusEffect(
    useCallback(() => {
      // Fetch all repositories including those the user doesn't have access to
      fetchAllRepositories(1, 20, true);
    }, [fetchAllRepositories])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;
    fetchAllRepositories(1, 20, true).finally(() => {
      refreshing.current = false;
    });
  }, [fetchAllRepositories]);

  // Handle end of list reached for pagination
  const handleEndReached = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      fetchAllRepositories(pagination.page + 1, pagination.limit, true);
    }
  }, [isLoading, pagination, fetchAllRepositories]);

  // Filter repositories based on search query and active filters
  const filteredRepositories = repositories.filter((repo) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false);

    // Provider filter
    let matchesProviderFilter = true;
    if (activeProviderFilter === "github") {
      matchesProviderFilter = repo.gitProvider === "GITHUB";
    } else if (activeProviderFilter === "gitlab") {
      matchesProviderFilter = repo.gitProvider === "GITLAB";
    } else if (activeProviderFilter === "bitbucket") {
      matchesProviderFilter = repo.gitProvider === "BITBUCKET";
    }

    // For now, we don't have direct access information in the repository object
    // We would need to map this from roleAssignments - will be implemented later
    let matchesAccessFilter = true;

    return matchesSearch && matchesProviderFilter && matchesAccessFilter;
  });

  // Get provider icon based on git provider
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

  // Animation values for the header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 60],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp",
  });

  // Render repository item
  const renderRepositoryItem = ({ item }: { item: Repository }) => {
    // Check if the repository needs permission (limited information available)
    const needsPermission = item.description?.includes(
      "You don't have access to view this repository"
    );

    return (
      <CardContainer
        onPress={() => {
          if (needsPermission) {
            // Fix navigation to the access request screen via tab navigator
            navigation.navigate("AccessRequestsTab", {
              screen: "CreateAccessRequest",
              params: { repositoryId: item.id },
            });
          } else {
            navigation.navigate("RepositoryDetail", { id: item.id });
          }
        }}
      >
        <View style={styles.repoHeader}>
          <View
            style={[
              styles.repoIcon,
              {
                backgroundColor: getProviderColor(item.gitProvider),
              },
            ]}
          >
            <MaterialCommunityIcons
              name={getProviderIcon(item.gitProvider)}
              size={fontScale(18)}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.repoInfo}>
            <View style={styles.repoNameContainer}>
              <Text style={styles.repoName}>{item.name}</Text>
              {needsPermission && (
                <View style={styles.permissionBadge}>
                  <Text style={styles.permissionBadgeText}>
                    Needs Permission
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.repoDescription}>
              {needsPermission
                ? "You need permission to access this repository"
                : item.description || "No description"}
            </Text>
          </View>
        </View>

        {needsPermission ? (
          <TouchableOpacity
            style={styles.requestAccessButton}
            onPress={() =>
              // Fix navigation to the access request screen via tab navigator
              navigation.navigate("AccessRequestsTab", {
                screen: "CreateAccessRequest",
                params: { repositoryId: item.id },
              })
            }
          >
            <Ionicons name="key-outline" size={fontScale(18)} color="#FFFFFF" />
            <Text style={styles.requestAccessText}>Request Access</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.repoFooter}>
            <View style={styles.repoMetadata}>
              <Text style={styles.timestampText}>
                Created {formatDate(item.createdAt)}
              </Text>
            </View>
            <View style={styles.actionButton}>
              <Ionicons
                name="chevron-forward"
                size={fontScale(16)}
                color="#BDC3D8"
              />
            </View>
          </View>
        )}
      </CardContainer>
    );
  };

  // Get repository color based on provider
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

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading repositories...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        icon="git-branch"
        title="No Repositories Found"
        message={
          searchQuery
            ? `No repositories match "${searchQuery}"`
            : "Add your first repository to get started"
        }
        action={{
          label: "Add Repository",
          onPress: () =>
            navigation.navigate({
              name: "CreateRepository",
              params: {},
            }),
        }}
      />
    );
  };

  // Render header component for FlatList
  const renderHeader = () => (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: headerHeight,
            opacity: headerOpacity,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Repositories</Text>
        <Text style={styles.headerSubtitle}>
          Manage your repositories and access controls
        </Text>
      </Animated.View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={fontScale(20)}
            color="#BDC3D8"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search repositories..."
            placeholderTextColor="#BDC3D8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={fontScale(20)}
                color="#BDC3D8"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={activeProviderFilter === item.id}
              onPress={() => setActiveProviderFilter(item.id)}
              style={[
                styles.filterChip,
                activeProviderFilter === item.id && styles.activeFilterChip,
              ]}
              textStyle={[
                styles.filterChipText,
                activeProviderFilter === item.id && styles.activeFilterChipText,
              ]}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={accessLevelOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Chip
              selected={activeAccessFilter === item.id}
              onPress={() => setActiveAccessFilter(item.id)}
              style={[
                styles.filterChip,
                activeAccessFilter === item.id && styles.activeFilterChip,
              ]}
              textStyle={[
                styles.filterChipText,
                activeAccessFilter === item.id && styles.activeFilterChipText,
              ]}
            >
              {item.label}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {error && <ErrorMessage message={error} />}
    </>
  );

  // Render footer component for FlatList (loading indicator for pagination)
  const renderFooter = () => {
    if (!isLoading || repositories.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FF7B00" />
        <Text style={styles.footerText}>Loading more repositories...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.addButtonContainer}>
        <LinearGradientButton
          onPress={() =>
            navigation.navigate({
              name: "CreateRepository",
              params: {},
            })
          }
          text="Add Repository"
          icon="add-circle-outline"
          textSize={16}
          height={56}
          borderRadius={16}
        />
      </View>

      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={filteredRepositories}
        renderItem={renderRepositoryItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing.current}
            onRefresh={handleRefresh}
            colors={["#FF7B00"]}
            tintColor="#FF7B00"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  headerContainer: {
    paddingHorizontal: horizontalScale(16),
    justifyContent: "center",
    marginBottom: verticalScale(8),
  },
  headerTitle: {
    fontSize: fontScale(28),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  headerSubtitle: {
    fontSize: fontScale(14),
    color: "#BDC3D8",
    marginTop: verticalScale(4),
    fontFamily: "Inter-Regular",
  },
  listContainer: {
    paddingBottom: verticalScale(100),
  },
  searchContainer: {
    paddingHorizontal: horizontalScale(16),
    marginBottom: verticalScale(16),
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E2435",
    borderRadius: 12,
    paddingHorizontal: horizontalScale(12),
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: "#2D3548",
  },
  searchIcon: {
    marginRight: horizontalScale(8),
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: fontScale(16),
    height: "100%",
    fontFamily: "Inter-Regular",
  },
  filterContainer: {
    marginBottom: verticalScale(16),
  },
  filterList: {
    paddingHorizontal: horizontalScale(16),
  },
  filterChip: {
    marginRight: horizontalScale(8),
    backgroundColor: "#1E2435",
    borderColor: "#2D3548",
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: "rgba(255, 123, 0, 0.2)",
    borderColor: "#FF7B00",
  },
  filterChipText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    fontSize: fontScale(14),
  },
  activeFilterChipText: {
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
  repoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
  },
  repoIcon: {
    width: horizontalScale(36),
    height: verticalScale(36),
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#24292E",
    marginRight: horizontalScale(12),
  },
  repoInfo: {
    flex: 1,
  },
  repoNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  repoName: {
    fontSize: fontScale(16),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    marginBottom: verticalScale(4),
  },
  repoDescription: {
    fontSize: fontScale(14),
    color: "#BDC3D8",
    marginBottom: verticalScale(12),
    fontFamily: "Inter-Regular",
  },
  repoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: verticalScale(4),
  },
  repoMetadata: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestampText: {
    fontSize: fontScale(12),
    color: "#BDC3D8",
    fontFamily: "Inter-Regular",
  },
  actionButton: {
    width: horizontalScale(24),
    height: verticalScale(24),
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    paddingVertical: verticalScale(40),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: verticalScale(12),
    fontSize: fontScale(14),
    color: "#BDC3D8",
    fontFamily: "Inter-Regular",
  },
  footerContainer: {
    paddingVertical: verticalScale(20),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    marginLeft: horizontalScale(8),
    fontSize: fontScale(14),
    color: "#BDC3D8",
    fontFamily: "Inter-Regular",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: verticalScale(24),
    left: horizontalScale(24),
    right: horizontalScale(24),
    zIndex: 10,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionBadge: {
    paddingHorizontal: horizontalScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FF7B00",
    backgroundColor: "rgba(255, 123, 0, 0.15)",
    marginLeft: horizontalScale(8),
    marginBottom: verticalScale(4),
  },
  permissionBadgeText: {
    fontSize: fontScale(10),
    fontWeight: "600",
    color: "#FF7B00",
    fontFamily: "Inter-SemiBold",
  },
  requestAccessButton: {
    padding: verticalScale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF7B00",
    borderRadius: 8,
    marginTop: verticalScale(8),
  },
  requestAccessText: {
    marginLeft: horizontalScale(8),
    fontSize: fontScale(14),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
});

export default RepositoryListScreen;
