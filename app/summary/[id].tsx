// app/summary/[id].tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Workout Summary Screen
// ----------------------
// Route: /summary/[id]   (id = workout_sessions.id)
//
// Loads:
// - workout_sessions row
// - set_results for that session
// Builds summary stats (sets, exercises, reps, rest time)
// Minimal-scroll “tired lifter friendly” UI
//
// NOTE:
// To show this automatically after finishing a workout, update each workout
// screen’s finish handler to: router.replace(`/summary/${sessionId}`)

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { TEMPLATES } from "../../src/data/templates";
import type { WorkoutTemplate } from "../../src/data/types";
import { buildSessionSummary, formatDuration } from "../../src/utils/sessionSummary";

type SessionRow = {
  id: string;
  template_id: string;
  started_at: string;
  finished_at: string | null;
};

type SetResultRow = {
  exercise_name: string;
  set_index: number;
  target_kind: "reps" | "seconds";
  target_value: number;
  rest_seconds: number;
  reps_done: number | null;
  completed: boolean;
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
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hr = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const h12 = ((hr + 11) % 12) + 1;
  const ampm = hr >= 12 ? "PM" : "AM";
  return `${mm}/${dd}/${yyyy} • ${h12}:${min} ${ampm}`;
}

function safeDurationSeconds(startIso?: string, endIso?: string | null) {
  if (!startIso || !endIso) return null;
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const sec = Math.max(0, Math.floor((b - a) / 1000));
  return sec;
}

export default function WorkoutSummary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = String(id ?? "");

  const [session, setSession] = useState<SessionRow | null>(null);
  const [rows, setRows] = useState<SetResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const template = useMemo(() => {
    if (!session?.template_id) return undefined;
    return TEMPLATES.find((t) => t.id === session.template_id);
  }, [session?.template_id]);

  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      setLoading(true);

      const { data: sData, error: sErr } = await supabase
        .from("workout_sessions")
        .select("id,template_id,started_at,finished_at")
        .eq("id", sessionId)
        .single();

      if (sErr) {
        console.error("Summary session load error", sErr);
        setSession(null);
        setRows([]);
        setLoading(false);
        return;
      }

      setSession(sData as SessionRow);

      const { data: rData, error: rErr } = await supabase
        .from("set_results")
        .select("exercise_name,set_index,target_kind,target_value,rest_seconds,reps_done,completed")
        .eq("session_id", sessionId)
        .order("set_index", { ascending: true });

      if (rErr) {
        console.error("Summary set_results load error", rErr);
        setRows([]);
      } else {
        setRows((rData ?? []) as SetResultRow[]);
      }

      setLoading(false);
    };

    load();
  }, [sessionId]);

  const summary = useMemo(() => buildSessionSummary(rows), [rows]);

  const header = useMemo(() => {
    const title = template?.title ?? "Workout Summary";
    const label = workoutTypeLabel(template?.workout_type);
    const started = session?.started_at ? formatWhen(session.started_at) : "";
    const finished = session?.finished_at ? formatWhen(session.finished_at) : null;

    const durSec = safeDurationSeconds(session?.started_at, session?.finished_at ?? null);
    const duration = durSec == null ? null : formatDuration(durSec);

    return { title, label, started, finished, duration };
  }, [template?.title, template?.workout_type, session?.started_at, session?.finished_at]);

  const topExercises = useMemo(() => {
    // “Top” by total reps_done (simple + useful)
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.target_kind !== "reps") continue;
      const reps = r.reps_done ?? 0;
      map.set(r.exercise_name, (map.get(r.exercise_name) ?? 0) + reps);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [rows]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Header */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "900" }}>{header.title}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>
              {header.started ? `Started: ${header.started}` : ""}
              {header.finished ? `\nFinished: ${header.finished}` : ""}
              {header.duration ? `\nDuration: ${header.duration}` : ""}
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
            <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>{header.label}</Text>
          </View>
        </View>

        {template?.description ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#0b1220",
              padding: 12,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#cbd5e1", fontSize: 13 }}>{String(template.description)}</Text>
          </View>
        ) : null}
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
          <Text style={{ color: "white", fontWeight: "800" }}>Loading summary…</Text>
        </View>
      )}

      {!loading && (
        <>
          {/* Stats grid */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 6,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Completed sets</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
                {summary.completed_sets}/{summary.total_sets}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 6,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Exercises hit</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
                {summary.total_exercises}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 6,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Total reps</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
                {summary.total_reps}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 6,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Total rest</Text>
              <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
                {formatDuration(summary.total_rest_seconds)}
              </Text>
            </View>
          </View>

          {/* Top exercises */}
          <View
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#0b1220",
              padding: 14,
              borderRadius: 18,
              gap: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              Top exercises (by reps)
            </Text>

            {topExercises.length === 0 ? (
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                No rep data found for this session.
              </Text>
            ) : (
              topExercises.map(([name, reps]) => (
                <View
                  key={name}
                  style={{
                    borderWidth: 1,
                    borderColor: "#1f2a44",
                    backgroundColor: "#071024",
                    padding: 10,
                    borderRadius: 14,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <Text style={{ color: "#cbd5e1", fontSize: 13, flex: 1 }}>{name}</Text>
                  <Text style={{ color: "white", fontWeight: "900" }}>{reps}</Text>
                </View>
              ))
            )}
          </View>

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => router.push("/(tabs)")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: "#2563eb",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 14 }}>Back to Workouts</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/history/${sessionId}`)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900", fontSize: 14 }}>View Session</Text>
            </Pressable>
          </View>

          <View
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#071024",
              padding: 12,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>
              Pro tip: If today felt brutal… congrats, that’s the feature working 😅
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
