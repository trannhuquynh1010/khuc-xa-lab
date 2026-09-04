import type { ActivityKey } from "@/lib/activities";

export const practiceDefinitions = [
  { key: "refraction-application", activityKey: "refraction", label: "Bài vận dụng khúc xạ", totalItems: 16 },
  { key: "current-voltage-practice", activityKey: "ohm", label: "Luyện tập I phụ thuộc vào U", totalItems: 10 },
  { key: "ohm-law-practice", activityKey: "ohm", label: "Định luật Ohm", totalItems: 7 },
  { key: "resistance-factors-practice", activityKey: "resistance-factors", label: "Mật mã điện trở", totalItems: 12 },
] as const satisfies ReadonlyArray<{ key: string; activityKey: ActivityKey; label: string; totalItems: number }>;

export type PracticeKey = (typeof practiceDefinitions)[number]["key"];

export function isPracticeKey(value: unknown): value is PracticeKey {
  return practiceDefinitions.some((definition) => definition.key === value);
}

export function getPracticeDefinition(key: PracticeKey) {
  return practiceDefinitions.find((definition) => definition.key === key)!;
}

export function getPracticeBonusPoint(correctCount: number, totalItems: number) {
  if (correctCount >= totalItems) return 2;
  if (correctCount >= totalItems - 1) return 1;
  return 0;
}

export type PracticeAttemptStatus = {
  submitted: boolean;
  forced: boolean;
  released: boolean;
  completedCount: number;
  correctCount?: number;
  totalItems: number;
  bonusPoint?: number;
};

export type TeacherPracticeAttempt = {
  id: string;
  className: string;
  studentNumber: number;
  completedCount: number;
  correctCount: number;
  totalItems: number;
  bonusPoint: number;
  forced: boolean;
  releasedAt: string | null;
  submittedAt: string | null;
};
