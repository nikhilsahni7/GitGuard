# GitGuard Backend

This is the backend service for GitGuard, an advanced repository access control system featuring biometric authentication, Just-In-Time (JIT) access, and real-time notifications.

## Features

- Biometric verification for access approvals
- Dynamic role-based access control with expiration
- Push notification workflow for admins
- Multi-approver flow for sensitive repositories
- Comprehensive audit logging
- Integration with Permit.io for authorization

## Setup

1. Install dependencies:

   ```
   bun install
   ```

2. Configure environment variables:

   ```
   cp .env.example .env
   ```

   And update the values in `.env` to match your environment.

3. Set up the database:

   ```
   bun run db:migrate
   ```

4. Seed the database with sample data:

   ```
   bun run db:seed
   ```

5. Start the development server:

   ```
   bun run dev
   ```

## Testing the Backend

You can test the backend using the following approaches:

### 1. Using the Database Seed

Run the seed script to populate the database with sample data:

```
bun run db:seed
```

This will create:

- Two user accounts: admin and regular user
- An organization with roles (Viewer, Contributor, Admin)
- Two sample repositories including one from `nikhilsahni7/taxiapp-backend`
- Role assignments
- A sample access request
- Audit logs

### 2. Testing with API Requests

You can test the API using tools like Postman, Insomnia, or curl.

#### Authentication

1. Create a user account:

   ```
   POST http://localhost:4000/api/auth/signup
   {
     "email": "test@example.com",
     "firstName": "Test",
     "lastName": "User",
     "password": "testpassword123"
   }
   ```

2. Login to get a JWT token:

   ```
   POST http://localhost:4000/api/auth/login
   {
     "email": "test@example.com",
     "password": "testpassword123"
   }
   ```

   Or use the seeded accounts:

   ```
   {
     "email": "admin@gitguard.dev",
     "password": "2025DEVChallenge"
   }
   ```

   ```
   {
     "email": "newuser@gitguard.dev",
     "password": "2025DEVChallenge"
   }
   ```

3. Use the received token in the Authorization header for subsequent requests:

   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

#### Testing Repository Access

1. Get repositories list:

   ```
   GET http://localhost:4000/api/repositories
   ```

2. View a specific repository:

   ```
   GET http://localhost:4000/api/repositories/00000000-0000-0000-0000-000000000001
   ```

#### Testing Access Requests

1. Create an access request:

   ```
   POST http://localhost:4000/api/access-requests
   {
     "repositoryId": "00000000-0000-0000-0000-000000000002",
     "roleId": "00000000-0000-0000-0000-000000000002",
     "reason": "Need to fix critical bug"
   }
   ```

2. View pending access requests (as admin):

   ```
   GET http://localhost:4000/api/access-requests?type=pending
   ```

3. Approve an access request (requires biometric token):

   ```
   POST http://localhost:4000/api/access-requests/REQUEST_ID/approve
   {
     "biometricToken": "biometric_token_here"
   }
   ```

### 3. Using Permit.io Dashboard

1. Register at [Permit.io](https://permit.io)
2. Get your API key and update the `.env` file
3. Run the backend with the updated API key
4. Monitor authorization decisions in the Permit.io dashboard

### 4. Testing with Private GitHub Repositories

The system supports both public and private GitHub repositories:

1. For private repositories, you need to:
   - Configure GitHub OAuth (client ID and secret in .env)
   - Login with GitHub to get access tokens
   - The system will use these tokens for repository operations

## Application Flow

1. **Authentication Flow**:
   - User signs up or logs in
   - JWT token is issued for authentication
   - Biometric setup can be enabled for elevated security

2. **Repository Management Flow**:
   - Admin creates organizations and repositories
   - Basic roles (Viewer, Contributor, Admin) are assigned
   - Custom roles can be created with specific permissions

3. **Access Request Flow**:
   - User requests access to a repository with a specific role
   - Admin receives push notification
   - Admin verifies with biometric authentication (fingerprint/face ID)
   - Access is granted with optional expiration time
   - User receives notification of approval

4. **Audit and Compliance Flow**:
   - All actions are logged in the audit system
   - Logs can be filtered by user, action, or entity
   - Compliance reports can be generated

## Special Considerations

1. **Biometric Authentication**: This requires a mobile app integration for the full experience.
2. **Push Notifications**: Requires an Expo push token for each user.
3. **Permit.io Integration**: Heavy usage of Permit.io for authorization decisions.

## Permit.io Usage

This application heavily utilizes Permit.io for authorization:

1. **Resources**: Repositories are registered as resources in Permit.io
2. **Roles and Permissions**: Mapped to Permit.io's RBAC system
3. **Real-time Checks**: All access decisions use `permit.check()`
4. **User Sync**: Users are synchronized with Permit.io
5. **Fine-grained Control**: Repository-specific permissions

Permit.io provides:

- Centralized policy management
- Real-time permission updates
- Audit trail of authorization decisions
- Separation of authorization logic from application code

## Troubleshooting

Common issues:

- Database connection errors: Check your DATABASE_URL in .env
- JWT errors: Ensure JWT_SECRET is set correctly
- Permit.io errors: Verify your API key and PDP URL
