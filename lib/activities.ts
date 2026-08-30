export const activityDefinitions = [
  {
    key: "refraction",
    symbol: "↘",
    shortLabel: "Khúc xạ",
    label: "Khúc xạ ánh sáng",
    description: "Đo i, r và kiểm tra định luật khúc xạ.",
  },
  {
    key: "ohm",
    symbol: "I–U",
    shortLabel: "Sự phụ thuộc của I vào U",
    label: "Sự phụ thuộc của cường độ dòng điện vào hiệu điện thế",
    description: "Đo U, I và quan sát mối liên hệ.",
  },
  {
    key: "resistance-factors",
    symbol: "Ω",
    shortLabel: "Yếu tố của R",
    label: "Các yếu tố ảnh hưởng đến điện trở",
    description: "Khảo sát chất liệu, chiều dài và tiết diện.",
  },
] as const;

export type ActivityKey = (typeof activityDefinitions)[number]["key"];

export function isActivityKey(value: unknown): value is ActivityKey {
  return activityDefinitions.some((activity) => activity.key === value);
}

export function getActivityDefinition(key: ActivityKey) {
  return activityDefinitions.find((activity) => activity.key === key)!;
}
