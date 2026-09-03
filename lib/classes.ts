export const classNames = Array.from({ length: 10 }, (_, index) => `9H${String(index + 1).padStart(2, "0")}`);
export const groupNames = Array.from({ length: 8 }, (_, index) => `Nhóm ${index + 1}`);
export const refractionQuizClassNames = ["9H04", "9H05", "9H08", "9H09"] as const;
export const studentNumbers = Array.from({ length: 33 }, (_, index) => index + 1);

export type RefractionQuizClassName = (typeof refractionQuizClassNames)[number];

export function isClassName(value: unknown): value is string {
  return typeof value === "string" && classNames.includes(value);
}

export function isGroupName(value: unknown): value is string {
  return typeof value === "string" && groupNames.includes(value);
}

export function isRefractionQuizClassName(value: unknown): value is RefractionQuizClassName {
  return typeof value === "string" && refractionQuizClassNames.some((className) => className === value);
}

export function isStudentNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= studentNumbers.length;
}

export function formatStudentNumber(value: number) {
  return String(value).padStart(2, "0");
}
