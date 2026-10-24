import "server-only";

import {
  CURRENT_VOLTAGE_TOTAL_ITEMS,
  currentVoltageItemOrder,
  type CurrentVoltageItemId,
  type CurrentVoltageReviewItem,
} from "@/lib/current-voltage-practice";

/**
 * Đáp án, giải thích và gợi ý sửa cho bài "Luyện tập I phụ thuộc vào U".
 * Đặt ở phía máy chủ để học sinh không dò được trong trình duyệt.
 *
 * Bảng số liệu ở câu 1 ứng với một dây dẫn có U/I = 25 (U = 6,0 V ↔ I = 0,24 A).
 */
type NumberAnswer = { kind: "number"; value: number; unit: string; tolerance: number; explanation: string; hint: string };
type ChoiceAnswer = { kind: "choice"; value: string; labels: Record<string, string>; explanation: string; hint: string };
type AnswerEntry = NumberAnswer | ChoiceAnswer;

const truthLabels = { true: "Đúng", false: "Sai" };

export const currentVoltageAnswerKey: Record<CurrentVoltageItemId, AnswerEntry> = {
  currentAt15: {
    kind: "number", value: 0.06, unit: "A", tolerance: 0.001,
    explanation: "Cột đã đủ số liệu cho ta tỉ số của dây dẫn: U = 6,0 V ứng với I = 0,24 A nên U/I = 25. Ở U = 1,5 V thì I = 1,5 / 25 = 0,06 A.",
    hint: "Tìm một cột đã có cả U và I để tính tỉ số U/I trước, rồi dùng tỉ số đó cho ô còn trống.",
  },
  voltageAt012: {
    kind: "number", value: 3, unit: "V", tolerance: 0.001,
    explanation: "Dây dẫn này có U/I = 25. Với I = 0,12 A thì U = 0,12 × 25 = 3 V.",
    hint: "Khi đã biết tỉ số U/I, muốn tìm U thì nhân tỉ số đó với I.",
  },
  currentAt45: {
    kind: "number", value: 0.18, unit: "A", tolerance: 0.001,
    explanation: "U/I = 25 nên ở U = 4,5 V thì I = 4,5 / 25 = 0,18 A. Có thể kiểm tra nhanh: 4,5 V gấp 3 lần 1,5 V nên I cũng gấp 3 lần 0,06 A.",
    hint: "So sánh 4,5 V với một giá trị U đã biết trong bảng xem gấp mấy lần, rồi áp dụng đúng số lần đó cho I.",
  },
  incrementAnswer: {
    kind: "number", value: 0.35, unit: "A", tolerance: 0.001,
    explanation: "Điện trở của dây: R = U₁/I₁ = 4 / 0,20 = 20 Ω. Hiệu điện thế mới là 4 + 3 = 7 V, nên I₂ = 7 / 20 = 0,35 A.",
    hint: "Chú ý «+3 V» là tăng THÊM 3 V, nên U mới bằng 4 + 3 = 7 V chứ không phải 3 V.",
  },
  secondVoltageAnswer: {
    kind: "number", value: 3, unit: "V", tolerance: 0.001,
    explanation: "Điện trở của dây: R = U₁/I₁ = 9 / 0,30 = 30 Ω. Dòng điện giảm còn 0,10 A nên U₂ = 0,10 × 30 = 3 V.",
    hint: "Tính điện trở từ cặp số liệu ban đầu trước, rồi dùng U = I × R với giá trị I mới.",
  },
  graph: {
    kind: "choice", value: "direct",
    labels: { direct: "Đồ thị A · đường thẳng đi qua gốc tọa độ", offset: "Đồ thị B · đường thẳng không đi qua gốc tọa độ", curve: "Đồ thị C · đường cong" },
    explanation: "I tỉ lệ thuận với U nên khi U = 0 thì I = 0. Đồ thị vì vậy là đường thẳng đi qua gốc tọa độ.",
    hint: "Thử hỏi: nếu không đặt hiệu điện thế nào (U = 0) thì có dòng điện qua dây không? Câu trả lời cho biết đồ thị buộc phải đi qua điểm nào.",
  },
  scale: {
    kind: "choice", value: "true", labels: truthLabels,
    explanation: "Phát biểu đúng. Với cùng một dây dẫn ở nhiệt độ không đổi, I tỉ lệ thuận với U nên U tăng gấp 3 lần thì I cũng tăng gấp 3 lần.",
    hint: "Xem lại bảng số liệu ở câu 1: khi U gấp 3 lần thì giá trị I trong bảng thay đổi mấy lần?",
  },
  origin: {
    kind: "choice", value: "true", labels: truthLabels,
    explanation: "Phát biểu đúng. Vì I tỉ lệ thuận với U, khi U = 0 thì I = 0, nên đường thẳng phải đi qua gốc tọa độ.",
    hint: "Liên hệ với câu chọn đồ thị phía trên: đồ thị đúng đi qua điểm nào?",
  },
  ammeter: {
    kind: "choice", value: "false", labels: truthLabels,
    explanation: "Phát biểu sai. Ampe kế đo cường độ dòng điện chạy qua dây dẫn nên phải mắc NỐI TIẾP với dây dẫn. Vôn kế mới là dụng cụ mắc song song, để đo hiệu điện thế giữa hai đầu dây.",
    hint: "Nhớ lại sơ đồ mạch khảo sát I–U: dụng cụ nào mắc nối tiếp, dụng cụ nào mắc song song với dây dẫn?",
  },
  increment: {
    kind: "choice", value: "true", labels: truthLabels,
    explanation: "Phát biểu đúng. U tăng từ 2 V lên 5 V tức gấp 2,5 lần, nên I cũng gấp 2,5 lần. I mới bằng 2,5 lần I cũ, tức tăng THÊM 1,5 lần so với ban đầu, đúng bằng 150%.",
    hint: "Tính U mới gấp mấy lần U cũ, rồi phân biệt cho kĩ: «gấp 2,5 lần» khác với «tăng thêm 150%» ở chỗ nào?",
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

/** Lấy câu trả lời thô của từng ý từ payload đã lưu. */
function readResponses(answers: unknown): Record<CurrentVoltageItemId, string> {
  const data = record(answers);
  const missing = record(data.missingValues);
  const statements = record(data.statementAnswers);
  return {
    currentAt15: asText(missing.currentAt15),
    voltageAt012: asText(missing.voltageAt012),
    currentAt45: asText(missing.currentAt45),
    incrementAnswer: asText(data.incrementAnswer),
    secondVoltageAnswer: asText(data.secondVoltageAnswer),
    graph: asText(data.graph),
    scale: asText(statements.scale),
    origin: asText(statements.origin),
    ammeter: asText(statements.ammeter),
    increment: asText(statements.increment),
  };
}

export function isCurrentVoltageItemCorrect(id: CurrentVoltageItemId, response: string) {
  const entry = currentVoltageAnswerKey[id];
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
export function gradeCurrentVoltagePractice(answers: unknown) {
  const responses = readResponses(answers);
  const items: CurrentVoltageReviewItem[] = currentVoltageItemOrder.map((id) => {
    const entry = currentVoltageAnswerKey[id];
    const raw = responses[id];
    const answered = raw.trim().length > 0;
    const correct = isCurrentVoltageItemCorrect(id, raw);
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
      explanation: entry.explanation,
      hint: entry.hint,
    };
  });
  return {
    items,
    answeredCount: items.filter((item) => item.answered).length,
    correctCount: items.filter((item) => item.correct).length,
    totalItems: CURRENT_VOLTAGE_TOTAL_ITEMS,
  };
}
