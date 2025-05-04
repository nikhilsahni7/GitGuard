# Setting up Permit.io with GitGuard

This guide explains how to set up and configure Permit.io for permission management in the GitGuard application.

## Prerequisites

Before you begin, make sure you have:

1. Created a Permit.io account at [https://app.permit.io](https://app.permit.io)
2. Obtained an API key from the Permit.io dashboard
3. Docker installed (needed for running the local PDP)

## Environment Configuration

1. Add the following environment variables to your `.env` file:

```
PERMIT_API_KEY=your_api_key_here
PERMIT_PDP_URL=http://localhost:7766
```

## Running the Local PDP

The Policy Decision Point (PDP) is a critical component that handles permission checks at runtime. You need to run the PDP locally for permission checks to work:

```bash
# Run the PDP using Docker
docker run -d --name permit-pdp \
  -p 7766:7000 \
  -e PDP_API_KEY=${PERMIT_API_KEY} \
  -e PDP_DEBUG=true \
  permitio/pdp-v2:latest
```

Make sure the PDP is running before using any permission checks in your application.

## Automatic Setup

We've created a setup script that automatically creates all required resources, roles, and permissions in Permit.io:

```bash
# Run the setup script
bun run permit:setup
```

This script will:

1. Create a `repository` resource with view, clone, push, admin, delete, create, update, and read actions
2. Create a `user` resource with view, edit, and delete actions
3. Create roles: viewer, contributor, and administrator with appropriate permissions
4. Establish a resource relation between repository and user (owner relation)

## Verify the Setup

You can verify the setup using our verification script:

```bash
# Run the verification script
bun run permit:verify
```

This will check for the existence of resources, roles, and test basic permission functionality.

## Using Permit.io in Your Code

### Basic Permission Check

```typescript
import { permit } from '../index';

// Check if a user can perform an action on a resource
const canView = await permit.check(userId, 'view', 'repository');
if (canView) {
  // Allow the user to view the repository
} else {
  // Deny access
}
```

### Resource Instance Permission Check

```typescript
import { permit } from '../index';

// Check if a user can perform an action on a specific repository
const canEdit = await permit.check(userId, 'push', {
  type: 'repository',
  id: repositoryId
});
```

### Assigning Roles

```typescript
import { permit } from '../index';

// Assign a role to a user for a specific repository
await permit.api.roleAssignments.assign({
  user: userId,
  role: 'contributor',
  tenant: 'default',
  resource_instance: `repository:${repositoryId}`
});
```

## Creating a Relationship Between User and Repository

```typescript
import { permit } from '../index';

// Create a relationship tuple for ownership
await permit.api.relationshipTuples.create({
  subject: `user:${userId}`,
  relation: 'owner',
  object: `repository:${repositoryId}`,
  tenant: 'default',
});
```

## Troubleshooting

If you encounter issues with permission checks:

1. Make sure the PDP is running at http://localhost:7766
2. Verify your API key is correctly set in the .env file
3. Check that all resources and roles were created successfully
4. Check the console for Permit.io errors

For more information, visit the [Permit.io documentation](https://docs.permit.io).
