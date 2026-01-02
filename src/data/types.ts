// src/data/types.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Shared template type used by src/data/templates.ts and the workout dispatcher.
// We keep this intentionally flexible because each workout type has its own
// specific payload shape (day_plan, rounds, sets, etc.).
//
// Key requirement:
// - workout_type MUST include "conditioning_circuits"

export type WorkoutType =
  | "fibonacci"
  | "progressive_super_sets"
  | "timed_sets"
  | "conditioning_circuits";

/**
 * Base template shape shared across all programs.
 * Each workout type can attach additional fields as needed.
 */
export type WorkoutTemplate = {
  id: string;
  workout_type: WorkoutType;

  // Display fields
  title: string;
  description?: string;

  // Common program fields (optional; some programs may not use all)
  program_key?: string;
  program_name?: string;
  week?: number;
  day?: number;

  // Payload varies by workout_type
  // (kept as unknown so each workout screen can type-narrow locally)
  [key: string]: unknown;
};
