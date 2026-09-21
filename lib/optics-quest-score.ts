import "server-only";

import { getOpticsQuestQuestions, type OpticsQuestRevealItem } from "@/lib/optics-quest";

// Đáp án + giải thích nằm ở phía máy chủ để học sinh không dò được trong trình duyệt.
type AnswerEntry = { answer: string; tolerance?: number; explanation: string };

export const opticsQuestAnswerKey: Record<string, AnswerEntry> = {
  // Trạm 1 · Cổng khúc xạ
  "r-air-glass": { answer: "toward", explanation: "Thủy tinh chiết quang hơn không khí nên tia khúc xạ lệch về pháp tuyến." },
  "r-water-air": { answer: "greater", explanation: "Sang môi trường chiết quang kém hơn, tia khúc xạ lệch xa pháp tuyến nên r > i." },
  "r-normal": { answer: "0", tolerance: 0.01, explanation: "Tia tới theo pháp tuyến có i = 0° và truyền thẳng với r = 0°." },
  "r-index": { answer: "1.5", tolerance: 0.01, explanation: "n ≈ sin i/sin r = 0,60/0,40 = 1,50." },
  "r-snell-sine": { answer: "0.5", tolerance: 0.01, explanation: "sin r = 0,75/1,50 = 0,50." },
  "r-speed": { answer: "200000", tolerance: 1, explanation: "v = 300 000/1,50 = 200 000 km/s." },
  // Trạm 2 · Mắt nhìn dưới nước
  "a-fish": { answer: "shallower", explanation: "Mắt kéo dài tia ló theo đường thẳng và thấy ảnh ảo của cá gần mặt nước hơn." },
  "a-branch": { answer: "higher", explanation: "Tia từ không khí vào nước lệch về pháp tuyến; mắt truy ngược tia và thấy ảnh cao hơn." },
  "a-aim": { answer: "below", explanation: "Cá thật nằm sâu hơn ảnh ảo mà mắt quan sát được." },
  "a-ray": { answer: "surface", explanation: "Sự khúc xạ xảy ra tại mặt phân cách giữa hai môi trường trong suốt." },
  "a-fish-ray-turn": { answer: "15", tolerance: 0.01, explanation: "Độ đổi hướng là |45° − 30°| = 15°; tia khúc xạ lệch xa pháp tuyến." },
  "a-diver-ray-turn": { answer: "12", tolerance: 0.01, explanation: "Độ đổi hướng là |40° − 28°| = 12°; tia khúc xạ lệch gần pháp tuyến." },
  // Trạm 3 · Mê cung phản xạ
  "t-condition": { answer: "dense-large", explanation: "Phản xạ toàn phần cần đúng chiều truyền và góc tới vượt góc giới hạn." },
  "t-critical": { answer: "90", tolerance: 0.01, explanation: "Ở góc giới hạn, tia khúc xạ đi sát mặt phân cách nên r = 90°." },
  "t-fiber": { answer: "fiber", explanation: "Lõi sợi quang giữ ánh sáng nhờ phản xạ toàn phần liên tiếp." },
  "t-diamond": { answer: "tir", explanation: "Chiết suất lớn làm góc giới hạn nhỏ, ánh sáng dễ phản xạ toàn phần trong viên đá." },
  "t-critical-sine": { answer: "0.67", tolerance: 0.01, explanation: "sin i₍gh₎ = 1,00/1,50 ≈ 0,67." },
  "t-critical-diamond": { answer: "0.42", tolerance: 0.01, explanation: "sin i₍gh₎ = 1,00/2,40 ≈ 0,42; giá trị nhỏ nên phản xạ toàn phần dễ xảy ra." },
  // Trạm 4 · Mật mã lăng kính
  "p-order": { answer: "red-violet", explanation: "Chiết suất của lăng kính với ánh sáng tím lớn hơn với ánh sáng đỏ." },
  "p-white": { answer: "index", explanation: "Mỗi thành phần màu có chiết suất khác nhau nên bị lệch khác nhau." },
  "p-second": { answer: "white", explanation: "Lăng kính thứ hai có thể bù độ lệch và tổng hợp các thành phần màu." },
  "p-red": { answer: "red-only", explanation: "Ánh sáng đơn sắc không bị phân tích thành các màu khác." },
  "p-violet-speed": { answer: "200000", tolerance: 1, explanation: "v = c/n = 300 000/1,50 = 200 000 km/s." },
  "p-color-speed": { answer: "12500", tolerance: 1, explanation: "vđỏ = 200 000 km/s; vtím = 187 500 km/s; chênh lệch 12 500 km/s." },
  // Trạm 5 · Phòng màu sắc
  "c-red-white": { answer: "reflect-red", explanation: "Màu quan sát phụ thuộc ánh sáng vật phản xạ truyền tới mắt." },
  "c-blue-red": { answer: "dark", explanation: "Nguồn không có ánh sáng xanh để vật phản xạ vào mắt." },
  "c-white-blue": { answer: "blue", explanation: "Giấy trắng phản xạ tốt màu đang chiếu tới, nên phản xạ ánh sáng xanh vào mắt." },
  "c-black": { answer: "absorb", explanation: "Rất ít ánh sáng từ vật đen truyền đến mắt nên ta thấy nó tối." },
  "c-rgb-power": { answer: "4", tolerance: 0.01, explanation: "Mỗi thành phần có 12/3 = 4 mW; vật đỏ phản xạ phần đỏ 4 mW." },
  "c-yellow-power": { answer: "5", tolerance: 0.01, explanation: "Phần đỏ chiếm 10/2 = 5 mW và được vật đỏ phản xạ vào mắt." },
  // Trạm 6 · Boss hải đăng
  "b-pool-fiber": { answer: "ref-tir", explanation: "Tia đổi hướng khi qua mặt nước; tín hiệu được giữ trong sợi bằng phản xạ toàn phần." },
  "b-rainbow-shirt": { answer: "spectrum-dark", explanation: "Lăng kính tán sắc; áo xanh không phản xạ tốt ánh sáng đỏ." },
  "b-critical-color": { answer: "violet", explanation: "n tím lớn hơn nên tím khúc xạ mạnh hơn; sin i₍gh₎ = n₂/n₁ nên góc giới hạn nhỏ hơn." },
  "b-lighthouse": { answer: "prism-fiber-normal", explanation: "Lăng kính xử lí màu, sợi quang dẫn sáng và tia theo pháp tuyến không đổi hướng." },
  "b-snell-speed": { answer: "05-2e8", explanation: "sin r = 0,75/1,50 = 0,50 và v = c/n = 2,0×10⁸ m/s." },
  "b-critical-code": { answer: "0.625", tolerance: 0.005, explanation: "sin i₍gh₎ = 1,00/1,60 = 0,625." },
};

function parseDecimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isOpticsQuestAnswerCorrect(questionId: string, response: string) {
  const key = opticsQuestAnswerKey[questionId];
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
 * questionIds là bộ 12 câu đã gán cho học sinh; responses là đáp án đã lưu.
 */
export function gradeOpticsQuest(studentNumber: number, round: number, questionIds: string[], responses: Record<string, string>) {
  // Ưu tiên bộ câu suy ra từ STT+vòng (chống can thiệp), rồi hợp với danh sách đã lưu nếu hợp lệ.
  const canonical = getOpticsQuestQuestions(studentNumber, round).map((question) => question.id);
  const canonicalSet = new Set(canonical);
  const ids = questionIds.length && questionIds.every((id) => canonicalSet.has(id)) && questionIds.length === canonical.length
    ? questionIds
    : canonical;
  const items: OpticsQuestRevealItem[] = ids.map((id) => {
    const response = typeof responses[id] === "string" ? responses[id] : "";
    const answered = response.trim().length > 0;
    const key = opticsQuestAnswerKey[id];
    return {
      id,
      response,
      answered,
      correct: isOpticsQuestAnswerCorrect(id, response),
      correctAnswer: key?.answer ?? "",
      explanation: key?.explanation ?? "",
    };
  });
  const correctCount = items.filter((item) => item.correct).length;
  const answeredCount = items.filter((item) => item.answered).length;
  return { correctCount, answeredCount, totalItems: ids.length, items };
}
