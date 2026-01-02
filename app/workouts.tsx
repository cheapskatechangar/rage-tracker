// app/workouts.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Start Workout UX v2:
// - "Next Up" card at top (smart suggestion)
// - If unfinished session exists -> show Continue Workout button
// - Program cards (tap to expand) -> choose specific day
// - Simple search to reduce scrolling
//
// Navigation:
// - Start/Choose workout -> /workout/[templateId]
// - Continue workout -> /workout/[templateId]?sessionId=...

import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "../src/lib/supabase";
import { TEMPLATES } from "../src/data/templates";
import type { WorkoutTemplate } from "../src/data/types";

type ActiveSession = {
  id: string;
  template_id: string;
  started_at: string;
};

type ProgramCard = {
  key: string;
  title: string;
  templates: WorkoutTemplate[];
};

function normalize(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function asArray<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function labelForTemplate(t: WorkoutTemplate) {
  const wk = t.week ? `W${t.week}` : "";
  const dy = t.day ? `D${t.day}` : "";
  const left = [wk, dy].filter(Boolean).join("");
  return left ? left : "Day";
}

function sortTemplates(a: WorkoutTemplate, b: WorkoutTemplate) {
  const aw = Number(a.week ?? 999);
  const bw = Number(b.week ?? 999);
  if (aw !== bw) return aw - bw;

  const ad = Number(a.day ?? 999);
  const bd = Number(b.day ?? 999);
  if (ad !== bd) return ad - bd;

  return normalize(a.title).localeCompare(normalize(b.title));
}

function templateProgramKey(t: WorkoutTemplate) {
  return normalize(t.program_key ?? t.program_name ?? "workouts") || "workouts";
}

function templateProgramTitle(t: WorkoutTemplate) {
  return String(t.program_name ?? t.program_key ?? "Workouts");
}

export default function Workouts() {
  const [search, setSearch] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSession | null>(null);

  const [nextUp, setNextUp] = useState<WorkoutTemplate | null>(null);
  const [nextUpSubtitle, setNextUpSubtitle] = useState<string>("");

  const templatesSorted = useMemo(() => {
    return [...TEMPLATES].sort(sortTemplates);
  }, []);

  const programs: ProgramCard[] = useMemo(() => {
    const map = new Map<string, ProgramCard>();

    for (const t of templatesSorted) {
      const key = templateProgramKey(t);
      if (!map.has(key)) {
        map.set(key, { key, title: templateProgramTitle(t), templates: [] });
      }
      map.get(key)!.templates.push(t);
    }

    const list = Array.from(map.values());
    list.sort((a, b) => normalize(a.title).localeCompare(normalize(b.title)));
    return list;
  }, [templatesSorted]);

  const filteredPrograms = useMemo(() => {
    const q = normalize(search);
    if (!q) return programs;

    return programs
      .map((p) => {
        const filtered = p.templates.filter((t) => normalize(t.title).includes(q));
        return { ...p, templates: filtered };
      })
      .filter((p) => p.templates.length > 0);
  }, [programs, search]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const { data: auth } = await supabase.auth.getSession();
      const session = auth.session;
      if (!session) {
        router.replace("/sign-in");
        return;
      }

      const userId = session.user.id;

      // 1) Load active (unfinished) session — used for Continue Workout
      const { data: activeRow, error: activeErr } = await supabase
        .from("workout_sessions")
        .select("id, template_id, started_at")
        .eq("user_id", userId)
        .is("finished_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (activeErr) {
        console.warn("Failed loading active session", activeErr);
        setActive(null);
      } else {
        setActive(activeRow ?? null);
      }

      // 2) Compute Next Up suggestion (only if no active session)
      if (!activeRow?.id) {
        const { data: lastFinished, error: lastErr } = await supabase
          .from("workout_sessions")
          .select("template_id, finished_at")
          .eq("user_id", userId)
          .not("finished_at", "is", null)
          .order("finished_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          if (lastErr) {
            console.warn("Failed loading last finished session", lastErr);
          }

          const lastTemplateId = String(lastFinished?.template_id ?? "");
          const lastTemplate = templatesSorted.find((t) => t.id === lastTemplateId) ?? null;

          if (!lastTemplate) {
            // first-time user or mismatch: pick the first template overall
            const first = templatesSorted[0] ?? null;
            setNextUp(first);
            setNextUpSubtitle(first ? "Suggested start" : "");
          } else {
            // pick next within same program ordering
            const pk = templateProgramKey(lastTemplate);
            const programTemplates = templatesSorted.filter((t) => templateProgramKey(t) === pk).sort(sortTemplates);

            const idx = programTemplates.findIndex((t) => t.id === lastTemplate.id);
            const next = idx >= 0 && idx < programTemplates.length - 1 ? programTemplates[idx + 1] : programTemplates[0];

            setNextUp(next ?? programTemplates[0] ?? templatesSorted[0] ?? null);

            const lastLabel = `${labelForTemplate(lastTemplate)} completed`;
            setNextUpSubtitle(lastLabel);
          }
        }
      } else {
        // Active session exists -> Next Up becomes "Continue"
        setNextUp(null);
        setNextUpSubtitle("");
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [templatesSorted]);

  const startTemplate = (t: WorkoutTemplate) => {
    router.push(`/workout/${t.id}`);
  };

  const continueWorkout = () => {
    if (!active?.id || !active?.template_id) return;
    router.push(`/workout/${active.template_id}?sessionId=${active.id}`);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Start Workout</Text>
        <Text style={{ color: "#94a3b8", fontSize: 14 }}>
          Pick “Next Up” or choose a program. Minimal thinking. Maximum lifting.
        </Text>
      </View>

      {/* Search */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#334155",
          backgroundColor: "#071024",
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      >
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search workouts (e.g., incline, squat, W1D2)…"
          placeholderTextColor="#64748b"
          style={{ color: "white", fontSize: 14 }}
        />
      </View>

      {/* Next Up / Continue */}
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
        <View style={{ gap: 4 }}>
          <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
            {active ? "Continue Workout" : "Next Up"}
          </Text>

          {active ? (
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>
              You have an unfinished workout session. Resume it.
            </Text>
          ) : nextUp ? (
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>
              {nextUpSubtitle ? `${nextUpSubtitle} • ` : ""}Suggested next:{" "}
              <Text style={{ color: "white", fontWeight: "900" }}>{nextUp.title}</Text>
            </Text>
          ) : (
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>
              {loading ? "Loading suggestion…" : "Pick a program below."}
            </Text>
          )}
        </View>

        {active ? (
          <Pressable
            onPress={continueWorkout}
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#052e16", fontSize: 16, fontWeight: "900" }}>Continue</Text>
          </Pressable>
        ) : nextUp ? (
          <Pressable
            onPress={() => startTemplate(nextUp)}
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#052e16", fontSize: 16, fontWeight: "900" }}>Start Next Workout</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => Alert.alert("No workouts found", "Your template catalog looks empty.")}
            style={{
              borderWidth: 1,
              borderColor: "#334155",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>No suggestion</Text>
          </Pressable>
        )}
      </View>

      {/* Program cards */}
      <View style={{ gap: 10 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>Programs</Text>

        {filteredPrograms.map((p) => {
          const isOpen = expandedKey === p.key;

          return (
            <View
              key={p.key}
              style={{
                borderWidth: 1,
                borderColor: "#334155",
                backgroundColor: "#0b1220",
                borderRadius: 18,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => setExpandedKey(isOpen ? null : p.key)}
                style={{
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ gap: 4, flex: 1 }}>
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>{p.title}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                    {p.templates.length} workouts • Tap to {isOpen ? "collapse" : "expand"}
                  </Text>
                </View>

                <Text style={{ color: "#94a3b8", fontSize: 18, fontWeight: "900" }}>
                  {isOpen ? "–" : "+"}
                </Text>
              </Pressable>

              {isOpen ? (
                <View style={{ padding: 14, paddingTop: 0, gap: 10 }}>
                  {p.templates.map((t) => (
                    <Pressable
                      key={t.id}
                      onPress={() => startTemplate(t)}
                      style={{
                        borderWidth: 1,
                        borderColor: "#334155",
                        padding: 12,
                        borderRadius: 14,
                        gap: 4,
                      }}
                    >
                      <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>
                        {labelForTemplate(t)} • {t.title}
                      </Text>
                      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{t.id}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Footer helper */}
      <View style={{ marginTop: 6, gap: 6 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            borderWidth: 1,
            borderColor: "#334155",
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 14, fontWeight: "900" }}>Back</Text>
        </Pressable>

        <Text style={{ color: "#64748b", fontSize: 12, textAlign: "center" }}>
          Pro tip: the “Next Up” button is here to save you from decision fatigue (and doom-scrolling your own workouts).
        </Text>
      </View>
    </ScrollView>
  );
}
