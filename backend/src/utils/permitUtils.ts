import { permit, prisma } from '../index';
import { ApiError } from '../middleware/errorHandler';

/**
 * Synchronizes a user with Permit.io
 */
export const syncUserWithPermit = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Sync user with Permit.io
    await permit.api.syncUser({
      key: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      attributes: {
        biometricEnabled: user.biometricEnabled
      },
    });

    return true;
  } catch (error: any) {
    console.error('Failed to sync user with Permit.io:', error);
    throw new ApiError(500, 'Failed to sync user with Permit.io');
  }
};

/**
 * Creates a resource in Permit.io
 */
export const createResourceInPermit = async (
  key: string,
  name: string,
  actions: Record<string, Record<string, string>>
) => {
  try {
    await permit.api.resources.create({
      key,
      name,
      actions,
    });

    return true;
  } catch (error: any) {
    // If resource already exists (409 error), consider it a success
    if (error.response && error.response.status === 409) {
      console.log(`Resource '${key}' already exists in Permit.io, skipping creation`);
      return true;
    }

    console.error('Failed to create resource in Permit.io:', error);
    throw new ApiError(500, 'Failed to create resource in Permit.io');
  }
};

/**
 * Creates a role in Permit.io
 */
export const createRoleInPermit = async (
  key: string,
  name: string,
  permissions: string[]
) => {
  try {
    await permit.api.roles.create({
      key,
      name,
      permissions,
    });

    return true;
  } catch (error: any) {
    // If role already exists (409 error), consider it a success
    if (error.response && error.response.status === 409) {
      console.log(`Role '${key}' already exists in Permit.io, skipping creation`);
      return true;
    }

    console.error('Failed to create role in Permit.io:', error);
    throw new ApiError(500, 'Failed to create role in Permit.io');
  }
};

/**
 * Assigns a role to a user in Permit.io
 */
export const assignRoleInPermit = async (
  userId: string,
  roleKey: string,
  resourceType: string,
  resourceInstanceKey: string
) => {
  try {
    await permit.api.roleAssignments.assign({
      user: userId,
      role: roleKey,
      tenant: 'default',
      resource_instance: `${resourceType}:${resourceInstanceKey}`,
    });

    return true;
  } catch (error: any) {
    console.error('Failed to assign role in Permit.io:', error);
    throw new ApiError(500, 'Failed to assign role in Permit.io');
  }
};

/**
 * Checks if a user has permission to perform an action on a resource
 */
export const checkPermission = async (
  userId: string,
  action: string,
  resource: string,
  resourceInstance?: string
) => {
  try {
    let resourceObj: string | { type: string, id: string } = resource;

    // If resource instance is provided, create resource object
    if (resourceInstance) {
      resourceObj = {
        type: resource,
        id: resourceInstance,
      };
    }

    // Check permission with Permit.io
    const permitted = await permit.check(userId, action, resourceObj);

    return permitted;
  } catch (error: any) {
    console.error('Failed to check permission with Permit.io:', error);
    return false;
  }
};

/**
 * Initialize Permit.io with default resources and roles
 */
export const initializePermit = async () => {
  try {
    // Create repository resource
    await createResourceInPermit('repository', 'Repository', {
      view: { description: 'View repository contents' },
      clone: { description: 'Clone repository' },
      push: { description: 'Push changes to repository' },
      admin: { description: 'Administer repository settings' },
      delete: { description: 'Delete repository' },
      create: { description: 'Create new repository' },
      update: { description: 'Update repository information' },
      read: { description: 'Read repository data' },
    });

    // Create standard roles
    await createRoleInPermit('viewer', 'Viewer', [
      'repository:view',
    ]);

    await createRoleInPermit('contributor', 'Contributor', [
      'repository:view',
      'repository:clone',
      'repository:push',
    ]);

    await createRoleInPermit('admin', 'Administrator', [
      'repository:view',
      'repository:clone',
      'repository:push',
      'repository:admin',
      'repository:delete',
      'repository:create',
      'repository:update',
      'repository:read',
    ]);

    // Set up resource instance level permissions
    try {
      // The method expects two arguments: 1) resourceKey (string) and 2) relationData (object)
      const resourceKey = 'repository';
      const relationData = {
        key: 'owner',
        name: 'Owner',
        subject_resource: 'user',
      };

      await permit.api.resourceRelations.create(resourceKey, relationData);
    } catch (relationError: any) {
      console.warn('Resource relation may already exist:', relationError);
    }

    return true;
  } catch (error: any) {
    console.error('Failed to initialize Permit.io:', error);
    throw new ApiError(500, 'Failed to initialize Permit.io');
  }
};
