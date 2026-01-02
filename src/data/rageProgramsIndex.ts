// src/data/rageProgramsIndex.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Fixes: Programs/Progress missing programs (only showing Conditioning Circuits)
// by generating the program index directly from TEMPLATES.
// Also exports multiple names for compatibility with older imports.

import { TEMPLATES } from "./templates";
import type { WorkoutTemplate } from "./types";

export type CanonicalWorkoutType =
  | "fibonacci"
  | "progressive_super_sets"
  | "timed_sets"
  | "conditioning_circuits";

export type RageProgramIndexItem = {
  key: CanonicalWorkoutType;
  title: string;
  description: string;
  template_ids: string[];
};

function normalizeType(raw: any): CanonicalWorkoutType | null {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!s) return null;

  if (s === "fibonacci" || s.includes("fibonacci") || s.includes("pyramid") || s.includes("rage_fibonacci")) {
    return "fibonacci";
  }

  if (
    s === "progressive_super_sets" ||
    s === "progressive_supersets" ||
    s.includes("superset") ||
    s.includes("super_set") ||
    s.includes("super_sets")
  ) {
    return "progressive_super_sets";
  }

  if (s === "timed_sets" || s === "timed" || s.includes("timed_set") || s.includes("rage_timed")) {
    return "timed_sets";
  }

  if (s === "conditioning_circuits" || s.includes("conditioning") || s.includes("circuit") || s.includes("circuits")) {
    return "conditioning_circuits";
  }

  return null;
}

function canonicalTypeForTemplate(t: WorkoutTemplate): CanonicalWorkoutType | null {
  const candidates = [
    (t as any).workout_type,
    (t as any).workoutType,
    (t as any).type,
    (t as any).program_type,
    (t as any).program_key,
    (t as any).program_name,
    (t as any).title,
    (t as any).id,
  ];

  for (const c of candidates) {
    const x = normalizeType(c);
    if (x) return x;
  }

  return null;
}

function sortByWeekDayTitle(a: WorkoutTemplate, b: WorkoutTemplate) {
  const aw = Number((a as any).week ?? 999);
  const bw = Number((b as any).week ?? 999);
  if (aw !== bw) return aw - bw;

  const ad = Number((a as any).day ?? 999);
  const bd = Number((b as any).day ?? 999);
  if (ad !== bd) return ad - bd;

  return String(a.title ?? "").localeCompare(String(b.title ?? ""));
}

const PROGRAM_META: Record<CanonicalWorkoutType, { title: string; description: string }> = {
  fibonacci: {
    title: "RAGE — Fibonacci Pyramids",
    description: "2-week program. 3 workouts/week. Normal + reverse pyramids with static target reps.",
  },
  progressive_super_sets: {
    title: "Progressive Super Sets",
    description: "2-week program. 4 workouts/week. 9 rounds: build → peak → descend. One round at a time.",
  },
  timed_sets: {
    title: "Timed Sets",
    description: "2-week program. 4 workouts/week. Timed RAGE sets inserted into normal strength work.",
  },
  conditioning_circuits: {
    title: "Conditioning Circuits",
    description:
      "Fixed 3-exercise circuits performed non-stop for 3 rounds with structured rest between rounds and circuits.",
  },
};

function buildProgramsFromTemplates(templates: WorkoutTemplate[]): RageProgramIndexItem[] {
  const buckets: Record<CanonicalWorkoutType, WorkoutTemplate[]> = {
    fibonacci: [],
    progressive_super_sets: [],
    timed_sets: [],
    conditioning_circuits: [],
  };

  for (const t of templates) {
    const ct = canonicalTypeForTemplate(t);
    if (!ct) continue;
    buckets[ct].push(t);
  }

  const order: CanonicalWorkoutType[] = [
    "fibonacci",
    "progressive_super_sets",
    "timed_sets",
    "conditioning_circuits",
  ];

  return order
    .map((k) => {
      const list = [...buckets[k]].sort(sortByWeekDayTitle);
      return {
        key: k,
        title: PROGRAM_META[k].title,
        description: PROGRAM_META[k].description,
        template_ids: list.map((t) => t.id),
      };
    })
    .filter((p) => p.template_ids.length > 0);
}

export const PROGRAMS: RageProgramIndexItem[] = buildProgramsFromTemplates(TEMPLATES);

// Compatibility exports (so older code keeps working)
export const RAGE_PROGRAMS = PROGRAMS;
export const RAGE_PROGRAMS_INDEX = PROGRAMS;
