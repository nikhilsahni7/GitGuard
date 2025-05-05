# 📱 GitGuard Mobile App

_Part of the [GitGuard](https://github.com/nikhilsahni7/GitGuard) solution for the Permit.io Authorization Challenge_

The GitGuard mobile application is designed to provide secure repository access management on the go. This React Native application interfaces with the GitGuard backend API for authentication, profile management, and repository access controls.

## 🚀 Key Features

- **🔒 Biometric Authentication**: Secure approvals with fingerprint/face ID
- **📱 Push Notifications**: Real-time alerts for access requests
- **🗂️ Repository Management**: Browse and manage GitHub repositories
- **🔑 Access Request Workflow**: Request, approve, or deny access on the go
- **👤 User Profile Management**: Manage credentials and preferences
- **📊 Audit Log Visualization**: View access history and activity logs
- **🌐 Multi-Organization Support**: Work across multiple GitHub organizations

## 🧩 Architecture

### 📂 Directory Structure

```
mobile/
├── assets/             # App images, fonts, and other static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── navigation/     # React Navigation configuration
│   ├── screens/        # App screens organized by feature
│   │   ├── auth/       # Authentication screens (login, register, etc.)
│   │   ├── home/       # Main app screens
│   │   ├── profile/    # User profile screens
│   │   └── ...
│   ├── services/       # API services for backend communication
│   ├── store/          # State management using Zustand
│   ├── styles/         # Global styles and theme
│   └── utils/          # Helper functions and utilities
├── App.tsx             # Root component
└── index.ts            # Entry point
```

### 🔌 Backend Integration

The mobile app integrates with the GitGuard backend API, which leverages Permit.io for authorization:

- **🔑 Auth Service**: Manages secure authentication with JWT tokens
- **👤 User Service**: Handles profile operations and preference management
- **📂 Repository Service**: Interfaces with GitHub repositories through backend API
- **📝 Access Request Service**: Manages the creation and approval of access requests
- **📱 Biometric Service**: Handles secure fingerprint/face ID verification

## 🎨 UI Components

The app uses a consistent design system with these components:

```tsx
// Button component with primary styling
<Button
  variant="primary"
  text="Approve Request"
  onPress={handleApprove}
  leftIcon="check-circle"
/>

// Card component for repository items
<RepositoryCard
  name="GitGuard"
  owner="nikhilsahni7"
  description="Just-in-Time GitHub Access Control"
  onPress={() => navigateToDetails(repo.id)}
/>

// Using the project theme
import { colors, typography, spacing } from '../../styles/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.dark,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
  },
});
```

## 🔐 Authorization Flow

The mobile app interacts with Permit.io indirectly through the backend API:

1. **👤 User Authentication**: Secure login with JWT token
2. **📱 Device Registration**: Register device for push notifications
3. **📋 Access Requests**: Create access requests for specific repositories
4. **👍 Approval Flow**:
   - Admin receives push notification
   - Opens app and views request details
   - Authenticates with biometrics
   - Backend verifies and uses Permit.io to grant role

This architecture ensures:

- **🔒 Security**: Sensitive operations require biometric verification
- **🔄 Real-time Updates**: Changes in permissions are immediately reflected
- **📊 Audit Trail**: All actions are logged for compliance and transparency

## 📦 Setup and Usage

### Prerequisites

- Node.js 18+
- Yarn or npm
- Expo CLI

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/nikhilsahni7/GitGuard.git
   cd GitGuard/mobile
   ```

2. Install dependencies:

   ```
   yarn install
   ```

3. Configure the environment:
   - Copy `.env.example` to `.env` and update the API endpoints

### Running the App

```
yarn start
```

This will start the Expo development server. You can then run the app on:

- iOS simulator
- Android emulator
- Physical device using the Expo Go app

## 🤝 Integration with Permit.io

While the mobile app doesn't directly call Permit.io APIs, it consumes authorization decisions made by the backend:

1. **🔐 Permission-aware UI**: The UI adapts based on user permissions
2. **⏱️ Time-bound Access**: Shows remaining time for temporary access
3. **📋 Role-based Displays**: Shows only permitted actions based on roles
4. **🔄 Dynamic Updates**: Reflects permission changes in real-time

This creates a seamless user experience where authorization is both powerful and invisible.

## 🏁 Development Considerations

When extending the mobile app:

1. **🔒 Security First**: All sensitive operations should use biometric verification
2. **🎨 Consistent Design**: Follow the theme system in `src/styles/theme.ts`
3. **🧩 Component Reuse**: Leverage existing components for consistency
4. **📱 Responsive Design**: Test on multiple device sizes

---

**Built with ❤️ using:**
`React Native` • `Expo` • `TypeScript` • `Zustand` • `React Navigation`
