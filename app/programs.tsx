// app/programs.tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// UX: Collapse programs into 4 expandable sections (accordion)
// - Shows a single button per program
// - Expand to reveal Week/Day workouts
// - Tap a workout to start (/workout/[templateId])
//
// Uses:
// - src/data/rageProgramsIndex.ts -> PROGRAMS
// - src/data/templates.ts -> TEMPLATES

import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";

import { PROGRAMS } from "../src/data/rageProgramsIndex";
import { TEMPLATES } from "../src/data/templates";

type DayItem = {
  id: string;
  title: string;
  week?: number;
  day?: number;
};

function num(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildDayLabel(t: any) {
  const w = num(t?.week);
  const d = num(t?.day);

  if (w && d) return `Week ${w} • Day ${d}`;
  if (w) return `Week ${w}`;
  if (d) return `Day ${d}`;
  return "Workout";
}

export default function ProgramsScreen() {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const templatesById = useMemo(() => {
    const m = new Map<string, any>();
    for (const t of TEMPLATES) m.set(t.id, t);
    return m;
  }, []);

  const programDays = useMemo(() => {
    const out: Record<string, DayItem[]> = {};

    for (const p of PROGRAMS) {
      const list: DayItem[] = (p.template_ids ?? [])
        .map((id) => templatesById.get(id))
        .filter(Boolean)
        .map((t: any) => ({
          id: String(t.id),
          title: String(t.title ?? t.id),
          week: num(t.week),
          day: num(t.day),
        }))
        .sort((a, b) => {
          const aw = a.week ?? 999;
          const bw = b.week ?? 999;
          if (aw !== bw) return aw - bw;
          const ad = a.day ?? 999;
          const bd = b.day ?? 999;
          if (ad !== bd) return ad - bd;
          return a.title.localeCompare(b.title);
        });

      out[p.key] = list;
    }

    return out;
  }, [templatesById]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>Programs</Text>
      <Text style={{ color: "#94a3b8" }}>
        Pick a program, then choose a day. (Less chaos. More gains.)
      </Text>

      {PROGRAMS.map((p) => {
        const isOpen = openKey === p.key;
        const days = programDays[p.key] ?? [];

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
            {/* Program header button */}
            <Pressable
              onPress={() => setOpenKey((prev) => (prev === p.key ? null : p.key))}
              style={{
                padding: 14,
                gap: 6,
                backgroundColor: isOpen ? "rgba(34,197,94,0.08)" : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ color: "white", fontSize: 16, fontWeight: "900", flex: 1 }}>{p.title}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 16 }}>{isOpen ? "▾" : "▸"}</Text>
              </View>

              <Text style={{ color: "#94a3b8", fontSize: 12 }}>{p.description}</Text>
              <Text style={{ color: "#64748b", fontSize: 12 }}>{days.length} workouts</Text>
            </Pressable>

            {/* Expanded list */}
            {isOpen ? (
              <View style={{ padding: 12, paddingTop: 0, gap: 10 }}>
                {/* Group by week for readability */}
                {(() => {
                  const byWeek = new Map<number, DayItem[]>();
                  const noWeek: DayItem[] = [];

                  for (const d of days) {
                    if (d.week) {
                      if (!byWeek.has(d.week)) byWeek.set(d.week, []);
                      byWeek.get(d.week)!.push(d);
                    } else {
                      noWeek.push(d);
                    }
                  }

                  const weekKeys = Array.from(byWeek.keys()).sort((a, b) => a - b);

                  return (
                    <>
                      {weekKeys.map((wk) => (
                        <View key={`wk-${wk}`} style={{ gap: 8 }}>
                          <Text style={{ color: "#cbd5f5", fontWeight: "900", marginTop: 6 }}>Week {wk}</Text>

                          <View style={{ gap: 8 }}>
                            {byWeek.get(wk)!.map((d) => (
                              <Pressable
                                key={d.id}
                                onPress={() => router.push(`/workout/${d.id}`)}
                                style={{
                                  borderWidth: 1,
                                  borderColor: "#334155",
                                  borderRadius: 14,
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  backgroundColor: "#071024",
                                  gap: 2,
                                }}
                              >
                                <Text style={{ color: "white", fontWeight: "900" }}>{d.title}</Text>
                                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{buildDayLabel(d)}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}

                      {noWeek.length > 0 ? (
                        <View style={{ gap: 8 }}>
                          <Text style={{ color: "#cbd5f5", fontWeight: "900", marginTop: 6 }}>Other</Text>
                          {noWeek.map((d) => (
                            <Pressable
                              key={d.id}
                              onPress={() => router.push(`/workout/${d.id}`)}
                              style={{
                                borderWidth: 1,
                                borderColor: "#334155",
                                borderRadius: 14,
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                backgroundColor: "#071024",
                                gap: 2,
                              }}
                            >
                              <Text style={{ color: "white", fontWeight: "900" }}>{d.title}</Text>
                              <Text style={{ color: "#94a3b8", fontSize: 12 }}>{buildDayLabel(d)}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </>
                  );
                })()}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
