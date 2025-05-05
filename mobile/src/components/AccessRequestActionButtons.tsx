import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useAccessRequestStore } from "../store";

interface AccessRequestActionButtonsProps {
  accessRequestId: string;
  biometricToken: string | null;
  onComplete?: () => void;
}

const AccessRequestActionButtons: React.FC<AccessRequestActionButtonsProps> = ({
  accessRequestId,
  biometricToken,
  onComplete,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { approveAccessRequest, rejectAccessRequest } = useAccessRequestStore();
  const navigation = useNavigation();

  // Check if biometric authentication is available
  const checkBiometricAvailability = async () => {
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return available && enrolled;
    } catch (error) {
      console.error("Error checking biometric availability:", error);
      return false;
    }
  };

  // Handle approval
  const handleApprove = async () => {
    try {
      setIsProcessing(true);

      // Check for biometric availability
      const biometricAvailable = await checkBiometricAvailability();

      // Get stored biometric token from AsyncStorage directly
      const storedToken = await AsyncStorage.getItem("biometric_token");
      console.log("Retrieved biometric token for approval:", !!storedToken);

      // Use stored token if available, otherwise check if biometricToken from props is available
      const tokenToUse = storedToken || biometricToken;

      if (!tokenToUse) {
        Alert.alert(
          "Authentication Error",
          "No biometric token available. Please set up biometric authentication in your profile settings first."
        );
        setIsProcessing(false);
        return;
      }

      if (biometricAvailable) {
        // Authenticate with biometrics
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Verify identity to approve access request",
          fallbackLabel: "Use PIN instead",
        });

        if (!result.success) {
          Alert.alert(
            "Authentication Failed",
            "Please try again to approve this request."
          );
          setIsProcessing(false);
          return;
        }

        // Complete the approval with the actual token
        await completeApproval(tokenToUse);
      } else {
        // If biometrics not available, confirm approval
        Alert.alert(
          "Biometrics Not Available",
          "Your device doesn't support biometric authentication. Continue with approval?",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setIsProcessing(false);
              },
            },
            {
              text: "Approve",
              onPress: () => completeApproval(tokenToUse),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error in approval process:", error);
      Alert.alert(
        "Error",
        "An error occurred during the approval process. Please try again."
      );
      setIsProcessing(false);
    }
  };

  // Complete the approval process
  const completeApproval = async (token: string) => {
    try {
      await approveAccessRequest(accessRequestId, token);
      Alert.alert("Success", "The access request has been approved.", [
        {
          text: "OK",
          onPress: () => {
            if (onComplete) {
              onComplete();
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Error completing approval:", error);
      Alert.alert(
        "Error",
        "Failed to approve the access request. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (showRejectInput) {
      if (!rejectionReason.trim()) {
        Alert.alert("Error", "Please provide a reason for rejection.");
        return;
      }

      try {
        setIsProcessing(true);
        await rejectAccessRequest(accessRequestId, rejectionReason);
        Alert.alert("Success", "The access request has been rejected.", [
          {
            text: "OK",
            onPress: () => {
              if (onComplete) {
                onComplete();
              } else {
                navigation.goBack();
              }
            },
          },
        ]);
      } catch (error) {
        console.error("Error rejecting request:", error);
        Alert.alert(
          "Error",
          "Failed to reject the access request. Please try again."
        );
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowRejectInput(true);
    }
  };

  return (
    <View style={styles.container}>
      {showRejectInput ? (
        <View style={styles.rejectInputContainer}>
          <TextInput
            label="Reason for rejection"
            value={rejectionReason}
            onChangeText={setRejectionReason}
            mode="outlined"
            style={styles.rejectInput}
            multiline
            numberOfLines={3}
            theme={{ colors: { primary: "#FF7B00" } }}
          />
          <View style={styles.rejectButtonsRow}>
            <TouchableOpacity
              style={[styles.buttonSmall, styles.cancelButton]}
              onPress={() => setShowRejectInput(false)}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonSmall, styles.confirmButton]}
              onPress={handleReject}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Confirm Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApprove}
            disabled={isProcessing}
            style={styles.approveButtonContainer}
          >
            <LinearGradient
              colors={["#FF7B00", "#FF5500"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.approveButton}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Approve</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  buttonSmall: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  approveButtonContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
  },
  rejectInputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  rejectInput: {
    marginBottom: 16,
    backgroundColor: "#1E2435",
  },
  rejectButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  confirmButton: {
    backgroundColor: "#EF4444",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6E6E6E",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
});

export default AccessRequestActionButtons;
