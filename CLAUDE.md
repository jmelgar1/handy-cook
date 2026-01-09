# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (requires dev client)
npm run start

# Run on platforms
npm run android
npm run ios
npm run web

# Code quality
npm run lint          # Check for linting issues
npm run lint:fix      # Auto-fix linting issues
npm run format        # Format code with Prettier
```

## Architecture Overview

HandyCook is a React Native recipe management app with gamification features built using Expo SDK 54 with the bare workflow.

### Tech Stack
- **Framework**: React Native + Expo (bare workflow)
- **Navigation**: Expo Router with file-based routing
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Authentication**: AWS Cognito via amazon-cognito-identity-js
- **Backend** (planned): AWS Lambda + API Gateway + DynamoDB

### Project Structure

```
app/                    # Expo Router screens (file-based routing)
├── (auth)/            # Auth screens (login, signup, forgot-password)
├── (tabs)/            # Main tab navigation (home, recipes, scan, pantry, profile)
├── recipe/[id].tsx    # Dynamic recipe detail route
└── _layout.tsx        # Root layout with Stack navigator

src/
├── components/        # Reusable UI components
├── hooks/             # Custom React hooks (useAuth, usePantry)
├── services/          # External integrations (API, auth, barcode, image recognition)
├── store/             # Zustand stores (authStore, pantryStore, recipeStore)
├── types/             # TypeScript type definitions
└── utils/             # Helper utilities
```

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@hooks/*` → `src/hooks/*`
- `@services/*` → `src/services/*`
- `@store/*` → `src/store/*`
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`

### State Management Pattern

Zustand stores in `src/store/` use the persist middleware with AsyncStorage:
- `authStore.ts` - User session, tokens, auth state
- `pantryStore.ts` - User's pantry inventory
- `recipeStore.ts` - Recipe data and user progress

### API Integration

`src/services/api.ts` provides a centralized API client that:
- Automatically includes auth headers from authStore
- Exposes typed endpoint functions (recipeApi, pantryApi, scanApi, userApi)
- Base URL from `EXPO_PUBLIC_API_URL` env variable

### Custom Theme

The primary color palette (green) is defined in `tailwind.config.js` with shades from 50-900.

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `EXPO_PUBLIC_API_URL` - Backend API base URL
- Cognito pool configuration (see auth service)
