import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) return Alert.alert("Sign-up failed", error.message);

    Alert.alert("Account created", "Now sign in.");
    router.replace("/sign-in");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "800" }}>
        Create Account
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        style={{
          borderWidth: 1,
          borderColor: "#334155",
          borderRadius: 12,
          padding: 12,
          color: "white",
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Password (6+ chars)"
        placeholderTextColor="#94a3b8"
        style={{
          borderWidth: 1,
          borderColor: "#334155",
          borderRadius: 12,
          padding: 12,
          color: "white",
        }}
      />

      <Pressable
        onPress={onSignUp}
        disabled={loading}
        style={{
          backgroundColor: "#22c55e",
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#052e16", fontSize: 18, fontWeight: "700" }}>
          {loading ? "Creating..." : "Create Account"}
        </Text>
      </Pressable>

      <Link href="/sign-in" style={{ color: "#cbd5f5", marginTop: 8 }}>
        Already have an account? Sign in
      </Link>
    </View>
  );
}
