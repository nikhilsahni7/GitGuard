import dotenv from 'dotenv';
import { Permit } from 'permitio';

// Load environment variables
dotenv.config();

// Initialize Permit.io client
const permit = new Permit({
  token: process.env.PERMIT_API_KEY || '',
  pdp: process.env.PERMIT_PDP_URL || 'http://localhost:7766',
  log: {
    level: "debug",
  },
});

async function testPermit() {
  try {
    console.log('🧪 Starting Permit.io test...');

    // 1. Test if we can create and sync a user
    console.log('\n🔹 Testing user sync...');
    await permit.api.syncUser({
      key: 'test-user',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      attributes: {
        biometricEnabled: false
      },
    });
    console.log('✅ User sync successful');

    // 2. Test resource existence
    console.log('\n🔹 Testing resource existence...');
    const resources = await permit.api.resources.list();
    console.log('Available resources:', resources.map(r => r.key));

    const repository = resources.find(r => r.key === 'repository');
    if (!repository) {
      throw new Error('Repository resource not found! Run "bun run permit:setup" first.');
    }
    console.log('✅ Repository resource exists');

    // 3. Test roles existence
    console.log('\n🔹 Testing roles existence...');
    const roles = await permit.api.roles.list();
    console.log('Available roles:', roles.map(r => r.key));

    const adminRole = roles.find(r => r.key === 'admin');
    const viewerRole = roles.find(r => r.key === 'viewer');
    const contributorRole = roles.find(r => r.key === 'repository#Contributor');

    if (!adminRole || !viewerRole || !contributorRole) {
      throw new Error('Required roles not found! Run "bun run permit:setup" first.');
    }
    console.log('✅ Required roles exist');

    // 4. Test role assignment
    console.log('\n🔹 Testing role assignment...');
    await permit.api.roleAssignments.assign({
      user: 'test-user',
      role: 'viewer',
      tenant: 'default',
      resource_instance: 'repository:test-repo',
    });
    console.log('✅ Role assignment successful');

    // 5. Test permission checks
    console.log('\n🔹 Testing permission checks...');
    const canView = await permit.check('test-user', 'view', 'repository');
    const canClone = await permit.check('test-user', 'clone', 'repository');
    const canPush = await permit.check('test-user', 'push', 'repository');
    const canAdmin = await permit.check('test-user', 'admin', 'repository');

    console.log('- Can view repository:', canView);
    console.log('- Can clone repository:', canClone);
    console.log('- Can push to repository:', canPush);
    console.log('- Can admin repository:', canAdmin);

    if (canView !== true || canClone !== false || canPush !== false || canAdmin !== false) {
      console.warn('⚠️ Permission check results are unexpected for viewer role!');
    } else {
      console.log('✅ Permission checks for viewer role are correct');
    }

    // 6. Test role upgrade and new permissions
    console.log('\n🔹 Testing role upgrade...');
    await permit.api.roleAssignments.unassign({
      user: 'test-user',
      role: 'viewer',
      tenant: 'default',
      resource_instance: 'repository:test-repo',
    });

    await permit.api.roleAssignments.assign({
      user: 'test-user',
      role: 'repository#Contributor',
      tenant: 'default',
      resource_instance: 'repository:test-repo',
    });

    const canViewAsContributor = await permit.check('test-user', 'view', 'repository');
    const canCloneAsContributor = await permit.check('test-user', 'clone', 'repository');
    const canPushAsContributor = await permit.check('test-user', 'push', 'repository');

    console.log('- Can view repository as contributor:', canViewAsContributor);
    console.log('- Can clone repository as contributor:', canCloneAsContributor);
    console.log('- Can push to repository as contributor:', canPushAsContributor);

    if (canViewAsContributor !== true || canCloneAsContributor !== true || canPushAsContributor !== true) {
      console.warn('⚠️ Permission check results are unexpected for contributor role!');
    } else {
      console.log('✅ Permission checks for contributor role are correct');
    }

    // 7. Cleanup
    console.log('\n🔹 Cleaning up...');
    await permit.api.roleAssignments.unassign({
      user: 'test-user',
      role: 'repository#Contributor',
      tenant: 'default',
      resource_instance: 'repository:test-repo',
    });
    console.log('✅ Cleanup successful');

    console.log('\n🎉 All tests completed successfully!');
    console.log('Your Permit.io configuration is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testPermit();
