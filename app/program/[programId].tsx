// Legacy program detail route was based on a retired data schema.
// The current program picker lives at /programs.
import { useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function LegacyProgramRedirect() {
  useEffect(() => {
    router.replace("/programs");
  }, []);
  return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator /></View>;
}
