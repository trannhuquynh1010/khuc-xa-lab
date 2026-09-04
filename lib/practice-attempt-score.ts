import "server-only";

import {
  createEmptyRefractionQuizAnswers,
  sortingItems,
  trueFalseQuestions,
  type RefractionQuizAnswers,
} from "@/lib/refraction-quiz";
import { scoreRefractionQuiz } from "@/lib/refraction-quiz-score";
import { getPracticeBonusPoint, type PracticeKey } from "@/lib/practice-attempt-types";

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
  if (key === "current-voltage-practice") return { slots: {}, missingValue: "", anomaly: "", graph: "", statementAnswers: {} };
  if (key === "ohm-law-practice") return { formula: ["", "", ""], currentAnswer: "", voltageAnswer: "", resistanceAnswer: "", scenario: "" };
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
    const slots = record(answers.slots);
    const statements = record(answers.statementAnswers);
    const responses = [slots.seriesMeter, slots.control, slots.parallelMeter, answers.missingValue, answers.anomaly, answers.graph, statements.scale, statements.origin, statements.ammeter, statements.repeat];
    const correct = [slots.seriesMeter === "ammeter", slots.control === "switch", slots.parallelMeter === "voltmeter", answers.missingValue === "0.18", answers.anomaly === "3", answers.graph === "direct", statements.scale === "true", statements.origin === "true", statements.ammeter === "false", statements.repeat === "false"];
    return finish(responses.filter(Boolean).length, correct.filter(Boolean).length, 10);
  }

  if (key === "ohm-law-practice") {
    const formula = Array.isArray(answers.formula) ? answers.formula : [];
    const responses = [formula[0], formula[1], formula[2], answers.currentAnswer, answers.voltageAnswer, answers.resistanceAnswer, answers.scenario];
    const correct = [formula[0] === "I", formula[1] === "U", formula[2] === "R", approximately(answers.currentAnswer, 0.3), approximately(answers.voltageAnswer, 6), approximately(answers.resistanceAnswer, 30), answers.scenario === "series"];
    return finish(responses.filter((item) => String(item ?? "").trim()).length, correct.filter(Boolean).length, 7);
  }

  const controls = record(answers.controls);
  const statements = record(answers.statementAnswers);
  const rankOrder = Array.isArray(answers.rankOrder) ? answers.rankOrder : [];
  const responses = [controls.material, controls.length, controls.area, rankOrder.length === 3 ? "ranked" : "", answers.lengthScale, answers.areaScale, answers.diagnosis, answers.fix, statements.material, statements.length, statements.area, statements.thick];
  const correct = [controls.material === "length-area", controls.length === "material-area", controls.area === "material-length", rankOrder.join(",") === "A,C,B", answers.lengthScale === "triple", answers.areaScale === "half", answers.diagnosis === "invalid", answers.fix === "same-length-area", statements.material === "true", statements.length === "true", statements.area === "false", statements.thick === "false"];
  return finish(responses.filter(Boolean).length, correct.filter(Boolean).length, 12);
}
