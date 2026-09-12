export const prismLiveQuestionTypes = ["single", "multiple", "short", "drawing"] as const;

export type PrismLiveQuestionType = (typeof prismLiveQuestionTypes)[number];
export type PrismLiveQuestionStatus = "draft" | "running" | "closed";

export type PrismDrawingPoint = { x: number; y: number };
export type PrismDrawingStroke = {
  color: string;
  width: number;
  points: PrismDrawingPoint[];
};

export type PrismLiveAnswer =
  | { type: "single"; selected: number | null }
  | { type: "multiple"; selected: number[] }
  | { type: "short"; text: string }
  | { type: "drawing"; strokes: PrismDrawingStroke[] };

export type PrismLiveQuestion = {
  id: string;
  schoolYear: string;
  className: string;
  type: PrismLiveQuestionType;
  prompt: string;
  options: string[];
  durationSeconds: number;
  status: PrismLiveQuestionStatus;
  startedAt: string | null;
  deadlineAt: string | null;
  closedAt: string | null;
  createdAt: string;
  responseCount: number;
};

export type PrismLiveResponse = {
  studentNumber: number;
  answer: PrismLiveAnswer;
  submittedAt: string | null;
  updatedAt: string;
};

export const prismLiveTypeLabels: Record<PrismLiveQuestionType, string> = {
  single: "Chọn 1 đáp án",
  multiple: "Chọn nhiều đáp án",
  short: "Trả lời ngắn",
  drawing: "Vẽ hình",
};

export function isPrismLiveQuestionType(value: unknown): value is PrismLiveQuestionType {
  return typeof value === "string" && prismLiveQuestionTypes.includes(value as PrismLiveQuestionType);
}

export function emptyPrismLiveAnswer(type: PrismLiveQuestionType): PrismLiveAnswer {
  if (type === "single") return { type, selected: null };
  if (type === "multiple") return { type, selected: [] };
  if (type === "short") return { type, text: "" };
  return { type, strokes: [] };
}

export function hasPrismLiveAnswer(answer: PrismLiveAnswer) {
  if (answer.type === "single") return answer.selected !== null;
  if (answer.type === "multiple") return answer.selected.length > 0;
  if (answer.type === "short") return answer.text.trim().length > 0;
  return answer.strokes.some((stroke) => stroke.points.length > 1);
}

function finiteUnit(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : null;
}

export function normalizePrismLiveAnswer(
  value: unknown,
  type: PrismLiveQuestionType,
  optionCount: number,
): PrismLiveAnswer | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.type !== type) return null;

  if (type === "single") {
    if (record.selected === null) return { type, selected: null };
    const selected = Number(record.selected);
    return Number.isInteger(selected) && selected >= 0 && selected < optionCount ? { type, selected } : null;
  }

  if (type === "multiple") {
    if (!Array.isArray(record.selected)) return null;
    const selected = [...new Set(record.selected.map(Number))];
    if (selected.some((index) => !Number.isInteger(index) || index < 0 || index >= optionCount)) return null;
    return { type, selected: selected.sort((left, right) => left - right) };
  }

  if (type === "short") {
    if (typeof record.text !== "string" || record.text.length > 800) return null;
    return { type, text: record.text };
  }

  if (!Array.isArray(record.strokes) || record.strokes.length > 80) return null;
  let totalPoints = 0;
  const strokes: PrismDrawingStroke[] = [];
  for (const candidate of record.strokes) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const stroke = candidate as Record<string, unknown>;
    if (typeof stroke.color !== "string" || !/^#[0-9a-f]{6}$/i.test(stroke.color)) return null;
    const width = Number(stroke.width);
    if (!Number.isFinite(width) || width < 1 || width > 8 || !Array.isArray(stroke.points) || stroke.points.length > 500) return null;
    const points: PrismDrawingPoint[] = [];
    for (const candidatePoint of stroke.points) {
      if (!candidatePoint || typeof candidatePoint !== "object" || Array.isArray(candidatePoint)) return null;
      const point = candidatePoint as Record<string, unknown>;
      const x = finiteUnit(point.x);
      const y = finiteUnit(point.y);
      if (x === null || y === null) return null;
      points.push({ x, y });
    }
    totalPoints += points.length;
    if (totalPoints > 6000) return null;
    strokes.push({ color: stroke.color, width, points });
  }
  return { type, strokes };
}
