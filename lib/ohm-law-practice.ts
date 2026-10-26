// Phần dùng chung cho bài "Luyện tập định luật Ohm".
// KHÔNG chứa đáp án: việc chấm và giải thích nằm ở lib/ohm-law-practice-score.ts
// (server-only), vì bài này không còn nút "Kiểm tra" nên đáp án không được xuất
// hiện trong trình duyệt của học sinh.

import { getRankBonusConfig } from "@/lib/practice-attempt-types";

export const OHM_LAW_TOTAL_ITEMS = 7;

const bonus = getRankBonusConfig("ohm-law-practice")!;
/** Số suất điểm cộng của mỗi lớp. */
export const OHM_LAW_BONUS_SLOTS = bonus.slots;
/** Số điểm cộng cho mỗi suất. */
export const OHM_LAW_BONUS_POINT = bonus.point;
/** Số ý đúng tối thiểu để được xét điểm cộng. */
export const OHM_LAW_BONUS_MIN_CORRECT = bonus.minCorrect;

export type OhmLawItemId =
  | "boxResistanceAnswer"
  | "boxCurrentAnswer"
  | "boxConclusion"
  | "currentAnswer"
  | "voltageAnswer"
  | "resistanceAnswer"
  | "safeSource";

/** Nhãn hiển thị cho từng ý khi học sinh xem lại bài. */
export const ohmLawItemLabels: Record<OhmLawItemId, { card: string; label: string }> = {
  boxResistanceAnswer: { card: "Câu 1 · Giải mã hộp đen X", label: "Điện trở của dây dẫn X" },
  boxCurrentAnswer: { card: "Câu 1 · Giải mã hộp đen X", label: "Cường độ dòng điện khi U = 9 V" },
  boxConclusion: { card: "Câu 1 · Giải mã hộp đen X", label: "Nhận định phù hợp nhất về dây dẫn X" },
  currentAnswer: { card: "Câu 2 · Tìm cường độ dòng điện", label: "Tính I khi U = 6 V và R = 20 Ω" },
  voltageAnswer: { card: "Câu 3 · Tìm hiệu điện thế", label: "Tính U khi I = 0,25 A và R = 24 Ω" },
  resistanceAnswer: { card: "Câu 4 · Tìm điện trở", label: "Tính R khi U = 12 V và I = 0,40 A" },
  safeSource: { card: "Câu 5 · Chọn nguồn trong giới hạn", label: "Nguồn lớn nhất vẫn bảo đảm an toàn" },
};

/** Thứ tự hiển thị khi học sinh xem lại bài. */
export const ohmLawItemOrder: OhmLawItemId[] = [
  "boxResistanceAnswer", "boxCurrentAnswer", "boxConclusion",
  "currentAnswer", "voltageAnswer", "resistanceAnswer", "safeSource",
];

export type OhmLawReviewItem = {
  id: OhmLawItemId;
  answered: boolean;
  correct: boolean;
  /** Câu trả lời của học sinh, đã chuyển sang dạng dễ đọc. */
  response: string;
  /** Đáp án đúng, dạng dễ đọc. */
  correctAnswer: string;
  /** Giá trị thô của đáp án, để giao diện đánh dấu đúng phương án nào. */
  correctValue: string;
  explanation: string;
  hint: string;
};

export type OhmLawResult = {
  submitted: boolean;
  correctCount: number;
  totalItems: number;
  /** Điểm cộng đã chốt lúc nộp bài. */
  bonusPoint: number;
  /** Hạng trong số các bạn đạt mức xét điểm cộng; null khi chưa đạt. */
  rank: number | null;
  bonusSlots: number;
  /** Số suất điểm cộng của lớp đã có người nhận. */
  awardedCount: number;
  items: OhmLawReviewItem[];
};
