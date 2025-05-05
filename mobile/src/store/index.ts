import { useAccessRequestStore } from "./accessRequestStore";
import { useAuditLogStore } from "./auditLogStore";
import { useRepositoryStore } from "./repositoryStore";
import { useUserStore } from "./userStore";

export {
  useAccessRequestStore,
  useAuditLogStore,
  useRepositoryStore,
  useUserStore,
};

// Common types used across multiple stores
export interface PaginationState {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AccessRequestData {
  repositoryId: string;
  roleId?: string;
  requestedActions?: string[];
  reason: string;
  expiresAt?: string;
  requiresMultiApproval?: boolean;
  approverIds?: string[];
}

// Repository types
export type GitProvider = "GITHUB" | "GITLAB" | "BITBUCKET";
export type AccessLevel = "ADMIN" | "DEVELOPER" | "READONLY";

export interface Repository {
  id: string;
  name: string;
  description: string;
  gitProvider: GitProvider;
  owner: string;
  access: AccessLevel;
  members: number;
  lastActivity: string;
}

// Access Request types
export type AccessRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  repositoryId: string;
  repositoryName: string;
  roleId?: string;
  roleName?: string;
  requestedActions?: string[];
  reason: string;
  status: AccessRequestStatus;
  approverId?: string;
  approverName?: string;
  expiresAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  requiresMultiApproval: boolean;
  approvalCount: number;
  approverIds: string[];
  createdAt: string;
  updatedAt: string;
}
