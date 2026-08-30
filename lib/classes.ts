export const classNames = Array.from({ length: 10 }, (_, index) => `9H${String(index + 1).padStart(2, "0")}`);
export const groupNames = Array.from({ length: 8 }, (_, index) => `Nhóm ${index + 1}`);

export function isClassName(value: unknown): value is string {
  return typeof value === "string" && classNames.includes(value);
}

export function isGroupName(value: unknown): value is string {
  return typeof value === "string" && groupNames.includes(value);
}
