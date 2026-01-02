// src/data/rageConditioningCircuits.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Conditioning Circuits — STRICT DATA MODEL (AI-parsable, no inference)
// -------------------------------------------------------------------
// Implements exact rules:
//
// Hierarchy:
// Week -> Day -> Circuit -> Exercises
//
// Circuit Rules:
// - Exactly 3 exercises per circuit
// - Exactly 3 rounds per circuit
// - NO rest between exercises
// - Rest between rounds: 60s
// - Rest after circuit: 180s
//
// Exercise Rules:
// - Fixed reps only (no seconds)
// - No weights specified
// - Rounds repeat the SAME exercises and reps
//
// This file exports templates compatible with the generic WorkoutTemplate union shape.

import type { WorkoutTemplate } from "./types";

export type ConditioningCircuitsWorkoutType = "conditioning_circuits";

export type ConditioningCircuitExercise = {
  name: string;
  reps: number;
};

export type ConditioningCircuit = {
  circuit: number; // 1-based index for display
  rounds: 3;
  rest_between_rounds_sec: 60;
  rest_after_circuit_sec: 180;
  exercises: [
    ConditioningCircuitExercise,
    ConditioningCircuitExercise,
    ConditioningCircuitExercise
  ];
};

export type ConditioningCircuitsDayPlan = {
  week: 1 | 2;
  day: 1 | 2 | 3 | 4;
  workout_type: ConditioningCircuitsWorkoutType;
  title: string; // display title for the day
  circuits: ConditioningCircuit[];
};

export type ConditioningCircuitsTemplate = WorkoutTemplate & {
  program_key: "rage_conditioning_circuits";
  program_name: "Conditioning Circuits";
  workout_type: ConditioningCircuitsWorkoutType;
  week: 1 | 2;
  day: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  day_plan: ConditioningCircuitsDayPlan;
};

/**
 * ✅ Canonical constants (so UI never guesses)
 */
export const CC_ROUNDS = 3 as const;
export const CC_REST_BETWEEN_ROUNDS_SEC = 60 as const;
export const CC_REST_AFTER_CIRCUIT_SEC = 180 as const;

/**
 * Helper to enforce strict circuit shape at compile time.
 * - Exactly 3 exercises
 * - Exactly the rest rules
 * - Exactly 3 rounds
 */
function makeCircuit(
  circuit: number,
  exercises: [
    ConditioningCircuitExercise,
    ConditioningCircuitExercise,
    ConditioningCircuitExercise
  ]
): ConditioningCircuit {
  return {
    circuit,
    rounds: CC_ROUNDS,
    rest_between_rounds_sec: CC_REST_BETWEEN_ROUNDS_SEC,
    rest_after_circuit_sec: CC_REST_AFTER_CIRCUIT_SEC,
    exercises,
  };
}

/**
 * ✅ Templates
 * Duration: 2 weeks
 * Frequency: 4 workouts/week
 *
 * Content is starter-level; structure is fixed by spec.
 */
export const RAGE_CONDITIONING_CIRCUITS_TEMPLATES: ConditioningCircuitsTemplate[] = [
  // -------------------------
  // WEEK 1
  // -------------------------
  {
    id: "rage-cc-w1d1",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 1,
    day: 1,
    title: "Week 1 • Day 1",
    description:
      "Perform each circuit for 3 rounds. No rest between exercises. Rest 60s between rounds and 3 min after each circuit.",
    day_plan: {
      week: 1,
      day: 1,
      workout_type: "conditioning_circuits",
      title: "Full Body Capacity",
      circuits: [
        makeCircuit(1, [
          { name: "Push Ups", reps: 21 },
          { name: "Bodyweight Squats", reps: 21 },
          { name: "Curl and Press", reps: 13 },
        ]),
        makeCircuit(2, [
          { name: "Close Hands Push Ups", reps: 21 },
          { name: "Prisoner Squat", reps: 21 },
          { name: "Bent Dumbbell Row", reps: 13 },
        ]),
        makeCircuit(3, [
          { name: "Reverse Lunge", reps: 13 },
          { name: "Wide Grip Pulldowns", reps: 13 },
          { name: "Stability Ball Curl Ups", reps: 21 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w1d2",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 1,
    day: 2,
    title: "Week 1 • Day 2",
    description:
      "Perform each circuit for 3 rounds. Non-stop inside the circuit. Rest 60s between rounds and 3 min after each circuit.",
    day_plan: {
      week: 1,
      day: 2,
      workout_type: "conditioning_circuits",
      title: "Upper + Core Conditioning",
      circuits: [
        makeCircuit(1, [
          { name: "Incline Push Ups", reps: 21 },
          { name: "Inverted Rows", reps: 13 },
          { name: "Bicycle Crunches", reps: 21 },
        ]),
        makeCircuit(2, [
          { name: "Pike Push Ups", reps: 13 },
          { name: "Band Rows", reps: 21 },
          { name: "Leg Raises", reps: 13 },
        ]),
        makeCircuit(3, [
          { name: "Tricep Dips", reps: 21 },
          { name: "Face Pulls", reps: 21 },
          { name: "Plank Shoulder Taps", reps: 13 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w1d3",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 1,
    day: 3,
    title: "Week 1 • Day 3",
    description:
      "3 rounds per circuit. No rest between exercises. Rest 60s between rounds, then 3 min after circuit.",
    day_plan: {
      week: 1,
      day: 3,
      workout_type: "conditioning_circuits",
      title: "Lower Body + Work Capacity",
      circuits: [
        makeCircuit(1, [
          { name: "Walking Lunges", reps: 21 },
          { name: "Glute Bridges", reps: 21 },
          { name: "Calf Raises", reps: 21 },
        ]),
        makeCircuit(2, [
          { name: "Reverse Lunges", reps: 13 },
          { name: "Wall Sit", reps: 21 }, // reps used as a fixed count per spec
          { name: "Bodyweight Good Mornings", reps: 21 },
        ]),
        makeCircuit(3, [
          { name: "Step Ups", reps: 13 },
          { name: "Sumo Squats", reps: 21 },
          { name: "Side Lunges", reps: 13 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w1d4",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 1,
    day: 4,
    title: "Week 1 • Day 4",
    description:
      "Move fast but clean. Same rules: non-stop exercises, 60s between rounds, 3 min after circuit.",
    day_plan: {
      week: 1,
      day: 4,
      workout_type: "conditioning_circuits",
      title: "Mixed Modal",
      circuits: [
        makeCircuit(1, [
          { name: "Burpees", reps: 13 },
          { name: "Bodyweight Squats", reps: 21 },
          { name: "Mountain Climbers", reps: 21 },
        ]),
        makeCircuit(2, [
          { name: "Jumping Jacks", reps: 21 },
          { name: "Alternating Lunges", reps: 21 },
          { name: "Sit Ups", reps: 13 },
        ]),
        makeCircuit(3, [
          { name: "Skaters", reps: 21 },
          { name: "Push Ups", reps: 13 },
          { name: "Russian Twists", reps: 21 },
        ]),
      ],
    },
  },

  // -------------------------
  // WEEK 2
  // -------------------------
  {
    id: "rage-cc-w2d1",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 2,
    day: 1,
    title: "Week 2 • Day 1",
    description:
      "Week 2 variation. Structure unchanged: 3 exercises per circuit, 3 rounds, rest 60s between rounds, 3 min after circuit.",
    day_plan: {
      week: 2,
      day: 1,
      workout_type: "conditioning_circuits",
      title: "Full Body Capacity (Var)",
      circuits: [
        makeCircuit(1, [
          { name: "Diamond Push Ups", reps: 13 },
          { name: "Prisoner Squat", reps: 21 },
          { name: "Alternating Reverse Lunge", reps: 13 },
        ]),
        makeCircuit(2, [
          { name: "Wide Push Ups", reps: 21 },
          { name: "Bent Over Row", reps: 13 },
          { name: "Crunches", reps: 21 },
        ]),
        makeCircuit(3, [
          { name: "Split Squat (Left)", reps: 13 },
          { name: "Split Squat (Right)", reps: 13 },
          { name: "Superman Holds", reps: 21 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w2d2",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 2,
    day: 2,
    title: "Week 2 • Day 2",
    description: "Same circuit rules. Keep transitions tight. No weights specified.",
    day_plan: {
      week: 2,
      day: 2,
      workout_type: "conditioning_circuits",
      title: "Upper + Core (Var)",
      circuits: [
        makeCircuit(1, [
          { name: "Shoulder Taps", reps: 21 },
          { name: "Band Pull Aparts", reps: 21 },
          { name: "V-Ups", reps: 13 },
        ]),
        makeCircuit(2, [
          { name: "Tricep Dips", reps: 21 },
          { name: "Inverted Rows", reps: 13 },
          { name: "Flutter Kicks", reps: 21 },
        ]),
        makeCircuit(3, [
          { name: "Push Ups", reps: 21 },
          { name: "Face Pulls", reps: 21 },
          { name: "Heel Touches", reps: 21 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w2d3",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 2,
    day: 3,
    title: "Week 2 • Day 3",
    description: "Lower body focus. Same exact structure and rest rules.",
    day_plan: {
      week: 2,
      day: 3,
      workout_type: "conditioning_circuits",
      title: "Lower Body + Capacity (Var)",
      circuits: [
        makeCircuit(1, [
          { name: "Jump Squats", reps: 13 },
          { name: "Glute Bridges", reps: 21 },
          { name: "Side Lunges", reps: 13 },
        ]),
        makeCircuit(2, [
          { name: "Step Ups", reps: 21 },
          { name: "Bodyweight Good Mornings", reps: 21 },
          { name: "Calf Raises", reps: 21 },
        ]),
        makeCircuit(3, [
          { name: "Walking Lunges", reps: 21 },
          { name: "Wall Sit", reps: 21 },
          { name: "Bodyweight Squats", reps: 21 },
        ]),
      ],
    },
  },

  {
    id: "rage-cc-w2d4",
    program_key: "rage_conditioning_circuits",
    program_name: "Conditioning Circuits",
    workout_type: "conditioning_circuits",
    week: 2,
    day: 4,
    title: "Week 2 • Day 4",
    description: "Mixed modal closer. Same rules. Keep moving.",
    day_plan: {
      week: 2,
      day: 4,
      workout_type: "conditioning_circuits",
      title: "Mixed Modal (Var)",
      circuits: [
        makeCircuit(1, [
          { name: "Burpees", reps: 13 },
          { name: "Skaters", reps: 21 },
          { name: "Sit Ups", reps: 21 },
        ]),
        makeCircuit(2, [
          { name: "Jumping Jacks", reps: 21 },
          { name: "Mountain Climbers", reps: 21 },
          { name: "Push Ups", reps: 13 },
        ]),
        makeCircuit(3, [
          { name: "High Knees", reps: 21 },
          { name: "Alternating Lunges", reps: 21 },
          { name: "Russian Twists", reps: 21 },
        ]),
      ],
    },
  },
];
