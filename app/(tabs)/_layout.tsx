// app/(tabs)/_layout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Tabs layout
// Ensures History tab exists and routes to app/history.tsx
//
// If your project already has a different tabs layout, replace this file with this
// to guarantee History is accessible while we test Conditioning Circuits end-to-end.

import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: { backgroundColor: "#050b18", borderTopColor: "#1f2a44" },
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#64748b",
        headerStyle: { backgroundColor: "#050b18" },
        headerTintColor: "white",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Workouts",
        }}
      />
      <Tabs.Screen
        name="../history"
        options={{
          title: "History",
        }}
      />
    </Tabs>
  );
}
