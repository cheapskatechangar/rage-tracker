// app/workout/types/TimedSetsWorkout.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// ✅ Fix: DB check constraint (target_kind) — we only write "reps"
// ✅ rest_seconds always included (NOT NULL)
// ✅ Show "Last: XX lbs" (no prefill)
// ✅ supports resume via sessionId prop

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../src/lib/supabase";

type Props = { template: any };

type Card = {
  kind: "standard" | "rage_set";
  labelTop: string; // used as exercise_name in DB
  labelSub: string;
  sets: number;
  target_value: number; // reps OR seconds (rage_set)
  rest_seconds: number;
};

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function clampInt(v: any, fallback: number) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function buildCardsFromItems(template: any): Card[] {
  const items = safeArray<any>(template?.items);

  return items
    .map((it: any) => {
      const kind = String(it?.kind ?? "").trim();
      const name = String(it?.name ?? "Exercise").trim();

      if (kind === "standard") {
        const warmupSets = clampInt(it?.warmupSets, 0);
        const workingSets = clampInt(it?.workingSets, 0);
        const sets = warmupSets + workingSets;
        const reps = clampInt(it?.reps, 0);

        return {
          kind: "standard" as const,
          labelTop: name,
          labelSub: warmupSets > 0 ? `Warm-up ${warmupSets} + Work ${workingSets}` : `Work ${workingSets}`,
          sets,
          target_value: reps,
          rest_seconds: clampInt(it?.restSec, 60),
        };
      }

      if (kind === "rage_set") {
        const durationSec = clampInt(it?.durationSec, 0);
        const restAfterSec = clampInt(it?.restAfterSec, 180);

        return {
          kind: "rage_set" as const,
          labelTop: `RAGE SET — ${name}`,
          labelSub: `${durationSec} seconds`,
          sets: 1,
          target_value: durationSec,
          rest_seconds: restAfterSec,
        };
      }

      return null;
    })
    .filter((c) => c && c.target_value > 0 && c.sets > 0) as Card[];
}

export default function TimedSetsWorkout({ template, sessionId: sessionIdOverride }: Props & { sessionId?: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [cardWeight, setCardWeight] = useState<Record<number, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({}); // key: cardIdx::setIdx

  // 👇 NEW: last weights note (no prefill) keyed by exercise_name (labelTop)
  const [lastLbsByName, setLastLbsByName] = useState<Record<string, number>>({});

  const title = template?.title ?? "Timed Sets";
  const cards: Card[] = useMemo(() => buildCardsFromItems(template), [template]);

  const totalSets = useMemo(() => cards.reduce((sum, c) => sum + c.sets, 0), [cards]);
  const completedSets = useMemo(() => Object.values(done).filter(Boolean).length, [done]);

  const keyFor = (cardIdx: number, setIdx: number) => `${cardIdx}::${setIdx}`;

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
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;

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

  // 👇 NEW: Load last weights for this template (most recent finished session)
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
        .select("exercise_name, weight, set_index")
        .eq("session_id", lastSession.id)
        .order("set_index", { ascending: true });

      if (cancelled) return;
      if (rErr || !results?.length) return;

      // take last non-null weight seen per exercise_name
      const map: Record<string, number> = {};
      for (const row of results) {
        const name = String((row as any).exercise_name ?? "").trim();
        const w = (row as any).weight;
        if (!name) continue;
        if (typeof w === "number" && Number.isFinite(w)) {
          map[name] = w;
        }
      }

      setLastLbsByName(map);
    };

    loadLastWeights();

    return () => {
      cancelled = true;
    };
  }, [template?.id]);

  const toggleDone = (cardIdx: number, setIdx: number) => {
    const k = keyFor(cardIdx, setIdx);
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

      for (let cardIdx = 0; cardIdx < cards.length; cardIdx++) {
        const c = cards[cardIdx];

        const wRaw = (cardWeight[cardIdx] ?? "").trim();
        const wNum = wRaw === "" ? null : Number(wRaw);
        const weight = Number.isFinite(wNum as any) ? (wNum as number) : null;

        for (let s = 0; s < c.sets; s++) {
          const isDone = !!done[keyFor(cardIdx, s)];

          rows.push({
            session_id: sessionId,
            user_id: userId,
            template_id: template.id,
            exercise_id: `timed:${template.id}:card${cardIdx + 1}:s${s + 1}`,
            exercise_name: c.labelTop,
            set_index: globalSetIndex++,

            // ✅ DB-safe: avoid check constraint surprises
            target_kind: "reps",
            target_value: c.target_value,

            // ✅ NOT NULL
            rest_seconds: c.rest_seconds,

            weight,

            reps_done: c.kind === "standard" && isDone ? c.target_value : null,
            completed: isDone,
          });
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

  if (!cards.length) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{title}</Text>
        <Text style={{ color: "#94a3b8" }}>No items found (expected template.items[]).</Text>

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
      </View>

      {cards.map((c, cardIdx) => {
        const last = lastLbsByName[c.labelTop];

        return (
          <View
            key={`${c.labelTop}-${cardIdx}`}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#0b1220",
              padding: 14,
              borderRadius: 18,
              gap: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{c.labelTop}</Text>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>{c.labelSub}</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                  Target: {c.kind === "rage_set" ? `${c.target_value} seconds` : `${c.target_value} reps`} • Rest{" "}
                  {c.rest_seconds}s
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {Array.from({ length: c.sets }).map((_, setIdx) => {
                    const k = keyFor(cardIdx, setIdx);
                    const isDone = !!done[k];

                    return (
                      <Pressable
                        key={k}
                        onPress={() => toggleDone(cardIdx, setIdx)}
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
                          Set {setIdx + 1} {isDone ? "✓" : ""}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={{ width: 110, gap: 6 }}>
                <TextInput
                  value={cardWeight[cardIdx] ?? ""}
                  onChangeText={(v) => setCardWeight((p) => ({ ...p, [cardIdx]: v }))}
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
                {typeof last === "number" ? (
                  <Text style={{ color: "#94a3b8", fontSize: 12, textAlign: "center" }}>
                    Last: {last} lbs
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}

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
