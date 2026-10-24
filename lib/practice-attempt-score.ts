import "server-only";

import {
  createEmptyRefractionQuizAnswers,
  sortingItems,
  trueFalseQuestions,
  type RefractionQuizAnswers,
} from "@/lib/refraction-quiz";
import { scoreRefractionQuiz } from "@/lib/refraction-quiz-score";
import { getPracticeBonusPoint, type PracticeKey } from "@/lib/practice-attempt-types";
import { gradeCurrentVoltagePractice } from "@/lib/current-voltage-practice-score";
import { createEmptyOhmRaceAnswers, OHM_RACE_QUESTION_COUNT } from "@/lib/ohm-race";
import { isOhmRaceAnswerCorrect } from "@/lib/ohm-race-score";
import { createEmptyOpticsQuestAnswers, OPTICS_QUEST_QUESTION_COUNT } from "@/lib/optics-quest";
import { isOpticsQuestAnswerCorrect } from "@/lib/optics-quest-score";
import { createEmptyOpticsReviewAnswers, getOpticsReviewQuestion, isOpticsReviewAnswerCorrect, isOpticsReviewResponseAnswered, OPTICS_REVIEW_QUESTION_COUNT } from "@/lib/optics-review";

type ScoreResult = { completedCount: number; correctCount: number; totalItems: number; bonusPoint: number };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseDecimal(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function approximately(value: unknown, expected: number) {
  const parsed = parseDecimal(value);
  return parsed !== null && Math.abs(parsed - expected) < 0.001;
}

function finish(completedCount: number, correctCount: number, totalItems: number): ScoreResult {
  return { completedCount, correctCount, totalItems, bonusPoint: getPracticeBonusPoint(correctCount, totalItems) };
}

function normalizeRefractionAnswers(value: unknown): RefractionQuizAnswers {
  const source = record(value);
  const normalized = createEmptyRefractionQuizAnswers();
  const sourceTrueFalse = record(source.trueFalse);
  const sourceSorting = record(source.sorting);
  trueFalseQuestions.forEach((question) => {
    const answer = sourceTrueFalse[question.id];
    normalized.trueFalse[question.id] = answer === "true" || answer === "false" ? answer : "";
  });
  sortingItems.forEach((item) => {
    const answer = sourceSorting[item.id];
    normalized.sorting[item.id] = answer === "toward" || answer === "away" ? answer : "";
  });
  normalized.phenomenon = typeof source.phenomenon === "string" ? source.phenomenon : "";
  normalized.refractiveIndex = typeof source.refractiveIndex === "string" ? source.refractiveIndex : "";
  normalized.statements = Array.isArray(source.statements) ? source.statements.filter((item): item is string => typeof item === "string") : [];
  return normalized;
}

export function emptyPracticeAnswers(key: PracticeKey): unknown {
  if (key === "refraction-application") return createEmptyRefractionQuizAnswers();
  if (key === "current-voltage-practice") return { missingValues: {}, incrementAnswer: "", secondVoltageAnswer: "", graph: "", statementAnswers: {} };
  if (key === "ohm-law-practice") return { boxResistanceAnswer: "", boxCurrentAnswer: "", boxConclusion: "", currentAnswer: "", voltageAnswer: "", resistanceAnswer: "", safeSource: "" };
  if (key === "ohm-race") return createEmptyOhmRaceAnswers(1);
  if (key === "optics-quest") return createEmptyOpticsQuestAnswers(1);
  if (key === "optics-review") return createEmptyOpticsReviewAnswers();
  return { controls: {}, rankOrder: [], lengthScale: "", areaScale: "", diagnosis: "", fix: "", statementAnswers: {} };
}

export function scorePracticeAttempt(key: PracticeKey, value: unknown): ScoreResult {
  if (key === "refraction-application") {
    const answers = normalizeRefractionAnswers(value);
    const evaluation = scoreRefractionQuiz(answers);
    const completedRequired = [
      ...trueFalseQuestions.map((question) => answers.trueFalse[question.id]),
      answers.phenomenon,
      answers.refractiveIndex,
      ...sortingItems.map((item) => answers.sorting[item.id]),
    ].filter(Boolean).length;
    const completedCount = completedRequired + (answers.statements.length > 0 ? 6 : 0);
    return { ...evaluation, completedCount };
  }

  const answers = record(value);
  if (key === "current-voltage-practice") {
    // Điểm cộng của bài này không theo số câu đúng mà theo thứ hạng nộp bài
    // (10 bạn làm đúng trọn bài và nộp sớm nhất), nên được chốt ở lớp DB khi
    // lưu bài; ở đây luôn trả về 0.
    const graded = gradeCurrentVoltagePractice(value);
    return { completedCount: graded.answeredCount, correctCount: graded.correctCount, totalItems: graded.totalItems, bonusPoint: 0 };
  }

  if (key === "ohm-law-practice") {
    const responses = [answers.boxResistanceAnswer, answers.boxCurrentAnswer, answers.boxConclusion, answers.currentAnswer, answers.voltageAnswer, answers.resistanceAnswer, answers.safeSource];
    const correct = [approximately(answers.boxResistanceAnswer, 20), approximately(answers.boxCurrentAnswer, 0.45), answers.boxConclusion === "consistent", approximately(answers.currentAnswer, 0.3), approximately(answers.voltageAnswer, 6), approximately(answers.resistanceAnswer, 30), answers.safeSource === "6"];
    return finish(responses.filter((item) => String(item ?? "").trim()).length, correct.filter(Boolean).length, 7);
  }

  if (key === "ohm-race") {
    // Chấm trực tiếp đáp án đã lưu; câu bỏ trống = sai. Không cần làm đúng mới tính.
    const questionIds = Array.isArray(answers.questionIds) ? answers.questionIds.filter((item): item is string => typeof item === "string") : [];
    const responses = record(answers.responses);
    const ids = questionIds.slice(0, OHM_RACE_QUESTION_COUNT);
    let answered = 0;
    let correct = 0;
    for (const id of ids) {
      const response = typeof responses[id] === "string" ? responses[id] : "";
      if (response.trim()) answered += 1;
      if (isOhmRaceAnswerCorrect(id, response)) correct += 1;
    }
    return { completedCount: answered, correctCount: correct, totalItems: OHM_RACE_QUESTION_COUNT, bonusPoint: 0 };
  }

  if (key === "optics-quest") {
    // Chấm trực tiếp đáp án đã lưu; câu bỏ trống = sai. Không cần làm đúng mới tính.
    const questionIds = Array.isArray(answers.questionIds) ? answers.questionIds.filter((item): item is string => typeof item === "string") : [];
    const responses = record(answers.responses);
    const ids = questionIds.slice(0, OPTICS_QUEST_QUESTION_COUNT);
    let answered = 0;
    let correct = 0;
    for (const id of ids) {
      const response = typeof responses[id] === "string" ? responses[id] : "";
      if (response.trim()) answered += 1;
      if (isOpticsQuestAnswerCorrect(id, response)) correct += 1;
    }
    return { completedCount: answered, correctCount: correct, totalItems: OPTICS_QUEST_QUESTION_COUNT, bonusPoint: 0 };
  }

  if (key === "optics-review") {
    const questionIds = Array.isArray(answers.questionIds) ? answers.questionIds.filter((item): item is string => typeof item === "string") : [];
    const responses = record(answers.responses);
    const checkedIds = new Set(Array.isArray(answers.checkedQuestionIds) ? answers.checkedQuestionIds.filter((item): item is string => typeof item === "string") : []);
    const validQuestionList = questionIds.length <= OPTICS_REVIEW_QUESTION_COUNT && new Set(questionIds).size === questionIds.length;
    const questions = validQuestionList
      ? questionIds.map(getOpticsReviewQuestion)
      : [];
    const valid = questions.length === questionIds.length && questions.every(Boolean);
    const completedCount = valid ? questions.filter((question) => question && checkedIds.has(question.id) && isOpticsReviewResponseAnswered(responses[question.id])).length : 0;
    const correctCount = valid ? questions.filter((question) => question && checkedIds.has(question.id) && isOpticsReviewAnswerCorrect(question, responses[question.id])).length : 0;
    return finish(completedCount, correctCount, OPTICS_REVIEW_QUESTION_COUNT);
  }

  const controls = record(answers.controls);
  const statements = record(answers.statementAnswers);
  const rankOrder = Array.isArray(answers.rankOrder) ? answers.rankOrder : [];
  const responses = [controls.material, controls.length, controls.area, rankOrder.length === 3 ? "ranked" : "", answers.lengthScale, answers.areaScale, answers.diagnosis, answers.fix, statements.material, statements.length, statements.area, statements.thick];
  const correct = [controls.material === "length-area", controls.length === "material-area", controls.area === "material-length", rankOrder.join(",") === "A,C,B", answers.lengthScale === "triple", answers.areaScale === "half", answers.diagnosis === "invalid", answers.fix === "same-length-area", statements.material === "true", statements.length === "true", statements.area === "false", statements.thick === "false"];
  return finish(responses.filter(Boolean).length, correct.filter(Boolean).length, 12);
}
