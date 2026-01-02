// app/workouts.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// /workouts is deprecated. Keep route for safety and redirect users to /programs.

import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";

export default function WorkoutsDeprecatedRedirect() {
  useEffect(() => {
    router.replace("/programs");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 20 }}>
      <ActivityIndicator />
      <Text style={{ color: "#94a3b8" }}>Redirecting to Programs…</Text>
    </View>
  );
}
