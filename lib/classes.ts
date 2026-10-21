export const classNames = Array.from({ length: 10 }, (_, index) => `9H${String(index + 1).padStart(2, "0")}`);
export const groupNames = Array.from({ length: 8 }, (_, index) => `Nhóm ${index + 1}`);
export const refractionQuizClassNames = ["9H04", "9H05", "9H08", "9H09"] as const;
/**
 * Classes actually taught this year. Analytics defaults to these so trial runs
 * in the other classes do not distort the figures reported to anyone.
 */
export const taughtClassNames = refractionQuizClassNames;
export const studentNumbers = Array.from({ length: 33 }, (_, index) => index + 1);

/**
 * Real roll size per taught class, school year 26-27. Roll numbers above these
 * belong to nobody, so any row carrying one is a trial run and is kept out of
 * analytics. Update here when a roll changes.
 */
export const classRosterSizes: Readonly<Record<string, number>> = {
  "9H04": 29,
  "9H05": 33,
  "9H08": 29,
  "9H09": 29,
};

export function getRosterSize(className: string) {
  return classRosterSizes[className] ?? studentNumbers.length;
}

/** True when the roll number belongs to a real student of that class. */
export function isOnRoster(className: string, studentNumber: number) {
  return Number.isInteger(studentNumber) && studentNumber >= 1 && studentNumber <= getRosterSize(className);
}

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

export function isTaughtClassName(value: unknown): value is RefractionQuizClassName {
  return typeof value === "string" && taughtClassNames.some((className) => className === value);
}

export function isStudentNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= studentNumbers.length;
}

export function formatStudentNumber(value: number) {
  return String(value).padStart(2, "0");
}
