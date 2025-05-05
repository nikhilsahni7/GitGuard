import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import LinearGradientButton from "../../components/LinearGradientButton";
import { OrganizationStackParamList } from "../../navigation";
import { useOrganizationStore } from "../../store/organizationStore";

type OrganizationListScreenNavigationProp = StackNavigationProp<
  OrganizationStackParamList,
  "OrganizationList"
>;

const OrganizationListScreen = () => {
  const navigation = useNavigation<OrganizationListScreenNavigationProp>();
  const refreshing = useRef(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");

  // Get organizations from store
  const { organizations, isLoading, error, fetchOrganizations, pagination } =
    useOrganizationStore();

  // Load organizations when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchOrganizations();
    }, [fetchOrganizations])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;
    fetchOrganizations().finally(() => {
      refreshing.current = false;
    });
  }, [fetchOrganizations]);

  // Handle pagination
  const handleEndReached = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      fetchOrganizations(pagination.page + 1);
    }
  }, [isLoading, pagination, fetchOrganizations]);

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Navigate to organization detail
  const handleOrganizationPress = (id: string) => {
    navigation.navigate("OrganizationDetail", { id });
  };

  // Render organization item
  const renderOrganizationItem = ({ item }) => (
    <CardContainer onPress={() => handleOrganizationPress(item.id)}>
      <View style={styles.orgHeader}>
        <View style={styles.orgIcon}>
          <Text style={styles.orgIconText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{item.name}</Text>
          <Text style={styles.orgDate}>
            Created: {formatDate(item.createdAt)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#9DA5BD" />
      </View>
      {item.repositories && (
        <View style={styles.repoInfo}>
          <Text style={styles.repoCount}>
            {item.repositories.length} Repositories
          </Text>
        </View>
      )}
    </CardContainer>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading organizations...</Text>
        </View>
      );
    }

    return (
      <EmptyState
        icon="business"
        title="No Organizations Found"
        message="Create your first organization to get started"
        action={{
          label: "Create Organization",
          onPress: () => navigation.navigate("CreateOrganization"),
        }}
      />
    );
  };

  // Render header
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
        <Text style={styles.headerTitle}>Organizations</Text>
        <Text style={styles.headerSubtitle}>
          Manage your organizations and their repositories
        </Text>
      </Animated.View>

      {error && <ErrorMessage message={error} />}
    </>
  );

  // Render footer for FlatList (loading indicator for pagination)
  const renderFooter = () => {
    if (!isLoading || organizations.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color="#FF7B00" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.addButtonContainer}>
        <LinearGradientButton
          onPress={() => navigation.navigate("CreateOrganization")}
          text="Create Organization"
          icon="add-circle-outline"
        />
      </View>

      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={organizations}
        renderItem={renderOrganizationItem}
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
    paddingHorizontal: 16,
    justifyContent: "center",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9DA5BD",
    marginTop: 4,
    fontFamily: "Inter-Regular",
  },
  listContainer: {
    paddingBottom: 100,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FF7B00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orgIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
  },
  orgDate: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
    marginTop: 2,
  },
  repoInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2D3548",
  },
  repoCount: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 10,
    backgroundColor: "transparent",
  },
});

export default OrganizationListScreen;
