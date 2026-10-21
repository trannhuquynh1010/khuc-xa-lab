// Only server routes import this module. Answer keys never enter the student bundle.
import { aiLessons, lessonByVersion, type AiLessonConfig, type AiLessonKey } from "./ai-lessons";
import { aiBonusPoint, AI_LEGACY_PRACTICE_COUNT, aiStateTotal, type AiBankQuestion, type AiFeedback, type AiPhase, type AiQuestion, type AiPublicEntry, type AiTopic, type AiView } from "./optics-ai-types";

type AiStoredQuestion = AiBankQuestion & { requiresExplanation?: boolean };
export type AiEntry = Omit<AiPublicEntry, "question" | "correct"> & { question: AiStoredQuestion; correct: boolean };
export type AiState = { id: string; version: number; lessonVersion: string; phase: AiPhase; needsRevision: boolean; bank: AiBankQuestion[]; current: AiStoredQuestion | null; entries: AiEntry[]; preview: boolean; selectionReason: string; aiCalls: number; responsePolicy?: "focused-v2" | "answer-first-v3";
  // Carried on the session so a stored snapshot stays self-describing even if
  // the lesson registry changes later. Absent on pre-registry snapshots.
  lessonKey?: AiLessonKey; preIds?: string[]; postIds?: string[]; topics?: AiTopic[]; practiceCount?: number;
  /** Set when the teacher ended the lesson before the student finished. */
  forcedAt?: string };
export type AiSubmission = { response: string[]; explanation: string; confidence: number };
// Snapshots written before the registry existed were all the optics lesson.
function lessonOf(state: AiState): AiLessonConfig {
  return (state.lessonKey && aiLessons[state.lessonKey]) || lessonByVersion(state.lessonVersion) || aiLessons.optics;
}
function preIdsOf(state: AiState) { return state.preIds ?? lessonOf(state).diagnosticIds; }
function postIdsOf(state: AiState) { return state.postIds ?? lessonOf(state).transferIds; }
function topicsOf(state: AiState) { return state.topics ?? lessonOf(state).topics; }
// A session in progress keeps the length it was started with, so raising the
// count never strands a student mid-lesson on a changed denominator.
function practiceCountOf(state: AiState) { return state.practiceCount ?? AI_LEGACY_PRACTICE_COUNT; }
function totalOf(state: AiState) { return aiStateTotal({ preIds: preIdsOf(state), postIds: postIdsOf(state), practiceCount: practiceCountOf(state) }); }
function fromBank(state: AiState, id: string) { const question = state.bank.find(q => q.id === id); if (!question) throw new Error("Không tìm thấy câu hỏi của phiên bản bài học."); return question; }
export function createLessonState(lesson: AiLessonConfig, id: string, preview = false): AiState {
  const bank = lesson.buildBank();
  const state: AiState = { id, version: 0, lessonVersion: lesson.version, lessonKey: lesson.key, preIds: [...lesson.diagnosticIds], postIds: [...lesson.transferIds], topics: [...lesson.topics], practiceCount: lesson.practiceCount,
    responsePolicy: "answer-first-v3", phase: "diagnostic", needsRevision: false, bank, current: null, entries: [], preview, selectionReason: "Câu chẩn đoán chung cho cả lớp.", aiCalls: 0 };
  setCurrentQuestion(state, bank.find(q => q.id === lesson.diagnosticIds[0])!);
  return state;
}
export function createAiState(id: string, preview = false): AiState {
  return createLessonState(aiLessons.optics, id, preview);
}
function setCurrentQuestion(state: AiState, question: AiBankQuestion) {
  // Grading reads the selected answer, so written reasoning is always optional.
  // Snapshots with no policy predate that rule and keep their stricter one.
  if (!state.responsePolicy) { state.current = question; return; }
  state.current = { ...question, requiresExplanation: false };
}
// Shared by the correct-answer path and the retry path so practice advances identically.
function advanceAfterPractice(state: AiState, preferredNextId?: string, reason?: string) {
  if (state.entries.filter(e => e.phase === "practice").length >= practiceCountOf(state)) {
    state.phase = "transfer";
    setCurrentQuestion(state, fromBank(state, postIdsOf(state)[0]));
    state.selectionReason = "Chặng cuối: em tự làm, không có gợi ý.";
    return;
  }
  const allowed = candidatesFor(state);
  setCurrentQuestion(state, allowed.find(q => q.id === preferredNextId) ?? allowed[0]);
  state.selectionReason = reason ?? "Củng cố chủ đề còn khó.";
}
export function publicQuestion(q: AiStoredQuestion): AiQuestion { return { id: q.id, topic: q.topic, difficulty: q.difficulty, kind: q.kind, prompt: q.prompt, context: q.context, choices: q.choices, requiresExplanation: q.requiresExplanation ?? true }; }
function grade(q: AiBankQuestion, values: string[]) { return values.length === q.answers.length && values.every(v => q.answers.includes(v)); }
export function validateSubmission(question: AiStoredQuestion | null, input: unknown): AiSubmission {
  if (!question || !input || typeof input !== "object") throw new Error("Câu trả lời không hợp lệ.");
  const value = input as Record<string, unknown>;
  if (!Array.isArray(value.response) || !value.response.length || value.response.some(v => typeof v !== "string" || !question.choices.some(c => c.value === v)) || new Set(value.response).size !== value.response.length || (question.kind !== "multiple" && value.response.length !== 1)) throw new Error("Hãy chọn đáp án hợp lệ.");
  const explanation = value.explanation === undefined ? "" : value.explanation;
  if (typeof explanation !== "string" || explanation.length > 600) throw new Error("Hãy viết lý do tối đa 600 ký tự.");
  // Explanation is a checkpoint, not a quota on every answer: only questions
  // explicitly marked optional skip it. Legacy snapshots (undefined) stay required.
  const minimum = question.requiresExplanation === false ? 0 : 10;
  if (explanation.trim().length < minimum) throw new Error("Hãy viết ít nhất 10 ký tự cho lý do chọn đáp án.");
  if (![1, 2, 3].includes(Number(value.confidence))) throw new Error("Hãy chọn mức tự tin.");
  return { response: value.response as string[], explanation: explanation.trim(), confidence: Number(value.confidence) };
}
export function candidatesFor(state: AiState): AiBankQuestion[] {
  const used = new Set(state.entries.map(e => e.question.id));
  // Pre/post anchors are reserved: practice must never spend them.
  const reserved = new Set([...preIdsOf(state), ...postIdsOf(state)]);
  const available = state.bank.filter(q => !reserved.has(q.id) && !used.has(q.id));
  const ranked = topicsOf(state).map(topic => {
    const entries = state.entries.filter(e => e.question.topic === topic);
    const correct = entries.filter(e => e.revision ? e.revision.correct : e.correct).length;
    return { topic, rate: correct / Math.max(entries.length, 1), visits: entries.filter(e => e.phase === "practice").length };
  }).sort((a, b) => (a.rate + a.visits * .18) - (b.rate + b.visits * .18));
  // Cover all topics while giving more practice to areas needing support.
  return ranked.flatMap(({ topic }) => {
    const recent = state.entries.filter(e => e.question.topic === topic).at(-1);
    const level = recent ? Math.max(1, Math.min(3, recent.question.difficulty + (recent.correct ? 1 : -1))) : 2;
    return available.filter(q => q.topic === topic).sort((a, b) => Math.abs(a.difficulty - level) - Math.abs(b.difficulty - level)).slice(0, 2);
  });
}
// Used whenever no provider answers. A fixed question every time reads as
// generic, so the nudge names the chosen option and varies the prompt.
const rulesPrompts = [
  "Điều kiện nào trong đề quyết định kết quả này?",
  "Dữ kiện nào trong đề em chưa dùng tới?",
  "Nếu đổi chiều truyền hoặc đổi môi trường, kết luận đó còn đúng không?",
  "Quy luật em đang dùng chỉ áp dụng được khi nào?",
];
export function rulesFeedback(state: AiState, entry: AiEntry, reason: string): AiFeedback {
  const next = candidatesFor(state)[0];
  const chosen = entry.question.choices.filter(c => entry.response.includes(c.value)).map(c => c.label);
  const prompt = rulesPrompts[state.entries.length % rulesPrompts.length];
  return { source: "rules", hint: entry.question.explanation,
    reflection: chosen.length ? `Em đang chọn “${chosen[0]}”. ${prompt}` : prompt,
    reason: "Củng cố chủ đề còn khó.", nextQuestionId: next?.id ?? "", model: null, promptVersion: "optics-tutor-rules-v3", fallbackReason: reason };
}
export async function answerAiState(state: AiState, input: unknown, feedback: (state: AiState, entry: AiEntry) => Promise<AiFeedback>, now = new Date().toISOString()): Promise<AiState> {
  if (state.phase === "complete" || state.needsRevision) throw new Error("Hãy hoàn thành bước sửa giải thích trước khi trả lời câu mới.");
  const submission = validateSubmission(state.current, input);
  const next = structuredClone(state);
  const entry: AiEntry = { question: next.current!, phase: next.phase as Exclude<AiPhase, "complete">, ...submission, correct: grade(next.current!, submission.response), answeredAt: now };
  next.entries.push(entry);
  if (next.phase === "practice") {
    // A correct choice needs confirmation, not coaching: no hint, no retry, no
    // provider call. Only a wrong choice earns a targeted nudge.
    if (entry.correct) {
      advanceAfterPractice(next, undefined, "Em đã đúng câu trước, sang chủ đề tiếp theo.");
    } else {
      entry.feedback = await feedback(next, entry);
      if (entry.feedback.source === "ai") next.aiCalls++;
      next.needsRevision = true;
    }
  } else if (next.phase === "diagnostic") {
    const count = next.entries.length;
    if (count < preIdsOf(next).length) setCurrentQuestion(next, fromBank(next, preIdsOf(next)[count]));
    else { next.phase = "practice"; setCurrentQuestion(next, candidatesFor(next)[0]); next.selectionReason = "Luyện chủ đề còn khó."; }
  } else {
    const count = next.entries.filter(e => e.phase === "transfer").length;
    if (count < postIdsOf(next).length) setCurrentQuestion(next, fromBank(next, postIdsOf(next)[count]));
    else { next.phase = "complete"; next.current = null; }
  }
  next.version++;
  return next;
}
export function reviseAiState(state: AiState, input: unknown, now = new Date().toISOString()): AiState {
  if (!state.needsRevision || state.phase !== "practice") throw new Error("Không có câu đang chờ sửa.");
  const submission = validateSubmission(state.current, input);
  const next = structuredClone(state);
  const entry = next.entries.at(-1)!;
  entry.revision = { response: submission.response, explanation: submission.explanation, correct: grade(entry.question, submission.response), revisedAt: now };
  next.needsRevision = false;
  advanceAfterPractice(next, entry.feedback?.nextQuestionId, entry.feedback?.reason);
  next.version++;
  return next;
}
/**
 * Teacher-driven stop at the end of the period. Seals the lesson wherever the
 * student happens to be: answers already given stand, a question on screen is
 * simply never counted, and a wrong answer still waiting for its retry stays
 * wrong. Bumping the version invalidates any request the student has in flight,
 * so their next action returns "reload" instead of writing over this.
 */
export function forceCompleteAiState(state: AiState, now = new Date().toISOString()): AiState {
  if (state.phase === "complete") return state;
  const next = structuredClone(state);
  next.phase = "complete"; next.current = null; next.needsRevision = false;
  next.forcedAt = now; next.version++;
  return next;
}
export function flagAiState(state: AiState): AiState {
  if (!state.needsRevision) throw new Error("Chỉ báo lỗi gợi ý đang xem.");
  const next = structuredClone(state); next.entries.at(-1)!.flagged = true; next.version++; return next;
}
/** Correct on the final answer, so a fix after the hint counts. */
export function finalCorrectCount(state: AiState) {
  return state.entries.filter(e => (e.revision ? e.revision.correct : e.correct)).length;
}
export function aiView(state: AiState, teacher = false): AiView {
  const visible = teacher || state.phase === "complete";
  const score = (phase: string, revised = false) => state.entries.filter(e => e.phase === phase && (revised ? e.revision?.correct : e.correct)).length;
  return { id: state.id, version: state.version, lessonVersion: state.lessonVersion, phase: state.phase, needsRevision: state.needsRevision, question: state.current ? publicQuestion(state.current) : null, preview: state.preview, selectionReason: state.selectionReason, forcedAt: state.forcedAt,
    entries: state.entries.map(e => ({ question: publicQuestion(e.question), phase: e.phase, response: e.response, explanation: e.explanation, confidence: e.confidence, answeredAt: e.answeredAt, feedback: e.feedback, revision: e.revision, flagged: e.flagged,
      // Practice is for learning, so right/wrong shows at once. Diagnostic and
      // transfer stay sealed until the end to keep them a fair measure.
      ...(visible || e.revision || e.phase === "practice" ? { correct: e.correct } : {}),
      // The standard reasoning unlocks only once the student can no longer use
      // it to shortcut the retry. The correct choice values follow the same
      // gate, so the key is never visible while a retry is still live.
      ...(visible || e.revision || (e.phase === "practice" && e.correct) ? { reference: e.question.explanation, correctChoices: [...e.question.answers] } : {}) })),
    summary: { diagnostic: visible ? score("diagnostic") : 0, transfer: visible ? score("transfer") : 0, firstPractice: visible ? score("practice") : 0, revisedPractice: visible ? score("practice", true) : 0, aiCalls: state.aiCalls,
      total: totalOf(state),
      finalCorrect: visible ? finalCorrectCount(state) : 0,
      // Only a finished lesson can earn the award.
      bonusPoint: state.phase === "complete" ? aiBonusPoint(finalCorrectCount(state), totalOf(state)) : 0 } };
}
