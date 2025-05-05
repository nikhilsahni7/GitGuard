import api from "./api";

export interface AccessRequest {
  id: string;
  requesterId: string;
  repositoryId: string;
  roleId: string | null;
  requestedActions: string[];
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  approverId: string | null;
  expiresAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  requiresMultiApproval: boolean;
  approvalCount: number;
  approverIds: string[];
  createdAt: string;
  updatedAt: string;
  requester: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  repository: {
    id: string;
    name: string;
    description: string | null;
    gitProvider: "GITHUB" | "GITLAB" | "BITBUCKET";
    ownerId: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedAccessRequests {
  accessRequests: AccessRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper function to safely stringify objects for logging
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return `[Error stringifying object: ${error}]`;
  }
};

export const accessRequestService = {
  getAccessRequests: async (
    page = 1,
    limit = 10,
    status?: string,
    type?: "pending" | "approved" | "rejected" | "all",
    role?: "requester" | "approver"
  ): Promise<PaginatedAccessRequests> => {
    let url = `/access-requests?page=${page}&limit=${limit}`;

    if (status) {
      url += `&status=${status}`;
    }

    if (type) {
      url += `&type=${type}`;
    }

    if (role) {
      url += `&role=${role}`;

      if (role === "approver") {
        console.log(`Setting role filter to: ${role}`);
        console.log(
          `Switching to APPROVER view - will show pending requests requiring approval`
        );

        // If approver, default to pending requests if no type is specified
        if (!type) {
          url += "&type=pending";
          console.log(
            `No type specified for approver view, defaulting to pending`
          );
        }
      } else if (role === "requester") {
        console.log(`Setting role filter to: ${role}`);
        console.log(`Switching to REQUESTER view - will show your requests`);
      }
    }

    // Log the complete URL being requested
    console.log(`Fetching access requests from: ${url}`);

    try {
      const response = await api.get(url);
      console.log(
        `Retrieved ${response.data.accessRequests.length} access requests`
      );
      console.log(
        `Status filter: ${type || "all"}, Role filter: ${role || "all"}`
      );

      if (role === "approver") {
        console.log(
          `Found ${response.data.accessRequests.filter((r: AccessRequest) => r.status === "PENDING").length} pending requests to approve`
        );
      }

      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch access requests: ${error.message}`);
      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data: ${safeStringify(error.response.data)}`);
      }
      throw error;
    }
  },

  getAccessRequest: async (
    id: string
  ): Promise<{ accessRequest: AccessRequest }> => {
    console.log(`Fetching access request details: /access-requests/${id}`);
    const response = await api.get(`/access-requests/${id}`);
    return response.data;
  },

  createAccessRequest: async (data: {
    repositoryId: string;
    roleId?: string;
    requestedActions?: string[];
    reason: string;
    expiresAt?: string;
    requiresMultiApproval?: boolean;
    approverIds?: string[];
  }): Promise<{ message: string; accessRequest: AccessRequest }> => {
    console.log("Creating access request with data:", JSON.stringify(data));

    try {
      const response = await api.post("/access-requests", data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to create access request: ${error.message}`);
      if (error.response) {
        console.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  },

  approveAccessRequest: async (
    id: string,
    biometricToken: string
  ): Promise<{ message: string; accessRequest: AccessRequest }> => {
    console.log(`Approving access request: /access-requests/${id}/approve`);
    const response = await api.post(`/access-requests/${id}/approve`, {
      biometricToken,
    });
    return response.data;
  },

  rejectAccessRequest: async (
    id: string,
    reason?: string
  ): Promise<{ message: string; accessRequest: AccessRequest }> => {
    console.log(`Rejecting access request: /access-requests/${id}/reject`);
    const response = await api.post(`/access-requests/${id}/reject`, {
      reason,
    });
    return response.data;
  },
};
