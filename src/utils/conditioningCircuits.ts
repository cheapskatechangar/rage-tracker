// src/utils/conditioningCircuits.ts
//
// FULL-FILE REPLACEMENT ONLY
//
// Conditioning Circuits helpers
// -----------------------------
// Centralized logic so rules are never duplicated across UI, history, or charts.
//
// Canonical rules enforced:
// - 3 exercises per circuit
// - 3 rounds per circuit
// - No rest between exercises
// - Rest between rounds: 60s
// - Rest after circuit: 180s

import type { ConditioningCircuit, ConditioningCircuitsDayPlan } from "../data/rageConditioningCircuits";

export const CC_EXERCISES_PER_CIRCUIT = 3 as const;
export const CC_ROUNDS_PER_CIRCUIT = 3 as const;

/**
 * Validate a circuit at runtime (dev safety net).
 * Throws if the structure is invalid.
 */
export function assertValidCircuit(circuit: ConditioningCircuit) {
  if (!circuit) throw new Error("Conditioning Circuit is missing");

  if (!Array.isArray(circuit.exercises)) {
    throw new Error(`Conditioning Circuit ${circuit.circuit} exercises must be an array`);
  }

  if (circuit.exercises.length !== CC_EXERCISES_PER_CIRCUIT) {
    throw new Error(
      `Conditioning Circuit ${circuit.circuit} must have exactly ${CC_EXERCISES_PER_CIRCUIT} exercises`
    );
  }

  if (circuit.rounds !== CC_ROUNDS_PER_CIRCUIT) {
    throw new Error(
      `Conditioning Circuit ${circuit.circuit} must have exactly ${CC_ROUNDS_PER_CIRCUIT} rounds`
    );
  }
}

/**
 * Total number of sets produced by a single circuit.
 * (3 exercises × 3 rounds = 9 sets)
 */
export function setsPerCircuit() {
  return CC_EXERCISES_PER_CIRCUIT * CC_ROUNDS_PER_CIRCUIT;
}

/**
 * Total sets for an entire Conditioning Circuits day.
 */
export function totalSetsForDay(plan: ConditioningCircuitsDayPlan) {
  return plan.circuits.length * setsPerCircuit();
}

/**
 * Compute a GLOBAL set_index for storage & history.
 *
 * Ordering:
 * - Circuit 1 (round 1 ex 1–3, round 2 ex 1–3, round 3 ex 1–3)
 * - Circuit 2 ...
 *
 * All indices are 0-based.
 */
export function computeConditioningSetIndex(params: {
  circuitIndex0: number; // 0-based
  roundIndex0: 0 | 1 | 2; // 0–2
  exerciseIndex0: 0 | 1 | 2; // 0–2
}) {
  const { circuitIndex0, roundIndex0, exerciseIndex0 } = params;

  if (circuitIndex0 < 0) throw new Error("circuitIndex0 must be >= 0");
  if (roundIndex0 < 0 || roundIndex0 > 2) throw new Error("roundIndex0 must be 0..2");
  if (exerciseIndex0 < 0 || exerciseIndex0 > 2) throw new Error("exerciseIndex0 must be 0..2");

  return (
    circuitIndex0 * setsPerCircuit() +
    roundIndex0 * CC_EXERCISES_PER_CIRCUIT +
    exerciseIndex0
  );
}

/**
 * Friendly label helpers (for UI / debug / logs)
 */
export function circuitLabel(circuitNumber: number) {
  return `Circuit ${circuitNumber}`;
}

export function roundLabel(roundIndex0: 0 | 1 | 2) {
  return `Round ${roundIndex0 + 1}`;
}
