// app/workout/types/ConditioningCircuitsWorkout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Template shape expected (from rageConditioningCircuits.ts):
// template.day_plan.circuits[] = [
//   { circuit: 1, rounds: 3, rest_between_rounds_sec: 60, rest_after_circuit_sec: 180,
//     exercises: [{ name, reps }, { name, reps }, { name, reps }] }
// ]
//
// ✅ Adds lbs input per exercise (applies across all rounds)
// ✅ Shows "Last: XX lbs" (no prefill)
// ✅ DB-safe:
//    - target_kind always "reps" (to satisfy your check constraint)
//    - rest_seconds never null (0 / 60 / 180)
// ✅ Saves one row per set: (circuit * round * exercise)

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

type Props = { template: any };

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function clampInt(v: any, fallback: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

type Circuit = {
  circuit: number;
  rounds: number;
  rest_between_rounds_sec: number;
  rest_after_circuit_sec: number;
  exercises: { name: string; reps: number }[];
};

function normalize(template: any): Circuit[] {
  const circuitsRaw = safeArray<any>(template?.day_plan?.circuits);

  const circuits: Circuit[] = circuitsRaw
    .map((c: any) => {
      const circuitNum = clampInt(c?.circuit, 0);
      const rounds = clampInt(c?.rounds, 3);
      const restBetween = clampInt(c?.rest_between_rounds_sec, 60);
      const restAfter = clampInt(c?.rest_after_circuit_sec, 180);

      const exercises = safeArray<any>(c?.exercises)
        .map((e: any) => ({
          name: String(e?.name ?? "").trim(),
          reps: clampInt(e?.reps, 0),
        }))
        .filter((e) => e.name && e.reps > 0);

      if (!circuitNum || exercises.length !== 3) return null;

      return {
        circuit: circuitNum,
        rounds: rounds || 3,
        rest_between_rounds_sec: restBetween,
        rest_after_circuit_sec: restAfter,
        exercises,
      } as Circuit;
    })
    .filter(Boolean) as Circuit[];

  return circuits;
}

export default function ConditioningCircuitsWorkout({
  template,
  sessionId: sessionIdOverride,
}: Props & { sessionId?: string }) {
  const title = String(template?.title ?? template?.day_plan?.title ?? "Conditioning Circuits");

  const circuits = useMemo(() => normalize(template), [template]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // one weight input per exercise (stable exercise_id)
  const [weights, setWeights] = useState<Record<string, string>>({});

  // ✅ last lbs notes (no prefill)
  const [lastLbs, setLastLbs] = useState<Record<string, number>>({});

  // done state per set: circuitIdx::roundIdx::exIdx
  const [done, setDone] = useState<Record<string, boolean>>({});

  const setKey = (cIdx: number, rIdx: number, eIdx: number) => `${cIdx}::${rIdx}::${eIdx}`;

  // stable exercise_id: template.id + circuit number + exercise index (1..3)
  const exerciseId = (templateId: string, circuitNum: number, exIdx1: number) =>
    `${templateId}:c${circuitNum}:e${exIdx1}`;

  const totalSets = useMemo(() => {
    return circuits.reduce((sum, c) => sum + c.rounds * c.exercises.length, 0);
  }, [circuits]);

  const completedSets = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  // Start or resume session
  useEffect(() => {
    let cancelled = false;

    if (sessionIdOverride) {
      setSessionId(String(sessionIdOverride));
      return () => {
        cancelled = true;
      };
    }

    const startSession = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        Alert.alert("Not signed in", "Please sign in to start a workout.");
        router.back();
        return;
      }

      const { data: row, error } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: userId,
          template_id: template.id,
          started_at: new Date().toISOString(),
          finished_at: null,
        })
        .select("id")
        .single();

      if (cancelled) return;

      if (error || !row?.id) {
        console.error("Failed to create session", error);
        Alert.alert("Error", "Could not start workout session.");
        router.back();
        return;
      }

      setSessionId(row.id);
    };

    startSession();

    return () => {
      cancelled = true;
    };
  }, [template?.id, sessionIdOverride]);

  // Load last weights from most recent finished session for this template
  useEffect(() => {
    let cancelled = false;

    const loadLastWeights = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const { data: lastSession, error: sErr } = await supabase
        .from("workout_sessions")
        .select("id, finished_at")
        .eq("user_id", userId)
        .eq("template_id", template.id)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (sErr || !lastSession?.id) return;

      const { data: results, error: rErr } = await supabase
        .from("set_results")
        .select("exercise_id, weight, set_index")
        .eq("session_id", lastSession.id)
        .order("set_index", { ascending: true });

      if (cancelled) return;
      if (rErr || !results?.length) return;

      const map: Record<string, number> = {};
      for (const row of results) {
        const exId = String((row as any).exercise_id ?? "");
        const w = (row as any).weight;
        if (!exId) continue;
        if (typeof w === "number" && Number.isFinite(w)) {
          map[exId] = w; // last non-null weight wins
        }
      }

      setLastLbs(map);
    };

    loadLastWeights();

    return () => {
      cancelled = true;
    };
  }, [template?.id]);

  const toggle = (cIdx: number, rIdx: number, eIdx: number) => {
    const k = setKey(cIdx, rIdx, eIdx);
    setDone((p) => ({ ...p, [k]: !p[k] }));
  };

  const finish = async () => {
    if (!sessionId) {
      Alert.alert("Hold up", "Session not ready yet. Try again in a second.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    if (!userId) {
      Alert.alert("Not signed in", "Please sign in to save your workout.");
      return;
    }

    setSaving(true);

    try {
      const rows: any[] = [];
      let globalSetIndex = 0;

      for (let cIdx = 0; cIdx < circuits.length; cIdx++) {
        const c = circuits[cIdx];

        for (let rIdx = 0; rIdx < c.rounds; rIdx++) {
          for (let eIdx = 0; eIdx < c.exercises.length; eIdx++) {
            const ex = c.exercises[eIdx];
            const exId = exerciseId(String(template.id), c.circuit, eIdx + 1);

            const wRaw = (weights[exId] ?? "").trim();
            const wNum = wRaw === "" ? null : Number(wRaw);
            const weight = Number.isFinite(wNum as any) ? (wNum as number) : null;

            const isDone = !!done[setKey(cIdx, rIdx, eIdx)];

            // rest logic:
            // - no rest between exercises inside a round
            // - after last exercise of a round:
            //     if not last round -> rest_between_rounds_sec
            //     else -> rest_after_circuit_sec
            let restSeconds = 0;
            const isLastExerciseInRound = eIdx === c.exercises.length - 1;
            if (isLastExerciseInRound) {
              restSeconds = rIdx < c.rounds - 1 ? c.rest_between_rounds_sec : c.rest_after_circuit_sec;
            }

            rows.push({
              session_id: sessionId,
              user_id: userId,
              template_id: template.id,
              exercise_id: exId,
              exercise_name: ex.name,
              set_index: globalSetIndex++,

              // ✅ DB-safe: use only "reps" to satisfy your check constraint
              target_kind: "reps",
              target_value: ex.reps,

              // ✅ NOT NULL always
              rest_seconds: restSeconds,

              weight,
              reps_done: isDone ? ex.reps : null,
              completed: isDone,
            });
          }
        }
      }

      if (rows.length === 0) {
        Alert.alert("Nothing to save", "No sets were found to save.");
        return;
      }

      const { error: insErr } = await supabase.from("set_results").insert(rows);
      if (insErr) {
        console.error("Failed inserting set_results", insErr);
        Alert.alert("Error", insErr.message);
        return;
      }

      const { error: finErr } = await supabase
        .from("workout_sessions")
        .update({ finished_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (finErr) {
        console.error("Failed to finish session", finErr);
        Alert.alert("Error", "Could not finalize session (sets were saved).");
        router.back();
        return;
      }

      router.replace(`/summary/${sessionId}`);
    } finally {
      setSaving(false);
    }
  };

  if (!circuits.length) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "#94a3b8" }}>
          No circuits found. Expected template.day_plan.circuits[] with 3 exercises each.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={{
            paddingVertical: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "#64748b", fontSize: 12 }}>
          Progress: {completedSets}/{totalSets} sets completed
        </Text>
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>
          Each circuit = {circuits[0]?.rounds ?? 3} rounds • no rest between exercises
        </Text>
      </View>

      {circuits.map((c, cIdx) => (
        <View
          key={`circuit-${c.circuit}`}
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            padding: 14,
            borderRadius: 18,
            gap: 12,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
            Circuit {c.circuit}{" "}
            <Text style={{ color: "#94a3b8" }}>
              • {c.rounds} rounds • Rest {c.rest_between_rounds_sec}s between rounds • {c.rest_after_circuit_sec}s after
            </Text>
          </Text>

          {/* Exercise weight inputs (once per exercise, applies to all rounds) */}
          <View style={{ gap: 10 }}>
            {c.exercises.map((ex, eIdx) => {
              const exId = exerciseId(String(template.id), c.circuit, eIdx + 1);
              const last = lastLbs[exId];

              return (
                <View key={exId} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "white", fontWeight: "900" }}>
                      {ex.name}{" "}
                      <Text style={{ color: "#94a3b8", fontWeight: "700" }}>• {ex.reps} reps</Text>
                    </Text>
                    {typeof last === "number" ? (
                      <Text style={{ color: "#94a3b8", fontSize: 12 }}>Last: {last} lbs</Text>
                    ) : (
                      <Text style={{ color: "#0b1220", fontSize: 12 }}>.</Text>
                    )}
                  </View>

                  <View style={{ width: 110 }}>
                    <TextInput
                      value={weights[exId] ?? ""}
                      onChangeText={(v) => setWeights((p) => ({ ...p, [exId]: v }))}
                      keyboardType="number-pad"
                      placeholder="lbs"
                      placeholderTextColor="#64748b"
                      style={{
                        borderWidth: 1,
                        borderColor: "#334155",
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        color: "white",
                        backgroundColor: "#071024",
                        textAlign: "center",
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Round completion (tap to mark each exercise per round) */}
          <View style={{ gap: 10, marginTop: 6 }}>
            {Array.from({ length: c.rounds }).map((_, rIdx) => (
              <View key={`r-${rIdx}`} style={{ gap: 8 }}>
                <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "800" }}>
                  Round {rIdx + 1}
                </Text>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {c.exercises.map((ex, eIdx) => {
                    const k = setKey(cIdx, rIdx, eIdx);
                    const isDone = !!done[k];

                    return (
                      <Pressable
                        key={k}
                        onPress={() => toggle(cIdx, rIdx, eIdx)}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isDone ? "#22c55e" : "#334155",
                          backgroundColor: isDone ? "rgba(34,197,94,0.10)" : "transparent",
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "900" }}>
                          {ex.name} {isDone ? "✓" : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
        <Pressable
          onPress={() =>
            Alert.alert("Exit workout?", "Sets won’t be saved unless you finish.", [
              { text: "Cancel", style: "cancel" },
              { text: "Exit", style: "destructive", onPress: () => router.back() },
            ])
          }
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Exit</Text>
        </Pressable>

        <Pressable
          disabled={saving}
          onPress={finish}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: saving ? "#1f2a44" : "#22c55e",
            alignItems: "center",
          }}
        >
          <Text style={{ color: saving ? "#cbd5e1" : "#052e16", fontWeight: "900" }}>
            {saving ? "Saving…" : "Finish → Summary"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
