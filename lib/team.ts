export const teamTasks = [
  { key: "coordinator", label: "Điều phối nhóm" },
  { key: "setup", label: "Lắp dụng cụ / mạch" },
  { key: "measurement", label: "Thực hiện phép đo" },
  { key: "recorder", label: "Ghi số liệu & kết luận" },
] as const;

export type TeamTaskKey = (typeof teamTasks)[number]["key"];
export type TeamAssignments = Record<TeamTaskKey, string>;

export function createEmptyTeamAssignments(): TeamAssignments {
  return { coordinator: "", setup: "", measurement: "", recorder: "" };
}

export function isTeamAssignments(value: unknown): value is TeamAssignments {
  if (!value || typeof value !== "object") return false;
  const assignments = value as Record<string, unknown>;
  return teamTasks.every(({ key }) => (
    typeof assignments[key] === "string" &&
    assignments[key].trim().length > 0 &&
    assignments[key].trim().length <= 120
  ));
}

export function normalizeTeamAssignments(assignments: TeamAssignments): TeamAssignments {
  return Object.fromEntries(teamTasks.map(({ key }) => [key, assignments[key].trim()])) as TeamAssignments;
}
