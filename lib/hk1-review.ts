/**
 * Ôn thi HK1 · 28 câu trắc nghiệm (đề cương 2627_HKI_De cuong_KHTN Ly_9).
 * Học sinh làm trên giấy rồi chỉ nhập chữ cái đáp án. File này dùng được ở cả
 * trình duyệt nên KHÔNG chứa đáp án; đáp án nằm ở lib/hk1-review-score.ts.
 */

export const HK1_REVIEW_QUESTION_COUNT = 28;
export const hk1ChoiceLetters = ["A", "B", "C", "D"] as const;
export type Hk1ChoiceLetter = (typeof hk1ChoiceLetters)[number];
export type Hk1Choice = Hk1ChoiceLetter | "";

export type Hk1ReviewAnswers = { choices: Hk1Choice[] };

export type Hk1Topic = "ohm" | "resistance" | "circuit" | "power" | "energy";

export const hk1TopicLabels: Record<Hk1Topic, string> = {
  ohm: "Định luật Ohm · I–U",
  resistance: "Điện trở · ρl/S",
  circuit: "Nối tiếp · song song",
  power: "Công suất điện",
  energy: "Năng lượng điện · tiền điện",
};

export type Hk1Question = { number: number; topic: Hk1Topic; text: string; options: [string, string, string, string] };

export const hk1Questions: Hk1Question[] = [
  { number: 1, topic: "resistance", text: "Điện trở của một đoạn dây dẫn không phụ thuộc vào yếu tố nào?", options: ["Chiều dài dây dẫn.", "Tiết diện dây dẫn.", "Điện trở suất của vật liệu làm dây dẫn.", "Hình dạng dây dẫn."] },
  { number: 2, topic: "circuit", text: "R1 = 60 Ω song song R2 = 30 Ω, UAB = 120 V. Cường độ dòng điện của đoạn mạch AB là", options: ["3 A.", "6 A.", "4/3 A.", "1,5 A."] },
  { number: 3, topic: "resistance", text: "Tăng chiều dài đoạn dây dẫn lên 3 lần thì điện trở của đoạn dây thay đổi thế nào?", options: ["Tăng lên 9 lần.", "Tăng lên 3 lần.", "Giảm đi 3 lần.", "Giảm đi 9 lần."] },
  { number: 4, topic: "ohm", text: "Cần đặt hiệu điện thế bao nhiêu để cường độ dòng điện lớn gấp 2 lần khi hiệu điện thế là 7 V?", options: ["3,5 V.", "7 V.", "49 V.", "14 V."] },
  { number: 5, topic: "resistance", text: "Hai dây đồng cùng chiều dài: S1 = 15 mm², R1 = 9 Ω; S2 = 1,5 mm². Điện trở R2 là", options: ["27 Ω.", "90 Ω.", "18 Ω.", "9 Ω."] },
  { number: 6, topic: "circuit", text: "Mạch 24 V có I = 6 A. Nối thêm Rx nối tiếp để I còn 2 A. Giá trị Rx có thể là", options: ["8 Ω.", "6 Ω.", "4 Ω.", "2 Ω."] },
  { number: 7, topic: "circuit", text: "Đèn dây tóc và quạt trần cùng 220 V, nguồn 220 V, đều hoạt động bình thường. Thông tin nào đúng?", options: ["Bóng đèn và quạt trần mắc song song với nhau.", "Cường độ dòng điện qua đèn và quạt bằng nhau.", "Tổng các hiệu điện thế các dụng cụ bằng hiệu điện thế đoạn mạch.", "Bóng đèn và quạt trần mắc nối tiếp với nhau."] },
  { number: 8, topic: "ohm", text: "Hiệu điện thế giữa hai đầu dây dẫn giảm bao nhiêu lần thì cường độ dòng điện chạy qua dây dẫn sẽ", options: ["luân phiên tăng giảm.", "không thay đổi.", "giảm bấy nhiêu lần.", "tăng bấy nhiêu lần."] },
  { number: 9, topic: "power", text: "Bóng đèn ghi 6 V – 3 W. Khi đèn sáng bình thường, cường độ dòng điện qua đèn là", options: ["0,5 A.", "2 A.", "18 A.", "3 A."] },
  { number: 10, topic: "power", text: "Đèn 220 V – 60 W, dòng điện qua đèn là 0,18 A thì đèn sáng", options: ["bình thường.", "sáng yếu.", "sáng mạnh.", "không sáng."] },
  { number: 11, topic: "power", text: "Bóng đèn có điện trở 8 Ω, cường độ dòng điện định mức 2 A. Công suất định mức là", options: ["32 W.", "16 W.", "4 W.", "0,5 W."] },
  { number: 12, topic: "energy", text: "Năng lượng điện của bóng đèn trong 10 s, biết U = 12 V, I = 0,5 A.", options: ["W = 6 J.", "W = 60 J.", "W = 600 J.", "W = 0,6 J."] },
  { number: 13, topic: "power", text: "Công suất điện định mức của một thiết bị điện cho biết điều gì?", options: ["Công suất thiết bị tiêu thụ khi hoạt động bình thường.", "Hiệu điện thế thiết bị tiêu thụ khi hoạt động bình thường.", "Năng lượng điện thiết bị tiêu thụ khi hoạt động bình thường.", "Cơ năng thiết bị tiêu thụ khi hoạt động bình thường."] },
  { number: 14, topic: "energy", text: "Công thức tính công của dòng điện sản ra trong một đoạn mạch là", options: ["A = U·I²·t", "A = U·I·t", "A = U²·I·t", "A = P/t"] },
  { number: 15, topic: "power", text: "Chọn câu SAI. Quạt có 3 nút tốc độ tăng dần (1), (2), (3). Công suất của quạt khi bật", options: ["nút (3) là lớn nhất.", "nút (1) là lớn nhất.", "nút (1) nhỏ hơn nút (2).", "nút (2) nhỏ hơn nút (3)."] },
  { number: 16, topic: "power", text: "Hai đèn 75 W và 40 W hoạt động bình thường ở 120 V. So sánh điện trở dây tóc:", options: ["Đèn 75 W có điện trở lớn hơn.", "Đèn 40 W có điện trở lớn hơn.", "Điện trở hai đèn như nhau.", "Không so sánh được."] },
  { number: 17, topic: "ohm", text: "Cùng U = 6 V: dây a có Ia = 0,3 A, dây b có Ib = 0,6 A. Kết luận nào đúng?", options: ["Ra = 2Rb.", "Rb = 2Ra.", "Ra = Rb.", "Không so sánh được vì chưa biết vật liệu."] },
  { number: 18, topic: "circuit", text: "Ba điện trở giống nhau R. Tỉ số Rnt/Rss bằng", options: ["3.", "9.", "1/3.", "6."] },
  { number: 19, topic: "energy", text: "Công tơ đầu tháng 2345, cuối tháng 2498. Năng lượng điện đã dùng là", options: ["153 kWh.", "4 843 kWh.", "153 J.", "2 498 kWh."] },
  { number: 20, topic: "resistance", text: "Hai dây đồng cùng chiều dài: dây A 2,5 mm², dây B 1,0 mm². Phát biểu nào đúng?", options: ["Dây A có điện trở suất nhỏ hơn nên dẫn điện tốt hơn.", "Dây A có điện trở nhỏ hơn nên hợp với thiết bị công suất lớn.", "Dây A có điện trở lớn hơn nên chịu dòng lớn hơn.", "Hai dây có điện trở bằng nhau vì cùng là đồng."] },
  { number: 21, topic: "energy", text: "Mỗi số đếm của công tơ điện ứng với lượng năng lượng điện là", options: ["1 J.", "1 Wh.", "1 kW.", "1 kWh."] },
  { number: 22, topic: "energy", text: "Nồi cơm (220 V – 600 W) và tivi (220 V – 100 W) cùng hoạt động bình thường 2 giờ. Phát biểu nào đúng?", options: ["Nồi cơm tiêu thụ năng lượng điện gấp 6 lần tivi.", "Tivi tiêu thụ năng lượng điện nhiều hơn nồi cơm.", "Cường độ dòng điện qua tivi lớn hơn qua nồi cơm.", "Điện trở nồi cơm lớn hơn điện trở tivi."] },
  { number: 23, topic: "resistance", text: "Dây nung bàn là (220 V – 1210 W) bằng nicrom ρ = 1,1·10⁻⁶ Ω·m, dài 4 m. Tiết diện dây nung là", options: ["0,055 mm².", "0,11 mm².", "0,22 mm².", "1,1 mm²."] },
  { number: 24, topic: "resistance", text: "Dây đồng chất, tiết diện đều 12 Ω cắt thành ba đoạn dài bằng nhau. Điện trở mỗi đoạn là", options: ["4 Ω.", "12 Ω.", "36 Ω.", "2 Ω."] },
  { number: 25, topic: "ohm", text: "U = 8 V thì I = 0,4 A. Để I giảm bớt 0,1 A thì hiệu điện thế phải là", options: ["2 V.", "10 V.", "6 V.", "7,9 V."] },
  { number: 26, topic: "circuit", text: "Đèn nối tiếp điện trở bảo vệ vào nguồn 9 V, hiệu điện thế hai đầu đèn là 6 V. Hiệu điện thế hai đầu điện trở là", options: ["3 V.", "6 V.", "9 V.", "15 V."] },
  { number: 27, topic: "power", text: "Phòng 220 V, cầu chì 10 A, đang có máy lạnh 1100 W. Có thể dùng thêm tổng công suất tối đa là", options: ["2 200 W.", "1 100 W.", "550 W.", "220 W."] },
  { number: 28, topic: "energy", text: "Máy sấy tóc (220 V – 1200 W) hoạt động bình thường 30 phút. Năng lượng điện tiêu thụ là", options: ["36 000 J.", "36 kWh.", "0,6 kWh.", "600 kWh."] },
];

export function isHk1ChoiceLetter(value: unknown): value is Hk1ChoiceLetter {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

export function createEmptyHk1ReviewAnswers(): Hk1ReviewAnswers {
  return { choices: Array.from({ length: HK1_REVIEW_QUESTION_COUNT }, () => "" as Hk1Choice) };
}

/** Đọc mọi dạng dữ liệu (nháp trên máy, JSON từ DB) về đúng 28 ô A–D hoặc trống. */
export function normalizeHk1ReviewAnswers(value: unknown): Hk1ReviewAnswers {
  const source = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>).choices : null;
  const list = Array.isArray(source) ? source : [];
  return {
    choices: Array.from({ length: HK1_REVIEW_QUESTION_COUNT }, (_, index) => (isHk1ChoiceLetter(list[index]) ? list[index] : "") as Hk1Choice),
  };
}

export function countHk1Answered(answers: Hk1ReviewAnswers) {
  return answers.choices.filter(Boolean).length;
}

/** Thống kê một câu, do API giáo viên trả về. */
export type Hk1QuestionStat = {
  number: number;
  correct: Hk1ChoiceLetter;
  counts: Record<Hk1ChoiceLetter, number>;
  blank: number;
  correctPercent: number;
};

export type Hk1StudentRow = {
  studentNumber: number;
  status: "draft" | "submitted";
  forced: boolean;
  answered: number;
  correct: number | null;
};

export type Hk1ReviewStats = {
  participantCount: number;
  submittedCount: number;
  draftCount: number;
  averageCorrect: number | null;
  questions: Hk1QuestionStat[];
  students: Hk1StudentRow[];
};
