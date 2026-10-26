import "server-only";

import {
  OHM_LAW_TOTAL_ITEMS,
  ohmLawItemOrder,
  type OhmLawItemId,
  type OhmLawReviewItem,
} from "@/lib/ohm-law-practice";

/**
 * Đáp án, giải thích và gợi ý sửa cho bài "Luyện tập định luật Ohm".
 * Đặt ở phía máy chủ để học sinh không dò được trong trình duyệt.
 *
 * Hộp đen X ở câu 1: hai lần đo 3,0 V–0,15 A và 6,0 V–0,30 A đều cho R = 20 Ω.
 */
type NumberAnswer = { kind: "number"; value: number; unit: string; tolerance: number; explanation: string; hint: string };
type ChoiceAnswer = { kind: "choice"; value: string; labels: Record<string, string>; explanation: string; hint: string };
type AnswerEntry = NumberAnswer | ChoiceAnswer;

export const ohmLawAnswerKey: Record<OhmLawItemId, AnswerEntry> = {
  boxResistanceAnswer: {
    kind: "number", value: 20, unit: "Ω", tolerance: 0.001,
    explanation: "Cả hai lần đo đều cho cùng một tỉ số: 3,0 / 0,15 = 20 và 6,0 / 0,30 = 20. Vậy điện trở của X là R = U/I = 20 Ω.",
    hint: "Lấy U chia cho I ở một lần đo bất kì, rồi kiểm tra lại bằng lần đo còn lại xem có ra cùng kết quả không.",
  },
  boxCurrentAnswer: {
    kind: "number", value: 0.45, unit: "A", tolerance: 0.001,
    explanation: "Điện trở của X không đổi, R = 20 Ω. Khi U = 9 V thì I = U/R = 9 / 20 = 0,45 A.",
    hint: "Dùng điện trở vừa tìm được ở ô bên cạnh, rồi áp dụng I = U/R với U = 9 V.",
  },
  boxConclusion: {
    kind: "choice", value: "consistent",
    labels: {
      consistent: "Điện trở của dây dẫn không phụ thuộc vào hiệu điện thế đặt vào nó",
      "resistance-doubles": "Điện trở tăng gấp đôi khi U tăng gấp đôi",
      "current-constant": "Cường độ dòng điện không phụ thuộc vào U",
    },
    explanation: "Khi U tăng gấp đôi (từ 3,0 V lên 6,0 V) thì I cũng tăng gấp đôi (từ 0,15 A lên 0,30 A), nên tỉ số U/I giữ nguyên 20 Ω. Điện trở là đặc trưng của chính dây dẫn, không thay đổi theo hiệu điện thế ta đặt vào.",
    hint: "Tính U/I cho cả hai lần đo rồi so sánh hai kết quả. Nếu hai kết quả bằng nhau thì điện trở có thay đổi theo U không?",
  },
  currentAnswer: {
    kind: "number", value: 0.3, unit: "A", tolerance: 0.001,
    explanation: "Theo định luật Ohm: I = U/R = 6 / 20 = 0,3 A.",
    hint: "Dùng công thức I = U/R. Chú ý chia U cho R chứ không nhân hai số với nhau.",
  },
  voltageAnswer: {
    kind: "number", value: 6, unit: "V", tolerance: 0.001,
    explanation: "Từ I = U/R suy ra U = I × R = 0,25 × 24 = 6 V.",
    hint: "Khi đã biết I và R thì nhân hai số đó với nhau để được U.",
  },
  resistanceAnswer: {
    kind: "number", value: 30, unit: "Ω", tolerance: 0.001,
    explanation: "Từ I = U/R suy ra R = U/I = 12 / 0,40 = 30 Ω.",
    hint: "Chia U cho I. Chú ý chia cho số nhỏ hơn 1 thì kết quả phải lớn hơn 12, không nhỏ hơn.",
  },
  safeSource: {
    kind: "choice", value: "6",
    labels: { "3": "Nguồn 3 V", "6": "Nguồn 6 V", "9": "Nguồn 9 V" },
    explanation: "Ampe kế chỉ an toàn khi I ≤ 0,25 A, tức là U ≤ I × R = 0,25 × 24 = 6 V. Nguồn 9 V cho I = 9 / 24 = 0,375 A nên vượt mức an toàn; nguồn 3 V thì an toàn nhưng chưa phải mức lớn nhất. Vậy chọn nguồn 6 V.",
    hint: "Tính xem với R = 24 Ω thì hiệu điện thế lớn nhất nào còn giữ được I ở mức 0,25 A, rồi chọn nguồn lớn nhất không vượt quá giá trị đó.",
  },
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseDecimal(value: string) {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!/\d/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatExpected(entry: NumberAnswer) {
  return `${String(entry.value).replace(".", ",")} ${entry.unit}`;
}

function readResponses(answers: unknown): Record<OhmLawItemId, string> {
  const data = record(answers);
  return {
    boxResistanceAnswer: asText(data.boxResistanceAnswer),
    boxCurrentAnswer: asText(data.boxCurrentAnswer),
    boxConclusion: asText(data.boxConclusion),
    currentAnswer: asText(data.currentAnswer),
    voltageAnswer: asText(data.voltageAnswer),
    resistanceAnswer: asText(data.resistanceAnswer),
    safeSource: asText(data.safeSource),
  };
}

export function isOhmLawItemCorrect(id: OhmLawItemId, response: string) {
  const entry = ohmLawAnswerKey[id];
  if (!response.trim()) return false;
  if (entry.kind === "number") {
    const actual = parseDecimal(response);
    return actual !== null && Math.abs(actual - entry.value) <= entry.tolerance;
  }
  return response === entry.value;
}

/**
 * Chấm toàn bài và dựng phần xem lại. Ý bỏ trống tính là sai, vì bài này nộp
 * một lần và không có bước kiểm tra trước khi nộp.
 */
export function gradeOhmLawPractice(answers: unknown) {
  const responses = readResponses(answers);
  const items: OhmLawReviewItem[] = ohmLawItemOrder.map((id) => {
    const entry = ohmLawAnswerKey[id];
    const raw = responses[id];
    const answered = raw.trim().length > 0;
    const correct = isOhmLawItemCorrect(id, raw);
    const response = !answered
      ? "(bỏ trống)"
      : entry.kind === "choice"
        ? entry.labels[raw] ?? raw
        : raw.trim();
    return {
      id,
      answered,
      correct,
      response,
      correctAnswer: entry.kind === "number" ? formatExpected(entry) : entry.labels[entry.value] ?? entry.value,
      correctValue: entry.kind === "number" ? String(entry.value) : entry.value,
      explanation: entry.explanation,
      hint: entry.hint,
    };
  });
  return {
    items,
    answeredCount: items.filter((item) => item.answered).length,
    correctCount: items.filter((item) => item.correct).length,
    totalItems: OHM_LAW_TOTAL_ITEMS,
  };
}
