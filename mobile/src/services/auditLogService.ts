import api from "./api";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Record<string, any> | null;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaginatedAuditLogs {
  auditLogs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AuditLogFilters {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}

export const auditLogService = {
  getAuditLogs: async (
    page = 1,
    limit = 20,
    filters?: AuditLogFilters
  ): Promise<PaginatedAuditLogs> => {
    let url = `/audit-logs?page=${page}&limit=${limit}`;

    if (filters) {
      if (filters.userId) url += `&userId=${filters.userId}`;
      if (filters.entityType) url += `&entityType=${filters.entityType}`;
      if (filters.entityId) url += `&entityId=${filters.entityId}`;
      if (filters.action) url += `&action=${filters.action}`;
      if (filters.fromDate) url += `&fromDate=${filters.fromDate}`;
      if (filters.toDate) url += `&toDate=${filters.toDate}`;
    }

    const response = await api.get(url);
    return response.data;
  },

  getAuditLog: async (id: string): Promise<{ auditLog: AuditLog }> => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  getEntityLogs: async (
    entityType: string,
    entityId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedAuditLogs> => {
    const response = await api.get(
      `/audit-logs/entity/${entityType}/${entityId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  getUserLogs: async (
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedAuditLogs> => {
    const response = await api.get(
      `/audit-logs/user/${userId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
