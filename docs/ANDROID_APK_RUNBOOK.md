# Build your first native Rage Tracker APK

This workflow is **manual-only** and does not publish to Google Play. It has not yet been used to produce an APK.

## One-time Expo setup
1. Sign in to your Expo account in a local checkout of this repository.
2. Run `npx eas-cli init` and review/commit the generated `expo.extra.eas.projectId` in `app.json`. This links the project to your Expo account.
3. Run an interactive first Android preview build locally: `npx eas-cli build -p android --profile preview`. This allows you to configure Android signing credentials in Expo securely. Never put keystore passwords or signing material in GitHub.
4. Create an Expo **access token** in your Expo account. In GitHub repository **Settings → Secrets and variables → Actions**, add `EXPO_TOKEN`.
5. In the same GitHub Actions secrets interface, add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` for the intended beta Supabase project. These values are bundled into a mobile app and must be considered public. Never use a service-role key.
6. Open **Actions → Build Android test APK → Run workflow** on `main`.

## What the action does
- Stops with a clear error if essential configuration is missing.
- Runs a clean install and TypeScript checks.
- Queues an Android `preview` APK on EAS.
- Does not distribute a build publicly or submit it to any store.
- The actual APK link appears in the resulting EAS build record after EAS finishes; success of a GitHub workflow just confirms the build request was queued.

## Before sharing
Review Supabase RLS and auth isolation, real-device workout interruption/recovery, and dependency advisories. APK testers may need to enable installation from the download source.

No account credentials, token, APK, or Expo project ID have been provisioned by this repository change.
