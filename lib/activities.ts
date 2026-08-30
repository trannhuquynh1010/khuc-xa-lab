export const activityDefinitions = [
  {
    key: "refraction",
    shortLabel: "Khúc xạ",
    label: "Khúc xạ ánh sáng",
    description: "Đo góc tới, góc khúc xạ và kiểm tra định luật khúc xạ.",
  },
  {
    key: "ohm",
    shortLabel: "Định luật Ohm",
    label: "Điện trở – Định luật Ohm",
    description: "Đo hiệu điện thế, cường độ dòng điện và xác định điện trở.",
  },
  {
    key: "resistance-factors",
    shortLabel: "Yếu tố của R",
    label: "Các yếu tố ảnh hưởng đến điện trở",
    description: "Khảo sát chất liệu, chiều dài và tiết diện của dây dẫn.",
  },
] as const;

export type ActivityKey = (typeof activityDefinitions)[number]["key"];

export function isActivityKey(value: unknown): value is ActivityKey {
  return activityDefinitions.some((activity) => activity.key === value);
}

export function getActivityDefinition(key: ActivityKey) {
  return activityDefinitions.find((activity) => activity.key === key)!;
}
