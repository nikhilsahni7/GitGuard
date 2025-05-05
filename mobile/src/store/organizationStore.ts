import { create } from "zustand";
import {
  Organization,
  organizationService,
} from "../services/organizationService";

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  // Actions
  fetchOrganizations: (page?: number, limit?: number) => Promise<void>;
  fetchOrganization: (id: string) => Promise<void>;
  createOrganization: (data: { name: string }) => Promise<Organization>;
  updateOrganization: (
    id: string,
    data: { name: string }
  ) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  setCurrentOrganization: (organization: Organization | null) => void;
  clearError: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  // State
  organizations: [],
  currentOrganization: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },

  // Actions
  fetchOrganizations: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await organizationService.getOrganizations(page, limit);
      set({
        organizations: response.organizations,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error("Organization Store: Error fetching organizations", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch organizations",
      });
    }
  },

  fetchOrganization: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { organization } = await organizationService.getOrganization(id);
      set({
        currentOrganization: organization,
        isLoading: false,
      });
    } catch (error) {
      console.error("Organization Store: Error fetching organization", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch organization",
      });
    }
  },

  createOrganization: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const { organization } =
        await organizationService.createOrganization(data);

      // Update organizations list
      set((state) => ({
        organizations: [organization, ...state.organizations],
        isLoading: false,
      }));

      return organization;
    } catch (error) {
      console.error("Organization Store: Error creating organization", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create organization",
      });
      throw error;
    }
  },

  updateOrganization: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const { organization } = await organizationService.updateOrganization(
        id,
        data
      );

      // Update organizations list and current organization if it's the one being updated
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.id === id ? organization : org
        ),
        currentOrganization:
          state.currentOrganization?.id === id
            ? organization
            : state.currentOrganization,
        isLoading: false,
      }));

      return organization;
    } catch (error) {
      console.error("Organization Store: Error updating organization", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update organization",
      });
      throw error;
    }
  },

  deleteOrganization: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await organizationService.deleteOrganization(id);

      // Remove organization from list and clear current organization if it's the one being deleted
      set((state) => ({
        organizations: state.organizations.filter((org) => org.id !== id),
        currentOrganization:
          state.currentOrganization?.id === id
            ? null
            : state.currentOrganization,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Organization Store: Error deleting organization", error);
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete organization",
      });
      throw error;
    }
  },

  setCurrentOrganization: (organization) => {
    set({ currentOrganization: organization });
  },

  clearError: () => {
    set({ error: null });
  },
}));
