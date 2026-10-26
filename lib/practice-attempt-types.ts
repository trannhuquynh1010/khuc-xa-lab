import type { ActivityKey } from "@/lib/activities";

export const practiceDefinitions = [
  { key: "refraction-application", activityKey: "refraction", label: "Bài vận dụng khúc xạ", totalItems: 16 },
  { key: "current-voltage-practice", activityKey: "ohm", label: "Luyện tập I phụ thuộc vào U", totalItems: 10 },
  { key: "ohm-law-practice", activityKey: "ohm", label: "Định luật Ohm", totalItems: 7 },
  { key: "ohm-race", activityKey: "ohm", label: "Đường đua Điện học", totalItems: 15 },
  { key: "resistance-factors-practice", activityKey: "resistance-factors", label: "Mật mã điện trở", totalItems: 12 },
  { key: "optics-quest", activityKey: "optics-game", label: "Photon Quest", totalItems: 12 },
  { key: "optics-review", activityKey: "optics-review", label: "Ôn tập Quang học", totalItems: 20 },
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

/**
 * Các bài tính điểm cộng theo THỨ HẠNG NỘP BÀI thay vì theo số câu đúng:
 * mỗi lớp có một số suất nhất định, bạn nào nộp mà đạt mức `minCorrect` sẽ nhận
 * một suất nếu lớp còn trống. Suất được chốt ngay lúc nộp nên không bị đổi về
 * sau. Bài không có trong danh sách này vẫn dùng getPracticeBonusPoint.
 */
export type RankBonusConfig = { slots: number; point: number; minCorrect: number };

const rankBonusConfigs: Partial<Record<PracticeKey, RankBonusConfig>> = {
  // 10 ý · xét từ 9/10 trở lên
  "current-voltage-practice": { slots: 10, point: 1, minCorrect: 9 },
  // 7 ý · xét từ 6/7 trở lên
  "ohm-law-practice": { slots: 10, point: 1, minCorrect: 6 },
};

export function getRankBonusConfig(key: PracticeKey): RankBonusConfig | null {
  return rankBonusConfigs[key] ?? null;
}

export type PracticeCompletionState = "no-data" | "partial" | "complete";

export function getPracticeCompletionState(completedCount: number, totalItems: number): PracticeCompletionState {
  if (completedCount <= 0) return "no-data";
  if (totalItems > 0 && completedCount >= totalItems) return "complete";
  return "partial";
}

export type PracticeAttemptStatus = {
  submitted: boolean;
  forced: boolean;
  released: boolean;
  completedCount: number;
  correctCount?: number;
  totalItems: number;
  bonusPoint?: number;
  completionState: PracticeCompletionState;
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
  masteryLevel: string | null;
  completionState: PracticeCompletionState;
};
