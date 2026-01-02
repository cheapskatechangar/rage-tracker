// app/history/[id].tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Session Detail screen
// - Shows session header (template title, started/finished)
// - Loads all set_results rows for the session
// - Groups by exercise_name in the order of set_index
// - Works for ALL workout types (including conditioning_circuits)
// - Minimal scroll: compact cards, but readable mid-gym
//
// Note:
// - We do NOT re-interpret program logic here; we just render what was saved.

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../../src/lib/supabase";
import { TEMPLATES } from "../../src/data/templates";
import type { WorkoutTemplate } from "../../src/data/types";

type SessionRow = {
  id: string;
  template_id: string;
  started_at: string;
  finished_at: string | null;
};

type SetResultRow = {
  id?: string;
  session_id: string;
  template_id: string;
  exercise_id: string;
  exercise_name: string;
  set_index: number;
  target_kind: "reps" | "seconds";
  target_value: number;
  rest_seconds: number;
  weight: number | null;
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

function formatMMSS(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function HistorySessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = String(id ?? "");

  const [session, setSession] = useState<SessionRow | null>(null);
  const [sets, setSets] = useState<SetResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  const template = useMemo(() => {
    return TEMPLATES.find((t) => t.id === session?.template_id);
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
        console.error("Session load error", sErr);
        setSession(null);
        setSets([]);
        setLoading(false);
        return;
      }

      setSession(sData as SessionRow);

      const { data: rData, error: rErr } = await supabase
        .from("set_results")
        .select(
          "session_id,template_id,exercise_id,exercise_name,set_index,target_kind,target_value,rest_seconds,weight,reps_done,completed"
        )
        .eq("session_id", sessionId)
        .order("set_index", { ascending: true });

      if (rErr) {
        console.error("Set results load error", rErr);
        setSets([]);
      } else {
        setSets((rData ?? []) as SetResultRow[]);
      }

      setLoading(false);
    };

    load();
  }, [sessionId]);

  const groups = useMemo(() => {
    // Group by exercise_name, preserving first occurrence order via set_index.
    const map = new Map<string, { name: string; rows: SetResultRow[] }>();
    for (const row of sets) {
      const key = row.exercise_name;
      if (!map.has(key)) map.set(key, { name: key, rows: [] });
      map.get(key)!.rows.push(row);
    }
    return Array.from(map.values());
  }, [sets]);

  const header = useMemo(() => {
    const title = template?.title ?? "Workout Session";
    const label = workoutTypeLabel(template?.workout_type);
    const started = session?.started_at ? formatWhen(session.started_at) : "";
    const finished = session?.finished_at ? formatWhen(session.finished_at) : null;
    return { title, label, started, finished };
  }, [template?.title, template?.workout_type, session?.started_at, session?.finished_at]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {/* Header */}
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{header.title}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
              Started: {header.started}
              {header.finished ? `\nFinished: ${header.finished}` : "\nStatus: In progress"}
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
          <Text style={{ color: "white", fontWeight: "800" }}>Loading sets…</Text>
        </View>
      )}

      {!loading && sets.length === 0 && (
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
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>No set data</Text>
          <Text style={{ color: "#94a3b8" }}>
            This session has no saved sets yet.
          </Text>
        </View>
      )}

      {/* Exercise Groups */}
      {!loading &&
        groups.map((g) => {
          // Find if any row carries a rest value (often stored on last set of a round)
          const restRows = g.rows.filter((r) => (r.rest_seconds ?? 0) > 0);
          const restHint =
            restRows.length > 0
              ? `Rest logged: ${restRows.map((r) => formatMMSS(r.rest_seconds)).join(", ")}`
              : null;

          return (
            <View
              key={g.name}
              style={{
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{g.name}</Text>

              {restHint ? (
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{restHint}</Text>
              ) : null}

              {/* Rows */}
              {g.rows.map((r, idx) => {
                const target =
                  r.target_kind === "seconds"
                    ? `${r.target_value}s`
                    : `${r.target_value} reps`;

                const done =
                  r.target_kind === "seconds"
                    ? r.completed
                      ? "Done"
                      : "—"
                    : r.reps_done != null
                    ? `${r.reps_done}`
                    : "—";

                const wt = r.weight != null ? `${r.weight} lb` : null;

                return (
                  <View
                    key={`${g.name}-${idx}-${r.set_index}`}
                    style={{
                      borderWidth: 1,
                      borderColor: "#1f2a44",
                      backgroundColor: "#071024",
                      padding: 10,
                      borderRadius: 14,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#cbd5e1", fontSize: 12 }}>
                        Set #{r.set_index + 1} • Target {target}
                        {wt ? ` • ${wt}` : ""}
                      </Text>
                    </View>

                    <View
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: r.completed ? "#22c55e" : "#334155",
                        backgroundColor: r.completed ? "rgba(34,197,94,0.12)" : "transparent",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "900", fontSize: 12 }}>{done}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
    </ScrollView>
  );
}
