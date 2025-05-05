import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Chip } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import EmptyState from "../../components/EmptyState";
import ErrorMessage from "../../components/ErrorMessage";
import { AuditLogStackParamList } from "../../navigation";
import { AuditLog } from "../../services/auditLogService";
import { useAuditLogStore } from "../../store/auditLogStore";

type AuditLogScreenNavigationProp = StackNavigationProp<AuditLogStackParamList>;

// Action type filters
const actionFilters = [
  { id: "all", label: "All Actions" },
  { id: "ACCESS_REQUEST", label: "Access Requests" },
  { id: "REPOSITORY", label: "Repositories" },
  { id: "USER", label: "Users" },
  { id: "ROLE", label: "Roles" },
];

// Entity type filters
const entityFilters = [
  { id: "all", label: "All Entities" },
  { id: "access_request", label: "Access Requests" },
  { id: "repository", label: "Repositories" },
  { id: "user", label: "Users" },
  { id: "role", label: "Roles" },
];

const AuditLogScreen = () => {
  const navigation = useNavigation<AuditLogScreenNavigationProp>();
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const refreshing = useRef(false);

  // Get audit logs from store
  const {
    auditLogs,
    isLoading,
    error,
    fetchAuditLogs,
    pagination,
    setFilters,
    clearFilters,
  } = useAuditLogStore();

  // Load audit logs when screen is focused
  useFocusEffect(
    useCallback(() => {
      const filters: any = {};

      if (actionFilter !== "all") {
        filters.action = actionFilter;
      }

      if (entityFilter !== "all") {
        filters.entityType = entityFilter;
      }

      if (Object.keys(filters).length > 0) {
        setFilters(filters);
      } else {
        clearFilters();
      }
    }, [fetchAuditLogs, actionFilter, entityFilter, setFilters, clearFilters])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    refreshing.current = true;

    const filters: any = {};
    if (actionFilter !== "all") {
      filters.action = actionFilter;
    }
    if (entityFilter !== "all") {
      filters.entityType = entityFilter;
    }

    if (Object.keys(filters).length > 0) {
      setFilters(filters);
    } else {
      clearFilters();
    }

    refreshing.current = false;
  }, [actionFilter, entityFilter, setFilters, clearFilters]);

  // Handle end of list reached for pagination
  const handleEndReached = useCallback(() => {
    if (!isLoading && pagination.page < pagination.pages) {
      fetchAuditLogs(pagination.page + 1, pagination.limit);
    }
  }, [isLoading, pagination, fetchAuditLogs]);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get icon for audit log action
  const getActionIcon = (action: string) => {
    if (action.includes("CREATE")) return "add-circle-outline";
    if (action.includes("UPDATE")) return "pencil-outline";
    if (action.includes("DELETE")) return "trash-outline";
    if (action.includes("ACCESS")) return "key-outline";
    if (action.includes("LOGIN")) return "log-in-outline";
    if (action.includes("APPROVE")) return "checkmark-circle-outline";
    if (action.includes("REJECT")) return "close-circle-outline";
    return "document-outline";
  };

  // Get color for audit log action
  const getActionColor = (action: string) => {
    if (action.includes("CREATE")) return "#4CAF50";
    if (action.includes("UPDATE")) return "#2196F3";
    if (action.includes("DELETE")) return "#F44336";
    if (action.includes("ACCESS")) return "#FF9800";
    if (action.includes("LOGIN")) return "#9C27B0";
    if (action.includes("APPROVE")) return "#4CAF50";
    if (action.includes("REJECT")) return "#F44336";
    return "#607D8B";
  };

  // Render audit log item
  const renderAuditLogItem = ({ item }: { item: AuditLog }) => (
    <CardContainer>
      <View style={styles.logHeader}>
        <View style={styles.actionContainer}>
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: getActionColor(item.action) },
            ]}
          >
            <Ionicons
              name={getActionIcon(item.action)}
              size={16}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
        <Text style={styles.logDate}>{formatDateTime(item.createdAt)}</Text>
      </View>

      <Text style={styles.logDescription}>{item.description}</Text>

      <View style={styles.logFooter}>
        <Text style={styles.entityLabel}>
          {item.entityType}: {item.entityId.substring(0, 8)}...
        </Text>
        <Text style={styles.userInfo}>
          By {item.user.firstName} {item.user.lastName}
        </Text>
      </View>
    </CardContainer>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <EmptyState
        icon="document-outline"
        title="No Audit Logs"
        message="There are no audit logs matching your filters"
        action={{
          label: "Clear Filters",
          onPress: () => {
            setActionFilter("all");
            setEntityFilter("all");
            clearFilters();
          },
        }}
      />
    );
  };

  // Render filter chip
  const renderFilterChip = (
    id: string,
    label: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <Chip
      selected={selected}
      style={[styles.filterChip, selected ? styles.selectedFilterChip : null]}
      textStyle={[
        styles.filterChipText,
        selected ? styles.selectedFilterChipText : null,
      ]}
      onPress={onPress}
    >
      {label}
    </Chip>
  );

  // Render action filter
  const renderActionFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersLabel}>Action Type</Text>
      <FlatList
        data={actionFilters}
        renderItem={({ item }) =>
          renderFilterChip(item.id, item.label, actionFilter === item.id, () =>
            setActionFilter(item.id)
          )
        }
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersListContent}
      />
    </View>
  );

  // Render entity filter
  const renderEntityFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersLabel}>Entity Type</Text>
      <FlatList
        data={entityFilters}
        renderItem={({ item }) =>
          renderFilterChip(item.id, item.label, entityFilter === item.id, () =>
            setEntityFilter(item.id)
          )
        }
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersListContent}
      />
    </View>
  );

  // Render loading footer
  const renderFooter = () => {
    if (!isLoading || auditLogs.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#FF7B00" />
        <Text style={styles.footerText}>Loading more logs...</Text>
      </View>
    );
  };

  // Main render
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Audit Logs</Text>
      </View>

      {renderActionFilters()}
      {renderEntityFilters()}

      {error ? (
        <ErrorMessage message={error} />
      ) : (
        <FlatList
          data={auditLogs}
          renderItem={renderAuditLogItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing.current}
              onRefresh={handleRefresh}
              colors={["#FF7B00"]}
              tintColor="#FF7B00"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  headerContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  filtersContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  filtersLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    fontFamily: "Inter-SemiBold",
  },
  filtersListContent: {
    paddingRight: 16,
  },
  filterChip: {
    marginRight: 8,
    backgroundColor: "#1E2435",
    borderColor: "#3D4663",
    borderWidth: 1,
    height: 36,
    paddingHorizontal: 12,
  },
  selectedFilterChip: {
    backgroundColor: "#FF7B0020",
    borderColor: "#FF7B00",
  },
  filterChipText: {
    color: "#FFFFFF",
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  selectedFilterChipText: {
    color: "#FF7B00",
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
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
    fontSize: 15,
    color: "#FFFFFF",
    marginBottom: 12,
    fontFamily: "Inter-Regular",
    lineHeight: 22,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#2D3548",
    paddingTop: 12,
  },
  entityLabel: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  userInfo: {
    fontSize: 12,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
});

export default AuditLogScreen;
