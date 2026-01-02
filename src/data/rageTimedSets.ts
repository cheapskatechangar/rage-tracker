import type { WorkoutTemplate } from "./types";

export type TimedStandardItem = {
  kind: "standard";
  name: string;
  warmupSets: number;
  workingSets: number; // from your sheet "Sets"
  reps: number;
  restSec: number;
};

export type TimedRageSetItem = {
  kind: "rage_set";
  name: string; // should include "RAGE SET — ..."
  durationSec: number;
  restAfterSec: number; // 180
};

export type TimedSetsItem = TimedStandardItem | TimedRageSetItem;

type TimedSetsTemplate = WorkoutTemplate & {
  type: "timed_sets";
  items: TimedSetsItem[];
};

const ts = (id: string, title: string, items: TimedSetsItem[]): TimedSetsTemplate => ({
  id,
  title,
  type: "timed_sets",
  items,
  exercises: [],
});

export const RAGE_TIMED_SETS_TEMPLATES: WorkoutTemplate[] = [
  // =========================
  // WEEK 1 — DAY 1 (Adonis Index)
  // =========================
  ts("rage-ts-w1d1", "Rage Timed Sets — Week 1 Day 1", [
    { kind: "standard", name: "Standing Lateral Raise", warmupSets: 2, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Front Raises", warmupSets: 2, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Seated Lateral Raises", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Standing Dumbbell Shoulder Press", durationSec: 45, restAfterSec: 180 },

    { kind: "standard", name: "Curl & Press", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },
    { kind: "standard", name: "High Pulls", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Power Shrugs", durationSec: 45, restAfterSec: 180 },

    { kind: "standard", name: "Incline Dumbbell Press", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },
    { kind: "standard", name: "Incline Dumbbell Flye", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Incline Dumbbell Press", durationSec: 45, restAfterSec: 180 },

    { kind: "standard", name: "Tricep Rope Push Down", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 1 — DAY 2 (Build & Burn — Legs & Back)
  // =========================
  ts("rage-ts-w1d2", "Rage Timed Sets — Week 1 Day 2", [
    { kind: "standard", name: "Step Ups", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Reverse Lunge", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Stiff Leg Deadlift", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Dumbbell Squat", durationSec: 45, restAfterSec: 180 },

    { kind: "standard", name: "Wide Grip Pulldowns", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },
    { kind: "standard", name: "One Arm Dumbbell Rows", warmupSets: 5, workingSets: 1, reps: 8, restSec: 60 },

    // Your sheet omits seconds here, but Week 1 format implies 45s
    { kind: "rage_set", name: "RAGE SET — Low Pulley Row (Wide Grip)", durationSec: 45, restAfterSec: 180 },

    { kind: "standard", name: "Barbell Curl", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 1 — DAY 3 (Adonis Index)
  // =========================
  ts("rage-ts-w1d3", "Rage Timed Sets — Week 1 Day 3", [
    { kind: "standard", name: "Standing Lateral Raise", warmupSets: 2, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Standing Shoulder Press", warmupSets: 2, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Bent Lateral Raise", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Standing Dumbbell Shoulder Press", durationSec: 50, restAfterSec: 180 },

    { kind: "standard", name: "Curl & Press", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },
    { kind: "standard", name: "High Pulls", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Power Shrugs", durationSec: 50, restAfterSec: 180 },

    { kind: "standard", name: "One Arm Pushups", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Incline Dumbbell Flyes", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Incline Dumbbell Press", durationSec: 50, restAfterSec: 180 },

    { kind: "standard", name: "Tate Press", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 1 — DAY 4 (Build & Burn — Legs & Back)
  // =========================
  ts("rage-ts-w1d4", "Rage Timed Sets — Week 1 Day 4", [
    { kind: "standard", name: "Step Ups", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Reverse Lunge", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Stiff Leg Deadlift", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Dumbbell Squat", durationSec: 50, restAfterSec: 180 },

    { kind: "standard", name: "Reverse Grip Pulldowns", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },
    { kind: "standard", name: "Bent Dumbbell Rows", warmupSets: 5, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Low Pulley Row (Wide Grip)", durationSec: 50, restAfterSec: 180 },

    { kind: "standard", name: "Seated Dumbbell Curl", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 2 — DAY 1 (Adonis Index)
  // =========================
  ts("rage-ts-w2d1", "Rage Timed Sets — Week 2 Day 1", [
    { kind: "standard", name: "Standing Lateral Raises", warmupSets: 2, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Standing Shoulder Press", warmupSets: 2, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Bent Lateral Raise", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Standing Dumbbell Shoulder Press", durationSec: 55, restAfterSec: 180 },

    { kind: "standard", name: "Seated Shoulder Press", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "High Pulls", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Power Shrugs", durationSec: 55, restAfterSec: 180 },

    { kind: "standard", name: "Incline Dumbbell Press", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Incline Flyes", warmupSets: 3, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Incline Dumbbell Press", durationSec: 55, restAfterSec: 180 },

    { kind: "standard", name: "Close Grip Pushups", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Tricep Rope Push Down", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 2 — DAY 2 (Build & Burn — Legs & Back)
  // =========================
  ts("rage-ts-w2d2", "Rage Timed Sets — Week 2 Day 2", [
    { kind: "standard", name: "Step Ups", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Reverse Lunge", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Stiff Leg Deadlift", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Dumbbell Squat", durationSec: 55, restAfterSec: 180 },

    { kind: "standard", name: "Wide Grip Pulldowns", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "One Arm Dumbbell Rows", warmupSets: 5, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Low Pulley Row (Wide Grip)", durationSec: 55, restAfterSec: 180 },

    { kind: "standard", name: "Reverse Grip Pulldowns", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Barbell Curl", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 2 — DAY 3 (Adonis Index)
  // =========================
  ts("rage-ts-w2d3", "Rage Timed Sets — Week 2 Day 3", [
    { kind: "standard", name: "Standing Lateral Raises", warmupSets: 2, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Standing Shoulder Press", warmupSets: 2, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Seated Lateral Raises", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Standing Dumbbell Shoulder Press", durationSec: 60, restAfterSec: 180 },

    { kind: "standard", name: "Curl & Press", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Power Shrugs", durationSec: 60, restAfterSec: 180 },

    { kind: "standard", name: "Incline Flyes", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Incline Dumbbell Bench Press", durationSec: 60, restAfterSec: 180 },

    { kind: "standard", name: "Tate Press", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),

  // =========================
  // WEEK 2 — DAY 4 (Build & Burn — Legs & Back)
  // =========================
  ts("rage-ts-w2d4", "Rage Timed Sets — Week 2 Day 4", [
    { kind: "standard", name: "Reverse Lunge", warmupSets: 3, workingSets: 1, reps: 13, restSec: 60 },
    { kind: "standard", name: "Step Ups", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },
    { kind: "standard", name: "Stiff Leg Deadlift", warmupSets: 2, workingSets: 1, reps: 5, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Dumbbell Squat", durationSec: 60, restAfterSec: 180 },

    { kind: "standard", name: "Reverse Grip Pulldowns", warmupSets: 3, workingSets: 1, reps: 8, restSec: 60 },

    { kind: "rage_set", name: "RAGE SET — Low Pulley Row (Wide Grip)", durationSec: 60, restAfterSec: 180 },

    { kind: "standard", name: "Seated Dumbbell Curl", warmupSets: 3, workingSets: 1, reps: 21, restSec: 60 },
  ]),
];
