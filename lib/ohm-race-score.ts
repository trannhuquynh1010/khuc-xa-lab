import "server-only";

import { getOhmRaceQuestions, type OhmRaceRevealItem } from "@/lib/ohm-race";

// Đáp án + giải thích nằm ở phía máy chủ để học sinh không dò được trong trình duyệt.
type AnswerEntry = { answer: string; tolerance?: number; explanation: string };

export const ohmRaceAnswerKey: Record<string, AnswerEntry> = {
  // Trạm 1 · Cổng tỉ lệ thuận
  "prop-triple": { answer: "triple", explanation: "Với cùng một dây dẫn, I tỉ lệ thuận với U nên U tăng gấp 3 lần thì I cũng tăng gấp 3 lần." },
  "prop-graph": { answer: "origin", explanation: "I tỉ lệ thuận với U nên đồ thị I(U) là đường thẳng đi qua gốc tọa độ: U = 0 thì I = 0." },
  "prop-scale-up": { answer: "0.4", tolerance: 0.001, explanation: "Hiệu điện thế mới là 10 V, tức U gấp 4 lần so với 2,5 V, nên I cũng gấp 4 lần: I = 0,10 × 4 = 0,40 A." },
  "prop-scale-mid": { answer: "0.24", tolerance: 0.001, explanation: "Hiệu điện thế mới là 6 V, tức U gấp 1,5 lần so với 4 V, nên I = 0,16 × 1,5 = 0,24 A." },
  "prop-table": { answer: "a", explanation: "Ở bảng A, tỉ số I/U luôn bằng 0,04 nên I tỉ lệ thuận với U. Bảng B có tỉ số thay đổi; bảng C có I không đổi khi U tăng." },
  "prop-scale-down": { answer: "0.15", tolerance: 0.001, explanation: "Hiệu điện thế mới là 3 V, tức U giảm 3 lần so với 9 V, nên I cũng giảm 3 lần: I = 0,45 ÷ 3 = 0,15 A." },
  // Trạm 2 · Dấu vân tay dây dẫn
  "fingerprint-pair": { answer: "ac", explanation: "A và C có cùng tỉ số U/I = 30 Ω nên có thể là cùng một dây dẫn." },
  "fingerprint-high-r": { answer: "y", explanation: "Cùng U, dòng điện Y nhỏ nhất nên R_Y = U/I_Y lớn nhất." },
  "fingerprint-slope": { answer: "y", explanation: "Độ dốc đồ thị I(U) bằng 1/R; dốc nhỏ hơn ứng với điện trở lớn hơn." },
  "fingerprint-same-i": { answer: "n", explanation: "Cùng I, dây cần U lớn hơn có điện trở lớn hơn (R=U/I)." },
  "fingerprint-ratio": { answer: "0.3", tolerance: 0.001, explanation: "R = 3/0,12 = 25 Ω không đổi; ở U=7,5 V thì I = 7,5/25 = 0,3 A." },
  "fingerprint-compare-r": { answer: "p", explanation: "Cùng U, dòng điện qua P nhỏ hơn nên R_P = U/I_P lớn hơn." },
  // Trạm 3 · Dòng điện mục tiêu
  "target-6": { answer: "6", tolerance: 0.001, explanation: "U = I×R = 0,15×40 = 6 V." },
  "target-7": { answer: "7", tolerance: 0.001, explanation: "R = 3/0,12 = 25 Ω; U mới = 0,28×25 = 7 V." },
  "target-window": { answer: "6", explanation: "U = 6 V cho I = 6/30 = 0,20 A, nằm trong khoảng 0,18–0,22 A. Còn 4,5 V chỉ cho 0,15 A (thấp hơn mức tối thiểu) và 7,5 V cho tới 0,25 A (vượt mức tối đa)." },
  "target-32": { answer: "32", tolerance: 0.001, explanation: "R mới = U/I = 8/0,25 = 32 Ω." },
  "target-75": { answer: "7.5", tolerance: 0.001, explanation: "R = 3/0,2 = 15 Ω không đổi; U mới = 0,5×15 = 7,5 V." },
  "target-resistor-swap": { answer: "20", tolerance: 0.001, explanation: "R mới = U/I = 9/0,45 = 20 Ω." },
  // Trạm 4 · Bẫy đơn vị
  "unit-120": { answer: "120", tolerance: 0.001, explanation: "I = 75 mA = 0,075 A; R = 9/0,075 = 120 Ω." },
  "unit-30": { answer: "30", tolerance: 0.001, explanation: "I = 1,8/60 = 0,03 A = 30 mA." },
  "unit-error": { answer: "25", explanation: "I = 200 mA = 0,20 A; R = 5/0,20 = 25 Ω." },
  "unit-5": { answer: "5", tolerance: 0.001, explanation: "I = 12/2400 = 0,005 A = 5 mA." },
  "unit-150": { answer: "150", tolerance: 0.001, explanation: "I = 40 mA = 0,04 A; R = 6/0,04 = 150 Ω." },
  "unit-08": { answer: "0.8", tolerance: 0.001, explanation: "I = 2,4/3000 = 0,0008 A = 0,8 mA." },
  // Trạm 5 · Trạm năng lượng
  "boss-code": { answer: "40-10", explanation: "R = 7,2/0,18 = 40 Ω; U cần = 0,25×40 = 10 V." },
  "boss-config": { answer: "3-15", explanation: "U = 3 V với R = 15 Ω cho I = 0,20 A, nằm trong 0,18–0,22 A. Cấu hình 6 V/20 Ω cho 0,30 A (quá tải) và 9 V/60 Ω chỉ cho 0,15 A (không đủ dòng)." },
  "boss-two-lines": { answer: "40-25-n", explanation: "R_M=6/0,15=40 Ω; R_N=6/0,24=25 Ω; N có điện trở nhỏ hơn nên dòng lớn hơn." },
  "boss-fault": { answer: "020-80-30", explanation: "I dự kiến = 10/50 = 0,20 A; R thực tế = 10/0,125 = 80 Ω; chênh lệch 30 Ω." },
  "boss-combo": { answer: "a", explanation: "I = U/R = 9/60 = 0,15 A, đúng ở biên dưới của vùng an toàn 0,15–0,25 A." },
  "boss-energy": { answer: "10", tolerance: 0.001, explanation: "U = I×R = 0,2×50 = 10 V." },
};

/**
 * Chấp nhận cả dấu phẩy và dấu chấm thập phân ("0,4" = "0.4"), bỏ qua khoảng trắng
 * và cả đơn vị nếu học sinh gõ thêm ("0,4 A", "120 Ω", "5mA" đều hiểu được).
 */
function parseDecimal(value: string) {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!/\d/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isOhmRaceAnswerCorrect(questionId: string, response: string) {
  const key = ohmRaceAnswerKey[questionId];
  if (!key || typeof response !== "string" || !response.trim()) return false;
  if (key.tolerance !== undefined) {
    const actual = parseDecimal(response);
    const expected = parseDecimal(key.answer);
    return actual !== null && expected !== null && Math.abs(actual - expected) <= key.tolerance;
  }
  return response === key.answer;
}

/**
 * Chấm bài của một học sinh. Câu bỏ trống / không chọn = SAI.
 * questionIds là bộ 15 câu đã gán cho học sinh; responses là đáp án đã lưu.
 */
export function gradeOhmRace(studentNumber: number, round: number, questionIds: string[], responses: Record<string, string>) {
  // Ưu tiên bộ câu suy ra từ STT+vòng (chống can thiệp), rồi hợp với danh sách đã lưu nếu hợp lệ.
  const canonical = getOhmRaceQuestions(studentNumber, round).map((question) => question.id);
  const canonicalSet = new Set(canonical);
  const ids = questionIds.length && questionIds.every((id) => canonicalSet.has(id)) && questionIds.length === canonical.length
    ? questionIds
    : canonical;
  const items: OhmRaceRevealItem[] = ids.map((id) => {
    const response = typeof responses[id] === "string" ? responses[id] : "";
    const answered = response.trim().length > 0;
    const key = ohmRaceAnswerKey[id];
    return {
      id,
      response,
      answered,
      correct: isOhmRaceAnswerCorrect(id, response),
      correctAnswer: key?.answer ?? "",
      explanation: key?.explanation ?? "",
    };
  });
  const correctCount = items.filter((item) => item.correct).length;
  const answeredCount = items.filter((item) => item.answered).length;
  return { correctCount, answeredCount, totalItems: ids.length, items };
}
