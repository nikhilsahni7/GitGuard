import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { initializePermit } from '../src/utils/permitUtils';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting seed process...');

    // Initialize Permit.io with default resources and roles
    try {
      await initializePermit();
      console.log('✅ Initialized Permit.io with default resources and roles');
    } catch (error: any) {
      // If the error is about duplicate resources (409 status code), we can continue
      if (error.message && error.message.includes('already exists')) {
        console.log('✅ Permit.io resources already exist, continuing with seed process');
      } else {
        console.error('Failed to initialize Permit.io:', error);
      }
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('2025DEVChallenge', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@gitguard.dev' },
      update: {},
      create: {
        email: 'admin@gitguard.dev',
        firstName: 'Admin',
        lastName: 'User',
        password: adminPassword,
        biometricEnabled: false,
      },
    });
    console.log('✅ Created admin user');

    // Create regular user
    const userPassword = await bcrypt.hash('2025DEVChallenge', 10);
    const user = await prisma.user.upsert({
      where: { email: 'newuser@gitguard.dev' },
      update: {},
      create: {
        email: 'newuser@gitguard.dev',
        firstName: 'New',
        lastName: 'User',
        password: userPassword,
        biometricEnabled: false,
      },
    });
    console.log('✅ Created regular user');

    // Create organization
    const organization = await prisma.organization.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'GitGuard Development Team',
      },
    });
    console.log('✅ Created organization');

    // Create roles
    const viewerRole = await prisma.role.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Viewer',
        description: 'Can view repository contents',
        organizationId: organization.id,
      },
    });

    const contributorRole = await prisma.role.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Contributor',
        description: 'Can view and push changes to repository',
        organizationId: organization.id,
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Administrator',
        description: 'Full repository access and management',
        organizationId: organization.id,
      },
    });
    console.log('✅ Created roles');

    // Create permissions for roles
    await prisma.permission.deleteMany({
      where: {
        roleId: {
          in: [viewerRole.id, contributorRole.id, adminRole.id],
        },
      },
    });

    // Viewer permissions
    await prisma.permission.create({
      data: {
        roleId: viewerRole.id,
        action: 'view',
      },
    });

    // Contributor permissions
    await prisma.permission.createMany({
      data: [
        {
          roleId: contributorRole.id,
          action: 'view',
        },
        {
          roleId: contributorRole.id,
          action: 'clone',
        },
        {
          roleId: contributorRole.id,
          action: 'push',
        },
      ],
    });

    // Admin permissions
    await prisma.permission.createMany({
      data: [
        {
          roleId: adminRole.id,
          action: 'view',
        },
        {
          roleId: adminRole.id,
          action: 'clone',
        },
        {
          roleId: adminRole.id,
          action: 'push',
        },
        {
          roleId: adminRole.id,
          action: 'admin',
        },
        {
          roleId: adminRole.id,
          action: 'delete',
        },
      ],
    });
    console.log('✅ Created permissions');

    // Create sample repository
    const repository = await prisma.repository.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'GitGuard Backend',
        description: 'Backend repository for GitGuard project',
        gitProvider: 'GITHUB',
        gitRepoUrl: 'https://github.com/gitguard/backend',
        organizationId: organization.id,
        ownerId: admin.id,
      },
    });

    // Create a second repository referencing taxiapp-backend
    const taxiRepository = await prisma.repository.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Taxiapp Backend',
        description: 'Backend service for taxi booking application',
        gitProvider: 'GITHUB',
        gitRepoUrl: 'https://github.com/nikhilsahni7/taxiapp-backend',
        organizationId: organization.id,
        ownerId: admin.id,
      },
    });
    console.log('✅ Created sample repositories');

    // Assign admin role to admin user
    await prisma.roleAssignment.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        userId: admin.id,
        roleId: adminRole.id,
        repositoryId: repository.id,
      },
    });

    // Assign viewer role to regular user for taxiapp repository
    await prisma.roleAssignment.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        userId: user.id,
        roleId: viewerRole.id,
        repositoryId: taxiRepository.id,
      },
    });

    console.log('✅ Assigned roles to users');

    // Create sample audit logs
    await prisma.auditLog.createMany({
      data: [
        {
          action: 'USER_CREATED',
          entityType: 'user',
          entityId: admin.id,
          description: 'Admin user account created',
          userId: admin.id,
        },
        {
          action: 'USER_CREATED',
          entityType: 'user',
          entityId: user.id,
          description: 'Regular user account created',
          userId: admin.id,
        },
        {
          action: 'REPOSITORY_CREATED',
          entityType: 'repository',
          entityId: repository.id,
          description: 'Repository "GitGuard Backend" created',
          userId: admin.id,
        },
        {
          action: 'REPOSITORY_CREATED',
          entityType: 'repository',
          entityId: taxiRepository.id,
          description: 'Repository "Taxiapp Backend" created',
          userId: admin.id,
        },
        {
          action: 'ROLE_ASSIGNED',
          entityType: 'role_assignment',
          entityId: '00000000-0000-0000-0000-000000000001',
          description: 'Admin role assigned to admin user for GitGuard Backend repository',
          userId: admin.id,
        },
      ],
    });
    console.log('✅ Created sample audit logs');

    // Create a sample access request
    await prisma.accessRequest.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        requesterId: user.id,
        repositoryId: taxiRepository.id,
        roleId: contributorRole.id,
        reason: 'I need to contribute code to fix the payment processing bug',
        status: 'PENDING',
        requiresMultiApproval: false,
        approverIds: [],
        requestedActions: [],
      },
    });
    console.log('✅ Created sample access request');

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .then(() => {
    console.log('🎉 Database seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  });
