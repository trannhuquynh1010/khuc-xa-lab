// Client-safe Ohm Race module: KHÔNG chứa đáp án. Việc chấm điểm nằm ở lib/ohm-race-score.ts (server-only).

export type OhmRaceQuestion = {
  id: string;
  station: number;
  stationLabel: string;
  title: string;
  prompt: string;
  detail?: string;
  kind: "number" | "choice";
  unit?: string;
  choices?: Array<{ value: string; label: string }>;
};

export type OhmRaceAnswers = {
  round: number;
  groupName: string;
  questionIds: string[];
  responses: Record<string, string>;
};

export type OhmRacePlayer = {
  studentNumber: number;
  groupName: string;
  answeredCount: number;
  correctCount: number;
  finished: boolean;
  elapsedSeconds: number | null;
};

export type OhmRaceGroup = {
  groupName: string;
  participantCount: number;
  averageScore: number;
  totalTimeSeconds: number;
  rank: number | null;
};

export type OhmRaceQuestionStat = {
  id: string;
  title: string;
  stationLabel: string;
  station: number;
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  attemptedCount: number;
};

export type OhmRaceSnapshot = {
  round: number;
  isOpen: boolean;
  isRunning: boolean;
  ended: boolean;
  endedAt: string | null;
  startedAt: string | null;
  participantCount: number;
  submittedCount: number;
  classCorrectRate: number;
  players: OhmRacePlayer[];
  groups: OhmRaceGroup[];
  questionStats: OhmRaceQuestionStat[];
};

export type OhmRaceRevealItem = {
  id: string;
  response: string;
  answered: boolean;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
};

export type OhmRaceReveal = {
  ended: boolean;
  submitted: boolean;
  correctCount: number;
  totalItems: number;
  elapsedSeconds: number | null;
  items: OhmRaceRevealItem[];
};

export const OHM_RACE_STATION_COUNT = 5;
export const OHM_RACE_VARIANTS_PER_STATION = 6;
export const OHM_RACE_QUESTIONS_PER_STATION = 3;
export const OHM_RACE_QUESTION_COUNT = OHM_RACE_STATION_COUNT * OHM_RACE_QUESTIONS_PER_STATION;

export const OHM_RACE_GROUP_COLORS: Record<string, string> = {
  "Nhóm 1": "#ff6b6b",
  "Nhóm 2": "#ff9f43",
  "Nhóm 3": "#f6d74b",
  "Nhóm 4": "#9fe870",
  "Nhóm 5": "#4fd1c5",
  "Nhóm 6": "#60a5fa",
  "Nhóm 7": "#a78bfa",
  "Nhóm 8": "#f472b6",
};

export function getOhmRaceGroupColor(groupName: string) {
  return OHM_RACE_GROUP_COLORS[groupName] ?? "#c4ff5c";
}

const stations: OhmRaceQuestion[][] = [
  [
    { id: "prop-triple", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Quan hệ giữa I và U", prompt: "Giữ nguyên một dây dẫn ở nhiệt độ không đổi. Khi hiệu điện thế tăng gấp 3 lần thì cường độ dòng điện thay đổi thế nào?", kind: "choice", choices: [
      { value: "triple", label: "Tăng gấp 3 lần" },
      { value: "nine", label: "Tăng gấp 9 lần" },
      { value: "third", label: "Giảm đi 3 lần" },
    ] },
    { id: "prop-graph", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Dạng đồ thị I–U", prompt: "Đồ thị biểu diễn sự phụ thuộc của I vào U đối với một dây dẫn, ở nhiệt độ không đổi, có dạng nào?", kind: "choice", choices: [
      { value: "origin", label: "Đường thẳng đi qua gốc tọa độ" },
      { value: "offset", label: "Đường thẳng không đi qua gốc tọa độ" },
      { value: "curve", label: "Đường cong" },
    ] },
    { id: "prop-scale-up", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Đổi nguồn thành 10 V", prompt: "Một dây dẫn có I = 0,10 A khi U = 2,5 V. Sau đó hiệu điện thế được điều chỉnh thành 10 V, dây dẫn và nhiệt độ không đổi.", detail: "Tính cường độ dòng điện mới.", kind: "number", unit: "A" },
    { id: "prop-scale-mid", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Đổi nguồn thành 6 V", prompt: "Một dây dẫn có I = 0,16 A khi U = 4 V. Sau đó hiệu điện thế được điều chỉnh thành 6 V, dây dẫn và nhiệt độ không đổi.", detail: "Tính cường độ dòng điện mới.", kind: "number", unit: "A" },
    { id: "prop-table", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Bảng nào tỉ lệ thuận?", prompt: "Ba bảng dưới đây đều đo trên một dây dẫn ở nhiệt độ không đổi. Bảng số liệu nào cho thấy I tỉ lệ thuận với U?", kind: "choice", choices: [
      { value: "a", label: "U = 2; 4; 6 V → I = 0,08; 0,16; 0,24 A" },
      { value: "b", label: "U = 2; 4; 6 V → I = 0,08; 0,15; 0,30 A" },
      { value: "c", label: "U = 2; 4; 6 V → I = 0,12; 0,12; 0,12 A" },
    ] },
    { id: "prop-scale-down", station: 1, stationLabel: "Cổng tỉ lệ thuận", title: "Đổi nguồn thành 3 V", prompt: "Một dây dẫn có I = 0,45 A khi U = 9 V. Sau đó hiệu điện thế được điều chỉnh thành 3 V, dây dẫn và nhiệt độ không đổi.", detail: "Tính cường độ dòng điện mới.", kind: "number", unit: "A" },
  ],
  [
    { id: "fingerprint-pair", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Ghép hai hồ sơ", prompt: "Cặp phép đo nào có thể thuộc cùng một dây dẫn ở nhiệt độ không đổi?", kind: "choice", choices: [
      { value: "ac", label: "2,4 V – 0,08 A  và  7,5 V – 0,25 A" },
      { value: "ab", label: "2,4 V – 0,08 A  và  5 V – 0,10 A" },
      { value: "bd", label: "5 V – 0,10 A  và  8 V – 0,20 A" },
    ] },
    { id: "fingerprint-high-r", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Ai cản dòng mạnh nhất?", prompt: "Cùng đặt vào 6 V: dây X có I=0,30 A; Y có I=0,12 A; Z có I=0,20 A. Dây nào có điện trở lớn nhất?", kind: "choice", choices: [
      { value: "x", label: "Dây X" }, { value: "y", label: "Dây Y" }, { value: "z", label: "Dây Z" },
    ] },
    { id: "fingerprint-slope", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Đọc độ dốc", prompt: "Hai dây dẫn X và Y được khảo sát ở nhiệt độ không đổi. Trên đồ thị I(U), đường X có độ dốc 0,05 A/V; đường Y có độ dốc 0,02 A/V. Dây nào có điện trở lớn hơn?", kind: "choice", choices: [
      { value: "x", label: "Dây X" }, { value: "y", label: "Dây Y" }, { value: "same", label: "Hai dây bằng nhau" },
    ] },
    { id: "fingerprint-same-i", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Cùng dòng, khác áp", prompt: "Hai dây cùng có I=0,15 A. Dây M cần 3 V, dây N cần 7,5 V. Dây nào có điện trở lớn hơn?", kind: "choice", choices: [
      { value: "m", label: "Dây M" }, { value: "n", label: "Dây N" }, { value: "same", label: "Hai dây bằng nhau" },
    ] },
    { id: "fingerprint-ratio", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "Hai lần đo một dây dẫn", prompt: "Một dây dẫn được đo hai lần, cùng dây và nhiệt độ không đổi. Lần đo 1: U = 3 V, I = 0,12 A. Lần đo 2: U = 7,5 V.", detail: "Tính cường độ dòng điện ở lần đo 2.", kind: "number", unit: "A" },
    { id: "fingerprint-compare-r", station: 2, stationLabel: "Dấu vân tay dây dẫn", title: "So điện trở hai dây", prompt: "Dây P đo được 4 V–0,08 A; dây Q đo được 4 V–0,16 A. Dây nào có điện trở lớn hơn?", kind: "choice", choices: [
      { value: "p", label: "Dây P" }, { value: "q", label: "Dây Q" }, { value: "same", label: "Hai dây bằng nhau" },
    ] },
  ],
  [
    { id: "target-6", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Căn chỉnh nguồn", prompt: "Dây dẫn có R=40 Ω. Cần tạo dòng điện 0,15 A.", detail: "Đặt hiệu điện thế bằng bao nhiêu?", kind: "number", unit: "V" },
    { id: "target-7", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Nâng dòng đúng mức", prompt: "Một thiết bị có I=0,12 A khi U=3 V. Muốn I=0,28 A và điện trở không đổi.", detail: "Đặt hiệu điện thế bằng bao nhiêu?", kind: "number", unit: "V" },
    { id: "target-window", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Chọn nguồn đúng khoảng", prompt: "Một mạch dùng dây dẫn R = 30 Ω chỉ chạy đúng khi cường độ dòng điện nằm trong khoảng từ 0,18 A đến 0,22 A.", detail: "Nhỏ hơn 0,18 A thì mạch không chạy, lớn hơn 0,22 A thì mạch bị quá tải. Chọn mức nguồn phù hợp.", kind: "choice", choices: [
      { value: "4.5", label: "4,5 V" }, { value: "6", label: "6 V" }, { value: "7.5", label: "7,5 V" },
    ] },
    { id: "target-32", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Hạ dòng khi giữ nguồn", prompt: "Nguồn giữ ở 8 V. Muốn dòng điện giảm từ 0,40 A xuống 0,25 A.", detail: "Điện trở mới cần bằng bao nhiêu?", kind: "number", unit: "Ω" },
    { id: "target-75", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Nâng dòng theo yêu cầu", prompt: "Dây dẫn có điện trở R=15 Ω đang có I=0,2 A (U=3 V). Muốn tăng dòng điện lên I=0,5 A, điện trở không đổi.", detail: "Đặt hiệu điện thế bằng bao nhiêu?", kind: "number", unit: "V" },
    { id: "target-resistor-swap", station: 3, stationLabel: "Dòng điện mục tiêu", title: "Đổi điện trở, giữ nguồn", prompt: "Nguồn giữ ở 9 V. Muốn dòng điện tăng từ 0,3 A lên 0,45 A mà vẫn dùng nguồn này.", detail: "Điện trở mới cần bằng bao nhiêu?", kind: "number", unit: "Ω" },
  ],
  [
    { id: "unit-120", station: 4, stationLabel: "Bẫy đơn vị", title: "mA không phải A", prompt: "Một dây dẫn có U=9 V và I=75 mA.", detail: "Tính điện trở.", kind: "number", unit: "Ω" },
    { id: "unit-30", station: 4, stationLabel: "Bẫy đơn vị", title: "Đổi kết quả sang mA", prompt: "Một dây dẫn có U=1,8 V và R=60 Ω.", detail: "Tính cường độ dòng điện theo mA.", kind: "number", unit: "mA" },
    { id: "unit-error", station: 4, stationLabel: "Bẫy đơn vị", title: "Sửa lời giải sai", prompt: "Bạn An tính R=5/200=0,025 Ω khi U=5 V và I=200 mA. Phương án sửa nào đúng?", kind: "choice", choices: [
      { value: "25", label: "R=25 Ω; An quên đổi 200 mA=0,20 A" },
      { value: "0.025", label: "R=0,025 Ω; lời giải đã đúng" },
      { value: "1000", label: "R=1000 Ω; phải nhân 200 với 5" },
    ] },
    { id: "unit-5", station: 4, stationLabel: "Bẫy đơn vị", title: "Giải mã kΩ", prompt: "Điện trở 2,4 kΩ được đặt vào hiệu điện thế 12 V.", detail: "Tính cường độ dòng điện theo mA.", kind: "number", unit: "mA" },
    { id: "unit-150", station: 4, stationLabel: "Bẫy đơn vị", title: "Đổi mA thành A", prompt: "Một dây dẫn có U=6 V và I=40 mA.", detail: "Tính điện trở.", kind: "number", unit: "Ω" },
    { id: "unit-08", station: 4, stationLabel: "Bẫy đơn vị", title: "Giải mã kΩ, trả lời bằng mA", prompt: "Điện trở 3 kΩ được đặt vào hiệu điện thế 2,4 V.", detail: "Tính cường độ dòng điện theo mA.", kind: "number", unit: "mA" },
  ],
  [
    { id: "boss-code", station: 5, stationLabel: "Trạm năng lượng", title: "Mã khóa trạm năng lượng", prompt: "Thiết bị có U=7,2 V và I=0,18 A. Muốn dòng đạt 0,25 A mà R không đổi. Chọn chuỗi kết quả đúng.", kind: "choice", choices: [
      { value: "40-10", label: "R=40 Ω → đặt U=10 V" }, { value: "25-10", label: "R=25 Ω → đặt U=10 V" }, { value: "40-6.25", label: "R=40 Ω → đặt U=6,25 V" },
    ] },
    { id: "boss-config", station: 5, stationLabel: "Trạm năng lượng", title: "Chọn cấu hình vận hành", prompt: "Một thiết bị chỉ chạy đúng khi 0,18 A ≤ I ≤ 0,22 A: thấp hơn thì không đủ dòng, cao hơn thì quá tải.", detail: "Cấu hình nào cho dòng điện nằm đúng trong khoảng này?", kind: "choice", choices: [
      { value: "3-15", label: "U=3 V; R=15 Ω" }, { value: "6-20", label: "U=6 V; R=20 Ω" }, { value: "9-60", label: "U=9 V; R=60 Ω" },
    ] },
    { id: "boss-two-lines", station: 5, stationLabel: "Trạm năng lượng", title: "Hai đường truyền", prompt: "Tại 6 V: dây M có I=0,15 A; N có I=0,24 A. Báo cáo nào đúng?", kind: "choice", choices: [
      { value: "40-25-n", label: "R_M=40 Ω; R_N=25 Ω; N cho dòng lớn hơn" },
      { value: "25-40-m", label: "R_M=25 Ω; R_N=40 Ω; M cho dòng lớn hơn" },
      { value: "40-25-m", label: "R_M=40 Ω; R_N=25 Ω; M cho dòng lớn hơn" },
    ] },
    { id: "boss-fault", station: 5, stationLabel: "Trạm năng lượng", title: "Điều tra sự cố", prompt: "Thiết kế: U=10 V, R=50 Ω. Thực tế ampe kế chỉ 0,125 A. Báo cáo nào đúng?", kind: "choice", choices: [
      { value: "020-80-30", label: "I dự kiến 0,20 A; R thực tế 80 Ω; R tăng 30 Ω" },
      { value: "020-50-0", label: "I dự kiến 0,20 A; R vẫn là 50 Ω" },
      { value: "0125-80-30", label: "I dự kiến 0,125 A; R thực tế 80 Ω" },
    ] },
    { id: "boss-combo", station: 5, stationLabel: "Trạm năng lượng", title: "Kiểm vùng an toàn", prompt: "Một thiết bị có điện trở R=60 Ω, hoạt động an toàn khi 0,15 A ≤ I ≤ 0,25 A. Nguồn được đặt ở 9 V.", detail: "Dòng điện có nằm trong vùng an toàn không?", kind: "choice", choices: [
      { value: "a", label: "Có, I=0,15 A đúng ở biên dưới vùng an toàn" },
      { value: "b", label: "Không, I=0,25 A vượt biên trên" },
      { value: "c", label: "Không, I=0,10 A dưới biên dưới" },
    ] },
    { id: "boss-energy", station: 5, stationLabel: "Trạm năng lượng", title: "Mở khóa cửa cuối", prompt: "Mạch yêu cầu dòng điện đúng 0,2 A để mở khóa trạm năng lượng. Điện trở hiện tại là 50 Ω.", detail: "Tính hiệu điện thế cần đặt.", kind: "number", unit: "V" },
  ],
];

const allQuestions = stations.flat();

export function getOhmRaceQuestion(id: string) {
  return allQuestions.find((question) => question.id === id);
}

// PRNG có hạt giống để trộn thứ tự ổn định theo từng học sinh + vòng.
function seededShuffle<T>(items: T[], seed: number): T[] {
  let state = (seed * 1103515245 + 12345) & 0x7fffffff;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

/**
 * Mỗi học sinh nhận 15 câu được cá nhân hoá: mỗi trạm chọn 3 biến thể KHÔNG trùng nhau
 * (trong 6 biến thể có sẵn) theo STT + vòng đua, sau đó TRỘN THỨ TỰ toàn bộ 15 câu để
 * các bạn cạnh nhau không làm cùng câu cùng lúc.
 */
export function getOhmRaceQuestions(studentNumber: number, round: number): OhmRaceQuestion[] {
  const picked = stations.flatMap((variants, stationIndex) => {
    const seed = Math.abs(studentNumber * 131 + round * 977 + stationIndex * 53) + 1;
    const order = seededShuffle(Array.from({ length: variants.length }, (_, index) => index), seed);
    return order.slice(0, OHM_RACE_QUESTIONS_PER_STATION).map((index) => variants[index]);
  });
  return seededShuffle(picked, Math.abs(studentNumber * 311 + round * 613) + 1);
}

export function createEmptyOhmRaceAnswers(round: number): OhmRaceAnswers {
  return { round, groupName: "", questionIds: [], responses: {} };
}
