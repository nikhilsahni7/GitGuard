/**
 * Git provider types
 */
export type GitProvider = 'GITHUB' | 'GITLAB' | 'BITBUCKET';

/**
 * Request status types
 */
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

/**
 * Role types
 */
export type RoleType = 'ADMIN' | 'CONTRIBUTOR' | 'VIEWER';

/**
 * Pagination response interface
 */
export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Generic data filter
 */
export interface DataFilter {
  [key: string]: any;
}

/**
 * User info interface
 */
export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles?: string[];
}

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Organization interface
 */
export interface Organization extends BaseEntity {
  name: string;
  owner: UserInfo;
  repositories?: Repository[];
}

/**
 * Repository interface
 */
export interface Repository extends BaseEntity {
  name: string;
  description?: string;
  gitProvider: GitProvider;
  gitRepoUrl: string;
  owner?: UserInfo;
  organization?: Organization;
  organizationId: string;
}

/**
 * Access request interface
 */
export interface AccessRequest extends BaseEntity {
  repository: Repository;
  requester: UserInfo;
  reviewer?: UserInfo;
  role: RoleType;
  status: RequestStatus;
  reason: string;
  reviewerNote?: string;
  reviewedAt?: string;
  expiresAt?: string;
}

/**
 * Audit log interface
 */
export interface AuditLog extends BaseEntity {
  action: string;
  entity: string;
  entityId: string;
  performedBy: UserInfo;
  details?: string;
  metadata?: Record<string, any>;
}
