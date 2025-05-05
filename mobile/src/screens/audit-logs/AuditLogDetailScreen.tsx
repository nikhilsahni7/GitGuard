import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardContainer from "../../components/CardContainer";
import ErrorMessage from "../../components/ErrorMessage";
import { AuditLogStackParamList } from "../../navigation";
import { useAuditLogStore } from "../../store/auditLogStore";

type AuditLogDetailScreenRouteProp = RouteProp<
  AuditLogStackParamList,
  "AuditLogDetail"
>;

type AuditLogDetailScreenNavigationProp =
  StackNavigationProp<AuditLogStackParamList>;

const AuditLogDetailScreen = () => {
  const route = useRoute<AuditLogDetailScreenRouteProp>();
  const navigation = useNavigation<AuditLogDetailScreenNavigationProp>();
  const { id } = route.params;

  // Get audit log data from store
  const { currentAuditLog, isLoading, error, fetchAuditLog } =
    useAuditLogStore();

  // Load audit log when screen mounts
  useEffect(() => {
    fetchAuditLog(id);
  }, [id, fetchAuditLog]);

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
      second: "2-digit",
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
    return "document-text-outline";
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

  // Render JSON metadata in a readable format
  const renderMetadata = (metadata: Record<string, any> | null) => {
    if (!metadata) return null;

    return (
      <View style={styles.metadataContainer}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        {Object.entries(metadata).map(([key, value]) => (
          <View key={key} style={styles.metadataItem}>
            <Text style={styles.metadataKey}>{key}</Text>
            <Text style={styles.metadataValue}>
              {typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF7B00" />
          <Text style={styles.loadingText}>Loading audit log...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ErrorMessage message={error} />
      </SafeAreaView>
    );
  }

  // No audit log found
  if (!currentAuditLog) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ErrorMessage message="Audit log not found" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Audit Log Details</Text>
        </View>

        <CardContainer style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: getActionColor(currentAuditLog.action),
                },
              ]}
            >
              <Ionicons
                name={getActionIcon(currentAuditLog.action)}
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionText}>{currentAuditLog.action}</Text>
              <Text style={styles.actionDate}>
                {formatDateTime(currentAuditLog.createdAt)}
              </Text>
            </View>
          </View>
        </CardContainer>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <CardContainer>
            <Text style={styles.descriptionText}>
              {currentAuditLog.description}
            </Text>
          </CardContainer>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Details</Text>
          <CardContainer>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Entity Type</Text>
              <Text style={styles.detailValue}>
                {currentAuditLog.entityType}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Entity ID</Text>
              <Text style={styles.detailValue}>{currentAuditLog.entityId}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Performed By</Text>
              <Text style={styles.detailValue}>
                {`${currentAuditLog.user.firstName} ${currentAuditLog.user.lastName}`}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>
                {currentAuditLog.user.email}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IP Address</Text>
              <Text style={styles.detailValue}>
                {currentAuditLog.ipAddress}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>User Agent</Text>
              <Text style={styles.detailValue} numberOfLines={2}>
                {currentAuditLog.userAgent}
              </Text>
            </View>
          </CardContainer>
        </View>

        {currentAuditLog.metadata && renderMetadata(currentAuditLog.metadata)}
      </ScrollView>
    </SafeAreaView>
  );
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
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 16,
    fontFamily: "Inter-Regular",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    marginRight: 16,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
  },
  actionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    fontFamily: "Inter-SemiBold",
  },
  actionDate: {
    fontSize: 14,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
  },
  sectionContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    fontFamily: "Inter-SemiBold",
  },
  descriptionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
    fontFamily: "Inter-Regular",
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#9DA5BD",
    marginBottom: 4,
    fontFamily: "Inter-Regular",
  },
  detailValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
  metadataContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  metadataItem: {
    backgroundColor: "#1E2435",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  metadataKey: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF7B00",
    marginBottom: 8,
    fontFamily: "Inter-SemiBold",
  },
  metadataValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
  },
});

export default AuditLogDetailScreen;
