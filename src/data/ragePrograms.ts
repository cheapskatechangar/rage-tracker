export type RageProgram = {
  programId: string;
  title: string;
  durationWeeks: 2;
  workoutsPerWeek: 3 | 4;
  weeks: {
    week: 1 | 2;
    days: {
      day: 1 | 2 | 3 | 4;
      title: string;
      blocks: RageBlock[];
    }[];
  }[];
};

export type RageBlock =
  | {
      type: "fib_pyramid";
      exerciseName: string;
      // 21 → 13 → 8 → 5 → 8 → 13 → 21 (or reversed variant)
      reps: number[];
      restsSec: number[]; // per step
      notes?: string;
    }
  | {
      type: "progressive_superset";
      name: string; // "Progressive Super Set 1"
      steps: { exercises: { name: string; reps: number }[]; restSec: number }[];
    }
  | {
      type: "timed_sets";
      items: {
        name: string;
        warmupSets?: number;
        sets: number;
        reps?: number;
        restSec: number;
        rageSeconds?: number; // for RAGE SET lines
        isRage?: boolean;
      }[];
    }
  | {
      type: "conditioning_circuits";
      circuits: {
        circuit: number;
        sets: number; // "complete 3 sets"
        restBetweenCircuitSec: number; // 60
        exercises: { name: string; reps: number }[];
        notes?: string; // "3 min rest then circuit 2"
      }[];
    };
