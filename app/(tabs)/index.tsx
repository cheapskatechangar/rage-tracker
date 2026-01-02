// app/(tabs)/index.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Workout picker (Templates list)
// - Pulls from src/data/templates.ts
// - Groups by program_name (if present)
// - Navigates to /workout/[id] via router.push(`/workout/${template.id}`)
// - Works for ALL workout_type values including "conditioning_circuits"

import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { TEMPLATES } from "../../src/data/templates";
import type { WorkoutTemplate } from "../../src/data/types";

type Group = {
  key: string;
  title: string;
  templates: WorkoutTemplate[];
};

function normalize(s: unknown) {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function workoutTypeLabel(t: WorkoutTemplate["workout_type"]) {
  switch (t) {
    case "fibonacci":
      return "FIBONACCI";
    case "progressive_super_sets":
      return "SUPER SETS";
    case "timed_sets":
      return "TIMED SETS";
    case "conditioning_circuits":
      return "CIRCUITS";
    default:
      return "WORKOUT";
  }
}

export default function HomeTab() {
  const [q, setQ] = useState("");

  const groups: Group[] = useMemo(() => {
    const query = normalize(q);

    // Sort templates in a predictable order: program, then week/day if available, then title
    const sorted = [...TEMPLATES].sort((a, b) => {
      const ap = normalize(a.program_name ?? a.program_key ?? "");
      const bp = normalize(b.program_name ?? b.program_key ?? "");
      if (ap !== bp) return ap.localeCompare(bp);

      const aw = Number(a.week ?? 999);
      const bw = Number(b.week ?? 999);
      if (aw !== bw) return aw - bw;

      const ad = Number(a.day ?? 999);
      const bd = Number(b.day ?? 999);
      if (ad !== bd) return ad - bd;

      return normalize(a.title).localeCompare(normalize(b.title));
    });

    const filtered = query
      ? sorted.filter((t) => {
          const blob = normalize(
            [
              t.title,
              t.description,
              t.program_name,
              t.program_key,
              t.workout_type,
              t.week,
              t.day,
            ].join(" ")
          );
          return blob.includes(query);
        })
      : sorted;

    const map = new Map<string, Group>();

    for (const t of filtered) {
      const groupTitle =
        (t.program_name as string | undefined) ??
        (t.program_key as string | undefined) ??
        "Workouts";

      const key = normalize(groupTitle) || "workouts";

      if (!map.has(key)) {
        map.set(key, { key, title: groupTitle, templates: [] });
      }
      map.get(key)!.templates.push(t);
    }

    return Array.from(map.values());
  }, [q]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Workouts</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14 }}>
          Pick a template and go. Minimal scrolling, maximum sweat.
        </Text>
      </View>

      {/* Search */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#334155",
          backgroundColor: "#071024",
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search (e.g., circuits, week 2, timed, day 3)..."
          placeholderTextColor="#64748b"
          style={{ color: "white", fontSize: 14 }}
        />
      </View>

      {/* Groups */}
      {groups.map((g) => (
        <View key={g.key} style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>{g.title}</Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {g.templates.length} template{g.templates.length === 1 ? "" : "s"}
            </Text>
          </View>

          {g.templates.map((t) => {
            const week = t.week != null ? `W${t.week}` : null;
            const day = t.day != null ? `D${t.day}` : null;
            const meta = [week, day].filter(Boolean).join(" • ");

            return (
              <Pressable
                key={t.id}
                onPress={() => router.push(`/workout/${t.id}`)}
                style={{
                  borderWidth: 1,
                  borderColor: "#334155",
                  backgroundColor: "#0b1220",
                  padding: 14,
                  borderRadius: 18,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
                      {t.title}
                    </Text>
                    {meta ? (
                      <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{meta}</Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#334155",
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 999,
                      alignSelf: "flex-start",
                      backgroundColor: "#071024",
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>
                      {workoutTypeLabel(t.workout_type)}
                    </Text>
                  </View>
                </View>

                {t.description ? (
                  <Text style={{ color: "#94a3b8", fontSize: 13 }} numberOfLines={2}>
                    {String(t.description)}
                  </Text>
                ) : null}

                <Text style={{ color: "#64748b", fontSize: 12 }}>
                  Tap to start →
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      {groups.length === 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            padding: 16,
            borderRadius: 18,
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>No matches</Text>
          <Text style={{ color: "#94a3b8", marginTop: 6 }}>
            Try a different search (like “circuits” or “week 1”).
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
