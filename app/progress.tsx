import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Svg, { Polyline } from "react-native-svg";
import { supabase } from "../src/lib/supabase";
import { router } from "expo-router";

type Row = {
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  weight: number | null;
  reps_done: number | null;
  completed: boolean;
  created_at: string;
};

function toPoints(values: number[], w: number, h: number) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function safeNum(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function Progress() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // picker selection
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("__all__");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        router.replace("/sign-in");
        return;
      }

      // Pull enough history to be useful; we'll aggregate client-side.
      const { data, error } = await supabase
        .from("set_results")
        .select("session_id,exercise_id,exercise_name,weight,reps_done,completed,created_at")
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(1200);

      if (error) {
        console.log("progress load error", error);
        setRows([]);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as Row[]);
      setLoading(false);
    };

    load();
  }, []);

  const exercises = useMemo(() => {
    // unique list by exercise_id
    const map = new Map<string, { id: string; name: string }>();
    for (const r of rows) {
      map.set(r.exercise_id, { id: r.exercise_id, name: r.exercise_name });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedExerciseId === "__all__") return rows;
    return rows.filter((r) => r.exercise_id === selectedExerciseId);
  }, [rows, selectedExerciseId]);

  const prs = useMemo(() => {
    // PR per exercise (or overall if filtered)
    const map = new Map<string, { name: string; pr: number; prDate: string }>();

    for (const r of filteredRows) {
      if (r.weight == null) continue;
      const key = `${r.exercise_id}`;
      const w = safeNum(r.weight);
      const existing = map.get(key);

      if (!existing || w > existing.pr) {
        map.set(key, { name: r.exercise_name, pr: w, prDate: r.created_at });
      }
    }

    return Array.from(map.entries())
      .map(([id, v]) => ({ exercise_id: id, ...v }))
      .sort((a, b) => b.pr - a.pr);
  }, [filteredRows]);

  const summary = useMemo(() => {
    // For selected exercise only: latest weight, delta, recent weights
    if (selectedExerciseId === "__all__") return null;

    const weightsDesc = filteredRows
      .filter((r) => r.weight != null)
      .map((r) => safeNum(r.weight))
      .filter((n) => Number.isFinite(n));

    const latest = weightsDesc[0] ?? null;
    const oldest = weightsDesc[weightsDesc.length - 1] ?? null;

    const delta = latest != null && oldest != null ? latest - oldest : 0;

    const recent = [...weightsDesc.slice(0, 10)].reverse(); // oldest->newest for sparkline

    return { latest, oldest, delta, recent };
  }, [filteredRows, selectedExerciseId]);

  const volumeTrend = useMemo(() => {
    // For selected exercise only: volume per session_id (sum of weight*reps)
    if (selectedExerciseId === "__all__") return null;

    const bySession = new Map<string, { created_at: string; vol: number }>();

    for (const r of filteredRows) {
      // 🔒 Ignore incomplete sets
     if (r.reps_done == null || r.weight == null) continue;

      const w = r.weight == null ? 0 : safeNum(r.weight);
      const reps = r.reps_done == null ? 0 : safeNum(r.reps_done);
      const vol = w * reps;

      const existing = bySession.get(r.session_id);
      if (!existing) {
        bySession.set(r.session_id, { created_at: r.created_at, vol });
      } else {
        existing.vol += vol;
        // keep earliest timestamp for ordering (not critical)
        if (r.created_at < existing.created_at) existing.created_at = r.created_at;
      }
    }

    const sessionsAsc = Array.from(bySession.values())
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-12); // last 12 sessions

    const vols = sessionsAsc.map((s) => Number(s.vol.toFixed(1)));

    return vols.length ? vols : null;
  }, [filteredRows, selectedExerciseId]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "900", color: "white" }}>Progress</Text>
      <Text style={{ color: "#94a3b8" }}>
        Pick an exercise to see PRs + trends (only completed sets are counted).
      </Text>

      {/* Picker */}
      <View style={{ borderWidth: 1, borderColor: "#334155", borderRadius: 14, overflow: "hidden" }}>
        <Picker
          selectedValue={selectedExerciseId}
          onValueChange={(v) => setSelectedExerciseId(String(v))}
          dropdownIconColor="white"
          style={{ color: "white" }}
        >
          <Picker.Item label="All exercises (PR list)" value="__all__" />
          {exercises.map((e) => (
            <Picker.Item key={e.id} label={e.name} value={e.id} />
          ))}
        </Picker>
      </View>

      {loading ? (
        <Text style={{ color: "white", fontWeight: "700", marginTop: 12 }}>Loading…</Text>
      ) : rows.length === 0 ? (
        <Text style={{ color: "white", fontWeight: "700", marginTop: 12 }}>
          No data yet. Save a workout and you’ll see progress here 👀
        </Text>
      ) : selectedExerciseId === "__all__" ? (
        // PR list
        <View style={{ gap: 10, marginTop: 6 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Top PRs</Text>

          {prs.length === 0 ? (
            <Text style={{ color: "#94a3b8" }}>No weighted sets yet.</Text>
          ) : (
            prs.slice(0, 12).map((p) => (
              <View
                key={p.exercise_id}
                style={{
                  borderWidth: 1,
                  borderColor: "#334155",
                  borderRadius: 14,
                  padding: 14,
                  gap: 6,
                }}
              >
                <Text style={{ color: "white", fontWeight: "900" }}>{p.name}</Text>
                <Text style={{ color: "#94a3b8" }}>
                  PR: <Text style={{ color: "white", fontWeight: "900" }}>{p.pr}</Text>{" "}
                  <Text style={{ color: "#94a3b8" }}>({new Date(p.prDate).toLocaleDateString()})</Text>
                </Text>
              </View>
            ))
          )}
        </View>
      ) : (
        // Selected exercise detail
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ borderWidth: 1, borderColor: "#334155", borderRadius: 14, padding: 14, gap: 10 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
              {exercises.find((e) => e.id === selectedExerciseId)?.name ?? "Exercise"}
            </Text>

            {/* Weight trend */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#94a3b8" }}>
                  Latest:{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {summary?.latest ?? "—"}
                  </Text>
                  {summary?.oldest != null && summary?.latest != null ? (
                    <Text style={{ color: summary.delta >= 0 ? "#22c55e" : "#f97316", fontWeight: "900" }}>
                      {" "}
                      ({summary.delta >= 0 ? "+" : ""}
                      {summary.delta.toFixed(1)} since first)
                    </Text>
                  ) : null}
                </Text>

                <Text style={{ color: "#94a3b8", marginTop: 4 }}>
                  PR:{" "}
                  <Text style={{ color: "white", fontWeight: "900" }}>
                    {prs[0]?.pr ?? "—"}
                  </Text>
                </Text>
              </View>

              <View style={{ width: 140, height: 44, justifyContent: "center" }}>
                {summary?.recent && summary.recent.length >= 2 ? (
                  <Svg width={140} height={44}>
                    <Polyline
                      points={toPoints(summary.recent, 140, 44)}
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </Svg>
                ) : (
                  <Text style={{ color: "#94a3b8" }}>—</Text>
                )}
              </View>
            </View>

            <Text style={{ color: "#94a3b8" }}>
              Recent weights: {summary?.recent?.map((n) => n.toString()).join(" • ") || "—"}
            </Text>
          </View>

          {/* Volume trend */}
          <View style={{ borderWidth: 1, borderColor: "#334155", borderRadius: 14, padding: 14, gap: 10 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Volume trend</Text>
            <Text style={{ color: "#94a3b8" }}>Volume = weight × reps (summed per session)</Text>

            <View style={{ width: "100%", height: 44, justifyContent: "center" }}>
              {volumeTrend && volumeTrend.length >= 2 ? (
                <Svg width={320} height={44}>
                  <Polyline
                    points={toPoints(volumeTrend, 320, 44)}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </Svg>
              ) : (
                <Text style={{ color: "#94a3b8" }}>Not enough volume data yet.</Text>
              )}
            </View>

            <Text style={{ color: "#94a3b8" }}>
              Recent volumes: {volumeTrend?.map((n) => n.toString()).join(" • ") || "—"}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
