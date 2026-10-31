// app/workout/types/ProgressiveSuperSetsWorkout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Supports rageProgressiveSuperSets.ts shape:
// template.workout_type === "progressive_super_sets"
// template.day_plan.waves[].rounds[].exercises[] = { name, target_reps:number[] }
//
// ✅ No more "No exercises found"
// ✅ One weight input per exercise (applies to all sets / rounds)
// ✅ Shows "Last: XX lbs" note (no prefill)
// ✅ DB-safe inserts:
//    - target_kind always "reps" (avoids CHECK constraint)
//    - rest_seconds never null
// ✅ Finish routes to /summary/[sessionId]
// ✅ Supports resume via sessionId prop

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

type Props = { template: any; sessionId?: string };

type NormalizedRound = {
  label: string;
  exercises: {
    id: string;
    name: string;
    target_reps: number[];
  }[];
};

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function clampInt(v: any, fallback: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function slug(s: string) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalize(template: any): NormalizedRound[] {
  const rounds: NormalizedRound[] = [];

  // Primary shape: day_plan.waves[].rounds[].exercises[].target_reps[]
  const waves = safeArray<any>(template?.day_plan?.waves);
  if (waves.length) {
    for (let w = 0; w < waves.length; w++) {
      const wave = waves[w];
      const waveLabel = String(wave?.label ?? `Wave ${w + 1}`);
      const rs = safeArray<any>(wave?.rounds);

      for (let r = 0; r < rs.length; r++) {
        const round = rs[r];
        const roundLabel = String(round?.label ?? `${waveLabel} • Round ${r + 1}`);

        const exs = safeArray<any>(round?.exercises)
          .map((e: any, idx: number) => {
            const name = String(e?.name ?? "").trim();
            const reps = safeArray<any>(e?.target_reps)
              .map((n) => clampInt(n, 0))
              .filter((n) => n > 0);

            if (!name || reps.length === 0) return null;

            // Stable exercise_id:
            // - prefer provided e.id
            // - otherwise create from template + name
            const id = String(e?.id ?? `${template?.id ?? "pss"}:${slug(name)}`);

            return { id, name, target_reps: reps };
          })
          .filter(Boolean) as any[];

        if (exs.length) rounds.push({ label: roundLabel, exercises: exs });
      }
    }

    if (rounds.length) return rounds;
  }

  // Fallback shape A: template.exercises[].target_reps[]
  const ex = safeArray<any>(template?.exercises);
  if (ex.length) {
    rounds.push({
      label: "Workout",
      exercises: ex
        .map((e: any, idx: number) => {
          const name = String(e?.name ?? "").trim();
          const reps = safeArray<any>(e?.target_reps)
            .map((n) => clampInt(n, 0))
            .filter((n) => n > 0);
          if (!name || reps.length === 0) return null;
          const id = String(e?.id ?? `${template?.id ?? "pss"}:${slug(name)}:${idx + 1}`);
          return { id, name, target_reps: reps };
        })
        .filter((value): value is { id: string; name: string; target_reps: number[] } => value !== null),
    });

    return rounds;
  }

  // Fallback shape B: template.day_plan.exercises[].target_reps[]
  const dpEx = safeArray<any>(template?.day_plan?.exercises);
  if (dpEx.length) {
    rounds.push({
      label: "Workout",
      exercises: dpEx
        .map((e: any, idx: number) => {
          const name = String(e?.name ?? "").trim();
          const reps = safeArray<any>(e?.target_reps)
            .map((n) => clampInt(n, 0))
            .filter((n) => n > 0);
          if (!name || reps.length === 0) return null;
          const id = String(e?.id ?? `${template?.id ?? "pss"}:${slug(name)}:${idx + 1}`);
          return { id, name, target_reps: reps };
        })
        .filter((value): value is { id: string; name: string; target_reps: number[] } => value !== null),
    });

    return rounds;
  }

  return [];
}

export default function ProgressiveSuperSetsWorkout({ template, sessionId: sessionIdOverride }: Props) {
  const title = String(template?.title ?? "Progressive Super Sets");

  const rounds = useMemo(() => normalize(template), [template]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // one weight input per exercise id
  const [weights, setWeights] = useState<Record<string, string>>({});

  // done state per (exercise, round, setIndex)
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Last lbs note (no prefill)
  const [lastLbs, setLastLbs] = useState<Record<string, number>>({});

  const setKey = (exId: string, roundIndex: number, setIndex: number) => `${exId}::${roundIndex}::${setIndex}`;

  // Start or resume session
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

  const toggle = (exId: string, rIdx: number, sIdx: number) => {
    const k = setKey(exId, rIdx, sIdx);
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

    if (!rounds.length) {
      Alert.alert("No exercises found", "Template didn't contain waves/rounds/exercises target reps.");
      return;
    }

    setSaving(true);

    try {
      const rows: any[] = [];
      let globalSetIndex = 0;

      for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
        const round = rounds[rIdx];

        for (const ex of round.exercises) {
          const wRaw = (weights[ex.id] ?? "").trim();
          const wNum = wRaw === "" ? null : Number(wRaw);
          const weight = Number.isFinite(wNum as any) ? (wNum as number) : null;

          for (let sIdx = 0; sIdx < ex.target_reps.length; sIdx++) {
            const reps = ex.target_reps[sIdx];
            const isDone = !!done[setKey(ex.id, rIdx, sIdx)];

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

              // ✅ NOT NULL
              rest_seconds: 0,

              weight,
              reps_done: isDone ? reps : null,
              completed: isDone,
            });
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

  if (!rounds.length) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "#94a3b8" }}>
          No exercises found (expected template.day_plan.waves[].rounds[].exercises[].target_reps[])
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
      <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{title}</Text>

      {rounds.map((round, rIdx) => (
        <View
          key={`round-${rIdx}-${round.label}`}
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
                  {ex.target_reps.map((reps, sIdx) => {
                    const k = setKey(ex.id, rIdx, sIdx);
                    const isDone = !!done[k];

                    return (
                      <Pressable
                        key={k}
                        onPress={() => toggle(ex.id, rIdx, sIdx)}
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
