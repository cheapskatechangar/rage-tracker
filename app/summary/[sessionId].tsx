// app/summary/[sessionId].tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Summary screen ("dopamine receipt"):
// - Fetch workout_session + set_results
// - Compute duration, sets completed, volume, reps
// - Group by exercise_name for a clean breakdown
// - Actions: Repeat workout, Home, History
//
// Notes:
// - Your DB target_kind constraint is tight, so we don't rely on it too much.
// - Timed sets store target_value as seconds but still write target_kind "reps" (DB-safe).
//   We'll infer "seconds" by label if it starts with "RAGE SET —".

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { TEMPLATES } from "../../src/data/templates";

type SessionRow = {
  id: string;
  user_id: string;
  template_id: string;
  started_at: string;
  finished_at: string | null;
};

type SetRow = {
  session_id: string;
  template_id: string;
  exercise_id: string;
  exercise_name: string;
  set_index: number;
  target_kind: string;
  target_value: number;
  rest_seconds: number;
  weight: number | null;
  reps_done: number | null;
  completed: boolean;
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function fmtDuration(startIso: string, endIso?: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "";
  const secs = Math.floor((end - start) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m <= 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function isTimedByLabel(exerciseName: string) {
  return String(exerciseName || "").startsWith("RAGE SET —");
}

export default function SummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionRow | null>(null);
  const [sets, setSets] = useState<SetRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const template = useMemo(() => {
    const id = String(session?.template_id ?? "");
    return TEMPLATES.find((t: any) => t.id === id);
  }, [session?.template_id]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const sid = String(sessionId ?? "").trim();
      if (!sid) {
        setError("Missing session id.");
        setLoading(false);
        return;
      }

      const { data: sRow, error: sErr } = await supabase
        .from("workout_sessions")
        .select("id,user_id,template_id,started_at,finished_at")
        .eq("id", sid)
        .maybeSingle();

      if (cancelled) return;

      if (sErr || !sRow) {
        setError(sErr?.message ?? "Could not load workout session.");
        setLoading(false);
        return;
      }

      const { data: setRows, error: rErr } = await supabase
        .from("set_results")
        .select(
          "session_id,template_id,exercise_id,exercise_name,set_index,target_kind,target_value,rest_seconds,weight,reps_done,completed"
        )
        .eq("session_id", sid)
        .order("set_index", { ascending: true });

      if (cancelled) return;

      if (rErr) {
        setError(rErr.message);
        setSession(sRow as any);
        setSets([]);
        setLoading(false);
        return;
      }

      setSession(sRow as any);
      setSets((setRows ?? []) as any);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const stats = useMemo(() => {
    const total = sets.length;
    const completed = sets.filter((s) => !!s.completed).length;

    // For volume + reps: only count completed sets where we have numeric reps + weight
    let totalReps = 0;
    let totalVolume = 0;

    for (const s of sets) {
      if (!s.completed) continue;

      const reps = typeof s.reps_done === "number" ? s.reps_done : null;
      const w = typeof s.weight === "number" ? s.weight : null;

      if (typeof reps === "number") totalReps += reps;
      if (typeof reps === "number" && typeof w === "number") totalVolume += w * reps;
    }

    return { total, completed, totalReps, totalVolume };
  }, [sets]);

  const grouped = useMemo(() => {
    // group by exercise_name
    const map = new Map<
      string,
      {
        name: string;
        isTimed: boolean;
        lastWeight: number | null;
        completedCount: number;
        totalCount: number;
        items: SetRow[];
      }
    >();

    for (const s of sets) {
      const name = String(s.exercise_name ?? "Exercise").trim();
      const g = map.get(name) ?? {
        name,
        isTimed: isTimedByLabel(name),
        lastWeight: null,
        completedCount: 0,
        totalCount: 0,
        items: [] as SetRow[],
      };

      g.totalCount += 1;
      if (s.completed) g.completedCount += 1;
      if (typeof s.weight === "number") g.lastWeight = s.weight; // last one wins (ordered by set_index)

      g.items.push(s);
      map.set(name, g);
    }

    return Array.from(map.values());
  }, [sets]);

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center", gap: 12 }}>
        <ActivityIndicator />
        <Text style={{ color: "#94a3b8" }}>Loading summary…</Text>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
        <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>Summary</Text>
        <Text style={{ color: "#fca5a5" }}>{error ?? "Something went wrong."}</Text>

        <Pressable
          onPress={() => router.replace("/")}
          style={{
            paddingVertical: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Back Home</Text>
        </Pressable>
      </View>
    );
  }

  const workoutTitle = String(template?.title ?? session.template_id);
  const duration = fmtDuration(session.started_at, session.finished_at);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Workout Summary</Text>
        <Text style={{ color: "#cbd5f5", fontSize: 16, fontWeight: "900" }}>{workoutTitle}</Text>
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>
          {fmtDate(session.started_at)} {duration ? `• ${duration}` : ""}
        </Text>
      </View>

      {/* Stats cards */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 16,
            padding: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>Sets</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
            {stats.completed}/{stats.total}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 16,
            padding: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>Total reps</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>{stats.totalReps}</Text>
        </View>

        <View
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 16,
            padding: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>Volume</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900" }}>
            {Math.round(stats.totalVolume)}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 10 }}>lbs × reps (completed)</Text>
        </View>
      </View>

      {/* Breakdown */}
      <Text style={{ color: "white", fontSize: 16, fontWeight: "900", marginTop: 8 }}>Breakdown</Text>

      {grouped.map((g) => (
        <View
          key={g.name}
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 18,
            padding: 14,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900" }}>{g.name}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                {g.completedCount}/{g.totalCount} sets completed
                {typeof g.lastWeight === "number" ? ` • last: ${g.lastWeight} lbs` : ""}
              </Text>
            </View>

            <Text style={{ color: g.completedCount === g.totalCount ? "#22c55e" : "#94a3b8", fontWeight: "900" }}>
              {g.completedCount === g.totalCount ? "✓" : ""}
            </Text>
          </View>

          {/* Small per-set row chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {g.items.map((s) => {
              const label = g.isTimed ? `${s.target_value}s` : `${s.target_value} reps`;
              return (
                <View
                  key={`${s.exercise_id}-${s.set_index}`}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: s.completed ? "#22c55e" : "#334155",
                    backgroundColor: s.completed ? "rgba(34,197,94,0.10)" : "transparent",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "800", fontSize: 12 }}>
                    {label} {s.completed ? "✓" : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
        <Pressable
          onPress={() => router.push(`/workout/${session.template_id}`)}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: "#22c55e",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#052e16", fontWeight: "900" }}>Repeat Workout</Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/")}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Home</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push("/history")}
        style={{
          paddingVertical: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#334155",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "900" }}>View History</Text>
      </Pressable>
    </ScrollView>
  );
}
