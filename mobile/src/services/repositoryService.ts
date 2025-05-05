import api from "./api";

export interface Repository {
  id: string;
  name: string;
  description: string | null;
  gitProvider: "GITHUB" | "GITLAB" | "BITBUCKET";
  gitRepoUrl: string;
  organizationId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  repositoryId: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  repositories?: Repository[];
  roles?: Role[];
}

export interface PaginatedRepositories {
  repositories: Repository[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const repositoryService = {
  getRepositories: async (
    page = 1,
    limit = 10,
    organizationId?: string,
    includeInaccessible = false
  ): Promise<PaginatedRepositories> => {
    let url = `/repositories?page=${page}&limit=${limit}`;
    if (organizationId) {
      url += `&organizationId=${organizationId}`;
    }
    if (includeInaccessible) {
      url += `&includeInaccessible=true`;
    }

    const response = await api.get(url);
    return response.data;
  },

  getAllRepositories: async (
    page = 1,
    limit = 10,
    includeInaccessible = true
  ): Promise<PaginatedRepositories> => {
    let url = `/repositories?page=${page}&limit=${limit}`;
    if (includeInaccessible) {
      url += `&includeInaccessible=true`;
    }

    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error("Error fetching all repositories:", error);
      return {
        repositories: [],
        pagination: { total: 0, page, limit, pages: 0 },
      };
    }
  },

  getRepository: async (
    id: string,
    ignorePermissionError = false
  ): Promise<{ repository: Repository }> => {
    try {
      const response = await api.get(`/repositories/${id}`);
      return response.data;
    } catch (error: any) {
      // Handle 403 Forbidden errors gracefully
      if (error.response && error.response.status === 403) {
        console.warn(`User doesn't have permission to view repository ${id}`);
        if (ignorePermissionError) {
          // Return a limited repository object with just the ID
          return {
            repository: {
              id,
              name: "Repository requires permission",
              description:
                "You don't have access to view this repository. Request access to view details.",
              gitProvider: "GITHUB", // Default value
              gitRepoUrl: "",
              organizationId: "",
              ownerId: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        }
        throw new Error("You don't have permission to view this repository");
      }
      throw error;
    }
  },

  createRepository: async (data: {
    name: string;
    description?: string;
    gitProvider: "GITHUB" | "GITLAB" | "BITBUCKET";
    gitRepoUrl: string;
    organizationId: string;
  }): Promise<{ message: string; repository: Repository }> => {
    const response = await api.post("/repositories", data);
    return response.data;
  },

  getRoleAssignments: async (
    repositoryId: string
  ): Promise<{ roleAssignments: RoleAssignment[] }> => {
    try {
      const response = await api.get(
        `/repositories/${repositoryId}/role-assignments`
      );
      return response.data;
    } catch (error: any) {
      // Handle 403 Forbidden errors gracefully
      if (error.response && error.response.status === 403) {
        console.warn(
          `User doesn't have permission to view role assignments for repository ${repositoryId}`
        );
        return { roleAssignments: [] };
      }
      throw error;
    }
  },

  getRepositoryRoles: async (
    repositoryId: string
  ): Promise<{ roles: Role[] }> => {
    try {
      const response = await api.get(`/repositories/${repositoryId}/roles`);
      return response.data;
    } catch (error: any) {
      // Handle 403 and 404 errors gracefully by returning an empty array
      if (
        error.response &&
        (error.response.status === 403 || error.response.status === 404)
      ) {
        console.warn(
          `Could not fetch roles for repository ${repositoryId}: ${error.response.data?.message || error.message}`
        );
        return { roles: [] };
      }
      throw error;
    }
  },

  getOrganizations: async (): Promise<{ organizations: Organization[] }> => {
    const response = await api.get("/organizations");
    return response.data;
  },

  getOrganization: async (
    id: string
  ): Promise<{ organization: Organization }> => {
    const response = await api.get(`/organizations/${id}`);
    return response.data;
  },
};
