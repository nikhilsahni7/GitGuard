import { create } from "zustand";
import {
  repositoryService,
  type Organization,
  type Repository,
  type RoleAssignment,
} from "../services/repositoryService";

interface RepositoryState {
  // State
  repositories: Repository[];
  currentRepository: Repository | null;
  roleAssignments: RoleAssignment[];
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  // Actions
  fetchRepositories: (
    page?: number,
    limit?: number,
    organizationId?: string,
    includeInaccessible?: boolean
  ) => Promise<void>;
  fetchAllRepositories: (
    page?: number,
    limit?: number,
    includeInaccessible?: boolean
  ) => Promise<void>;
  fetchRepository: (
    id: string,
    ignorePermissionError?: boolean
  ) => Promise<Repository>;
  createRepository: (data: {
    name: string;
    description?: string;
    gitProvider: "GITHUB" | "GITLAB" | "BITBUCKET";
    gitRepoUrl: string;
    organizationId: string;
  }) => Promise<Repository>;
  fetchRoleAssignments: (repositoryId: string) => Promise<void>;
  fetchOrganizations: () => Promise<void>;
  setCurrentRepository: (repository: Repository | null) => void;
  clearError: () => void;
}

export const useRepositoryStore = create<RepositoryState>()((set, get) => ({
  // State
  repositories: [],
  currentRepository: null,
  roleAssignments: [],
  organizations: [],
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },

  // Actions
  fetchRepositories: async (
    page = 1,
    limit = 10,
    organizationId?: string,
    includeInaccessible = false
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await repositoryService.getRepositories(
        page,
        limit,
        organizationId,
        includeInaccessible
      );
      set({
        repositories: response.repositories,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error("Repository Store: Error fetching repositories", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories",
      });
    }
  },

  fetchAllRepositories: async (
    page = 1,
    limit = 10,
    includeInaccessible = true
  ) => {
    set({ isLoading: true, error: null });
    try {
      const response = await repositoryService.getAllRepositories(
        page,
        limit,
        includeInaccessible
      );
      set({
        repositories: response.repositories,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error("Repository Store: Error fetching all repositories", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories",
      });
    }
  },

  fetchRepository: async (id, ignorePermissionError = false) => {
    set({ isLoading: true, error: null });
    try {
      const { repository } = await repositoryService.getRepository(
        id,
        ignorePermissionError
      );
      set({
        currentRepository: repository,
        isLoading: false,
      });
      return repository;
    } catch (error) {
      console.error("Repository Store: Error fetching repository", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch repository",
      });
      throw error;
    }
  },

  createRepository: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { repository } = await repositoryService.createRepository(data);

      // Update repositories list by adding the new repository
      set((state) => ({
        repositories: [repository, ...state.repositories],
        isLoading: false,
      }));

      return repository;
    } catch (error) {
      console.error("Repository Store: Error creating repository", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create repository",
      });
      throw error;
    }
  },

  fetchRoleAssignments: async (repositoryId) => {
    set({ isLoading: true, error: null });
    try {
      const { roleAssignments } =
        await repositoryService.getRoleAssignments(repositoryId);
      set({
        roleAssignments,
        isLoading: false,
      });
    } catch (error) {
      console.error("Repository Store: Error fetching role assignments", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch role assignments",
      });
    }
  },

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { organizations } = await repositoryService.getOrganizations();
      set({
        organizations,
        isLoading: false,
      });
    } catch (error) {
      console.error("Repository Store: Error fetching organizations", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch organizations",
      });
    }
  },

  setCurrentRepository: (repository) => {
    set({ currentRepository: repository });
  },

  clearError: () => {
    set({ error: null });
  },
}));
