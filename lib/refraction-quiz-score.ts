import "server-only";

import {
  directionChoices,
  refractiveIndexChoices,
  sortingItems,
  trueFalseQuestions,
  type RefractionQuizAnswers,
  type RefractionSortBucket,
  type TrueFalseAnswer,
} from "@/lib/refraction-quiz";

const trueFalseKey: Record<string, Exclude<TrueFalseAnswer, "">> = {
  "angles-from-normal": "true",
  "air-to-glass-away": "false",
  "same-plane": "true",
  "higher-index-faster": "false",
};

const sortingKey: Record<string, Exclude<RefractionSortBucket, "">> = {
  "air-water": "toward",
  "water-air": "away",
  "air-glass": "toward",
  "glass-air": "away",
};

export type RefractionQuizEvaluation = {
  score: number;
  correctCount: number;
  totalItems: number;
  sections: {
    trueFalse: boolean;
    direction: boolean;
    refractiveIndex: boolean;
    sorting: boolean;
    sineRatio: boolean;
  };
};

function parseDecimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isRefractionQuizAnswers(value: unknown): value is RefractionQuizAnswers {
  if (!value || typeof value !== "object") return false;
  const answers = value as Record<string, unknown>;
  if (!answers.trueFalse || typeof answers.trueFalse !== "object" || !answers.sorting || typeof answers.sorting !== "object") return false;

  const trueFalse = answers.trueFalse as Record<string, unknown>;
  const sorting = answers.sorting as Record<string, unknown>;
  const validTrueFalse = trueFalseQuestions.every((question) => trueFalse[question.id] === "true" || trueFalse[question.id] === "false");
  const validSorting = sortingItems.every((item) => sorting[item.id] === "toward" || sorting[item.id] === "away");
  const validDirection = directionChoices.some((choice) => choice.id === answers.direction);
  const validIndex = refractiveIndexChoices.some((choice) => choice.id === answers.refractiveIndex);
  return validTrueFalse && validSorting && validDirection && validIndex && typeof answers.sineRatio === "string" && answers.sineRatio.trim().length <= 30;
}

export function scoreRefractionQuiz(answers: RefractionQuizAnswers): RefractionQuizEvaluation {
  const trueFalseResults = trueFalseQuestions.map((question) => answers.trueFalse[question.id] === trueFalseKey[question.id]);
  const sortingResults = sortingItems.map((item) => answers.sorting[item.id] === sortingKey[item.id]);
  const directionCorrect = answers.direction === "r-less-than-i";
  const refractiveIndexCorrect = answers.refractiveIndex === "speed-c-over-1-5";
  const ratio = parseDecimal(answers.sineRatio);
  const sineRatioCorrect = ratio !== null && Math.abs(ratio - 1.5) <= 0.02;
  const correctCount = [
    ...trueFalseResults,
    directionCorrect,
    refractiveIndexCorrect,
    ...sortingResults,
    sineRatioCorrect,
  ].filter(Boolean).length;
  const score = trueFalseResults.filter(Boolean).length * 0.5
    + (directionCorrect ? 2 : 0)
    + (refractiveIndexCorrect ? 2 : 0)
    + sortingResults.filter(Boolean).length * 0.5
    + (sineRatioCorrect ? 2 : 0);

  return {
    score,
    correctCount,
    totalItems: 10,
    sections: {
      trueFalse: trueFalseResults.every(Boolean),
      direction: directionCorrect,
      refractiveIndex: refractiveIndexCorrect,
      sorting: sortingResults.every(Boolean),
      sineRatio: sineRatioCorrect,
    },
  };
}
