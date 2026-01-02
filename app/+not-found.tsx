import { Link } from "expo-router";
import { View, Text } from "react-native";

export default function NotFound() {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 10 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
        Page not found
      </Text>
      <Link href="/" style={{ color: "#22c55e", fontSize: 18 }}>
        Go Home
      </Link>
    </View>
  );
}
