// app/workout/[id].tsx
//
// FULL-FILE REPLACEMENT ONLY
//
// Dispatcher:
// - id is template_id
// - optional query param: ?sessionId=... to resume an unfinished session
// - uses template.workout_type (your data files), not template.type

import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { TEMPLATES } from "../../src/data/templates";

import FibonacciWorkout from "./types/FibonacciWorkout";
import ProgressiveSuperSetsWorkout from "./types/ProgressiveSuperSetsWorkout";
import TimedSetsWorkout from "./types/TimedSetsWorkout";
import ConditioningCircuitsWorkout from "./types/ConditioningCircuitsWorkout";

export default function WorkoutDispatcher() {
  const params = useLocalSearchParams<{ id: string; sessionId?: string }>();
  const templateId = String(params?.id ?? "").trim();
  const sessionId = params?.sessionId ? String(params.sessionId) : undefined;

  const template = TEMPLATES.find((t: any) => t.id === templateId);

  if (!template) {
    return (
      <View style={{ flex: 1, padding: 16, gap: 12, justifyContent: "center" }}>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "900" }}>Workout not found</Text>
        <Text style={{ color: "#94a3b8" }}>Missing template: {templateId}</Text>

        <Pressable
          onPress={() => router.back()}
          style={{
            paddingVertical: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#334155",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900" }}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const wt = String((template as any).workout_type ?? "");

  if (wt === "fibonacci") return <FibonacciWorkout template={template} sessionId={sessionId} />;
  if (wt === "progressive_super_sets") return <ProgressiveSuperSetsWorkout template={template} sessionId={sessionId} />;
  if (wt === "timed_sets") return <TimedSetsWorkout template={template} sessionId={sessionId} />;
  if (wt === "conditioning_circuits") return <ConditioningCircuitsWorkout template={template} sessionId={sessionId} />;

  // Fallback inference (if workout_type missing)
  const hasCircuits = !!(template as any)?.day_plan?.circuits?.length;
  const hasWaves = !!(template as any)?.day_plan?.waves?.length;
  const hasTimedItems = Array.isArray((template as any)?.items) && (template as any).items.length > 0;

  if (hasCircuits) return <ConditioningCircuitsWorkout template={template} sessionId={sessionId} />;
  if (hasTimedItems) return <TimedSetsWorkout template={template} sessionId={sessionId} />;
  if (hasWaves) return <ProgressiveSuperSetsWorkout template={template} sessionId={sessionId} />;

  // Default fallback
  return <FibonacciWorkout template={template} sessionId={sessionId} />;
}
