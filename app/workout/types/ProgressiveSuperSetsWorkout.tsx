// app/workout/types/ProgressiveSuperSetsWorkout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Fixes:
// ✅ "No exercises found" via multi-shape normalize()
// ✅ DB-safe inserts (target_kind always "reps", rest_seconds never null)
// ✅ Last lbs note per exercise (no prefill)
// ✅ Finish routes to /summary/[sessionId]
// ✅ Supports resume via sessionId prop

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

type Props = { template: any; sessionId?: string };

type SetDef = { kind: "reps" | "seconds"; value: number; restSeconds?: number };
type ExerciseSetList = { mode: "sets"; exercises: { id: string; name: string; sets: SetDef[] }[] };
type RoundMode = {
  mode: "rounds";
  rounds: { label: string; exercises: { id: string; name: string; target_reps: number[] }[] }[];
};

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function clampInt(v: any, fallback: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function normalize(template: any): ExerciseSetList | RoundMode | null {
  // A) template.exercises[].sets[]
  const ex = safeArray<any>(template?.exercises);
  if (ex.length) {
    const normalized = ex
      .map((e: any, idx: number) => {
        const id = String(e?.id ?? `${template?.id ?? "pss"}-ex-${idx + 1}`);
        const name = String(e?.name ?? "").trim();
        const setsRaw = safeArray<any>(e?.sets);

        const sets: SetDef[] = setsRaw
          .map((s: any) => {
            if (typeof s === "number") return { kind: "reps", value: s } as SetDef;
            if (s && typeof s.value === "number") {
              return {
                kind: (s.kind === "seconds" ? "seconds" : "reps") as any,
                value: clampInt(s.value, 0),
                restSeconds: typeof s.restSeconds === "number" ? s.restSeconds : undefined,
              } as SetDef;
            }
            return null;
          })
          .filter((x) => x && x.value > 0) as SetDef[];

        if (!name || !sets.length) return null;
        return { id, name, sets };
      })
      .filter(Boolean) as any[];

    if (normalized.length) return { mode: "sets", exercises: normalized };
  }

  // B) template.day_plan.waves[].rounds[]
  const waves = safeArray<any>(template?.day_plan?.waves);
  if (waves.length) {
    const rounds: any[] = [];

    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const rs = safeArray<any>(wave?.rounds);

      for (let r = 0; r < rs.length; r++) {
        const round = rs[r];
        const exs = safeArray<any>(round?.exercises)
          .map((e: any, idx: number) => {
            const name = String(e?.name ?? "").trim();
            const reps = safeArray<any>(e?.target_reps).map((n) => clampInt(n, 0)).filter((n) => n > 0);

            if (!name || !reps.length) return null;

            return {
              id: String(e?.id ?? `${template?.id ?? "pss"}-w${w + 1}-r${r + 1}-e${idx + 1}`),
              name,
              target_reps: reps,
            };
          })
          .filter(Boolean);

        if (exs.length) {
          rounds.push({
            label: String(round?.label ?? `Wave ${w + 1} • Round ${r + 1}`),
            exercises: exs,
          });
        }
      }
    }

    if (rounds.length) return { mode: "rounds", rounds };
  }

  // C) template.day_plan.exercises[] fallback
  const dpEx = safeArray<any>(template?.day_plan?.exercises);
  if (dpEx.length) {
    const normalized = dpEx
      .map((e: any, idx: number) => {
        const name = String(e?.name ?? "").trim();
        const reps = safeArray<any>(e?.target_reps).map((n) => clampInt(n, 0)).filter((n) => n > 0);
        if (!name || !reps.length) return null;

        return {
          id: String(e?.id ?? `${template?.id ?? "pss"}-dp-e${idx + 1}`),
          name,
          sets: reps.map((v) => ({ kind: "reps", value: v } as SetDef)),
        };
      })
      .filter(Boolean) as any[];

    if (normalized.length) return { mode: "sets", exercises: normalized };
  }

  return null;
}

export default function ProgressiveSuperSetsWorkout({ template, sessionId: sessionIdOverride }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const normalized = useMemo(() => normalize(template), [template]);

  // one weight input per exercise id
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Last lbs note (no prefill)
  const [lastLbs, setLastLbs] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    if (sessionIdOverride) {
      setSessionId(String(sessionIdOverride));
      return () => {
        cancelled = true;
      };
    }

    const start = async () => {
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

    start();

    return () => {
      cancelled = true;
    };
  }, [template?.id, sessionIdOverride]);

  // Load last weights from most recent finished session for this template
  useEffect(() => {
    let cancelled = false;

    const loadLast = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      const { data: lastSession } = await supabase
        .from("workout_sessions")
        .select("id, finished_at")
        .eq("user_id", userId)
        .eq("template_id", template.id)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (!lastSession?.id) return;

      const { data: results } = await supabase
        .from("set_results")
        .select("exercise_id, weight, set_index")
        .eq("session_id", lastSession.id)
        .order("set_index", { ascending: true });

      if (cancelled) return;
      if (!results?.length) return;

      const map: Record<string, number> = {};
      for (const r of results as any[]) {
        const exId = String(r.exercise_id ?? "");
        const w = r.weight;
        if (exId && typeof w === "number" && Number.isFinite(w)) map[exId] = w;
      }
      setLastLbs(map);
    };

    loadLast();

    return () => {
      cancelled = true;
    };
  }, [template?.id]);

  const finish = async () => {
    if (!sessionId) {
      Alert.alert("Hold up", "Session not ready yet. Try again in a second.");
      return;
    }

    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;

    if (!userId) {
      setSaving(false);
      Alert.alert("Not signed in");
      return;
    }

    try {
      const rows: any[] = [];
      let globalSetIndex = 0;

      if (!normalized) {
        Alert.alert("No exercises found", "This template didn’t normalize correctly.");
        return;
      }

      if (normalized.mode === "sets") {
        for (const ex of normalized.exercises) {
          const wRaw = (weights[ex.id] ?? "").trim();
          const wNum = wRaw === "" ? null : Number(wRaw);
          const weight = Number.isFinite(wNum as any) ? (wNum as number) : null;

          for (let i = 0; i < ex.sets.length; i++) {
            const s = ex.sets[i];
            const k = `${ex.id}::${i}`;
            const isDone = !!done[k];

            rows.push({
              session_id: sessionId,
              user_id: userId,
              template_id: template.id,
              exercise_id: ex.id,
              exercise_name: ex.name,
              set_index: globalSetIndex++,

              // ✅ DB-safe
              target_kind: "reps",
              target_value: s.value,
              rest_seconds: typeof s.restSeconds === "number" ? s.restSeconds : 0,

              weight,
              reps_done: isDone ? s.value : null,
              completed: isDone,
            });
          }
        }
      } else {
        // rounds mode
        for (let r = 0; r < normalized.rounds.length; r++) {
          const round = normalized.rounds[r];

          for (const ex of round.exercises) {
            // weight input per exercise id
            const wRaw = (weights[ex.id] ?? "").trim();
            const wNum = wRaw === "" ? null : Number(wRaw);
            const weight = Number.isFinite(wNum as any) ? (wNum as number) : null;

            for (let i = 0; i < ex.target_reps.length; i++) {
              const reps = ex.target_reps[i];
              const k = `${ex.id}::${r}::${i}`;
              const isDone = !!done[k];

              rows.push({
                session_id: sessionId,
                user_id: userId,
                template_id: template.id,
                exercise_id: ex.id,
                exercise_name: ex.name,
                set_index: globalSetIndex++,

                // ✅ DB-safe
                target_kind: "reps",
                target_value: reps,
                rest_seconds: 0,

                weight,
                reps_done: isDone ? reps : null,
                completed: isDone,
              });
            }
          }
        }
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

  if (!normalized) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>
          {String(template?.title ?? "Progressive Super Sets")}
        </Text>
        <Text style={{ color: "#94a3b8" }}>No exercises found (template shape mismatch).</Text>

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
      <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>
        {String(template?.title ?? "Progressive Super Sets")}
      </Text>

      {normalized.mode === "sets" ? (
        normalized.exercises.map((ex) => {
          const last = lastLbs[ex.id];

          return (
            <View
              key={ex.id}
              style={{
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                padding: 14,
                borderRadius: 18,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{ex.name}</Text>
                  {typeof last === "number" ? (
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>Last: {last} lbs</Text>
                  ) : (
                    <Text style={{ color: "#0b1220", fontSize: 12 }}>.</Text>
                  )}
                </View>

                <View style={{ width: 110 }}>
                  <TextInput
                    value={weights[ex.id] ?? ""}
                    onChangeText={(v) => setWeights((p) => ({ ...p, [ex.id]: v }))}
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

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {ex.sets.map((s, i) => {
                  const k = `${ex.id}::${i}`;
                  const isDone = !!done[k];
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setDone((p) => ({ ...p, [k]: !p[k] }))}
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
                        {s.value} reps {isDone ? "✓" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })
      ) : (
        normalized.rounds.map((round, rIdx) => (
          <View
            key={`${round.label}-${rIdx}`}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#0b1220",
              padding: 14,
              borderRadius: 18,
              gap: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{round.label}</Text>

            {round.exercises.map((ex) => {
              const last = lastLbs[ex.id];

              return (
                <View key={ex.id} style={{ gap: 8, marginTop: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "white", fontWeight: "900" }}>{ex.name}</Text>
                      {typeof last === "number" ? (
                        <Text style={{ color: "#94a3b8", fontSize: 12 }}>Last: {last} lbs</Text>
                      ) : (
                        <Text style={{ color: "#0b1220", fontSize: 12 }}>.</Text>
                      )}
                    </View>

                    <View style={{ width: 110 }}>
                      <TextInput
                        value={weights[ex.id] ?? ""}
                        onChangeText={(v) => setWeights((p) => ({ ...p, [ex.id]: v }))}
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

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {ex.target_reps.map((reps, i) => {
                      const k = `${ex.id}::${rIdx}::${i}`;
                      const isDone = !!done[k];
                      return (
                        <Pressable
                          key={k}
                          onPress={() => setDone((p) => ({ ...p, [k]: !p[k] }))}
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
                            {reps} reps {isDone ? "✓" : ""}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        ))
      )}

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
