import type { IconName } from "@/components/Icons";

// mood values are stored as the legacy emoji for data compatibility; the UI renders icons
export type MoodDef = { value: string; label: string; icon: IconName };

export const MOOD_DEFS: MoodDef[] = [
  { value: "😊", label: "Happy", icon: "moodHappy" },
  { value: "🥰", label: "Loved", icon: "moodLoved" },
  { value: "😐", label: "Calm", icon: "moodCalm" },
  { value: "😢", label: "Low", icon: "moodLow" },
  { value: "😤", label: "Tense", icon: "moodTense" },
  { value: "🌧", label: "Rainy", icon: "moodRainy" },
  { value: "✨", label: "Inspired", icon: "moodInspired" },
  { value: "😴", label: "Tired", icon: "moodTired" },
];

export function moodDef(value: string | null): MoodDef | null {
  if (!value) return null;
  return MOOD_DEFS.find((m) => m.value === value) ?? null;
}

export function moodLabel(value: string | null): string {
  return moodDef(value)?.label ?? "Mood";
}
