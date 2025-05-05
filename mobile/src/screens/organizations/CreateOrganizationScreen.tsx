import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradientButton from "../../components/LinearGradientButton";
import { OrganizationStackParamList } from "../../navigation";
import { useOrganizationStore } from "../../store/organizationStore";

type CreateOrganizationScreenNavigationProp = StackNavigationProp<
  OrganizationStackParamList,
  "CreateOrganization"
>;

const CreateOrganizationScreen = () => {
  const navigation = useNavigation<CreateOrganizationScreenNavigationProp>();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganization, error } = useOrganizationStore();

  // Custom theme for TextInput to ensure text visibility
  const inputTheme = {
    colors: {
      primary: "#FF7B00",
      background: "#1E2435",
      text: "#FFFFFF",
      placeholder: "#9DA5BD",
      onSurfaceVariant: "#FFFFFF", // Label text color
      outline: "#3D4663", // Border color when not focused
    },
  };

  // Show error if any
  React.useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
    }
  }, [error]);

  // Handle create organization
  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an organization name");
      return;
    }

    try {
      setIsSubmitting(true);
      const newOrganization = await createOrganization({ name });

      // Navigate to the new organization
      navigation.replace("OrganizationDetail", { id: newOrganization.id });
    } catch (error) {
      console.error("Error creating organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Organization</Text>
            <Text style={styles.subtitle}>
              Organizations help you group repositories and manage access
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Organization Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
              theme={inputTheme}
              autoCapitalize="words"
              outlineColor="#3D4663"
              activeOutlineColor="#FF7B00"
              textColor="#FFFFFF"
              contentStyle={styles.inputContent}
            />

            <View style={styles.buttonContainer}>
              <LinearGradientButton
                onPress={handleCreate}
                text={isSubmitting ? "Creating..." : "Create Organization"}
                loading={isSubmitting}
                disabled={isSubmitting || !name.trim()}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161A28",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9DA5BD",
    fontFamily: "Inter-Regular",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: 24,
    backgroundColor: "#1E2435",
    height: 56,
  },
  inputContent: {
    paddingVertical: 8,
    color: "#FFFFFF",
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default CreateOrganizationScreen;
