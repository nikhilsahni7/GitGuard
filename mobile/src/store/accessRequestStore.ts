import { create } from "zustand";
import {
  accessRequestService,
  type AccessRequest,
} from "../services/accessRequestService";

interface AccessRequestState {
  // State
  accessRequests: AccessRequest[];
  currentAccessRequest: AccessRequest | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };

  // Actions
  fetchAccessRequests: (
    page?: number,
    limit?: number,
    status?: string,
    type?: "pending" | "approved" | "rejected" | "all",
    role?: "requester" | "approver"
  ) => Promise<void>;
  fetchAccessRequest: (id: string) => Promise<void>;
  createAccessRequest: (data: {
    repositoryId: string;
    roleId?: string;
    requestedActions?: string[];
    reason: string;
    expiresAt?: string;
    requiresMultiApproval?: boolean;
    approverIds?: string[];
  }) => Promise<AccessRequest>;
  approveAccessRequest: (id: string, biometricToken: string) => Promise<void>;
  rejectAccessRequest: (id: string, reason?: string) => Promise<void>;
  setCurrentAccessRequest: (accessRequest: AccessRequest | null) => void;
  clearError: () => void;
}

export const useAccessRequestStore = create<AccessRequestState>()(
  (set, get) => ({
    // State
    accessRequests: [],
    currentAccessRequest: null,
    isLoading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0,
    },

    // Actions
    fetchAccessRequests: async (page = 1, limit = 10, status, type, role) => {
      set({ isLoading: true, error: null });
      try {
        const response = await accessRequestService.getAccessRequests(
          page,
          limit,
          status,
          type,
          role
        );
        set({
          accessRequests: response.accessRequests,
          pagination: response.pagination,
          isLoading: false,
        });
      } catch (error) {
        console.error(
          "Access Request Store: Error fetching access requests",
          error
        );
        set({
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch access requests",
        });
      }
    },

    fetchAccessRequest: async (id) => {
      set({ isLoading: true, error: null });
      try {
        console.log(
          `Access Request Store: Fetching access request with ID: ${id}`
        );
        const { accessRequest } =
          await accessRequestService.getAccessRequest(id);

        console.log(
          `Access Request Store: Successfully fetched request with ID: ${id}`
        );
        console.log(
          `Status: ${accessRequest.status}, Created: ${accessRequest.createdAt}`
        );

        set({
          currentAccessRequest: accessRequest,
          isLoading: false,
        });

        return accessRequest;
      } catch (error: any) {
        console.error(
          "Access Request Store: Error fetching access request",
          error
        );

        let errorMessage = "Failed to fetch access request";

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
          console.error(`API Error message: ${error.response.data.message}`);
        } else if (error.message) {
          errorMessage = error.message;
        }

        set({
          isLoading: false,
          error: errorMessage,
        });

        throw error;
      }
    },

    createAccessRequest: async (data) => {
      set({ isLoading: true, error: null });
      try {
        console.log("Access Request Store: Creating access request", data);

        const { accessRequest } =
          await accessRequestService.createAccessRequest(data);

        console.log(
          "Access Request Store: Access request created successfully",
          accessRequest
        );

        // Update access requests list by adding the new request
        set((state) => ({
          accessRequests: [accessRequest, ...state.accessRequests],
          isLoading: false,
        }));

        return accessRequest;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          "Access Request Store: Error creating access request",
          errorMessage
        );
        set({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    approveAccessRequest: async (id, biometricToken) => {
      set({ isLoading: true, error: null });
      try {
        console.log(
          `Access Request Store: Starting approval for request ${id}`
        );
        const { accessRequest } =
          await accessRequestService.approveAccessRequest(id, biometricToken);
        console.log(
          `Access Request Store: Successfully approved request ${id}`
        );

        // Update the current access request if it's the one being approved
        if (get().currentAccessRequest?.id === id) {
          set({ currentAccessRequest: accessRequest });
        }

        // Update the access request in the list
        set((state) => ({
          accessRequests: state.accessRequests.map((req) =>
            req.id === id ? accessRequest : req
          ),
          isLoading: false,
        }));
      } catch (error) {
        console.error(
          "Access Request Store: Error approving access request",
          error
        );
        let errorMessage = "Failed to approve access request";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    rejectAccessRequest: async (id, reason) => {
      set({ isLoading: true, error: null });
      try {
        console.log(
          `Access Request Store: Starting rejection for request ${id}`
        );
        const { accessRequest } =
          await accessRequestService.rejectAccessRequest(id, reason);
        console.log(
          `Access Request Store: Successfully rejected request ${id}`
        );

        // Update the current access request if it's the one being rejected
        if (get().currentAccessRequest?.id === id) {
          set({ currentAccessRequest: accessRequest });
        }

        // Update the access request in the list
        set((state) => ({
          accessRequests: state.accessRequests.map((req) =>
            req.id === id ? accessRequest : req
          ),
          isLoading: false,
        }));
      } catch (error) {
        console.error(
          "Access Request Store: Error rejecting access request",
          error
        );
        let errorMessage = "Failed to reject access request";

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
        throw error;
      }
    },

    setCurrentAccessRequest: (accessRequest) => {
      set({ currentAccessRequest: accessRequest });
    },

    clearError: () => {
      set({ error: null });
    },
  })
);
