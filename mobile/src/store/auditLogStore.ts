import { create } from "zustand";
import {
  AuditLog,
  AuditLogFilters,
  auditLogService,
} from "../services/auditLogService";

interface AuditLogState {
  auditLogs: AuditLog[];
  currentAuditLog: AuditLog | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters: AuditLogFilters;

  // Actions
  fetchAuditLogs: (
    page?: number,
    limit?: number,
    filters?: AuditLogFilters
  ) => Promise<void>;
  fetchAuditLog: (id: string) => Promise<void>;
  fetchEntityLogs: (
    entityType: string,
    entityId: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  fetchUserLogs: (
    userId: string,
    page?: number,
    limit?: number
  ) => Promise<void>;
  setFilters: (filters: AuditLogFilters) => void;
  clearFilters: () => void;
  setCurrentAuditLog: (auditLog: AuditLog | null) => void;
  clearError: () => void;
}

export const useAuditLogStore = create<AuditLogState>((set, get) => ({
  // State
  auditLogs: [],
  currentAuditLog: null,
  isLoading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  },
  filters: {},

  // Actions
  fetchAuditLogs: async (page = 1, limit = 20, filters = get().filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await auditLogService.getAuditLogs(page, limit, filters);
      set({
        auditLogs: response.auditLogs,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error) {
      console.error("Audit Log Store: Error fetching audit logs", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch audit logs",
      });
    }
  },

  fetchAuditLog: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { auditLog } = await auditLogService.getAuditLog(id);
      set({
        currentAuditLog: auditLog,
        isLoading: false,
      });
    } catch (error) {
      console.error("Audit Log Store: Error fetching audit log", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch audit log",
      });
    }
  },

  fetchEntityLogs: async (entityType, entityId, page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await auditLogService.getEntityLogs(
        entityType,
        entityId,
        page,
        limit
      );
      set({
        auditLogs: response.auditLogs,
        pagination: response.pagination,
        filters: { entityType, entityId },
        isLoading: false,
      });
    } catch (error) {
      console.error(
        `Audit Log Store: Error fetching ${entityType} logs`,
        error
      );
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : `Failed to fetch ${entityType} logs`,
      });
    }
  },

  fetchUserLogs: async (userId, page = 1, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await auditLogService.getUserLogs(userId, page, limit);
      set({
        auditLogs: response.auditLogs,
        pagination: response.pagination,
        filters: { userId },
        isLoading: false,
      });
    } catch (error) {
      console.error("Audit Log Store: Error fetching user logs", error);
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch user logs",
      });
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchAuditLogs(1, get().pagination.limit, filters);
  },

  clearFilters: () => {
    set({ filters: {} });
    get().fetchAuditLogs(1, get().pagination.limit, {});
  },

  setCurrentAuditLog: (auditLog) => {
    set({ currentAuditLog: auditLog });
  },

  clearError: () => {
    set({ error: null });
  },
}));
