export type OhmRaceQuestion = {
  id: string;
  station: number;
  stationLabel: string;
  title: string;
  prompt: string;
  detail?: string;
  kind: "number" | "choice";
  unit?: string;
  answer: string;
  tolerance?: number;
  choices?: Array<{ value: string; label: string }>;
};

export type OhmRaceAnswers = {
  round: number;
  questionIds: string[];
  responses: Record<string, string>;
  clearedQuestionIds: string[];
  wrongCount: number;
};

export type OhmRaceRacer = {
  studentNumber: number;
  progress: number;
  finished: boolean;
  wrongCount: number;
  adjustedSeconds: number | null;
  rank: number | null;
};

export type OhmRaceSnapshot = {
  round: number;
  isOpen: boolean;
  isRunning: boolean;
  startedAt: string | null;
  readyCount: number;
  finishedCount: number;
  racers: OhmRaceRacer[];
};

export const OHM_RACE_STATION_COUNT = 6;
export const OHM_RACE_PENALTY_SECONDS = 5;

const stationQuestions: OhmRaceQuestion[][] = [
  [
    { id: "meter-034", station: 1, stationLabel: "Kích hoạt đồng hồ", title: "Đọc ampe kế", prompt: "Ampe kế có thang 0–0,6 A gồm 30 vạch. Kim đang ở vạch 17.", detail: "Nhập số chỉ của ampe kế.", kind: "number", unit: "A", answer: "0.34", tolerance: 0.001 },
    { id: "meter-9", station: 1, stationLabel: "Kích hoạt đồng hồ", title: "Đọc vôn kế", prompt: "Vôn kế có thang 0–15 V gồm 30 vạch. Kim đang ở vạch 18.", detail: "Nhập số chỉ của vôn kế.", kind: "number", unit: "V", answer: "9", tolerance: 0.001 },
    { id: "meter-14", station: 1, stationLabel: "Kích hoạt đồng hồ", title: "Đọc đúng thang đo", prompt: "Ampe kế đang nối thang 0–3 A gồm 15 vạch. Kim đang ở vạch 7.", detail: "Nhập số chỉ của ampe kế.", kind: "number", unit: "A", answer: "1.4", tolerance: 0.001 },
    { id: "meter-75", station: 1, stationLabel: "Kích hoạt đồng hồ", title: "Giải mã vạch chia", prompt: "Vôn kế có thang 0–12 V gồm 24 vạch. Kim đang ở vạch 15.", detail: "Nhập số chỉ của vôn kế.", kind: "number", unit: "V", answer: "7.5", tolerance: 0.001 },
  ],
  [
    { id: "fingerprint-pair", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Ghép hai hồ sơ", prompt: "Cặp phép đo nào có thể thuộc cùng một dây dẫn ở nhiệt độ không đổi?", kind: "choice", answer: "ac", choices: [
      { value: "ac", label: "A: 2,4 V–0,08 A và C: 7,5 V–0,25 A" },
      { value: "ab", label: "A: 2,4 V–0,08 A và B: 5 V–0,10 A" },
      { value: "bd", label: "B: 5 V–0,10 A và D: 8 V–0,20 A" },
    ] },
    { id: "fingerprint-high-r", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Ai cản dòng mạnh nhất?", prompt: "Cùng đặt vào 6 V: dây X có I=0,30 A; Y có I=0,12 A; Z có I=0,20 A. Dây nào có điện trở lớn nhất?", kind: "choice", answer: "y", choices: [
      { value: "x", label: "Dây X" }, { value: "y", label: "Dây Y" }, { value: "z", label: "Dây Z" },
    ] },
    { id: "fingerprint-slope", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Đọc độ dốc", prompt: "Trên đồ thị I(U), đường X có độ dốc 0,05 A/V; đường Y có độ dốc 0,02 A/V. Dây nào có điện trở lớn hơn?", kind: "choice", answer: "y", choices: [
      { value: "x", label: "Dây X" }, { value: "y", label: "Dây Y" }, { value: "same", label: "Hai dây bằng nhau" },
    ] },
    { id: "fingerprint-same-i", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Cùng dòng, khác áp", prompt: "Hai dây cùng có I=0,15 A. Dây M cần 3 V, dây N cần 7,5 V. Dây nào có điện trở lớn hơn?", kind: "choice", answer: "n", choices: [
      { value: "m", label: "Dây M" }, { value: "n", label: "Dây N" }, { value: "same", label: "Hai dây bằng nhau" },
    ] },
  ],
  [
    { id: "target-6", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Căn chỉnh nguồn", prompt: "Dây dẫn có R=40 Ω. Cần tạo dòng điện 0,15 A.", detail: "Đặt hiệu điện thế bằng bao nhiêu?", kind: "number", unit: "V", answer: "6", tolerance: 0.001 },
    { id: "target-7", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Nâng dòng đúng mức", prompt: "Một thiết bị có I=0,12 A khi U=3 V. Muốn I=0,28 A và điện trở không đổi.", detail: "Đặt hiệu điện thế bằng bao nhiêu?", kind: "number", unit: "V", answer: "7", tolerance: 0.001 },
    { id: "target-window", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Đưa kim vào vùng xanh", prompt: "Dây dẫn R=30 Ω cần dòng điện từ 0,18 A đến 0,22 A. Chọn một mức nguồn.", kind: "choice", answer: "6", choices: [
      { value: "4.5", label: "4,5 V" }, { value: "6", label: "6 V" }, { value: "7.5", label: "7,5 V" },
    ] },
    { id: "target-32", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Hạ dòng khi giữ nguồn", prompt: "Nguồn giữ ở 8 V. Muốn dòng điện giảm từ 0,40 A xuống 0,25 A.", detail: "Điện trở mới cần bằng bao nhiêu?", kind: "number", unit: "Ω", answer: "32", tolerance: 0.001 },
  ],
  [
    { id: "unit-120", station: 4, stationLabel: "Bẫy đơn vị", title: "mA không phải A", prompt: "Một dây dẫn có U=9 V và I=75 mA.", detail: "Tính điện trở.", kind: "number", unit: "Ω", answer: "120", tolerance: 0.001 },
    { id: "unit-30", station: 4, stationLabel: "Bẫy đơn vị", title: "Đổi kết quả sang mA", prompt: "Một dây dẫn có U=1,8 V và R=60 Ω.", detail: "Tính cường độ dòng điện theo mA.", kind: "number", unit: "mA", answer: "30", tolerance: 0.001 },
    { id: "unit-error", station: 4, stationLabel: "Bẫy đơn vị", title: "Sửa lời giải sai", prompt: "Bạn An tính R=5/200=0,025 Ω khi U=5 V và I=200 mA. Phương án sửa nào đúng?", kind: "choice", answer: "25", choices: [
      { value: "25", label: "R=25 Ω; An quên đổi 200 mA=0,20 A" },
      { value: "0.025", label: "R=0,025 Ω; lời giải đã đúng" },
      { value: "1000", label: "R=1000 Ω; phải nhân 200 với 5" },
    ] },
    { id: "unit-5", station: 4, stationLabel: "Bẫy đơn vị", title: "Giải mã kΩ", prompt: "Điện trở 2,4 kΩ được đặt vào hiệu điện thế 12 V.", detail: "Tính cường độ dòng điện theo mA.", kind: "number", unit: "mA", answer: "5", tolerance: 0.001 },
  ],
  [
    { id: "analysis-axis", station: 5, stationLabel: "Phòng phân tích", title: "Đọc đúng trục", prompt: "Đồ thị đặt U trên trục đứng và I trên trục ngang. Độ dốc của đường thẳng biểu thị đại lượng nào?", kind: "choice", answer: "r", choices: [
      { value: "r", label: "Điện trở R" }, { value: "inverse-r", label: "Nghịch đảo điện trở 1/R" }, { value: "power", label: "Công suất điện" },
    ] },
    { id: "analysis-two-lines", station: 5, stationLabel: "Phòng phân tích", title: "Hai đường I(U)", prompt: "Đường A có độ dốc 0,04 A/V; B có độ dốc 0,025 A/V. Kết quả nào đúng?", kind: "choice", answer: "25-40", choices: [
      { value: "25-40", label: "R_A=25 Ω; R_B=40 Ω" }, { value: "40-25", label: "R_A=40 Ω; R_B=25 Ω" }, { value: "4-2.5", label: "R_A=4 Ω; R_B=2,5 Ω" },
    ] },
    { id: "analysis-heat", station: 5, stationLabel: "Phòng phân tích", title: "Dây dẫn nóng lên", prompt: "Giữ U không đổi, nhưng I qua dây giảm dần khi dây nóng lên. Suy luận phù hợp nhất là gì?", kind: "choice", answer: "r-up", choices: [
      { value: "r-up", label: "Điện trở của dây đã tăng" }, { value: "r-down", label: "Điện trở của dây đã giảm" }, { value: "r-same", label: "Điện trở chắc chắn không đổi" },
    ] },
    { id: "analysis-evidence", station: 5, stationLabel: "Phòng phân tích", title: "Kết luận có đủ căn cứ?", prompt: "Một nhóm chỉ đo một cặp U, I rồi kết luận I tỉ lệ thuận với U. Đánh giá nào hợp lí?", kind: "choice", answer: "not-enough", choices: [
      { value: "enough", label: "Đủ, một phép đo đã chứng minh được quan hệ" },
      { value: "not-enough", label: "Chưa đủ; cần nhiều phép đo và kiểm tra tỉ số hoặc đồ thị" },
      { value: "never", label: "Không thể khảo sát quan hệ I–U bằng thực nghiệm" },
    ] },
  ],
  [
    { id: "boss-code", station: 6, stationLabel: "Trạm năng lượng", title: "Mã khóa 40–10", prompt: "Thiết bị có U=7,2 V và I=0,18 A. Muốn dòng đạt 0,25 A mà R không đổi. Chọn chuỗi kết quả đúng.", kind: "choice", answer: "40-10", choices: [
      { value: "40-10", label: "R=40 Ω → đặt U=10 V" }, { value: "25-10", label: "R=25 Ω → đặt U=10 V" }, { value: "40-6.25", label: "R=40 Ω → đặt U=6,25 V" },
    ] },
    { id: "boss-config", station: 6, stationLabel: "Trạm năng lượng", title: "Chọn cấu hình vận hành", prompt: "Thiết bị yêu cầu 0,18 A ≤ I ≤ 0,22 A. Cấu hình nào đưa dòng điện vào vùng xanh?", kind: "choice", answer: "3-15", choices: [
      { value: "3-15", label: "U=3 V; R=15 Ω" }, { value: "6-20", label: "U=6 V; R=20 Ω" }, { value: "9-60", label: "U=9 V; R=60 Ω" },
    ] },
    { id: "boss-two-lines", station: 6, stationLabel: "Trạm năng lượng", title: "Hai đường truyền", prompt: "Tại 6 V: dây M có I=0,15 A; N có I=0,24 A. Báo cáo nào đúng?", kind: "choice", answer: "40-25-n", choices: [
      { value: "40-25-n", label: "R_M=40 Ω; R_N=25 Ω; N cho dòng lớn hơn" },
      { value: "25-40-m", label: "R_M=25 Ω; R_N=40 Ω; M cho dòng lớn hơn" },
      { value: "40-25-m", label: "R_M=40 Ω; R_N=25 Ω; M cho dòng lớn hơn" },
    ] },
    { id: "boss-fault", station: 6, stationLabel: "Trạm năng lượng", title: "Điều tra sự cố", prompt: "Thiết kế: U=10 V, R=50 Ω. Thực tế ampe kế chỉ 0,125 A. Báo cáo nào đúng?", kind: "choice", answer: "020-80-30", choices: [
      { value: "020-80-30", label: "I dự kiến 0,20 A; R thực tế 80 Ω; R tăng 30 Ω" },
      { value: "020-50-0", label: "I dự kiến 0,20 A; R vẫn là 50 Ω" },
      { value: "0125-80-30", label: "I dự kiến 0,125 A; R thực tế 80 Ω" },
    ] },
  ],
];

function parseDecimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isOhmRaceAnswerCorrect(question: OhmRaceQuestion, response: string) {
  if (question.kind === "number") {
    const actual = parseDecimal(response);
    const expected = parseDecimal(question.answer);
    return actual !== null && expected !== null && Math.abs(actual - expected) <= (question.tolerance ?? 0.001);
  }
  return response === question.answer;
}

export function getOhmRaceQuestion(id: string) {
  for (const station of stationQuestions) {
    const question = station.find((item) => item.id === id);
    if (question) return question;
  }
  return undefined;
}

export function getOhmRaceQuestions(studentNumber: number, round: number) {
  return stationQuestions.map((station, stationIndex) => {
    const variantIndex = Math.abs(studentNumber + round + stationIndex * 2) % station.length;
    return station[variantIndex];
  });
}

export function createEmptyOhmRaceAnswers(round: number): OhmRaceAnswers {
  return { round, questionIds: [], responses: {}, clearedQuestionIds: [], wrongCount: 0 };
}

