export const activityDefinitions = [
  {
    key: "refraction",
    symbol: "↘",
    shortLabel: "Khúc xạ",
    label: "Khúc xạ ánh sáng",
    description: "Đo i, r và kiểm tra định luật khúc xạ.",
  },
  {
    key: "prism-colors",
    symbol: "△",
    shortLabel: "Lăng kính & màu sắc",
    label: "Lăng kính và màu sắc của vật",
    description: "Dựng tia tán sắc và dự đoán màu quan sát.",
  },
  {
    key: "total-internal-reflection",
    symbol: "↗",
    shortLabel: "Phản xạ toàn phần",
    label: "Phản xạ toàn phần",
    description: "Trả lời từng câu về điều kiện, góc giới hạn và ứng dụng.",
  },
  {
    key: "optics-game",
    symbol: "✦",
    shortLabel: "Photon Quest",
    label: "Photon Quest · Hải đăng ánh sáng",
    description: "Cuộc đua cá nhân qua 6 trạm quang học.",
  },
  {
    key: "optics-review",
    symbol: "◎",
    shortLabel: "Ôn tập Quang học",
    label: "Ôn tập Quang học cá nhân hóa",
    description: "20 câu thích ứng về khúc xạ, phản xạ toàn phần, lăng kính và màu sắc.",
  },
  {
    key: "lenses",
    symbol: ")(",
    shortLabel: "Thấu kính & Tạo ảnh",
    label: "Thấu kính và sự tạo ảnh",
    description: "Giáo viên dẫn dắt từ điểm khúc xạ đến tác dụng hội tụ.",
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
