# HandyCook - React Native App Implementation Plan

## Overview
A recipe management app with gamification: users "unlock" recipes by scanning foods they have. MVP focuses on recipes + scanning; meal planning comes later.

## Tech Stack
- **Frontend**: React Native + Expo (Bare workflow)
- **Backend**: AWS Lambda + API Gateway + DynamoDB
- **Auth**: AWS Cognito
- **ML**: TensorFlow Lite (on-device) + AWS Rekognition/GPT-4 Vision (cloud)
- **Barcode**: expo-barcode-scanner or react-native-vision-camera

---

## Project Structure

```
handy-cook/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth screens (login, signup)
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home/Dashboard
│   │   ├── recipes.tsx           # Recipe browser
│   │   ├── scan.tsx              # Scanner screen
│   │   ├── pantry.tsx            # Pantry inventory
│   │   └── profile.tsx           # User profile
│   ├── recipe/[id].tsx           # Recipe detail
│   └── _layout.tsx               # Root layout
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── RecipeCard.tsx
│   │   ├── IngredientList.tsx
│   │   ├── ScannerOverlay.tsx
│   │   └── UnlockProgress.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePantry.ts
│   │   ├── useRecipes.ts
│   │   └── useScanner.ts
│   ├── services/                 # API & external services
│   │   ├── api.ts                # API client
│   │   ├── auth.ts               # Cognito integration
│   │   ├── imageRecognition.ts   # ML processing
│   │   └── barcodeService.ts     # Barcode lookup
│   ├── store/                    # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── pantryStore.ts
│   │   └── recipeStore.ts
│   ├── utils/                    # Helpers
│   │   └── recipeParser.ts       # URL recipe extraction
│   └── types/                    # TypeScript types
│       └── index.ts
├── assets/                       # Images, fonts
├── ml-models/                    # TensorFlow Lite models
├── android/                      # Native Android
├── ios/                          # Native iOS
├── infrastructure/               # AWS CDK/SAM
│   ├── lib/
│   │   └── handy-cook-stack.ts
│   └── cdk.json
└── app.json                      # Expo config
```

---

## AWS Architecture

### DynamoDB Tables

**Users Table**
```
PK: USER#<userId>
SK: PROFILE
Attributes: email, displayName, avatarUrl, createdAt, achievements[]
GSI1: email-index (for lookup by email)
```

**Recipes Table**
```
PK: RECIPE#<recipeId>
SK: META
Attributes: title, description, imageUrl, cuisine, prepTime, cookTime,
            servings, ingredients[], steps[], tags[], isPublic, authorId
GSI1: cuisine-index
GSI2: author-index
```

**Pantry Table**
```
PK: USER#<userId>
SK: ITEM#<itemId>
Attributes: name, quantity, unit, category, expiresAt, addedVia (manual|barcode|image), barcode?
GSI1: user-expiry-index (for expiration alerts)
```

**UserRecipes Table** (unlocks, favorites, etc.)
```
PK: USER#<userId>
SK: RECIPE#<recipeId>
Attributes: isFavorite, unlockProgress, unlockedAt?, notes
```

### Lambda Functions

| Function | Route | Purpose |
|----------|-------|---------|
| auth-handler | POST /auth/* | Cognito triggers |
| recipes-get | GET /recipes | List/search recipes |
| recipes-crud | POST/PUT/DELETE /recipes | Recipe management |
| recipe-import | POST /recipes/import | URL extraction |
| pantry-crud | GET/POST/PUT/DELETE /pantry | Pantry management |
| scan-barcode | POST /scan/barcode | Lookup barcode in food DB |
| scan-image | POST /scan/image | Cloud image recognition |
| user-progress | GET /user/progress | Unlock stats & achievements |

### Cognito Setup
- User Pool with email/password
- Optional social providers (Google, Apple)
- Custom attributes: displayName

---

## Key Dependencies

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "expo-camera": "~16.x",
  "expo-barcode-scanner": "~13.x",
  "@tensorflow/tfjs": "^4.x",
  "@tensorflow/tfjs-react-native": "^1.x",
  "amazon-cognito-identity-js": "^6.x",
  "aws-sdk": "^2.x or @aws-sdk/client-*",
  "zustand": "^4.x",
  "@tanstack/react-query": "^5.x",
  "react-native-reanimated": "~3.x",
  "nativewind": "^4.x",
  "react-native-mmkv": "^2.x"
}
```

---

## Implementation Order

### Phase 1: Project Foundation ✅
- [x] Initialize Expo bare project: `npx create-expo-app handy-cook --template bare-minimum`
- [x] Configure TypeScript, ESLint, Prettier
- [x] Set up Expo Router for navigation
- [x] Install and configure NativeWind (Tailwind CSS)
- [x] Create basic folder structure

### Phase 2: Authentication (~60% Complete)
- [ ] Set up AWS Cognito User Pool (via CDK or console)
- [x] Implement auth service with amazon-cognito-identity-js (`src/services/auth.ts`)
- [x] Create login/signup/forgot-password screens (`app/(auth)/`)
- [x] Build auth state management (Zustand) (`src/store/authStore.ts`)
- [ ] Add protected route wrapper

### Phase 3: Recipe System (~40% Complete)
- [ ] Design and deploy DynamoDB tables
- [ ] Build Lambda functions for recipe CRUD
- [x] Create recipe list screen with search/filter (`app/(tabs)/recipes.tsx`)
- [x] Build recipe detail view (`app/recipe/[id].tsx`)
- [ ] Implement manual recipe entry form
- [ ] Add URL import with recipe parser (use OpenAI or regex-based extraction)

### Phase 4: Pantry & Scanning (~60% Complete)
- [x] Implement pantry CRUD (local + API sync) (`src/store/pantryStore.ts`, `src/hooks/usePantry.ts`)
- [ ] Add barcode scanner with expo-barcode-scanner
- [x] Integrate barcode lookup API (Open Food Facts) (`src/services/barcodeService.ts`)
- [~] Set up TensorFlow Lite with food detection model (placeholder in `src/services/imageRecognition.ts`)
- [~] Build cloud image recognition fallback (placeholder in `src/services/imageRecognition.ts`)
- [x] Create scanner UI with mode toggle (`app/(tabs)/scan.tsx`)

### Phase 5: Recipe Unlocking (Gamification) (~30% Complete)
- [ ] Calculate unlock progress (pantry items vs recipe ingredients)
- [ ] Build "What Can I Make?" filtered view
- [x] Add unlock progress UI to recipe cards (`src/components/UnlockProgress.tsx`)
- [ ] Implement achievements system
- [x] Create dashboard with stats (`app/(tabs)/index.tsx`)

### Phase 6: Polish & Launch Prep (0% Complete)
- [ ] Offline support with MMKV caching
- [ ] Push notifications (recipe suggestions, expiring items)
- [ ] Error handling & loading states
- [ ] App icons and splash screen
- [ ] EAS Build configuration
- [ ] TestFlight / Play Store internal testing

---

## Critical Files to Create First

- [x] `app.json` - Expo configuration
- [x] `app/_layout.tsx` - Root navigation layout
- [x] `src/services/auth.ts` - Cognito integration
- [x] `src/services/api.ts` - API client with auth headers
- [x] `src/store/authStore.ts` - Auth state
- [ ] `infrastructure/lib/handy-cook-stack.ts` - AWS CDK stack

---

## Decisions Made

- **Recipe Database**: Dual source - Spoonacular + Edamam APIs
  - Spoonacular for broad recipe coverage
  - Edamam for nutrition data and dietary filters
  - Cache popular recipes in DynamoDB for performance

- **Barcode Database**: Multi-source fallback strategy
  - Primary: Open Food Facts (free, 3M+ products)
  - Fallback: UPC Database API or similar commercial API
  - Cache successful lookups in DynamoDB

- **Sync Strategy**: Hybrid offline/online
  - Offline: Pantry inventory, favorites, scan history, cached recipes
  - Online: Recipe search, new recipe imports, user profile sync
  - Use MMKV for local storage, sync queue for pending changes

- **TensorFlow Model**: Start with existing food detection model
  - Use MobileNet or similar pre-trained model for initial detection
  - Cloud fallback (Rekognition/GPT-4 Vision) for precise identification

---

## External API Keys Needed

1. **Spoonacular API** - Recipe data
2. **Edamam API** - Recipe + nutrition data
3. **AWS credentials** - Lambda, DynamoDB, Cognito, Rekognition
4. **OpenAI API** (optional) - GPT-4 Vision for image recognition fallback
