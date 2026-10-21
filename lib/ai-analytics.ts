// Pure aggregation over finished tutor sessions. No DB, no network, so it can be
// tested directly and reused by any surface.
//
// IMPORTANT on interpretation: the diagnostic and transfer sets are different
// questions probing similar ideas. They were never equated or validated, so a
// gap between them describes what changed during the lesson. It is NOT an
// estimate of the effect of the AI, and nothing here supports a causal claim.
import { aiBonusPoint, aiStateTotal, aiTopicLabels, type AiPhase, type AiTopic } from "./optics-ai-types";
import type { AiEntry, AiState } from "./optics-ai-engine";

export type AnalyticsSession = { className: string; studentNumber: number; lessonVersion: string; createdAt: string; updatedAt: string; state: AiState };
/** A submitted practice attempt from any activity, not just the tutored ones. */
export type AnalyticsAttempt = { className: string; studentNumber: number; practiceKey: string; label: string; correctCount: number; totalItems: number; submittedAt: string };

export type ActivityRow = { practiceKey: string; label: string; students: number; submissions: number; correct: number; total: number; accuracyPercent: number; lastSubmittedAt: string | null };
/** One row per student combining every activity they submitted. */
export type OverallRow = { className: string; studentNumber: number; activities: number; correct: number; total: number; accuracyPercent: number };

/**
 * Item analysis for one question of the bank. `difficultyPercent` is the share
 * of students who got it right first try (classic p-value). `discrimination`
 * compares the strongest and weakest third of students on this item: a low or
 * negative value usually means the wording, not the student, is the problem.
 */
export type ItemRow = {
  questionId: string; topic: AiTopic; phase: AiPhase; difficulty: 1 | 2 | 3; prompt: string;
  served: number; correctFirst: number; difficultyPercent: number;
  discriminationPoints: number | null;
  /** The wrong option the class picked most often, i.e. the shared misconception. */
  topDistractor: { label: string; count: number; sharePercent: number } | null;
  hintsGiven: number; selfCorrected: number; hintSuccessPercent: number | null;
};

/** How long a student spent, used to spot clicking without reading. */
export type PaceRow = {
  className: string; studentNumber: number;
  medianSeconds: number | null; fastAnswers: number;
  medianHintSeconds: number | null; rushedRevisions: number;
};

export type TriageBand = "incomplete" | "needs-teacher" | "rushing" | "self-corrects" | "secure" | "mixed";
export type TriageRow = { className: string; studentNumber: number; band: TriageBand; note: string };

/** Did a hint lead to a fix? Split by who wrote the hint. */
export type HintEffectRow = { source: "ai" | "rules"; hints: number; selfCorrected: number; successPercent: number | null };

/** Per-topic first-attempt accuracy in the opening versus the closing stage. */
export type TopicShiftRow = { topic: AiTopic; label: string; diagnosticPercent: number | null; transferPercent: number | null; shiftPoints: number | null };

export type StudentRow = {
  className: string;
  studentNumber: number;
  updatedAt: string;
  completed: boolean;
  answered: number;
  /** Items in this session, read from the snapshot so older runs stay correct. */
  total: number;
  diagnostic: number;
  diagnosticTotal: number;
  transfer: number;
  transferTotal: number;
  /** Percentage points: transfer rate minus diagnostic rate. Null until both phases have items. */
  deltaPercent: number | null;
  practiceFirst: number;
  practiceRevised: number;
  practiceTotal: number;
  /** First-attempt correct answers across all three stages. */
  firstCorrectAll: number;
  /** Correct on the final answer, counting the one allowed retry. */
  finalCorrectAll: number;
  /** 2, 1 or 0. Zero until the lesson is finished. */
  bonusPoint: number;
  /** How often a wrong practice answer became right after coaching. */
  selfCorrected: number;
  aiCalls: number;
  ruleFallbacks: number;
  flagged: number;
  weakestTopic: AiTopic | null;
};

export type TopicRow = { topic: AiTopic; label: string; attempts: number; correct: number; accuracyPercent: number; students: number };

export type ClassRow = {
  className: string;
  sessions: number;
  completed: number;
  diagnosticPercent: number | null;
  transferPercent: number | null;
  deltaPercent: number | null;
  selfCorrectedPercent: number | null;
};

export type TimelineRow = { date: string; sessions: number; completed: number; diagnosticPercent: number | null; transferPercent: number | null };

export type Analytics = {
  students: StudentRow[];
  topics: TopicRow[];
  classes: ClassRow[];
  timeline: TimelineRow[];
  totals: {
    sessions: number;
    completed: number;
    aiCalls: number;
    ruleFallbacks: number;
    flagged: number;
    diagnosticPercent: number | null;
    transferPercent: number | null;
    deltaPercent: number | null;
    selfCorrectedPercent: number | null;
    /** How many finished students earned each award. */
    bonusTwo: number;
    bonusOne: number;
    bonusNone: number;
  };
  /** Results from every other activity the class submitted. */
  activities: ActivityRow[];
  overall: OverallRow[];
  activityTimeline: { date: string; submissions: number; accuracyPercent: number | null }[];
  activityTotals: { submissions: number; students: number; accuracyPercent: number | null };
  /** Beyond counting right and wrong. */
  items: ItemRow[];
  pace: PaceRow[];
  triage: TriageRow[];
  hintEffect: HintEffectRow[];
  topicShift: TopicShiftRow[];
  /** Bank items the adaptive engine never served, useful for bank upkeep. */
  unusedQuestions: { questionId: string; topic: AiTopic; prompt: string }[];
};

const FAST_ANSWER_SECONDS = 6;
const RUSHED_REVISION_SECONDS = 5;
/** Longer gaps mean the student stepped away, so they must not skew the median. */
const PAUSE_CAP_SECONDS = 600;

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  return Math.round(value * 10) / 10;
}
function secondsBetween(from: string, to: string) {
  const delta = (new Date(to).getTime() - new Date(from).getTime()) / 1000;
  return Number.isFinite(delta) && delta >= 0 ? delta : null;
}
/** Label of a response, so the same wrong pick groups together across students. */
function responseLabel(entry: AiEntry) {
  return entry.question.choices.filter(c => entry.response.includes(c.value)).map(c => c.label).sort().join(" + ");
}

function percent(correct: number, total: number) { return total > 0 ? Math.round((correct / total) * 1000) / 10 : null; }
function phaseEntries(state: AiState, phase: AiPhase) { return state.entries.filter(e => e.phase === phase); }
/** A practice item counts as mastered if the retry fixed it. */
function finalCorrect(entry: AiEntry) { return entry.revision ? entry.revision.correct : entry.correct; }

/**
 * One line per roll number of the class, including students who never started,
 * so the teacher can read the whole room at a glance right after stopping the
 * lesson. Roll numbers above the roster still appear, flagged, because a wrong
 * pick by a student is something the teacher needs to see rather than lose.
 */
export type ScoreboardRow = {
  studentNumber: number; onRoster: boolean; started: boolean; completed: boolean;
  /** True when this attempt was sealed by the teacher rather than finished. */
  forced: boolean;
  answered: number; total: number; finalCorrect: number; bonusPoint: number;
};
export function buildClassScoreboard(sessions: ReadonlyArray<{ studentNumber: number; state: AiState }>, rosterSize: number): ScoreboardRow[] {
  const byNumber = new Map(sessions.map(s => [s.studentNumber, s]));
  const numbers = new Set<number>([...Array.from({ length: rosterSize }, (_, i) => i + 1), ...byNumber.keys()]);
  return [...numbers].sort((a, b) => a - b).map(studentNumber => {
    const session = byNumber.get(studentNumber);
    const base = { studentNumber, onRoster: studentNumber <= rosterSize };
    if (!session) return { ...base, started: false, completed: false, forced: false, answered: 0, total: 0, finalCorrect: 0, bonusPoint: 0 };
    const { state } = session;
    const total = aiStateTotal(state);
    const correct = state.entries.filter(finalCorrect).length;
    const completed = state.phase === "complete";
    return { ...base, started: true, completed, forced: Boolean(state.forcedAt), answered: state.entries.length, total,
      finalCorrect: correct, bonusPoint: completed ? aiBonusPoint(correct, total) : 0 };
  });
}

export function summariseStudent(session: AnalyticsSession): StudentRow {
  const { state } = session;
  const diagnostics = phaseEntries(state, "diagnostic");
  const transfers = phaseEntries(state, "transfer");
  const practice = phaseEntries(state, "practice");
  const diagnostic = diagnostics.filter(e => e.correct).length;
  const transfer = transfers.filter(e => e.correct).length;
  const diagnosticRate = percent(diagnostic, diagnostics.length);
  const transferRate = percent(transfer, transfers.length);

  // Weakest topic uses the final outcome of every item the student saw.
  const byTopic = new Map<AiTopic, { attempts: number; correct: number }>();
  for (const entry of state.entries) {
    const bucket = byTopic.get(entry.question.topic) ?? { attempts: 0, correct: 0 };
    bucket.attempts++; if (finalCorrect(entry)) bucket.correct++;
    byTopic.set(entry.question.topic, bucket);
  }
  let weakestTopic: AiTopic | null = null; let worst = Infinity;
  for (const [topic, { attempts, correct }] of byTopic) {
    const rate = correct / attempts;
    if (rate < worst) { worst = rate; weakestTopic = topic; }
  }

  const wrongFirst = practice.filter(e => !e.correct);
  const finalCorrectTotal = state.entries.filter(finalCorrect).length;
  const total = aiStateTotal(state);
  return {
    className: session.className,
    studentNumber: session.studentNumber,
    updatedAt: session.updatedAt,
    completed: state.phase === "complete",
    answered: state.entries.length,
    total,
    diagnostic, diagnosticTotal: diagnostics.length,
    transfer, transferTotal: transfers.length,
    deltaPercent: diagnosticRate === null || transferRate === null ? null : Math.round((transferRate - diagnosticRate) * 10) / 10,
    practiceFirst: practice.filter(e => e.correct).length,
    practiceRevised: practice.filter(finalCorrect).length,
    practiceTotal: practice.length,
    firstCorrectAll: state.entries.filter(e => e.correct).length,
    finalCorrectAll: finalCorrectTotal,
    bonusPoint: state.phase === "complete" ? aiBonusPoint(finalCorrectTotal, total) : 0,
    selfCorrected: wrongFirst.filter(e => e.revision?.correct).length,
    aiCalls: state.aiCalls,
    ruleFallbacks: state.entries.filter(e => e.feedback?.source === "rules").length,
    flagged: state.entries.filter(e => e.flagged).length,
    weakestTopic: weakestTopic && worst < 1 ? weakestTopic : null,
  };
}

export function buildAnalytics(sessions: AnalyticsSession[], attempts: AnalyticsAttempt[] = []): Analytics {
  const students = sessions.map(summariseStudent).sort((a, b) => a.className.localeCompare(b.className) || a.studentNumber - b.studentNumber);

  // Topic accuracy across every student, so the teacher sees what the class as a
  // whole has not settled yet.
  const topicBuckets = new Map<AiTopic, { attempts: number; correct: number; students: Set<string> }>();
  for (const session of sessions) {
    for (const entry of session.state.entries) {
      const bucket = topicBuckets.get(entry.question.topic) ?? { attempts: 0, correct: 0, students: new Set<string>() };
      bucket.attempts++; if (finalCorrect(entry)) bucket.correct++;
      bucket.students.add(`${session.className}:${session.studentNumber}`);
      topicBuckets.set(entry.question.topic, bucket);
    }
  }
  const topics: TopicRow[] = [...topicBuckets].map(([topic, b]) => ({
    topic, label: aiTopicLabels[topic] ?? topic, attempts: b.attempts, correct: b.correct,
    accuracyPercent: percent(b.correct, b.attempts) ?? 0, students: b.students.size,
  })).sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const classNames = [...new Set(sessions.map(s => s.className))].sort();
  const classes: ClassRow[] = classNames.map(className => {
    const rows = students.filter(s => s.className === className);
    const dCorrect = rows.reduce((t, r) => t + r.diagnostic, 0); const dTotal = rows.reduce((t, r) => t + r.diagnosticTotal, 0);
    const tCorrect = rows.reduce((t, r) => t + r.transfer, 0); const tTotal = rows.reduce((t, r) => t + r.transferTotal, 0);
    const wrongFirst = rows.reduce((t, r) => t + (r.practiceTotal - r.practiceFirst), 0);
    const fixed = rows.reduce((t, r) => t + r.selfCorrected, 0);
    const dRate = percent(dCorrect, dTotal); const tRate = percent(tCorrect, tTotal);
    return {
      className, sessions: rows.length, completed: rows.filter(r => r.completed).length,
      diagnosticPercent: dRate, transferPercent: tRate,
      deltaPercent: dRate === null || tRate === null ? null : Math.round((tRate - dRate) * 10) / 10,
      selfCorrectedPercent: percent(fixed, wrongFirst),
    };
  });

  // Grouped by the day the session started, so repeated lessons show a trend.
  const dayBuckets = new Map<string, AnalyticsSession[]>();
  for (const session of sessions) {
    const date = session.createdAt.slice(0, 10);
    dayBuckets.set(date, [...(dayBuckets.get(date) ?? []), session]);
  }
  const timeline: TimelineRow[] = [...dayBuckets].sort(([a], [b]) => a.localeCompare(b)).map(([date, group]) => {
    const rows = group.map(summariseStudent);
    const dCorrect = rows.reduce((t, r) => t + r.diagnostic, 0); const dTotal = rows.reduce((t, r) => t + r.diagnosticTotal, 0);
    const tCorrect = rows.reduce((t, r) => t + r.transfer, 0); const tTotal = rows.reduce((t, r) => t + r.transferTotal, 0);
    return { date, sessions: rows.length, completed: rows.filter(r => r.completed).length, diagnosticPercent: percent(dCorrect, dTotal), transferPercent: percent(tCorrect, tTotal) };
  });

  const dCorrect = students.reduce((t, r) => t + r.diagnostic, 0); const dTotal = students.reduce((t, r) => t + r.diagnosticTotal, 0);
  const tCorrect = students.reduce((t, r) => t + r.transfer, 0); const tTotal = students.reduce((t, r) => t + r.transferTotal, 0);
  const wrongFirst = students.reduce((t, r) => t + (r.practiceTotal - r.practiceFirst), 0);
  const fixed = students.reduce((t, r) => t + r.selfCorrected, 0);
  const dRate = percent(dCorrect, dTotal); const tRate = percent(tCorrect, tTotal);

  // --- Item analysis: which questions worked, and which wrong option won ---
  // Rank students by first-attempt score so the item can be checked against the
  // strongest and weakest third (upper-lower discrimination index).
  const scored = sessions.map(session => ({ session, score: session.state.entries.filter(e => e.correct).length }))
    .sort((a, b) => b.score - a.score);
  const third = Math.floor(scored.length / 3);
  const upper = new Set(third >= 2 ? scored.slice(0, third).map(s => s.session) : []);
  const lower = new Set(third >= 2 ? scored.slice(-third).map(s => s.session) : []);

  type ItemBucket = {
    topic: AiTopic; phase: AiPhase; difficulty: 1 | 2 | 3; prompt: string;
    served: number; correctFirst: number; hints: number; selfCorrected: number;
    wrongPicks: Map<string, number>;
    upperServed: number; upperCorrect: number; lowerServed: number; lowerCorrect: number;
  };
  const itemBuckets = new Map<string, ItemBucket>();
  for (const session of sessions) {
    for (const entry of session.state.entries) {
      const bucket = itemBuckets.get(entry.question.id) ?? {
        topic: entry.question.topic, phase: entry.phase, difficulty: entry.question.difficulty, prompt: entry.question.prompt,
        served: 0, correctFirst: 0, hints: 0, selfCorrected: 0, wrongPicks: new Map<string, number>(),
        upperServed: 0, upperCorrect: 0, lowerServed: 0, lowerCorrect: 0,
      };
      bucket.served++;
      if (entry.correct) bucket.correctFirst++;
      else {
        const label = responseLabel(entry);
        if (label) bucket.wrongPicks.set(label, (bucket.wrongPicks.get(label) ?? 0) + 1);
      }
      if (entry.feedback) { bucket.hints++; if (entry.revision?.correct) bucket.selfCorrected++; }
      if (upper.has(session)) { bucket.upperServed++; if (entry.correct) bucket.upperCorrect++; }
      if (lower.has(session)) { bucket.lowerServed++; if (entry.correct) bucket.lowerCorrect++; }
      itemBuckets.set(entry.question.id, bucket);
    }
  }
  const items: ItemRow[] = [...itemBuckets].map(([questionId, b]) => {
    const upperRate = b.upperServed >= 2 ? b.upperCorrect / b.upperServed : null;
    const lowerRate = b.lowerServed >= 2 ? b.lowerCorrect / b.lowerServed : null;
    const top = [...b.wrongPicks].sort((x, y) => y[1] - x[1])[0];
    return {
      questionId, topic: b.topic, phase: b.phase, difficulty: b.difficulty, prompt: b.prompt,
      served: b.served, correctFirst: b.correctFirst, difficultyPercent: percent(b.correctFirst, b.served) ?? 0,
      discriminationPoints: upperRate === null || lowerRate === null ? null : Math.round((upperRate - lowerRate) * 1000) / 10,
      topDistractor: top ? { label: top[0], count: top[1], sharePercent: percent(top[1], b.served) ?? 0 } : null,
      hintsGiven: b.hints, selfCorrected: b.selfCorrected, hintSuccessPercent: percent(b.selfCorrected, b.hints),
    };
  }).sort((a, b) => a.difficultyPercent - b.difficultyPercent);

  // Questions in the bank that the adaptive engine never reached.
  const servedIds = new Set(itemBuckets.keys());
  const bank = sessions[0]?.state.bank ?? [];
  const unusedQuestions = bank.filter(q => !servedIds.has(q.id)).map(q => ({ questionId: q.id, topic: q.topic, prompt: q.prompt }));

  // --- Pace: a two-second answer is a click, not a reading ---
  const pace: PaceRow[] = sessions.map(session => {
    const gaps: number[] = [];
    const hintGaps: number[] = [];
    let fastAnswers = 0; let rushedRevisions = 0;
    let previous = session.createdAt;
    for (const entry of session.state.entries) {
      const gap = secondsBetween(previous, entry.answeredAt);
      if (gap !== null) {
        if (gap <= PAUSE_CAP_SECONDS) gaps.push(gap);
        if (gap < FAST_ANSWER_SECONDS) fastAnswers++;
      }
      previous = entry.answeredAt;
      if (entry.revision) {
        const hintGap = secondsBetween(entry.answeredAt, entry.revision.revisedAt);
        if (hintGap !== null) {
          if (hintGap <= PAUSE_CAP_SECONDS) hintGaps.push(hintGap);
          if (hintGap < RUSHED_REVISION_SECONDS) rushedRevisions++;
        }
        previous = entry.revision.revisedAt;
      }
    }
    return { className: session.className, studentNumber: session.studentNumber, medianSeconds: median(gaps), fastAnswers, medianHintSeconds: median(hintGaps), rushedRevisions };
  }).sort((a, b) => (a.medianSeconds ?? Infinity) - (b.medianSeconds ?? Infinity));

  // --- Triage: turn the numbers into who needs the teacher next ---
  const paceByStudent = new Map(pace.map(p => [`${p.className}:${p.studentNumber}`, p]));
  const triage: TriageRow[] = students.map(row => {
    const key = `${row.className}:${row.studentNumber}`;
    const p = paceByStudent.get(key);
    const wrongFirst = row.practiceTotal - row.practiceFirst;
    const fixRate = wrongFirst > 0 ? row.selfCorrected / wrongFirst : null;
    if (!row.completed) return { className: row.className, studentNumber: row.studentNumber, band: "incomplete" as TriageBand, note: `Mới làm ${row.answered}/${row.total} câu` };
    if (p && ((p.medianSeconds !== null && p.medianSeconds < 8) || p.fastAnswers >= 5 || p.rushedRevisions >= 3)) {
      return { className: row.className, studentNumber: row.studentNumber, band: "rushing" as TriageBand, note: `Trả lời rất nhanh (trung vị ${p.medianSeconds ?? "—"}s), có thể chưa đọc kỹ` };
    }
    if (fixRate !== null && wrongFirst >= 3 && fixRate < 0.5) {
      return { className: row.className, studentNumber: row.studentNumber, band: "needs-teacher" as TriageBand, note: `Sai ${wrongFirst} câu, chỉ sửa đúng ${row.selfCorrected}; gợi ý chưa đủ giúp em` };
    }
    // Band threshold is a share, not a count, so it holds if the lesson length changes.
    if (row.firstCorrectAll >= Math.ceil(row.total * 6 / 7)) return { className: row.className, studentNumber: row.studentNumber, band: "secure" as TriageBand, note: `Đúng ${row.firstCorrectAll}/${row.total} ngay lần đầu` };
    if (fixRate !== null && fixRate >= 0.7) return { className: row.className, studentNumber: row.studentNumber, band: "self-corrects" as TriageBand, note: `Sửa đúng ${row.selfCorrected}/${wrongFirst} câu sau khi đọc gợi ý` };
    return { className: row.className, studentNumber: row.studentNumber, band: "mixed" as TriageBand, note: `Đúng ${row.firstCorrectAll}/${row.total} lần đầu` };
  });

  // --- Did the hint work? Split by who wrote it ---
  const hintBuckets = new Map<"ai" | "rules", { hints: number; selfCorrected: number }>();
  for (const session of sessions) {
    for (const entry of session.state.entries) {
      if (!entry.feedback) continue;
      const bucket = hintBuckets.get(entry.feedback.source) ?? { hints: 0, selfCorrected: 0 };
      bucket.hints++; if (entry.revision?.correct) bucket.selfCorrected++;
      hintBuckets.set(entry.feedback.source, bucket);
    }
  }
  const hintEffect: HintEffectRow[] = (["ai", "rules"] as const)
    .filter(source => hintBuckets.has(source))
    .map(source => {
      const b = hintBuckets.get(source)!;
      return { source, hints: b.hints, selfCorrected: b.selfCorrected, successPercent: percent(b.selfCorrected, b.hints) };
    });

  // --- Per-topic opening versus closing, finer than one overall gap ---
  const shiftBuckets = new Map<AiTopic, { dCorrect: number; dTotal: number; tCorrect: number; tTotal: number }>();
  for (const session of sessions) {
    for (const entry of session.state.entries) {
      if (entry.phase !== "diagnostic" && entry.phase !== "transfer") continue;
      const bucket = shiftBuckets.get(entry.question.topic) ?? { dCorrect: 0, dTotal: 0, tCorrect: 0, tTotal: 0 };
      if (entry.phase === "diagnostic") { bucket.dTotal++; if (entry.correct) bucket.dCorrect++; }
      else { bucket.tTotal++; if (entry.correct) bucket.tCorrect++; }
      shiftBuckets.set(entry.question.topic, bucket);
    }
  }
  const topicShift: TopicShiftRow[] = [...shiftBuckets].map(([topic, b]) => {
    const d = percent(b.dCorrect, b.dTotal); const t = percent(b.tCorrect, b.tTotal);
    return { topic, label: aiTopicLabels[topic] ?? topic, diagnosticPercent: d, transferPercent: t, shiftPoints: d === null || t === null ? null : Math.round((t - d) * 10) / 10 };
  }).sort((a, b) => (a.shiftPoints ?? 0) - (b.shiftPoints ?? 0));

  // --- Every other activity, from submitted practice attempts ---
  const activityBuckets = new Map<string, { label: string; correct: number; total: number; submissions: number; students: Set<string>; last: string | null }>();
  for (const attempt of attempts) {
    const bucket = activityBuckets.get(attempt.practiceKey) ?? { label: attempt.label, correct: 0, total: 0, submissions: 0, students: new Set<string>(), last: null };
    bucket.correct += attempt.correctCount;
    bucket.total += attempt.totalItems;
    bucket.submissions++;
    bucket.students.add(`${attempt.className}:${attempt.studentNumber}`);
    if (!bucket.last || attempt.submittedAt > bucket.last) bucket.last = attempt.submittedAt;
    activityBuckets.set(attempt.practiceKey, bucket);
  }
  const activities: ActivityRow[] = [...activityBuckets].map(([practiceKey, b]) => ({
    practiceKey, label: b.label, students: b.students.size, submissions: b.submissions,
    correct: b.correct, total: b.total, accuracyPercent: percent(b.correct, b.total) ?? 0, lastSubmittedAt: b.last,
  })).sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const overallBuckets = new Map<string, OverallRow>();
  for (const attempt of attempts) {
    const key = `${attempt.className}:${attempt.studentNumber}`;
    const row = overallBuckets.get(key) ?? { className: attempt.className, studentNumber: attempt.studentNumber, activities: 0, correct: 0, total: 0, accuracyPercent: 0 };
    row.activities++; row.correct += attempt.correctCount; row.total += attempt.totalItems;
    overallBuckets.set(key, row);
  }
  const overall = [...overallBuckets.values()].map(row => ({ ...row, accuracyPercent: percent(row.correct, row.total) ?? 0 }))
    .sort((a, b) => a.className.localeCompare(b.className) || a.studentNumber - b.studentNumber);

  const attemptDays = new Map<string, { submissions: number; correct: number; total: number }>();
  for (const attempt of attempts) {
    const date = attempt.submittedAt.slice(0, 10);
    const bucket = attemptDays.get(date) ?? { submissions: 0, correct: 0, total: 0 };
    bucket.submissions++; bucket.correct += attempt.correctCount; bucket.total += attempt.totalItems;
    attemptDays.set(date, bucket);
  }
  const activityTimeline = [...attemptDays].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({ date, submissions: b.submissions, accuracyPercent: percent(b.correct, b.total) }));

  const attemptCorrect = attempts.reduce((t, a) => t + a.correctCount, 0);
  const attemptTotal = attempts.reduce((t, a) => t + a.totalItems, 0);

  return {
    students, topics, classes, timeline,
    totals: {
      sessions: students.length,
      completed: students.filter(s => s.completed).length,
      aiCalls: students.reduce((t, r) => t + r.aiCalls, 0),
      ruleFallbacks: students.reduce((t, r) => t + r.ruleFallbacks, 0),
      flagged: students.reduce((t, r) => t + r.flagged, 0),
      diagnosticPercent: dRate, transferPercent: tRate,
      deltaPercent: dRate === null || tRate === null ? null : Math.round((tRate - dRate) * 10) / 10,
      selfCorrectedPercent: percent(fixed, wrongFirst),
      bonusTwo: students.filter(s => s.bonusPoint === 2).length,
      bonusOne: students.filter(s => s.bonusPoint === 1).length,
      bonusNone: students.filter(s => s.completed && s.bonusPoint === 0).length,
    },
    activities, overall, activityTimeline,
    activityTotals: { submissions: attempts.length, students: overall.length, accuracyPercent: percent(attemptCorrect, attemptTotal) },
    items, pace, triage, hintEffect, topicShift, unusedQuestions,
  };
}
