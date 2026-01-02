// app/history.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// History screen
// - Lists recent workout_sessions
// - Shows template title + workout type badge (supports conditioning_circuits)
// - Taps through to /history/[id] (session detail screen)

import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { supabase } from "../src/lib/supabase";
import { router } from "expo-router";
import { TEMPLATES } from "../src/data/templates";
import type { WorkoutTemplate } from "../src/data/types";

type SessionRow = {
  id: string;
  template_id: string;
  started_at: string;
  finished_at: string | null;
};

function workoutTypeLabel(t: WorkoutTemplate["workout_type"] | undefined) {
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

function formatWhen(iso: string) {
  const d = new Date(iso);
  // Simple local format, no dependency
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hr = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const h12 = ((hr + 11) % 12) + 1;
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${mm}/${dd}/${yy} • ${h12}:${min} ${ampm}`;
}

export default function History() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const templateById = useMemo(() => {
    const m = new Map<string, WorkoutTemplate>();
    for (const t of TEMPLATES) m.set(t.id, t);
    return m;
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("workout_sessions")
        .select("id,template_id,started_at,finished_at")
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("History load error", error);
        setRows([]);
      } else {
        setRows((data ?? []) as SessionRow[]);
      }
      setLoading(false);
    };

    load();
  }, []);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>History</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14 }}>
          Your recent sessions. Tap one for the breakdown.
        </Text>
      </View>

      {loading && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            padding: 14,
            borderRadius: 18,
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>Loading…</Text>
        </View>
      )}

      {!loading && rows.length === 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            padding: 16,
            borderRadius: 18,
            gap: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>No sessions yet</Text>
          <Text style={{ color: "#94a3b8" }}>
            Start a workout and it’ll show up here (and your future self will thank you).
          </Text>
        </View>
      )}

      {!loading &&
        rows.map((r) => {
          const t = templateById.get(r.template_id);
          const title = t?.title ?? "Unknown Template";
          const label = workoutTypeLabel(t?.workout_type);

          const metaLeft = formatWhen(r.started_at);
          const metaRight = r.finished_at ? "Finished" : "In progress";

          return (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/history/${r.id}`)}
              style={{
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
                    {title}
                  </Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>
                    {metaLeft} • {metaRight}
                  </Text>
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
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>{label}</Text>
                </View>
              </View>

              <Text style={{ color: "#64748b", fontSize: 12 }}>Tap to view →</Text>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}
