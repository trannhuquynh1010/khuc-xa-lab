// Declares every AI-tutored lesson in one place. The tutor engine reads the
// descriptor from the session state, so adding a lesson needs no engine change.
// Deliberately imports no engine module, to keep this free of import cycles.
import { aiDiagnosticIds, aiTransferIds, buildOpticsAiBank } from "./optics-ai-bank";
import { buildLensAiBank, lensDiagnosticIds, lensTransferIds } from "./lens-review";
import { AI_PRACTICE_COUNT, LENS_AI_VERSION, OPTICS_AI_VERSION, type AiBankQuestion, type AiTopic } from "./optics-ai-types";

export type AiLessonKey = "optics" | "lens";

export type AiLessonConfig = {
  key: AiLessonKey;
  /** Stored on every session row; also the uniqueness key per student. */
  version: string;
  /** Row in activity_settings that the teacher opens and closes. */
  activityKey: string;
  title: string;
  /** Subject line injected into the tutor prompt. */
  subject: string;
  topics: AiTopic[];
  diagnosticIds: string[];
  transferIds: string[];
  /** Questions answered in the personalised middle phase. */
  practiceCount: number;
  buildBank: () => AiBankQuestion[];
};

export const aiLessons: Record<AiLessonKey, AiLessonConfig> = {
  optics: {
    key: "optics",
    version: OPTICS_AI_VERSION,
    activityKey: "optics-ai-review",
    title: "Ôn tập Quang học giữa kì 1",
    subject: "Quang học lớp 9 (khúc xạ, phản xạ toàn phần, lăng kính, màu sắc)",
    topics: ["refraction", "tir", "prism", "color"],
    diagnosticIds: aiDiagnosticIds,
    transferIds: aiTransferIds,
    practiceCount: AI_PRACTICE_COUNT,
    buildBank: buildOpticsAiBank,
  },
  lens: {
    key: "lens",
    version: LENS_AI_VERSION,
    activityKey: "lens-ai-review",
    title: "Thấu kính & cách hiểu của em",
    subject: "Thấu kính lớp 9 (nhận dạng thấu kính, tiêu điểm và tiêu cự, ba tia đặc biệt, sự tạo ảnh)",
    topics: ["lens-type", "focal", "rays", "image"],
    diagnosticIds: lensDiagnosticIds,
    transferIds: lensTransferIds,
    practiceCount: AI_PRACTICE_COUNT,
    buildBank: buildLensAiBank,
  },
};

export function isAiLessonKey(value: unknown): value is AiLessonKey {
  return value === "optics" || value === "lens";
}

export function lessonByVersion(version: string): AiLessonConfig | null {
  return Object.values(aiLessons).find(lesson => lesson.version === version) ?? null;
}
