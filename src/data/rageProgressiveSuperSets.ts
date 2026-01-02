// src/data/rageProgressiveSuperSets.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// NOTE:
// templates.ts expects: RAGE_PROGRESSIVE_SUPER_SETS_TEMPLATES
// This file previously exported: RAGE_PROGRESSIVE_SUPERSETS_TEMPLATES (missing underscore)
// which caused Progressive Super Sets to disappear from the app.

import type { WorkoutTemplate } from "./types";

/**
 * Progressive SuperSets rules (from the RAGE doc):
 * - 2 weeks
 * - 4 workouts/week
 * - 2 Progressive SuperSets per workout
 *
 * Each Progressive SuperSet “wave” is 9 rounds:
 * 1) Main exercise only: 21
 * 2) +1 exercise: 13/13
 * 3) +2 exercises: 8/8/8
 * 4) +3 exercises: 5/5/5/5
 * 5) +3 exercises: 5/5/5/5
 * 6) +3 exercises: 5/5/5/5
 * 7) +2 exercises: 8/8/8
 * 8) +1 exercise: 13/13
 * 9) Main exercise only: 21
 *
 * UI renders ONE ROUND at a time.
 */

type PSSExercise = {
  name: string;
  target_reps: number[];
};

type PSSRound = {
  round: number;
  exercises: PSSExercise[];
};

type PSSWave = {
  wave: 1 | 2;
  rounds: PSSRound[];
  rest_after_round_sec: number;
};

type PSSDayPlan = {
  waves: PSSWave[];
};

function e(name: string, reps: number[]): PSSExercise {
  return { name, target_reps: reps };
}

function buildWave(wave: 1 | 2, main: string, a: string, b: string, c: string): PSSWave {
  const rounds: PSSRound[] = [
    { round: 1, exercises: [e(main, [21])] },
    { round: 2, exercises: [e(main, [13]), e(a, [13])] },
    { round: 3, exercises: [e(main, [8]), e(a, [8]), e(b, [8])] },
    { round: 4, exercises: [e(main, [5]), e(a, [5]), e(b, [5]), e(c, [5])] },
    { round: 5, exercises: [e(main, [5]), e(a, [5]), e(b, [5]), e(c, [5])] },
    { round: 6, exercises: [e(main, [5]), e(a, [5]), e(b, [5]), e(c, [5])] },
    { round: 7, exercises: [e(main, [8]), e(a, [8]), e(b, [8])] },
    { round: 8, exercises: [e(main, [13]), e(a, [13])] },
    { round: 9, exercises: [e(main, [21])] },
  ];

  return {
    wave,
    rounds,
    rest_after_round_sec: 60,
  };
}

function template(id: string, title: string, week: 1 | 2, day: 1 | 2 | 3 | 4, wave1: any, wave2: any): WorkoutTemplate {
  const day_plan: PSSDayPlan = {
    waves: [wave1, wave2],
  };

  return {
    id,
    title,
    week,
    day,
    workout_type: "progressive_super_sets",
    program_key: "progressive_super_sets",
    program_name: "Progressive Super Sets",
    day_plan,
  } as any;
}

// ✅ Correct export name (matches templates.ts import)
export const RAGE_PROGRESSIVE_SUPER_SETS_TEMPLATES: WorkoutTemplate[] = [
  template(
    "rage-pss-w1d1",
    "Progressive Super Sets (Week 1 • Day 1)",
    1,
    1,
    buildWave(1, "Incline Dumbbell Press", "Incline Dumbbell Flye", "Push Ups", "Tricep Rope Pushdown"),
    buildWave(2, "Wide Grip Pulldowns", "Bent Dumbbell Row", "Seated Cable Row", "Stability Ball Curl Ups")
  ),

  template(
    "rage-pss-w1d2",
    "Progressive Super Sets (Week 1 • Day 2)",
    1,
    2,
    buildWave(1, "Standing Lateral Raise", "Front Raises", "Seated Lateral Raise", "Standing Dumbbell Shoulder Press"),
    buildWave(2, "Curl & Press", "High Pulls", "Power Shrugs", "Incline Dumbbell Press")
  ),

  template(
    "rage-pss-w1d3",
    "Progressive Super Sets (Week 1 • Day 3)",
    1,
    3,
    buildWave(1, "Leg Press", "Walking Lunges", "Romanian Deadlift", "Seated Leg Curl"),
    buildWave(2, "Standing Calf Raise", "Step Ups", "Reverse Lunge", "Get Ups")
  ),

  template(
    "rage-pss-w1d4",
    "Progressive Super Sets (Week 1 • Day 4)",
    1,
    4,
    buildWave(1, "Flat Dumbbell Press", "Push Ups", "Incline Dumbbell Flye", "Tricep Rope Pushdown"),
    buildWave(2, "Wide Grip Pulldowns", "Seated Cable Row", "Bent Dumbbell Row", "Stability Ball Curl Ups")
  ),

  template(
    "rage-pss-w2d1",
    "Progressive Super Sets (Week 2 • Day 1)",
    2,
    1,
    buildWave(1, "Incline Dumbbell Press", "Incline Dumbbell Flye", "Push Ups", "Tricep Rope Pushdown"),
    buildWave(2, "Wide Grip Pulldowns", "Bent Dumbbell Row", "Seated Cable Row", "Stability Ball Curl Ups")
  ),

  template(
    "rage-pss-w2d2",
    "Progressive Super Sets (Week 2 • Day 2)",
    2,
    2,
    buildWave(1, "Standing Lateral Raise", "Front Raises", "Seated Lateral Raise", "Standing Dumbbell Shoulder Press"),
    buildWave(2, "Curl & Press", "High Pulls", "Power Shrugs", "Incline Dumbbell Press")
  ),

  template(
    "rage-pss-w2d3",
    "Progressive Super Sets (Week 2 • Day 3)",
    2,
    3,
    buildWave(1, "Leg Press", "Walking Lunges", "Romanian Deadlift", "Seated Leg Curl"),
    buildWave(2, "Standing Calf Raise", "Step Ups", "Reverse Lunge", "Get Ups")
  ),

  template(
    "rage-pss-w2d4",
    "Progressive Super Sets (Week 2 • Day 4)",
    2,
    4,
    buildWave(1, "Flat Dumbbell Press", "Push Ups", "Incline Dumbbell Flye", "Tricep Rope Pushdown"),
    buildWave(2, "Wide Grip Pulldowns", "Seated Cable Row", "Bent Dumbbell Row", "Stability Ball Curl Ups")
  ),
];

// Backwards-compatible alias (older imports)
export const RAGE_PROGRESSIVE_SUPERSETS_TEMPLATES = RAGE_PROGRESSIVE_SUPER_SETS_TEMPLATES;
