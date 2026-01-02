// app/programs.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Programs screen (clean UX):
// - Groups templates by workout_type
// - Collapsible sections
// - Auto-opens section from query param: /programs?open=fibonacci
// - Smart ordering:
//    ✅ Continue Workout if an unfinished session exists
//    ✅ Next Up = next template after last finished in same program

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { TEMPLATES } from "../src/data/templates";

type GroupKey = "fibonacci" | "progressive_super_sets" | "timed_sets" | "conditioning_circuits";

const GROUPS: { key: GroupKey; title: string; emoji: string }[] = [
  { key: "fibonacci", title: "Fibonacci Pyramids", emoji: "🧮" },
  { key: "progressive_super_sets", title: "Progressive Super Sets", emoji: "📈" },
  { key: "timed_sets", title: "Timed Sets", emoji: "⏱️" },
  { key: "conditioning_circuits", title: "Conditioning Circuits", emoji: "🔥" },
];

function groupKeyForTemplate(t: any): GroupKey | null {
  const wt = String(t?.workout_type ?? "").trim();
  if (wt === "fibonacci") return "fibonacci";
  if (wt === "progressive_super_sets") return "progressive_super_sets";
  if (wt === "timed_sets") return "timed_sets";
  if (wt === "conditioning_circuits") return "conditioning_circuits";

  // fallback inference from id
  const id = String(t?.id ?? "");
  if (id.includes("fib")) return "fibonacci";
  if (id.includes("pss")) return "progressive_super_sets";
  if (id.includes("ts")) return "timed_sets";
  if (id.includes("cc")) return "conditioning_circuits";

  return null;
}

export default function ProgramsScreen() {
  const params = useLocalSearchParams<{ open?: string }>();
  const openParam = String(params?.open ?? "").trim();

  const grouped = useMemo(() => {
    const map: Record<GroupKey, any[]> = {
      fibonacci: [],
      progressive_super_sets: [],
      timed_sets: [],
      conditioning_circuits: [],
    };

    for (const t of TEMPLATES as any[]) {
      const k = groupKeyForTemplate(t);
      if (k) map[k].push(t);
    }

    // Sort by id for stable ordering (works great with your fib-w1d1 style IDs)
    (Object.keys(map) as GroupKey[]).forEach((k) => {
      map[k].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    });

    return map;
  }, []);

  const [openKey, setOpenKey] = useState<GroupKey | null>(null);

  // “Smart actions”
  const [continueSession, setContinueSession] = useState<{ sessionId: string; templateId: string } | null>(null);
  const [nextUp, setNextUp] = useState<{ group: GroupKey; templateId: string; title: string } | null>(null);

  useEffect(() => {
    const match = GROUPS.find((g) => g.key === openParam)?.key as GroupKey | undefined;
    if (match) setOpenKey(match);
  }, [openParam]);

  useEffect(() => {
    let cancelled = false;

    const loadSmart = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      // 1) Continue workout if unfinished session exists
      const { data: unfinished } = await supabase
        .from("workout_sessions")
        .select("id, template_id, started_at")
        .eq("user_id", userId)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (unfinished?.id && unfinished?.template_id) {
        setContinueSession({ sessionId: unfinished.id, templateId: unfinished.template_id });
        // Don’t compute next-up if we can continue — continuation wins
        setNextUp(null);
        return;
      } else {
        setContinueSession(null);
      }

      // 2) Otherwise compute Next Up from last finished workout
      const { data: lastFinished } = await supabase
        .from("workout_sessions")
        .select("template_id, finished_at")
        .eq("user_id", userId)
        .not("finished_at", "is", null)
        .order("finished_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      const lastTemplateId = String(lastFinished?.template_id ?? "");
      if (!lastTemplateId) {
        setNextUp(null);
        return;
      }

      const lastTemplate = (TEMPLATES as any[]).find((t) => t.id === lastTemplateId);
      const group = groupKeyForTemplate(lastTemplate) ?? groupKeyForTemplate({ id: lastTemplateId });

      if (!group) {
        setNextUp(null);
        return;
      }

      const list = grouped[group] ?? [];
      const idx = list.findIndex((t: any) => t.id === lastTemplateId);

      // “Next day” = next in sorted order; if last one, wrap to first.
      const next = idx >= 0 ? list[(idx + 1) % list.length] : list[0];

      if (!next?.id) {
        setNextUp(null);
        return;
      }

      setNextUp({
        group,
        templateId: next.id,
        title: String(next.title ?? next.id),
      });

      // also auto-open the program you were last in (nice UX)
      setOpenKey(group);
    };

    loadSmart();

    return () => {
      cancelled = true;
    };
  }, [grouped]);

  const toggle = (k: GroupKey) => setOpenKey((prev) => (prev === k ? null : k));

  const startTemplate = (templateId: string) => {
    router.push(`/workout/${templateId}`);
  };

  const continueWorkout = () => {
    if (!continueSession) return;
    router.push(`/workout/${continueSession.templateId}?sessionId=${encodeURIComponent(continueSession.sessionId)}`);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Programs</Text>
      <Text style={{ color: "#94a3b8" }}>Pick a program → pick today → go earn your shower.</Text>

      {/* Smart action card */}
      {continueSession ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 18,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>Continue Workout</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            You’ve got an unfinished session. Let’s not waste those gains.
          </Text>

          <Pressable
            onPress={continueWorkout}
            style={{
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: "#22c55e",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#052e16", fontWeight: "900" }}>Continue</Text>
          </Pressable>
        </View>
      ) : nextUp ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            backgroundColor: "#0b1220",
            borderRadius: 18,
            padding: 14,
            gap: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>Next Up</Text>
          <Text style={{ color: "#cbd5f5", fontSize: 14, fontWeight: "900" }}>{nextUp.title}</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>Based on your last workout → next day in that program.</Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              onPress={() => {
                setOpenKey(nextUp.group);
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#334155",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "900" }}>View Program</Text>
            </Pressable>

            <Pressable
              onPress={() => startTemplate(nextUp.templateId)}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 16,
                backgroundColor: "#22c55e",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#052e16", fontWeight: "900" }}>Start</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Program sections */}
      {GROUPS.map((g) => {
        const list = grouped[g.key] ?? [];
        const isOpen = openKey === g.key;

        return (
          <View
            key={g.key}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              backgroundColor: "#0b1220",
              borderRadius: 18,
              overflow: "hidden",
            }}
          >
            <Pressable
              onPress={() => toggle(g.key)}
              style={{
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 18 }}>{g.emoji}</Text>
                <View>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{g.title}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12 }}>{list.length} workouts</Text>
                </View>
              </View>

              <Text style={{ color: "#cbd5f5", fontWeight: "900" }}>{isOpen ? "−" : "+"}</Text>
            </Pressable>

            {isOpen ? (
              <View style={{ padding: 12, paddingTop: 0, gap: 8 }}>
                {list.map((t: any) => (
                  <Pressable
                    key={t.id}
                    onPress={() => startTemplate(t.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#334155",
                      borderRadius: 14,
                      padding: 12,
                      backgroundColor: "#071024",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "900" }}>{String(t.title ?? t.id)}</Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>{t.id}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
