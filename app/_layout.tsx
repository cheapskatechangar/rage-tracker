// app/_layout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Root layout
// - Wraps the app with a dark theme-y default background
// - Ensures /history/[id] is a valid stack route (session detail)
// - Keeps (tabs) as the main entry
//
// If you already have a root Stack layout, replace it with this to guarantee
// navigation works for the new History screens.

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#050b18" },
        headerTintColor: "white",
        contentStyle: { backgroundColor: "#050b18" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="workout/[id]" options={{ title: "Workout" }} />
      <Stack.Screen name="history" options={{ title: "History" }} />
      <Stack.Screen name="history/[id]" options={{ title: "Session" }} />
    </Stack>
  );
}
