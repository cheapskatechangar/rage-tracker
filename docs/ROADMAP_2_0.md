# Rage Tracker 2.0: Mobile-first launch

**Product direction:** an installable iPhone and Android workout app, not a web-only beta.

## Current foundations
- Expo 54, React Native, TypeScript, Expo Router, Supabase.
- Four training modes: Fibonacci pyramids, progressive supersets, timed sets, conditioning circuits.
- Workout sessions, saved weights, resume flow, history and summaries exist in source.
- These flows have **not** yet been verified on real devices.
- The `campaign/index.html` page is a standalone fundraising campaign prototype, not the product app.

## Release principles
1. Ship an actual native app to invited testers before public marketing.
2. Preserve existing programs and workout history.
3. Make recording sets fast and durable, including when network connectivity drops.
4. Keep the core tracking deterministic. AI guidance is opt-in and comes later.
5. Personal workout and health information stays private. Validate RLS and authorization on every data-access path.
6. Don't accept contributions until a real payment provider and accounting/disclosure workflow are configured.
7. Don't describe optional project support as a tax-deductible donation. No pay-to-download promise.
8. No public claims about app availability until a build is tested or a store listing is live.

## Sprint 1: Native readiness (next)
- [ ] Confirm app boots on both Android and iPhone through development builds.
- [ ] Run TypeScript and Expo diagnostics; establish CI checks.
- [ ] Audit Supabase schema, RLS policies and ownership checks on sessions/results.
- [ ] Replace end-of-workout-only inserts with reliable per-set persistence and safe resume.
- [ ] Fix duration-versus-repetitions schema distinction for timed sets.
- [ ] Verify duplicate submit protection, network interruption, sign-out and data isolation.
- [ ] Review auth/session persistence across native app restarts.
- [ ] Add basic crash/error instrumentation with no sensitive payloads.
- [ ] Configure identifiers, app icon, splash screen, privacy policy and support contact.
- [ ] Build installable Android test artifact and iOS development/TestFlight path.

## Sprint 2: Private beta
- [ ] Recruit testers and gather consent for testing.
- [ ] Provide actual native install instructions per platform.
- [ ] Add in-app feedback and issue intake that excludes personal health details by default.
- [ ] Test setup, first workout, history, and recovery from interrupted workout.
- [ ] Use feedback to fix the top friction points.

## Sprint 3: Community funding campaign
- [x] Add a responsive campaign prototype with honest status and $500 proposed goal.
- [ ] Review campaign copy and branding.
- [ ] Select a supported payment provider, connect a verified account, and disclose platform/processing fees.
- [ ] Replace disabled support UI only after the payment destination works.
- [ ] Add a privacy-conscious email signup only with a backend, explicit consent, and privacy notice.
- [ ] Deploy the campaign page at a dedicated site/address; do not confuse it with the native app.
- [ ] Publish real images or recordings only after tested builds exist.
- [ ] Update goal/progress from verified contributions, not invented numbers.

## Sprint 4: Public mobile launch
- [ ] Complete Play Console and App Store Connect requirements, app privacy labels, content disclosures, and platform reviews.
- [ ] Account for applicable Google Play closed-testing eligibility rules.
- [ ] Publish the approved native apps.
- [ ] Monitor crashes, store feedback and security incidents.

## Estimated expenses
- Apple Developer Program: approximately $99/year.
- Google Play developer registration: approximately $25 one-time.
- App infrastructure and native builds: start with eligible free tiers, monitor usage.
- AI inference, payment fees, compliance, paid hosting, and taxes may add costs.
- The $500 campaign figure is a **proposed goal, not money raised**.

## Campaign preview
Open `campaign/index.html` locally in a browser. This page is intentionally static, with no backend, mailing list, or live payments. When hosting is configured, use `campaign/` as the deploy root.

## Repo policy
All development work should use feature branches and pull requests with validation before merge. Do not add API secrets or service role keys to the React Native bundle or campaign files.
