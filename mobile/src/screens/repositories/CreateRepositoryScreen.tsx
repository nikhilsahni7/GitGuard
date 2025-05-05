import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { DefaultTheme, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradientButton from "../../components/LinearGradientButton";
import { Picker } from "../../components/Picker";
import { RepositoryStackParamList } from "../../navigation";
import { useOrganizationStore } from "../../store/organizationStore";
import { useRepositoryStore } from "../../store/repositoryStore";
import { GitProvider } from "../../types";
import {
  fontScale,
  horizontalScale,
  verticalScale,
} from "../../utils/responsive";

type CreateRepositoryScreenRouteProp = RouteProp<
  RepositoryStackParamList,
  "CreateRepository"
>;

type CreateRepositoryScreenNavigationProp =
  StackNavigationProp<RepositoryStackParamList>;

// Git provider options with proper typing
const gitProviderOptions = [
  { label: "GitHub", value: "GITHUB" as GitProvider },
  { label: "GitLab", value: "GITLAB" as GitProvider },
  { label: "Bitbucket", value: "BITBUCKET" as GitProvider },
];

// Custom theme for text inputs
const inputTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF7B00",
    background: "#1E2435",
    text: "#FFFFFF",
    placeholder: "#BDC3D8",
    surface: "#1E2435",
    accent: "#FF7B00",
    disabled: "#2D3548",
    error: "#E74C3C",
  },
  roundness: 8,
  dark: true,
};

const CreateRepositoryScreen = () => {
  const route = useRoute<CreateRepositoryScreenRouteProp>();
  const navigation = useNavigation<CreateRepositoryScreenNavigationProp>();
  const { organizationId } = route.params || {};

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gitProvider, setGitProvider] = useState<GitProvider | "">("");
  const [gitRepoUrl, setGitRepoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | undefined
  >(organizationId);
  const [organizationOptions, setOrganizationOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const { createRepository, error: repoError } = useRepositoryStore();
  const {
    organizations,
    fetchOrganizations,
    error: orgError,
  } = useOrganizationStore();

  // Load organizations if none is selected
  useEffect(() => {
    if (!organizationId) {
      fetchOrganizations();
    }
  }, [fetchOrganizations, organizationId]);

  // Set organization options when loaded
  useEffect(() => {
    if (organizations.length > 0) {
      const options = organizations.map((org) => ({
        label: org.name,
        value: org.id,
      }));
      setOrganizationOptions(options);

      // If none is selected yet, select the first one
      if (!selectedOrganizationId && options.length > 0) {
        setSelectedOrganizationId(options[0].value);
      }
    }
  }, [organizations, selectedOrganizationId]);

  // Show error if any
  useEffect(() => {
    if (repoError) {
      Alert.alert("Error", repoError);
    }
    if (orgError) {
      Alert.alert("Error", orgError);
    }
  }, [repoError, orgError]);

  // Handle create repository
  const handleCreate = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a repository name");
      return;
    }

    if (!gitProvider) {
      Alert.alert("Error", "Please select a Git provider");
      return;
    }

    if (!gitRepoUrl.trim()) {
      Alert.alert("Error", "Please enter a Git repository URL");
      return;
    }

    if (!selectedOrganizationId) {
      Alert.alert("Error", "Please select an organization");
      return;
    }

    try {
      setIsSubmitting(true);

      await createRepository({
        name,
        description: description.trim() || undefined,
        gitProvider,
        gitRepoUrl,
        organizationId: selectedOrganizationId,
      });

      // Navigate back to the organization detail or repository list
      if (organizationId) {
        // We need to go back to the main tab and then navigate to organizations
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "RepositoryList" }],
          })
        );

        // Wait a bit before navigating to other tab
        setTimeout(() => {
          navigation.getParent()?.navigate("Organizations", {
            screen: "OrganizationDetail",
            params: { id: organizationId },
          });
        }, 100);
      } else {
        navigation.navigate("RepositoryList");
      }
    } catch (error) {
      console.error("Error creating repository:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProviderChange = (value: string | number) => {
    setGitProvider(String(value) as GitProvider);
  };

  const handleOrganizationChange = (value: string | number) => {
    setSelectedOrganizationId(String(value));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Repository</Text>
            <Text style={styles.subtitle}>
              Add a new repository to your organization
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.inputLabel}>Repository Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Repository name"
                placeholderTextColor="#8F98AD"
                mode="outlined"
                theme={inputTheme}
                outlineColor="#2D3548"
                activeOutlineColor="#FF7B00"
                selectionColor="#FF7B00"
                textColor="#FFFFFF"
                underlineColor="transparent"
                underlineColorAndroid="transparent"
              />
            </View>

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                placeholder="Add a description"
                placeholderTextColor="#8F98AD"
                mode="outlined"
                multiline
                numberOfLines={3}
                theme={inputTheme}
                outlineColor="#2D3548"
                activeOutlineColor="#FF7B00"
                selectionColor="#FF7B00"
                textColor="#FFFFFF"
                underlineColor="transparent"
                underlineColorAndroid="transparent"
              />
            </View>

            <Text style={styles.inputLabel}>Git Provider</Text>
            <Picker
              items={gitProviderOptions}
              value={gitProvider}
              onValueChange={handleProviderChange}
              placeholder="Select Git Provider"
            />

            <Text style={styles.inputLabel}>Git Repository URL</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={gitRepoUrl}
                onChangeText={setGitRepoUrl}
                style={styles.input}
                placeholder="https://github.com/username/repo"
                placeholderTextColor="#8F98AD"
                mode="outlined"
                theme={inputTheme}
                outlineColor="#2D3548"
                activeOutlineColor="#FF7B00"
                selectionColor="#FF7B00"
                textColor="#FFFFFF"
                keyboardType="url"
                autoCapitalize="none"
                underlineColor="transparent"
                underlineColorAndroid="transparent"
              />
            </View>

            {!organizationId && (
              <>
                <Text style={styles.inputLabel}>Organization</Text>
                <Picker
                  placeholder="Select an organization"
                  items={organizations.map((org) => ({
                    label: org.name,
                    value: org.id,
                  }))}
                  value={selectedOrganizationId}
                  onValueChange={handleOrganizationChange}
                />
              </>
            )}

            <View style={styles.buttonContainer}>
              <LinearGradientButton
                onPress={handleCreate}
                text={isSubmitting ? "Creating..." : "Create Repository"}
                loading={isSubmitting}
                disabled={
                  isSubmitting ||
                  !name.trim() ||
                  !gitProvider ||
                  !gitRepoUrl.trim() ||
                  !selectedOrganizationId
                }
                height={56}
                textSize={16}
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
  content: {
    flex: 1,
    padding: horizontalScale(24),
  },
  header: {
    marginBottom: verticalScale(32),
  },
  title: {
    fontSize: fontScale(28),
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter-Bold",
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-Regular",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    marginBottom: verticalScale(8),
  },
  inputWrapper: {
    marginBottom: verticalScale(20),
  },
  input: {
    backgroundColor: "#1E2435",
    fontSize: fontScale(16),
    height: verticalScale(56),
    color: "#FFFFFF",
    borderWidth: 0,
  },
  textArea: {
    minHeight: verticalScale(100),
    textAlignVertical: "top",
  },
  dropdownLabel: {
    fontSize: fontScale(16),
    color: "#FFFFFF",
    fontFamily: "Inter-SemiBold",
    marginBottom: verticalScale(8),
  },
  buttonContainer: {
    marginTop: verticalScale(24),
    marginBottom: verticalScale(16),
  },
});

export default CreateRepositoryScreen;
