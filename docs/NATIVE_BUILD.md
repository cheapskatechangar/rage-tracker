# Native Android and iOS build setup

Rage Tracker remains a React Native/Expo app. The campaign website is separate; testers should receive native builds.

## Build profiles
- `preview` generates an installable **Android APK** and an internal-distribution iOS build when eligible.
- `development` requires an Expo development client dependency, which is **not** installed yet. Do not use this profile until added.
- `production` uses store-oriented builds, not a direct-download APK.

## Steps to create the first APK
1. Install dependencies with `npm ci`.
2. Run `npx tsc --noEmit` and `npx expo-doctor`; fix failures first.
3. Provide `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as build environment variables. These are public client values, **never** the service-role key.
4. Create or connect an Expo account and run `npx eas-cli build:configure` if the project is not linked. This may add a project ID to Expo config; review generated changes.
5. Run `npx eas-cli build --platform android --profile preview`.
6. Install the resulting APK on a test Android phone and verify account isolation, all four workout types, resume, backgrounding, offline behavior, and sign-out.

An APK can be shared privately, but Android testers might need to approve installing from that source. Avoid publicly posting unreviewed APK files. For iOS, normal distribution to other people requires Apple-managed signing and commonly a paid developer membership.

## Naming, signing, and release safety
The Android application ID `com.changar.ragetracker` and iOS bundle identifier with the same value are **provisional**. Confirm these are owned/available before store submission and don't change them casually after publishing.

No EAS project has been linked, no credentials were uploaded, no app was built, and nothing was submitted to a store by this setup change.

## Before external beta
- Confirm Supabase RLS for `workout_sessions` and `set_results` with separate tester accounts.
- Audit screen-specific data access and local draft storage.
- Add stable per-set persistence with retry/idempotency.
- Establish privacy disclosures and support contact.
- Review Expo/SDK compatibility and app store policies.
