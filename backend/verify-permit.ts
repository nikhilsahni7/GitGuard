import dotenv from 'dotenv';
import { Permit } from 'permitio';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Permit.io client
const permit = new Permit({
  token: process.env.PERMIT_API_KEY || '',
  pdp: process.env.PERMIT_PDP_URL || 'http://localhost:7766',
});

/**
 * Verify Permit.io setup
 */
async function verifyPermit() {
  try {
    console.log('🔍 Starting Permit.io verification...');

    // Verify repository resource
    console.log('\nVerifying repository resource...');
    try {
      const resource = await permit.api.resources.get('repository');
      console.log('✅ Repository resource exists');
      console.log(`   Actions: ${Object.keys(resource.actions || {}).join(', ')}`);
    } catch (error) {
      console.error('❌ Repository resource not found');
      return;
    }

    // Verify roles
    console.log('\nVerifying roles...');
    const roles = ['viewer', 'contributor', 'admin'];
    for (const roleKey of roles) {
      try {
        const role = await permit.api.roles.get(roleKey);
        console.log(`✅ ${role.name} role exists`);
        console.log(`   Permissions: ${(role.permissions || []).join(', ')}`);
      } catch (error) {
        console.error(`❌ ${roleKey} role not found`);
      }
    }

    // Test user permissions
    console.log('\nTesting permissions with a test user...');
    const testUserId = `test-user-${uuidv4()}`;
    const testRepoId = `test-repo-${uuidv4()}`;

    try {
      // Create test user
      await permit.api.syncUser({
        key: testUserId,
        email: `${testUserId}@example.com`,
        first_name: 'Test',
        last_name: 'User',
      });
      console.log(`✅ Created test user: ${testUserId}`);

      // Test permissions before role assignment
      console.log('\nPermissions before role assignment:');
      const viewPermissionBefore = await permit.check(testUserId, 'view', 'repository');
      const clonePermissionBefore = await permit.check(testUserId, 'clone', 'repository');
      console.log(`   Can view repository: ${viewPermissionBefore}`);
      console.log(`   Can clone repository: ${clonePermissionBefore}`);

      // Assign viewer role to test user
      console.log('\nAssigning viewer role to test user...');
      try {
        // Try to use the correct role name format - check both formats
        try {
          await permit.api.roleAssignments.assign({
            user: testUserId,
            role: 'repository#Viewer', // Try this format
            tenant: 'default',
            resource_instance: `repository:${testRepoId}`,
          });
          console.log('✅ Assigned repository#Viewer role to test user');
        } catch (innerError) {
          // If that fails, try the simpler format
          await permit.api.roleAssignments.assign({
            user: testUserId,
            role: 'viewer',
            tenant: 'default',
            resource_instance: `repository:${testRepoId}`,
          });
          console.log('✅ Assigned viewer role to test user');
        }
      } catch (error: any) {
        console.error('❌ Failed to assign role:', error.message || error);
      }

      // Test permissions after viewer role assignment
      console.log('\nPermissions after viewer role assignment:');
      const viewPermissionAfter = await permit.check(testUserId, 'view', 'repository');
      const clonePermissionAfter = await permit.check(testUserId, 'clone', 'repository');
      console.log(`   Can view repository: ${viewPermissionAfter}`);
      console.log(`   Can clone repository: ${clonePermissionAfter}`);

      // Test resource instance permissions
      console.log('\nTesting resource instance permissions...');

      // Create a relationship tuple for the test user as owner of the test repo
      await permit.api.relationshipTuples.create({
        subject: `user:${testUserId}`,
        relation: 'owner',
        object: `repository:${testRepoId}`,
        tenant: 'default',
      });
      console.log(`✅ Created owner relationship for user on repository: ${testRepoId}`);

      // Test instance-level permission
      const instancePermission = await permit.check(testUserId, 'view', `repository:${testRepoId}`);
      console.log(`   Can view specific repository instance: ${instancePermission}`);

      // Clean up
      console.log('\nCleaning up test data...');
      await permit.api.users.delete(testUserId);
      console.log('✅ Deleted test user');

    } catch (error) {
      console.error('❌ Error during permission testing:', error);
    }

    console.log('\n🎉 Permit.io verification completed!');
  } catch (error) {
    console.error('❌ Failed during verification:', error);
  } finally {
    process.exit(0);
  }
}

// Run the verification
verifyPermit();
