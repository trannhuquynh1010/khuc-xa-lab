import "server-only";

import {
  phenomenonChoices,
  refractionQuizBonusPoint,
  refractionQuizBonusThreshold,
  refractionQuizItemCount,
  refractionStatementChoices,
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
  bonusPoint: 0 | 1;
  correctCount: number;
  totalItems: number;
  sections: {
    trueFalse: boolean;
    phenomenon: boolean;
    refractiveIndex: boolean;
    sorting: boolean;
    statements: boolean;
  };
};

export function isRefractionQuizAnswers(value: unknown): value is RefractionQuizAnswers {
  if (!value || typeof value !== "object") return false;
  const answers = value as Record<string, unknown>;
  if (!answers.trueFalse || typeof answers.trueFalse !== "object" || !answers.sorting || typeof answers.sorting !== "object") return false;

  const trueFalse = answers.trueFalse as Record<string, unknown>;
  const sorting = answers.sorting as Record<string, unknown>;
  const validTrueFalse = trueFalseQuestions.every((question) => trueFalse[question.id] === "true" || trueFalse[question.id] === "false");
  const validSorting = sortingItems.every((item) => sorting[item.id] === "toward" || sorting[item.id] === "away");
  const validPhenomenon = phenomenonChoices.some((choice) => choice.id === answers.phenomenon);
  const validIndex = refractiveIndexChoices.some((choice) => choice.id === answers.refractiveIndex);
  const validStatementIds = new Set(refractionStatementChoices.map((choice) => choice.id));
  const validStatements = Array.isArray(answers.statements)
    && answers.statements.length > 0
    && answers.statements.length === new Set(answers.statements).size
    && answers.statements.every((id) => typeof id === "string" && validStatementIds.has(id as (typeof refractionStatementChoices)[number]["id"]));
  return validTrueFalse && validSorting && validPhenomenon && validIndex && validStatements;
}

export function scoreRefractionQuiz(answers: RefractionQuizAnswers): RefractionQuizEvaluation {
  const trueFalseResults = trueFalseQuestions.map((question) => answers.trueFalse[question.id] === trueFalseKey[question.id]);
  const sortingResults = sortingItems.map((item) => answers.sorting[item.id] === sortingKey[item.id]);
  const phenomenonCorrect = answers.phenomenon === "chopstick-water";
  const refractiveIndexCorrect = answers.refractiveIndex === "speed-c-over-1-5";
  const selectedStatements = new Set(answers.statements);
  const statementsCorrect = selectedStatements.size === 3
    && ["a", "d", "f"].every((id) => selectedStatements.has(id));
  const correctCount = [
    ...trueFalseResults,
    phenomenonCorrect,
    refractiveIndexCorrect,
    ...sortingResults,
    statementsCorrect,
  ].filter(Boolean).length;
  const bonusPoint = correctCount >= refractionQuizBonusThreshold ? refractionQuizBonusPoint : 0;

  return {
    bonusPoint,
    correctCount,
    totalItems: refractionQuizItemCount,
    sections: {
      trueFalse: trueFalseResults.every(Boolean),
      phenomenon: phenomenonCorrect,
      refractiveIndex: refractiveIndexCorrect,
      sorting: sortingResults.every(Boolean),
      statements: statementsCorrect,
    },
  };
}
