# Multi-Agent Claude Code Workflow System

## Overview

Create a 3-agent system for managing Android and iOS development in this Expo React Native project:

1. **Main Orchestrator** (`/main-agent`) - Full oversight and coordination
2. **Android Agent** (`/android-agent`) - Full Android build pipeline
3. **iOS Agent** (`/ios-agent`) - Full iOS build pipeline

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    /main-agent                          │
│         (Orchestrator - Full Oversight)                 │
│                                                         │
│  • Analyzes requests & delegates tasks                  │
│  • Makes shared code changes (src/, app/)               │
│  • Runs cross-platform validation                       │
│  • Tracks feature parity between platforms              │
│  • Coordinates agent outputs                            │
└─────────────────┬───────────────────┬───────────────────┘
                  │                   │
                  ▼                   ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│    /android-agent       │   │      /ios-agent         │
│  (Full Build Pipeline)  │   │  (Full Build Pipeline)  │
│                         │   │                         │
│ • Edit Android configs  │   │ • Edit iOS configs      │
│ • Run expo run:android  │   │ • Run expo run:ios      │
│ • Gradle troubleshooting│   │ • Xcode/CocoaPods fixes │
│ • Track permissions     │   │ • Track permissions     │
│ • Track build health    │   │ • Track build health    │
│ • Native code changes   │   │ • Native code changes   │
└─────────────────────────┘   └─────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.claude/commands/main-agent.md` | **Rewrite** | Full oversight orchestrator |
| `.claude/commands/android-agent.md` | **Create** | Android build pipeline agent |
| `.claude/commands/ios-agent.md` | **Create** | iOS build pipeline agent |
| `docs/platform-status.md` | **Create** | Shared status tracking file for agents |

---

## Command Specifications

### 1. Main Orchestrator (`/main-agent`)

**Responsibilities:**
- Analyze incoming requests and determine scope
- Delegate to platform agents when appropriate
- Handle all shared code changes (components, hooks, stores, services)
- Run cross-platform consistency checks
- Maintain `docs/platform-status.md` with overall status
- Validate feature parity after platform-specific changes

**Workflow:**
1. Parse user request
2. Scan shared codebase for context
3. Determine if task is shared, Android-only, iOS-only, or both
4. Execute shared work directly
5. Instruct user to run platform agents when needed
6. After platform work, validate cross-platform consistency

**Key Commands to Execute:**
- `npm run lint` - Code quality
- File reads/edits for shared code
- Status reporting

---

### 2. Android Agent (`/android-agent`)

**Responsibilities:**
- Full Android build pipeline management
- Edit platform configs: `app.json` (android section), `android/` directory
- Run and troubleshoot builds: `npm run android`
- Track Android permissions (camera, storage, location)
- Monitor Gradle health and dependencies
- Create `.android.tsx` platform-specific files when needed
- Native Kotlin/Java code changes in `android/app/src/`

**Auto-Tracking Checklist:**
```
## Android Status
- [ ] Build: [passing/failing/untested]
- [ ] Gradle sync: [ok/issues]
- [ ] Permissions configured:
  - [ ] Camera
  - [ ] Storage
  - [ ] Location
- [ ] Native modules: [list]
- [ ] Last build output: [summary]
```

**Key Commands to Execute:**
- `npm run android` - Build and run
- `cd android && ./gradlew assembleDebug` - Debug build
- `cd android && ./gradlew dependencies` - Check dependencies
- File edits in `android/` and `app.json`

---

### 3. iOS Agent (`/ios-agent`)

**Responsibilities:**
- Full iOS build pipeline management
- Edit platform configs: `app.json` (ios section), `ios/` directory
- Run and troubleshoot builds: `npm run ios`
- Track iOS permissions (camera, photos, location)
- Monitor CocoaPods and Xcode project health
- Create `.ios.tsx` platform-specific files when needed
- Native Swift/Objective-C code changes in `ios/handycook/`

**Auto-Tracking Checklist:**
```
## iOS Status
- [ ] Build: [passing/failing/untested]
- [ ] CocoaPods: [ok/issues]
- [ ] Permissions configured:
  - [ ] NSCameraUsageDescription
  - [ ] NSPhotoLibraryUsageDescription
  - [ ] NSLocationWhenInUseUsageDescription
- [ ] Native modules: [list]
- [ ] Last build output: [summary]
```

**Key Commands to Execute:**
- `npm run ios` - Build and run
- `cd ios && pod install` - Install CocoaPods
- `cd ios && xcodebuild -list` - Check Xcode project
- File edits in `ios/` and `app.json`

---

## Platform Status Tracking File

Create `docs/platform-status.md` for agents to update:

```markdown
# Platform Status

Last updated: [timestamp]

## Cross-Platform
- Feature parity: [yes/no - list differences]
- Shared code health: [status]

## Android
- Build status: [passing/failing]
- Last tested: [date]
- Permissions: [configured/missing]
- Issues: [list]

## iOS
- Build status: [passing/failing]
- Last tested: [date]
- Permissions: [configured/missing]
- Issues: [list]

## Action Items
- [ ] [pending items from each agent]
```

---

## Usage Flow

```
User: "Add camera scanning feature"
         │
         ▼
    /main-agent
         │
         ├─► Identifies: needs shared UI + platform permissions
         │
         ├─► Creates shared component in src/components/
         │
         ├─► Updates docs/platform-status.md
         │
         └─► Instructs: "Run /android-agent and /ios-agent
                         to configure camera permissions"

         │
    ┌────┴────┐
    ▼         ▼
/android   /ios-agent
-agent
    │         │
    ├─► Adds  ├─► Adds NSCameraUsageDescription
    │   perm  │   to Info.plist
    │         │
    ├─► Tests ├─► Tests build
    │   build │
    │         │
    └─► Updates status ◄─┘
         │
         ▼
    User runs /main-agent again
         │
         └─► Validates both platforms configured correctly
```

---

## Implementation Order

1. **Create `docs/platform-status.md`** - Status tracking file
2. **Rewrite `/main-agent`** - Full oversight orchestrator
3. **Create `/android-agent`** - Full build pipeline
4. **Create `/ios-agent`** - Full build pipeline
5. **Test the workflow** - Run each command to verify

---

## Key Project Files Referenced by Agents

**Shared (Main Agent):**
- `app/` - All screens
- `src/` - Components, hooks, services, stores, types
- `package.json` - Dependencies
- `docs/platform-status.md` - Status tracking

**Android Agent:**
- `app.json` → `expo.android` section
- `android/app/build.gradle` - Build config
- `android/gradle.properties` - Build properties
- `android/app/src/main/java/com/handycook/` - Native code

**iOS Agent:**
- `app.json` → `expo.ios` section
- `ios/Podfile` - CocoaPods dependencies
- `ios/handycook/Info.plist` - Permissions & config
- `ios/handycook/` - Native Swift code
