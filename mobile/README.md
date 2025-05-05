# GitGuard Mobile App

The GitGuard mobile application is designed to provide secure repository access management on the go. This React Native application interfaces with the GitGuard backend API for authentication, profile management, and repository access controls.

## Features

- **User Authentication**: Secure login and registration with JWT token management
- **Biometric Authentication**: Optional biometric authentication for enhanced security
- **Profile Management**: View and edit user profiles
- **Repository Access**: Manage repository access and permissions
- **Access Request Approval**: Approve or deny repository access requests

## Architecture

### Directory Structure

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

### Backend Integration

The mobile app integrates with the GitGuard backend API through a set of services:

- **API Client**: Centralized API client with authentication token handling and automatic token refresh
- **Auth Service**: Manages user authentication (login, register, biometric auth)
- **User Service**: Handles user profile operations
- **Repository Service**: Manages repository access and operations
- **Access Request Service**: Handles access request creation and approval

## State Management

The app uses Zustand for state management, with the following main stores:

- **User Store**: Manages user authentication state and profile data
- **Repository Store**: Manages repository data and access permissions
- **Access Request Store**: Manages pending access requests

## UI Components

The app uses a consistent design system with reusable components:

- **Button**: Customizable button component with variants
- **Card**: Card container component for content
- **Input**: Form input component with validation
- **GradientBackground**: Background component with customizable gradient
- **ScreenHeader**: Consistent header for all screens

## Setup and Development

### Prerequisites

- Node.js 18+
- Yarn or npm
- Expo CLI

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/gitguard.git
   cd gitguard/mobile
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

### Building for Production

```
expo build:android
expo build:ios
```

## Authentication Flow

1. **Login/Registration**: User authenticates via email/password
2. **JWT Token**: Server returns JWT token stored in secure storage
3. **API Requests**: Token automatically included in API requests
4. **Token Refresh**: Automatic token refresh when expired
5. **Biometric Auth**: Optional biometric authentication for enhanced security

## Backend API Integration

The app communicates with the following API endpoints:

### Authentication

- `POST /api/auth/signup`: Register a new user
- `POST /api/auth/login`: Authenticate and receive JWT token
- `POST /api/auth/refresh`: Refresh JWT token
- `POST /api/auth/biometric/setup`: Set up biometric authentication
- `POST /api/auth/biometric/verify`: Verify biometric authentication

### User Profile

- `GET /api/users/me`: Get current user profile
- `PUT /api/users/me`: Update user profile
- `PUT /api/users/push-token`: Update push notification token

### Repositories and Access

- `GET /api/repositories`: Get user repositories
- `GET /api/access-requests`: Get pending access requests
- `POST /api/access-requests/:id/approve`: Approve access request
- `POST /api/access-requests/:id/reject`: Reject access request
