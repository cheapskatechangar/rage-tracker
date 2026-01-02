// app/index.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Home UX:
// - If not logged in -> /sign-in
// - If unfinished workout session exists -> Continue Workout button
// - Otherwise show Start Workout
// - Replace "Progress" label with "Programs"

import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "../src/lib/supabase";

type Unfinished = { id: string; template_id: string; started_at: string };

export default function Home() {
  const [ready, setReady] = useState(false);
  const [unfinished, setUnfinished] = useState<Unfinished | null>(null);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/sign-in");
        return;
      }

      // Find most recent unfinished session
      const userId = data.session.user.id;

      const { data: row } = await supabase
        .from("workout_sessions")
        .select("id, template_id, started_at")
        .eq("user_id", userId)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      setUnfinished(row ? (row as any) : null);
      setReady(true);
    };

    boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 14 }}>
      <Text style={{ fontSize: 34, fontWeight: "800", color: "white" }}>RAGE Tracker 💪</Text>

      <Text style={{ fontSize: 16, color: "#cbd5f5" }}>
        Tap sets done. Save weights. Get stronger. (In that order.)
      </Text>

      {unfinished ? (
        <Pressable
          onPress={() => router.push(`/workout/${unfinished.template_id}?sessionId=${unfinished.id}`)}
          style={{
            backgroundColor: "#22c55e",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#052e16", fontSize: 18, fontWeight: "800" }}>
            Continue Workout
          </Text>
          <Text style={{ color: "#052e16", fontSize: 12, fontWeight: "700", marginTop: 2 }}>
            Started {new Date(unfinished.started_at).toLocaleString()}
          </Text>
        </Pressable>
      ) : (
        <Link href="/workouts" asChild>
          <Pressable
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#052e16", fontSize: 18, fontWeight: "800" }}>Start Workout</Text>
          </Pressable>
        </Link>
      )}

      <Link href="/history" asChild>
        <Pressable
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>History</Text>
        </Pressable>
      </Link>

      <Link href="/programs" asChild>
        <Pressable
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Programs</Text>
        </Pressable>
      </Link>

      <Pressable
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace("/sign-in");
        }}
        style={{
          marginTop: 10,
          borderWidth: 1,
          borderColor: "#334155",
          paddingVertical: 12,
          borderRadius: 12,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>Log out</Text>
      </Pressable>
    </View>
  );
}
