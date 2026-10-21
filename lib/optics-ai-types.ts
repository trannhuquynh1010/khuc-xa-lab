export const OPTICS_AI_VERSION = "optics-ai-v2";
export const LENS_AI_VERSION = "lens-ai-v1";
/**
 * Questions answered in the personalised middle phase. Raised from 6 to 10 so
 * every bank item collects enough answers for the per-question analysis
 * (difficulty, discrimination, top distractor) to mean anything.
 */
export const AI_PRACTICE_COUNT = 10;
/** Sessions stored before practiceCount existed were all six-question runs. */
export const AI_LEGACY_PRACTICE_COUNT = 6;
/** 4 diagnostic + 10 practice + 4 transfer, the same shape for both lessons. */
export const OPTICS_AI_TOTAL = 18;
/**
 * Total items for one session. Read from the snapshot rather than the constant
 * so a lesson already in progress keeps the length it was started with.
 */
export function aiStateTotal(state: { preIds?: string[]; postIds?: string[]; practiceCount?: number }) {
  return (state.preIds?.length ?? 4) + (state.practiceCount ?? AI_LEGACY_PRACTICE_COUNT) + (state.postIds?.length ?? 4);
}
/**
 * Same ladder the other practices use (see getPracticeBonusPoint): all correct
 * earns 2, one short earns 1. Counted on the final answer, because the single
 * retry after a hint is part of the designed task rather than a second chance
 * at the whole lesson. Eight of the items have no retry at all, so the top
 * award still requires being right first time on those.
 */
export function aiBonusPoint(correctCount: number, totalItems = OPTICS_AI_TOTAL) {
  if (correctCount >= totalItems) return 2;
  if (correctCount >= totalItems - 1) return 1;
  return 0;
}
// Topics are declared per lesson; the shared label map keeps every surface
// (student screen, teacher dashboard, analytics) reading from one source.
export type AiTopic =
  | "refraction" | "tir" | "prism" | "color"
  | "lens-type" | "focal" | "rays" | "image";
export const aiTopicLabels: Record<AiTopic, string> = {
  refraction: "Khúc xạ", tir: "Phản xạ toàn phần", prism: "Lăng kính", color: "Màu sắc",
  "lens-type": "Nhận dạng thấu kính", focal: "Tiêu điểm & tiêu cự", rays: "Đường truyền tia sáng", image: "Sự tạo ảnh",
};
export type AiPhase = "diagnostic" | "practice" | "transfer" | "complete";
export const aiPhaseLabels: Record<AiPhase, string> = { diagnostic: "Chẩn đoán", practice: "Luyện tập cá nhân hóa", transfer: "Vận dụng độc lập", complete: "Hoàn thành" };
/**
 * Labels for the end-of-lesson mastery read-out: the highest difficulty a
 * student answered correctly on the first try, per topic. 0 means no first
 * try succeeded on that topic, not that the student knows nothing about it.
 */
export const aiMasteryLabels: Record<0 | 1 | 2 | 3, string> = { 0: "Cần ôn lại", 1: "Cơ bản", 2: "Khá", 3: "Giỏi" };
export type AiQuestion = { id: string; topic: AiTopic; difficulty: 1 | 2 | 3; kind: "true-false" | "single" | "multiple"; prompt: string; context?: string; choices: ReadonlyArray<{ value: string; label: string }>; requiresExplanation: boolean };
/**
 * A graded bank item for any tutored lesson. Structurally the same as
 * OpticsReviewQuestion but with the wider topic union, so each lesson can
 * declare its own topics while sharing one engine. Holds answer keys: server only.
 */
export type AiBankQuestion = {
  id: string;
  topic: AiTopic;
  difficulty: 1 | 2 | 3;
  kind: "true-false" | "single" | "multiple";
  prompt: string;
  context?: string;
  choices: ReadonlyArray<{ value: string; label: string }>;
  answers: readonly string[];
  explanation: string;
};
export type AiFeedback = { source: "ai" | "rules"; hint: string; reflection: string; reason: string; nextQuestionId: string; model: string | null; promptVersion: string; fallbackReason: string | null };
export type AiPublicEntry = { question: AiQuestion; phase: Exclude<AiPhase, "complete">; response: string[]; explanation: string; confidence: number; answeredAt: string; correct?: boolean; feedback?: AiFeedback; revision?: { response: string[]; explanation: string; correct: boolean; revisedAt: string }; reference?: string;
  /**
   * Choice values that were graded correct for this question. Revealed under the
   * same conditions as `reference` (lesson finished, teacher view, or already
   * revised) so a student can never see the key while a retry is still live.
   */
  correctChoices?: string[]; flagged?: boolean };
export type AiView = { id: string; version: number; lessonVersion: string; phase: AiPhase; needsRevision: boolean; question: AiQuestion | null; entries: AiPublicEntry[]; preview: boolean; selectionReason: string;
  /** Present when the teacher closed the lesson before this student finished. */
  forcedAt?: string;
  summary: { diagnostic: number; transfer: number; firstPractice: number; revisedPractice: number; aiCalls: number;
    /** Items in this session, so every screen counts to the same denominator. */
    total: number;
    /** Correct on the final answer, counting the one allowed retry. */
    finalCorrect: number;
    /** Zero until the lesson is finished, so a half-done attempt never shows an award. */
    bonusPoint: number } };
