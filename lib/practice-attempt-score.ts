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
  if (key === "current-voltage-practice") return { slots: {}, missingValues: {}, incrementAnswer: "", anomaly: "", graph: "", statementAnswers: {} };
  if (key === "ohm-law-practice") return { boxResistanceAnswer: "", boxCurrentAnswer: "", boxConclusion: "", currentAnswer: "", voltageAnswer: "", resistanceAnswer: "", safeSource: "" };
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
    const missingValues = record(answers.missingValues);
    const statements = record(answers.statementAnswers);
    const responses = [slots.seriesMeter, slots.control, slots.parallelMeter, missingValues.currentAt15, missingValues.voltageAt012, missingValues.currentAt45, answers.incrementAnswer, answers.anomaly, answers.graph, statements.scale, statements.origin, statements.ammeter, statements.increment];
    const correct = [slots.seriesMeter === "ammeter", slots.control === "switch", slots.parallelMeter === "voltmeter", approximately(missingValues.currentAt15, 0.06), approximately(missingValues.voltageAt012, 3), approximately(missingValues.currentAt45, 0.18), approximately(answers.incrementAnswer, 0.35), answers.anomaly === "3", answers.graph === "direct", statements.scale === "true", statements.origin === "true", statements.ammeter === "false", statements.increment === "true"];
    return finish(responses.filter(Boolean).length, correct.filter(Boolean).length, 13);
  }

  if (key === "ohm-law-practice") {
    const responses = [answers.boxResistanceAnswer, answers.boxCurrentAnswer, answers.boxConclusion, answers.currentAnswer, answers.voltageAnswer, answers.resistanceAnswer, answers.safeSource];
    const correct = [approximately(answers.boxResistanceAnswer, 20), approximately(answers.boxCurrentAnswer, 0.45), answers.boxConclusion === "consistent", approximately(answers.currentAnswer, 0.3), approximately(answers.voltageAnswer, 6), approximately(answers.resistanceAnswer, 30), answers.safeSource === "6"];
    return finish(responses.filter((item) => String(item ?? "").trim()).length, correct.filter(Boolean).length, 7);
  }

  const controls = record(answers.controls);
  const statements = record(answers.statementAnswers);
  const rankOrder = Array.isArray(answers.rankOrder) ? answers.rankOrder : [];
  const responses = [controls.material, controls.length, controls.area, rankOrder.length === 3 ? "ranked" : "", answers.lengthScale, answers.areaScale, answers.diagnosis, answers.fix, statements.material, statements.length, statements.area, statements.thick];
  const correct = [controls.material === "length-area", controls.length === "material-area", controls.area === "material-length", rankOrder.join(",") === "A,C,B", answers.lengthScale === "triple", answers.areaScale === "half", answers.diagnosis === "invalid", answers.fix === "same-length-area", statements.material === "true", statements.length === "true", statements.area === "false", statements.thick === "false"];
  return finish(responses.filter(Boolean).length, correct.filter(Boolean).length, 12);
}
