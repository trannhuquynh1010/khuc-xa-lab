// Phần dùng chung cho bài "Luyện tập I phụ thuộc vào U".
// KHÔNG chứa đáp án: việc chấm và giải thích nằm ở lib/current-voltage-practice-score.ts
// (server-only), vì bài này không còn nút "Kiểm tra" nên đáp án không được
// xuất hiện trong trình duyệt của học sinh.

export const CURRENT_VOLTAGE_TOTAL_ITEMS = 10;
/** Số học sinh đầu tiên làm đúng trọn bài được cộng điểm. */
export const CURRENT_VOLTAGE_BONUS_SLOTS = 10;
/** Số điểm cộng cho mỗi suất. */
export const CURRENT_VOLTAGE_BONUS_POINT = 1;

export type CurrentVoltageItemId =
  | "currentAt15"
  | "voltageAt012"
  | "currentAt45"
  | "incrementAnswer"
  | "secondVoltageAnswer"
  | "graph"
  | "scale"
  | "origin"
  | "ammeter"
  | "increment";

/** Nhãn hiển thị cho từng ý khi học sinh xem lại bài. */
export const currentVoltageItemLabels: Record<CurrentVoltageItemId, { card: string; label: string }> = {
  currentAt15: { card: "Câu 1 · Giải mã ba ô trống", label: "Tính I khi U = 1,5 V" },
  voltageAt012: { card: "Câu 1 · Giải mã ba ô trống", label: "Tính U khi I = 0,12 A" },
  currentAt45: { card: "Câu 1 · Giải mã ba ô trống", label: "Tính I khi U = 4,5 V" },
  incrementAnswer: { card: "Câu 2 · Tính I khi U thay đổi", label: "Tính I₂ sau khi U tăng thêm 3 V" },
  secondVoltageAnswer: { card: "Câu 3 · Tính U khi I thay đổi", label: "Tính U₂ khi I giảm còn 0,10 A" },
  graph: { card: "Câu 4 · Chọn dấu vết đồ thị", label: "Đồ thị mô tả đúng I theo U" },
  scale: { card: "Câu 5 · Đúng – sai", label: "Phát biểu A: U gấp 3 thì I gấp 3" },
  origin: { card: "Câu 5 · Đúng – sai", label: "Phát biểu B: đồ thị đi qua gốc tọa độ" },
  ammeter: { card: "Câu 5 · Đúng – sai", label: "Phát biểu C: ampe kế mắc song song" },
  increment: { card: "Câu 5 · Đúng – sai", label: "Phát biểu D: U từ 2 V lên 5 V, I tăng thêm 150%" },
};

/** Thứ tự hiển thị khi học sinh xem lại bài. */
export const currentVoltageItemOrder: CurrentVoltageItemId[] = [
  "currentAt15", "voltageAt012", "currentAt45",
  "incrementAnswer", "secondVoltageAnswer", "graph",
  "scale", "origin", "ammeter", "increment",
];

export type CurrentVoltageReviewItem = {
  id: CurrentVoltageItemId;
  answered: boolean;
  correct: boolean;
  /** Câu trả lời của học sinh, đã chuyển sang dạng dễ đọc. */
  response: string;
  /** Đáp án đúng, dạng dễ đọc. */
  correctAnswer: string;
  explanation: string;
  hint: string;
};

export type CurrentVoltageResult = {
  submitted: boolean;
  correctCount: number;
  totalItems: number;
  /** Điểm cộng đã chốt lúc nộp bài. */
  bonusPoint: number;
  /** Hạng trong số các bạn làm đúng trọn bài; null khi chưa đủ đúng. */
  rank: number | null;
  bonusSlots: number;
  /** Số suất điểm cộng của lớp đã có người nhận. */
  awardedCount: number;
  items: CurrentVoltageReviewItem[];
};
