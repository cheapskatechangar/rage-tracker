// src/utils/sessionSummary.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Session summary helpers
// -----------------------
// Converts raw set_results rows into meaningful workout stats.
// Used by:
// - History detail
// - Charts
// - Future "Workout Summary" screen
//
// Works for ALL workout types, including conditioning_circuits.

export type SetResultRow = {
  exercise_name: string;
  set_index: number;
  target_kind: "reps" | "seconds";
  target_value: number;
  rest_seconds: number;
  reps_done: number | null;
  completed: boolean;
};

export type SessionSummary = {
  total_sets: number;
  total_exercises: number;
  total_reps: number;
  total_rest_seconds: number;
  completed_sets: number;
};

/**
 * Build a session summary from raw set_results rows.
 */
export function buildSessionSummary(rows: SetResultRow[]): SessionSummary {
  let total_sets = rows.length;
  let completed_sets = 0;
  let total_reps = 0;
  let total_rest_seconds = 0;

  const exercises = new Set<string>();

  for (const r of rows) {
    exercises.add(r.exercise_name);

    if (r.completed) completed_sets++;

    if (r.target_kind === "reps") {
      total_reps += r.reps_done ?? 0;
    }

    if (r.rest_seconds && r.rest_seconds > 0) {
      total_rest_seconds += r.rest_seconds;
    }
  }

  return {
    total_sets,
    completed_sets,
    total_exercises: exercises.size,
    total_reps,
    total_rest_seconds,
  };
}

/**
 * Format seconds → mm:ss
 */
export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
