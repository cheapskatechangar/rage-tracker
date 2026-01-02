// src/data/templates.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Ensures all program templates are included and prevents crashes if an import is undefined.

import type { WorkoutTemplate } from "./types";

import { RAGE_FIBONACCI_TEMPLATES } from "./rageFibonacci";
import { RAGE_PROGRESSIVE_SUPER_SETS_TEMPLATES } from "./rageProgressiveSuperSets";
import { RAGE_TIMED_SETS_TEMPLATES } from "./rageTimedSets";
import { RAGE_CONDITIONING_CIRCUITS_TEMPLATES } from "./rageConditioningCircuits";

function asArray<T>(v: T[] | undefined | null): T[] {
  return Array.isArray(v) ? v : [];
}

export const TEMPLATES: WorkoutTemplate[] = [
  ...asArray(RAGE_FIBONACCI_TEMPLATES),
  ...asArray(RAGE_PROGRESSIVE_SUPER_SETS_TEMPLATES),
  ...asArray(RAGE_TIMED_SETS_TEMPLATES),
  ...asArray(RAGE_CONDITIONING_CIRCUITS_TEMPLATES),
];
