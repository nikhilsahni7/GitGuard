import dotenv from 'dotenv';
import { Permit } from 'permitio';

// Load environment variables
dotenv.config();

// Initialize Permit.io client
const permit = new Permit({
  token: process.env.PERMIT_API_KEY || '',
  pdp: process.env.PERMIT_PDP_URL || 'http://localhost:7766',
  log: {
    level: 'debug',
  },
});

/**
 * Initialize Permit.io with GitGuard resources and roles
 */
async function setupPermit() {
  try {
    console.log('🔐 Starting Permit.io setup...');

    // Check if repository resource exists and create/update it
    const repositoryResource = {
      key: 'repository',
      name: 'Repository',
      description: 'Git repository',
      actions: {
        view: { description: 'View repository contents' },
        clone: { description: 'Clone repository' },
        push: { description: 'Push changes to repository' },
        admin: { description: 'Administer repository settings' },
        delete: { description: 'Delete repository' },
        create: { description: 'Create new repository' },
        update: { description: 'Update repository information' },
        read: { description: 'Read repository data' },
      },
    };

    try {
      console.log('Checking if repository resource exists...');
      await permit.api.resources.get('repository');
      console.log('Repository resource exists, updating...');

      // For updates, we need to omit the key
      const { key, ...updatePayload } = repositoryResource;
      await permit.api.resources.update('repository', updatePayload);
      console.log('✅ Repository resource updated successfully');
    } catch (error: any) {
      if (error.toString().includes('not found')) {
        console.log('Repository resource does not exist, creating...');
        await permit.api.resources.create(repositoryResource);
        console.log('✅ Repository resource created successfully');
      } else {
        console.error('❌ Error checking repository resource:', error.message);
      }
    }

    // Create user resource (force create without checking first)
    console.log('Creating user resource...');
    const userResource = {
      key: 'user',
      name: 'User',
      description: 'Application user',
      actions: {
        view: { description: 'View user profile' },
        edit: { description: 'Edit user profile' },
        delete: { description: 'Delete user account' },
      },
    };

    try {
      await permit.api.resources.create(userResource);
      console.log('✅ User resource created successfully');
    } catch (error: any) {
      // If the resource already exists, this is fine
      if (error.toString().includes('already in use')) {
        console.log('User resource already exists');
        try {
          // Try to update it
          const { key, ...updatePayload } = userResource;
          await permit.api.resources.update('user', updatePayload);
          console.log('✅ User resource updated successfully');
        } catch (updateError: any) {
          console.error('❌ Failed to update user resource:', updateError.message);
        }
      } else {
        console.error('❌ Error creating user resource:', error.message);
      }
    }

    // Now try to directly create the contributor role
    console.log('Directly creating the Contributor role...');
    try {
      const contributorRole = {
        key: 'contributor',
        name: 'Contributor',
        description: 'Can make changes to code and request access',
        permissions: [
          'repository:view',
          'repository:clone',
          'repository:push',
        ],
      };

      // First try to delete it if it exists (to force clean creation)
      try {
        await permit.api.roles.delete('contributor');
        console.log('Deleted existing contributor role');
      } catch (e) {
        // Ignore errors here, just try to create
      }

      await permit.api.roles.create(contributorRole);
      console.log('✅ Contributor role created successfully');
    } catch (error: any) {
      console.error('❌ Error creating Contributor role:', error.toString());
    }

    // Update the Admin role
    try {
      console.log('Checking if Administrator role exists...');
      const adminRole = {
        name: 'Administrator',
        description: 'Full access to all repositories',
        permissions: [
          'repository:view',
          'repository:clone',
          'repository:push',
          'repository:admin',
          'repository:delete',
          'repository:create',
          'repository:update',
          'repository:read',
        ],
      };

      await permit.api.roles.update('admin', adminRole);
      console.log('✅ Administrator role updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating Administrator role:', error.message);
    }

    // Set up resource instance level permissions - try a different approach
    console.log('Setting up resource instance level permissions...');
    try {
      // Try with full debug information
      console.log('Creating owner relation on repository resource');
      const relationData = {
        key: 'owner',
        name: 'Owner',
        subject_resource: 'user',
      };

      // First try to delete the relation if it exists
      try {
        await permit.api.resourceRelations.delete('repository', 'owner');
        console.log('Deleted existing owner relation');
      } catch (e) {
        // Ignore errors here
      }

      // Try to create the relation
      await permit.api.resourceRelations.create('repository', relationData);
      console.log('✅ Resource relation created successfully');
    } catch (error: any) {
      console.error('❌ Error creating owner relation:', error.toString());
      // Dump more debug info
      console.error('Error details:', JSON.stringify(error, null, 2));
    }

    console.log('🎉 Permit.io setup completed successfully!');
    console.log('You can now use permit.check() in your code to verify permissions.');
    console.log('Example: await permit.check(userId, "view", "repository")');

  } catch (error) {
    console.error('❌ Failed to set up Permit.io:', error);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupPermit();
