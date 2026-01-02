// src/data/rageFibonacci.ts
//
// FULL-FILE REPLACEMENT ONLY
// ✅ DATA ONLY — NO JSX / NO REACT COMPONENTS
//
// Matches the RAGE Fibonacci Pyramid doc exactly.
//
// Set #1 (normal pyramid): 21 → 13 → 8 → 5 → 8 → 13 → 21
// Set #2 (reverse pyramid order): 5 → 8 → 13 → 21 → 13 → 8 → 5
//
// Reverse exercises are represented as a second exercise entry with a "-rev" id.
// Template IDs MUST remain stable (Supabase depends on them).

import type { WorkoutTemplate } from "./types";

const FIB_UP = [21, 13, 8, 5, 8, 13, 21];
const FIB_DOWN = [5, 8, 13, 21, 13, 8, 5];

function ex(id: string, name: string, reverse = false) {
  return {
    id,
    name,
    target_reps: reverse ? [...FIB_DOWN] : [...FIB_UP],
  };
}

export const RAGE_FIBONACCI_TEMPLATES: WorkoutTemplate[] = [
  // -------------------------
  // WEEK 1 — DAY 1
  // -------------------------
  {
    id: "fib-w1d1", // KEEP (already in Supabase)
    title: "RAGE — Fibonacci Pyramids (Week 1 • Day 1)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 1,
    day: 1,
    exercises: [
      ex("incline-db-press", "Incline Dumbbell Press"),
      ex("incline-db-press-rev", "Incline Dumbbell Press (reverse pyramid order)", true),
      ex("tate-press", "Tate Press"),
      ex("db-curls", "Dumbbell Curls"),
      ex("standing-calf-raises", "Standing Calf Raises"),
      ex("standing-lateral-raises", "Standing Lateral Raises"),
    ],
  },

  // -------------------------
  // WEEK 1 — DAY 2
  // -------------------------
  {
    id: "rage-fib-w1d2", // KEEP (already in Supabase)
    title: "RAGE — Fibonacci Pyramids (Week 1 • Day 2)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 1,
    day: 2,
    exercises: [
      ex("db-squat", "Dumbbell Squat"),
      ex("db-squat-rev", "Dumbbell Squat (reverse pyramid order)", true),
      ex("seated-shoulder-press", "Seated Shoulder Press"),
      ex("lying-tri-ext-db", "Lying Triceps Extension (Dumbbells)"),
      ex("calf-press", "Calf Press"),
      ex("upright-db-row", "Upright Dumbbell Row"),
    ],
  },

  // -------------------------
  // WEEK 1 — DAY 3
  // -------------------------
  {
    id: "rage-fib-w1d3", // KEEP (already in Supabase)
    title: "RAGE — Fibonacci Pyramids (Week 1 • Day 3)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 1,
    day: 3,
    exercises: [
      ex("wide-grip-pulldown", "Wide Grip Pulldown"),
      ex("wide-grip-pulldown-rev", "Wide Grip Pulldown (reverse pyramid order)", true),
      ex("tricep-rope-pushdowns", "Tricep Rope Pushdowns"),
      ex("incline-db-curls", "Incline Dumbbell Curls"),
      ex("stiff-leg-deadlift", "Stiff Leg Deadlift"),
      ex("bent-lateral-raise", "Bent Lateral Raise"),
    ],
  },

  // -------------------------
  // WEEK 2 — DAY 1
  // -------------------------
  {
    id: "rage-fib-w2d1",
    title: "RAGE — Fibonacci Pyramids (Week 2 • Day 1)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 2,
    day: 1,
    exercises: [
      ex("seated-shoulder-press", "Seated Shoulder Press"),
      ex("seated-shoulder-press-rev", "Seated Shoulder Press (reverse pyramid order)", true),
      ex("lying-tri-ext-bb", "Lying Triceps Extension (Barbell)"),
      ex("incline-db-curls", "Incline Dumbbell Curls"),
      ex("seated-calf-raises", "Seated Calf Raises"),
      ex("alt-incline-db-press", "Alternate Incline Dumbbell Press"),
    ],
  },

  // -------------------------
  // WEEK 2 — DAY 2
  // -------------------------
  {
    id: "rage-fib-w2d2",
    title: "RAGE — Fibonacci Pyramids (Week 2 • Day 2)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 2,
    day: 2,
    exercises: [
      ex("db-squat", "Dumbbell Squat"),
      ex("db-squat-rev", "Dumbbell Squat (reverse pyramid order)", true),
      ex("high-pull", "High Pull"),
      ex("seated-curl-press", "Seated Curl & Press"),
      ex("standing-calf-raises", "Standing Calf Raises"),
      ex("shrugs", "Shrugs"),
    ],
  },

  // -------------------------
  // WEEK 2 — DAY 3
  // -------------------------
  {
    id: "rage-fib-w2d3",
    title: "RAGE — Fibonacci Pyramids (Week 2 • Day 3)",
    program_key: "fibonacci",
    program_name: "RAGE — Fibonacci Pyramids",
    workout_type: "fibonacci",
    week: 2,
    day: 3,
    exercises: [
      ex("low-pulley-row-cg", "Low Pulley Row (Close Grip)"),
      ex("low-pulley-row-cg-rev", "Low Pulley Row (Close Grip) (reverse pyramid order)", true),
      ex("incline-db-press", "Incline Dumbbell Press"),
      ex("tate-press", "Tate Press"),
      ex("bb-curls", "Barbell Curls"),
      ex("front-raises", "Front Raises"),
    ],
  },
];
