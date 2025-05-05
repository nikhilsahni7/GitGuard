import api from "./api";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  repositories?: Repository[];
  roles?: Role[];
}

export interface Repository {
  id: string;
  name: string;
  description: string | null;
  gitProvider: "GITHUB" | "GITLAB" | "BITBUCKET";
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface PaginatedOrganizations {
  organizations: Organization[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const organizationService = {
  getOrganizations: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedOrganizations> => {
    const response = await api.get(
      `/organizations?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getOrganization: async (
    id: string
  ): Promise<{ organization: Organization }> => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },

  createOrganization: async (data: {
    name: string;
  }): Promise<{ message: string; organization: Organization }> => {
    const response = await api.post("/organizations", data);
    return response.data;
  },

  updateOrganization: async (
    id: string,
    data: { name: string }
  ): Promise<{ message: string; organization: Organization }> => {
    const response = await api.put(`/organizations/${id}`, data);
    return response.data;
  },

  deleteOrganization: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/organizations/${id}`);
    return response.data;
  },
};
