import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, Link, router } from "expo-router";
import { RAGE_PROGRAMS } from "../../src/data/rageProgramsIndex";
import { supabase } from "../../src/lib/supabase";

type DoneMap = Record<string, boolean>; // templateId -> done?
type LastDoneAtMap = Record<string, string>; // templateId -> latest finished_at ISO

export default function ProgramDetail() {
  const { programId } = useLocalSearchParams<{ programId: string }>();

  const program = useMemo(
    () => RAGE_PROGRAMS.find((p) => p.programId === programId),
    [programId]
  );

  const [doneMap, setDoneMap] = useState<DoneMap>({});
  const [lastDoneAtMap, setLastDoneAtMap] = useState<LastDoneAtMap>({});
  const [loadingDone, setLoadingDone] = useState(true);

  const orderedDays = useMemo(() => {
    if (!program) return [];
    return [...program.weeks.flatMap((w) => w.days)].sort((a, b) => a.order - b.order);
  }, [program]);

  const nextDay = useMemo(() => {
    if (!orderedDays.length) return null;
    const firstUncompleted = orderedDays.find((d) => !doneMap[d.templateId]);
    return firstUncompleted ?? orderedDays[0];
  }, [orderedDays, doneMap]);

  const allComplete = useMemo(() => {
    if (!orderedDays.length) return false;
    return orderedDays.every((d) => !!doneMap[d.templateId]);
  }, [orderedDays, doneMap]);

  const nextLastAt = useMemo(() => {
    if (!nextDay) return null;
    return lastDoneAtMap[nextDay.templateId] ?? null;
  }, [nextDay, lastDoneAtMap]);

  useEffect(() => {
    const loadDone = async () => {
      if (!program) return;

      setLoadingDone(true);

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userRes.user) {
        router.replace("/sign-in");
        return;
      }

      const templateIds = program.weeks
        .flatMap((w) => w.days.map((d) => d.templateId))
        .filter(Boolean);

      if (templateIds.length === 0) {
        setDoneMap({});
        setLastDoneAtMap({});
        setLoadingDone(false);
        return;
      }

      const { data, error } = await supabase
        .from("workout_sessions")
        .select("template_id,finished_at,started_at")
        .eq("user_id", userRes.user.id)
        .in("template_id", templateIds)
        .order("started_at", { ascending: false })
        .limit(500);

      if (error) {
        console.log("loadDone error", error);
        setDoneMap({});
        setLastDoneAtMap({});
        setLoadingDone(false);
        return;
      }

      const done: DoneMap = {};
      const lastAt: LastDoneAtMap = {};

      for (const row of data ?? []) {
        if (!row.finished_at) continue;

        const tid = row.template_id as string;
        done[tid] = true;

        const prev = lastAt[tid];
        if (!prev || row.finished_at > prev) {
          lastAt[tid] = row.finished_at;
        }
      }

      setDoneMap(done);
      setLastDoneAtMap(lastAt);
      setLoadingDone(false);
    };

    loadDone();
  }, [programId, program?.programId]);

  if (!program) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 12 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Program not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!program.enabled) {
    Alert.alert("Coming soon", "This program isn’t enabled yet.");
    router.back();
    return null;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>{program.title}</Text>
      <Text style={{ color: "#94a3b8" }}>
        {program.workoutsPerWeek} workouts/week • Run for 2 weeks only.
      </Text>

      {/* Smart Start Next Workout */}
      {nextDay ? (
        <Pressable
          onPress={() => router.push(`/workout/${nextDay.templateId}`)}
          style={{
            backgroundColor: allComplete ? "#0f172a" : "#22c55e",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: allComplete ? "#334155" : "#22c55e",
          }}
        >
          <Text
            style={{
              color: allComplete ? "white" : "#052e16",
              fontSize: 18,
              fontWeight: "900",
            }}
          >
            {allComplete ? "Program Complete ✅ (Restart Day 1)" : "Start Next Workout"}
          </Text>

          <Text style={{ color: allComplete ? "#94a3b8" : "#052e16", fontWeight: "800", marginTop: 2 }}>
            {nextDay.title} • {nextDay.focus.join(" • ")}
          </Text>

          {nextLastAt ? (
            <Text style={{ color: allComplete ? "#94a3b8" : "#052e16", marginTop: 4, fontWeight: "700" }}>
              Last completed: {new Date(nextLastAt).toLocaleDateString()}
            </Text>
          ) : null}

          {loadingDone ? (
            <Text style={{ color: allComplete ? "#94a3b8" : "#052e16", marginTop: 4 }}>
              Checking history…
            </Text>
          ) : null}
        </Pressable>
      ) : null}

      {program.weeks.map((w) => {
        const weekDoneCount = w.days.filter((d) => !!doneMap[d.templateId]).length;
        const weekTotal = w.days.length;

        return (
          <View
            key={w.week}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              borderRadius: 14,
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>Week {w.week}</Text>
              <Text style={{ color: "#94a3b8", fontWeight: "800" }}>
                {weekDoneCount}/{weekTotal}
              </Text>
            </View>

            {/* Smart Week Progress Indicator (green if day completed) */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              {w.days.map((d) => {
                const done = !!doneMap[d.templateId];
                return (
                  <View
                    key={`week-${w.week}-day-${d.day}-bar`}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: done ? "#22c55e" : "#334155",
                      opacity: loadingDone ? 0.7 : 1,
                    }}
                  />
                );
              })}
            </View>

            {/* Days */}
            {w.days.map((d) => {
              const done = !!doneMap[d.templateId];
              const lastAt = lastDoneAtMap[d.templateId];

              return (
                <Link
                  key={`${w.week}-${d.day}`}
                  href={{ pathname: "/workout/[id]", params: { id: d.templateId } }}
                  asChild
                >
                  <Pressable
                    style={{
                      borderWidth: 1,
                      borderColor: done ? "#22c55e" : "#334155",
                      backgroundColor: done ? "rgba(34,197,94,0.10)" : "transparent",
                      padding: 12,
                      borderRadius: 12,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                      <Text style={{ color: "white", fontWeight: "900" }}>{d.title}</Text>
                      <Text style={{ color: done ? "#22c55e" : "#94a3b8", fontWeight: "900" }}>
                        {done ? "DONE" : ""}
                      </Text>
                    </View>

                    <Text style={{ color: "#94a3b8" }}>{d.focus.join(" • ")}</Text>

                    {done && lastAt ? (
                      <Text style={{ color: "#94a3b8" }}>
                        Last completed: {new Date(lastAt).toLocaleDateString()}
                      </Text>
                    ) : null}

                    <Text style={{ color: "#94a3b8" }}>{done ? "Tap to view/run again" : "Tap to start"}</Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        );
      })}

      <Pressable
        onPress={() => router.back()}
        style={{ borderWidth: 1, borderColor: "#334155", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "800" }}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}
