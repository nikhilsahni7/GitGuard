# GitGuard - Advanced Repository Access Control System

GitGuard is a state-of-the-art access control system for Git repositories, featuring biometric authentication, Just-In-Time (JIT) access, and real-time notifications through push notifications.

## 🔐 GitGuard – Just-in-Time GitHub Access Control

GitGuard is a full-stack, production-grade access control and auditing system for secure, temporary, and role-based GitHub access management.

Think of GitGuard as a **"Just-in-Time IAM layer"** tailored for GitHub. Perfect for fast-moving teams that need security without sacrificing agility.

## 📑 **IMPORTANT FOR JUDGES - Detailed Technical Implementation**

**For detailed technical implementation, Permit.io integration details, and challenge solutions, please see:**
**[👉 BACKEND README with Implementation Details](/backend/README.md)**

## 📸 Screenshots

### 🔐 Login Screen

![Login Screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5zpgdk44t2vmn7fkzacm.png)

### 📝 Register Screen

![Register Screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n8x5btjzwia8nmubws1p.png)

### 🏠 Home Page

![Home Page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/83goma9j0wu2k30zenj2.png)

### 📁 Repository Screen

![Repository Screen](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ccmtl8nmyfa1ed022hba.png)

### 🗂️ Access Request Manager

![Access Request Manager](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/35pxkxag9lp4zf1dxzie.png)

### ✅ Approval/Reject Filter

![Approval/Reject](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vfb1nca4d702m3zp9hzc.png)

### ✔️ Approve Request Flow

![Approve Request](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/igcrp2oourmdoo6mcwo1.png)

![Access Request Form](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/dohk7v6h9c1eo1o157xz.png)

### 🧬 Biometric Approval (Simulated)

> _Biometrics cannot be captured in screenshots; simulated via mobile preview._

![Biometric Approval](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/4qg64w0s1zf7a9i35br4.png)

### 🔔 Push Notification for Approvals

![Push Notification](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/5aw5r9ghss98a685sg9j.png)

### 📂 Repository Details

![Repository Details](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/q0cugqat3edis5997bxu.png)

### 🔔 Push Notifications list

![Push Notifications List](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rhksjlksw04ahtq09h5m.png)

### 🏢 Organisation List and Create

![Organisation List](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/afzvz0inaa7pjj9siy03.png)

### 📜 Audit Logs – View 1

> _(Local preview only)_ > ![Audit logs 1](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2qlvjoyfsh4l1mbkuyvh.png)

### 📜 Audit Logs – View 2

> _(Local preview only)_ > ![Audit logs 2](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/stulyclt7vtktrdrm56c.png)

## 🚀 Core Features

- 🔓 **Biometric Authentication**
- 🕒 **Just-in-Time GitHub Access**
- 👥 **Granular RBAC with Permit.io**
- 🔔 **Real-Time Notifications via Expo**
- 🧠 **Multi-Approver Logic & Escalation**
- 🪵 **Full Audit Logging**
- 🔁 **Auto Role Expiry + Renewals**
- 📱 **Mobile App with Secure Approvals**
- 🛠 **Built with Bun + Prisma + PostgreSQL**

## Key Features

1. **Biometric Authentication**

   - Real-time biometric verification for critical actions
   - Fingerprint/Face ID validation for access request approvals
   - Enhanced security for sensitive operations

2. **Dynamic Role-Based Access (JIT)**

   - Temporary, task-based access requests
   - Automatic role expiration after task completion
   - Permission escalation for emergency fixes

3. **Push Notification Workflow**

   - Instant notifications for pending access requests
   - Actionable approval/rejection directly from notifications
   - Deep linking to mobile app for biometric approval

4. **Real-Time Role Adjustments**

   - Automatic role adjustments based on repository activity
   - Repository-driven permissions
   - Expiry timers for temporary elevated access

5. **Compliance and Audit Logs**

   - Comprehensive audit trail of all actions
   - Detailed logs for security compliance
   - Searchable history for investigations

6. **Multi-Approver Workflow**
   - Critical access requests require multiple approvers
   - Configurable approval chains based on sensitivity
   - Complete audit trails of approval process

## 📦 Repositories

| Component     | Link                                                         |
| ------------- | ------------------------------------------------------------ |
| 🧠 Backend    | [GitGuard Backend](https://github.com/nikhilsahni7/GitGuard) |
| 📱 Mobile App | [GitGuard Mobile](https://github.com/nikhilsahni7/GitGuard)  |

## 🧑‍💻 My Journey – Permit.io Challenge 2025

### 🔧 Challenges

- Biometric + JWT backend auth
- GitHub + Permit.io role mapping
- Multi-approver, real-time push flow

### ✅ Solutions

- Modular Bun microservices
- Expo push hooks + native auth
- GitHub webhooks + role expiry logic

## 🧠 Permit.io Integration Highlights

- ✅ Scoped GitHub repo access as Permit.io resources
- ⏳ Time-bound role assignments
- 🔁 Real-time `permit.check()` on endpoints
- 📊 Transparent audit logs in Permit.io + local DB
- ⚙️ Dev-friendly setup via CLI + SDK

## Technical Stack

### Backend

- **Language/Runtime**: TypeScript + Bun
- **API Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Biometric tokens
- **Authorization**: Permit.io SDK
- **Push Notifications**: Expo Server SDK
- **Email Notifications**: Resend API

### Mobile App

- **Framework**: React Native + Expo
- **Biometric Auth**: Expo Local Authentication
- **State Management**: React Context + Hooks
- **Navigation**: React Navigation
- **UI Components**: Custom design system

## Repository Structure

```
.
├── backend/             # Server-side code
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # TypeScript source code
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── types/       # TypeScript type definitions
│   │   └── utils/       # Utility functions
│   └── package.json     # Dependencies
│
└── mobile/              # React Native mobile app
    ├── src/             # TypeScript source code
    │   ├── components/  # Reusable UI components
    │   ├── hooks/       # Custom React hooks
    │   ├── screens/     # App screens
    │   ├── services/    # API and device services
    │   └── utils/       # Utility functions
    └── package.json     # Dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- Bun (latest version)
- PostgreSQL
- Permit.io account
- Expo account (for push notifications)
- Resend account (for email notifications)

### Backend Setup

1. Clone the repository

   ```
   git clone https://github.com/yourusername/gitguard.git
   cd gitguard/backend
   ```

2. Install dependencies

   ```
   bun install
   ```

3. Set up environment variables by copying the example and updating values

   ```
   cp .env.example .env
   ```

4. Configure your database

   ```
   # Update DATABASE_URL in .env file
   bun prisma migrate dev
   ```

5. Start the development server

   ```
   bun run dev
   ```

### Mobile App Setup

1. Navigate to the mobile directory

   ```
   cd ../mobile
   ```

2. Install dependencies

   ```
   bun install
   ```

3. Set up environment variables

   ```
   cp .env.example .env
   ```

4. Start the development server

   ```
   bun expo start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Log in user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/biometric/setup` - Set up biometric authentication
- `POST /api/auth/biometric/verify` - Verify biometric authentication

### Users

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `PUT /api/users/push-token` - Update push notification token

### Repositories

- `POST /api/repositories` - Create new repository
- `GET /api/repositories` - Get all repositories
- `GET /api/repositories/:id` - Get repository by ID
- `PUT /api/repositories/:id` - Update repository
- `DELETE /api/repositories/:id` - Delete repository
- `GET /api/repositories/:id/role-assignments` - Get role assignments for repository

### Access Requests

- `POST /api/access-requests` - Create new access request
- `GET /api/access-requests` - Get all access requests
- `GET /api/access-requests/:id` - Get access request by ID
- `POST /api/access-requests/:id/approve` - Approve access request
- `POST /api/access-requests/:id/reject` - Reject access request

### Organizations

- `POST /api/organizations` - Create new organization
- `GET /api/organizations` - Get all organizations
- `GET /api/organizations/:id` - Get organization by ID
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Audit Logs

- `GET /api/audit-logs` - Get all audit logs
- `GET /api/audit-logs/:id` - Get audit log by ID
- `GET /api/audit-logs/entity/:type/:id` - Get audit logs for entity
- `GET /api/audit-logs/user/:userId` - Get audit logs for user
- `GET /api/audit-logs/actions/list` - Get all unique action types
- `GET /api/audit-logs/entity-types/list` - Get all unique entity types

## The Permit.io Challenge

This project was built for the Permit.io Authorization Challenge. It demonstrates how advanced authorization patterns can be implemented with external authorization services like Permit.io, while providing a modern and secure user experience.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
