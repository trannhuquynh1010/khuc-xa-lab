export type OpticsQuestQuestion = {
  id: string;
  station: number;
  stationLabel: string;
  title: string;
  prompt: string;
  kind: "choice" | "number";
  answer: string;
  unit?: string;
  tolerance?: number;
  choices?: Array<{ value: string; label: string }>;
  explanation: string;
  visual: "refraction" | "apparent" | "tir" | "prism" | "color" | "boss";
};

export type OpticsQuestAnswers = {
  round: number;
  groupName: string;
  questionIds: string[];
  responses: Record<string, string>;
  clearedQuestionIds: string[];
  deferredQuestionIds: string[];
  attemptCounts: Record<string, number>;
};

export type OpticsQuestPlayer = {
  studentNumber: number;
  groupName: string;
  progress: number;
  finished: boolean;
  energy: number;
  elapsedSeconds: number | null;
};

export type OpticsQuestGroup = {
  groupName: string;
  participantCount: number;
  finishedCount: number;
  completionRate: number;
  averageEnergy: number;
  eligible: boolean;
  rank: number | null;
};

export type OpticsQuestSnapshot = {
  round: number;
  isOpen: boolean;
  isRunning: boolean;
  startedAt: string | null;
  readyCount: number;
  finishedCount: number;
  players: OpticsQuestPlayer[];
  groups: OpticsQuestGroup[];
};

export const OPTICS_QUEST_STATION_COUNT = 6;
export const OPTICS_QUEST_QUESTIONS_PER_STATION = 2;
export const OPTICS_QUEST_QUESTION_COUNT = OPTICS_QUEST_STATION_COUNT * OPTICS_QUEST_QUESTIONS_PER_STATION;
export const OPTICS_QUEST_MAX_ENERGY = OPTICS_QUEST_QUESTION_COUNT * 3;
export const OPTICS_QUEST_GROUP_COLORS: Record<string, string> = {
  "Nhóm 1": "#ff6b6b",
  "Nhóm 2": "#ff9f43",
  "Nhóm 3": "#f6d74b",
  "Nhóm 4": "#9fe870",
  "Nhóm 5": "#4fd1c5",
  "Nhóm 6": "#60a5fa",
  "Nhóm 7": "#a78bfa",
  "Nhóm 8": "#f472b6",
};

export function getOpticsQuestGroupColor(groupName: string) {
  return OPTICS_QUEST_GROUP_COLORS[groupName] ?? "#c4ff5c";
}

const stations: OpticsQuestQuestion[][] = [
  [
    { id: "r-air-glass", station: 1, stationLabel: "Cổng khúc xạ", title: "Bẻ hướng tia sáng", prompt: "Tia sáng truyền xiên từ không khí vào thủy tinh. Tia khúc xạ đi theo hướng nào?", kind: "choice", answer: "toward", choices: [{ value: "toward", label: "Lệch về phía pháp tuyến" }, { value: "away", label: "Lệch xa pháp tuyến" }, { value: "straight", label: "Luôn truyền thẳng" }], explanation: "Thủy tinh chiết quang hơn không khí nên tia khúc xạ lệch về pháp tuyến.", visual: "refraction" },
    { id: "r-water-air", station: 1, stationLabel: "Cổng khúc xạ", title: "Thoát khỏi mặt nước", prompt: "Tia sáng truyền xiên từ nước ra không khí và vẫn có tia khúc xạ. So sánh r với i.", kind: "choice", answer: "greater", choices: [{ value: "greater", label: "r > i" }, { value: "less", label: "r < i" }, { value: "equal", label: "r = i với mọi góc" }], explanation: "Sang môi trường chiết quang kém hơn, tia khúc xạ lệch xa pháp tuyến nên r > i.", visual: "refraction" },
    { id: "r-normal", station: 1, stationLabel: "Cổng khúc xạ", title: "Tia đi theo pháp tuyến", prompt: "Một tia tới vuông góc mặt phân cách. Góc khúc xạ bằng bao nhiêu?", kind: "number", answer: "0", unit: "°", tolerance: 0.01, explanation: "Tia tới theo pháp tuyến có i = 0° và truyền thẳng với r = 0°.", visual: "refraction" },
    { id: "r-index", station: 1, stationLabel: "Cổng khúc xạ", title: "Giải mã chiết suất", prompt: "Từ không khí vào môi trường X: sin i = 0,60; sin r = 0,40. Chiết suất của X gần bằng bao nhiêu?", kind: "number", answer: "1.5", tolerance: 0.01, explanation: "n ≈ sin i/sin r = 0,60/0,40 = 1,50.", visual: "refraction" },
    { id: "r-snell-sine", station: 1, stationLabel: "Cổng khúc xạ", title: "Khóa số Snell", prompt: "Tia truyền từ không khí vào thủy tinh có n = 1,50 và sin i = 0,75. Tính sin r.", kind: "number", answer: "0.5", tolerance: 0.01, explanation: "sin r = 0,75/1,50 = 0,50.", visual: "refraction" },
    { id: "r-speed", station: 1, stationLabel: "Cổng khúc xạ", title: "Tốc độ trong thủy tinh", prompt: "Chiết suất của thủy tinh là 1,50. Tốc độ ánh sáng trong chân không là 300 000 km/s. Tính tốc độ ánh sáng trong thủy tinh.", kind: "number", answer: "200000", unit: "km/s", tolerance: 1, explanation: "v = 300 000/1,50 = 200 000 km/s.", visual: "refraction" },
  ],
  [
    { id: "a-fish", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Con cá ở đâu?", prompt: "Nhìn gần vuông góc từ trên mặt nước, ta thấy con cá ở vị trí nào so với vị trí thật?", kind: "choice", answer: "shallower", choices: [{ value: "shallower", label: "Gần mặt nước hơn" }, { value: "deeper", label: "Sâu hơn" }, { value: "same", label: "Đúng vị trí thật" }], explanation: "Mắt kéo dài tia ló theo đường thẳng và thấy ảnh ảo của cá gần mặt nước hơn.", visual: "apparent" },
    { id: "a-branch", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Cành cây nhìn từ dưới", prompt: "Người lặn nhìn cành cây trên bờ qua mặt nước. Cành cây thường trông như thế nào?", kind: "choice", answer: "higher", choices: [{ value: "higher", label: "Cao hơn vị trí thật" }, { value: "lower", label: "Thấp hơn vị trí thật" }, { value: "invisible", label: "Không thể nhìn thấy" }], explanation: "Tia từ không khí vào nước lệch về pháp tuyến; mắt truy ngược tia và thấy ảnh cao hơn.", visual: "apparent" },
    { id: "a-aim", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Nhắm đúng mục tiêu", prompt: "Muốn chạm đúng con cá khi nhìn từ trên bờ, nên hướng dụng cụ về đâu so với ảnh nhìn thấy?", kind: "choice", answer: "below", choices: [{ value: "below", label: "Thấp hơn ảnh nhìn thấy" }, { value: "at", label: "Đúng ảnh nhìn thấy" }, { value: "above", label: "Cao hơn ảnh nhìn thấy" }], explanation: "Cá thật nằm sâu hơn ảnh ảo mà mắt quan sát được.", visual: "apparent" },
    { id: "a-ray", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Tia nào đến mắt?", prompt: "Khi nhìn vật dưới nước từ không khí, tia sáng đến mắt đã đổi hướng ở đâu?", kind: "choice", answer: "surface", choices: [{ value: "surface", label: "Tại mặt phân cách nước–không khí" }, { value: "eye", label: "Chỉ khi đi vào mắt" }, { value: "object", label: "Ngay khi rời vật" }], explanation: "Sự khúc xạ xảy ra tại mặt phân cách giữa hai môi trường trong suốt.", visual: "apparent" },
    { id: "a-fish-ray-turn", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Tia sáng từ con cá", prompt: "Tia sáng từ con cá truyền từ nước ra không khí có góc tới i = 30° và góc khúc xạ r = 45°. Tia sáng bị đổi hướng bao nhiêu độ?", kind: "number", answer: "15", unit: "°", tolerance: 0.01, explanation: "Độ đổi hướng là |45° − 30°| = 15°; tia khúc xạ lệch xa pháp tuyến.", visual: "apparent" },
    { id: "a-diver-ray-turn", station: 2, stationLabel: "Mắt nhìn dưới nước", title: "Ánh đèn đến thợ lặn", prompt: "Tia sáng từ đèn trên bờ truyền từ không khí vào nước có i = 40° và r = 28°. Tia sáng bị đổi hướng bao nhiêu độ?", kind: "number", answer: "12", unit: "°", tolerance: 0.01, explanation: "Độ đổi hướng là |40° − 28°| = 12°; tia khúc xạ lệch gần pháp tuyến.", visual: "apparent" },
  ],
  [
    { id: "t-condition", station: 3, stationLabel: "Mê cung phản xạ", title: "Mở khóa phản xạ toàn phần", prompt: "Điều kiện nào phải đồng thời được thỏa mãn?", kind: "choice", answer: "dense-large", choices: [{ value: "dense-large", label: "Từ môi trường chiết quang hơn sang kém hơn và i > i₍gh₎" }, { value: "thin-large", label: "Từ môi trường kém hơn sang chiết quang hơn và i lớn" }, { value: "any", label: "Chỉ cần góc tới lớn" }], explanation: "Phản xạ toàn phần cần đúng chiều truyền và góc tới vượt góc giới hạn.", visual: "tir" },
    { id: "t-critical", station: 3, stationLabel: "Mê cung phản xạ", title: "Chạm góc giới hạn", prompt: "Khi i = i₍gh₎, tia khúc xạ có góc r bằng bao nhiêu?", kind: "number", answer: "90", unit: "°", tolerance: 0.01, explanation: "Ở góc giới hạn, tia khúc xạ đi sát mặt phân cách nên r = 90°.", visual: "tir" },
    { id: "t-fiber", station: 3, stationLabel: "Mê cung phản xạ", title: "Dẫn ánh sáng quanh co", prompt: "Bộ phận nào truyền tín hiệu nhờ nhiều lần phản xạ toàn phần?", kind: "choice", answer: "fiber", choices: [{ value: "fiber", label: "Sợi quang" }, { value: "filter", label: "Kính lọc màu" }, { value: "diffuser", label: "Tấm tán quang" }], explanation: "Lõi sợi quang giữ ánh sáng nhờ phản xạ toàn phần liên tiếp.", visual: "tir" },
    { id: "t-diamond", station: 3, stationLabel: "Mê cung phản xạ", title: "Ánh sáng trong kim cương", prompt: "Kim cương lấp lánh mạnh chủ yếu do hiện tượng nào bên trong?", kind: "choice", answer: "tir", choices: [{ value: "tir", label: "Phản xạ toàn phần nhiều lần" }, { value: "absorb", label: "Hấp thụ hoàn toàn" }, { value: "straight", label: "Truyền thẳng không đổi hướng" }], explanation: "Chiết suất lớn làm góc giới hạn nhỏ, ánh sáng dễ phản xạ toàn phần trong viên đá.", visual: "tir" },
    { id: "t-critical-sine", station: 3, stationLabel: "Mê cung phản xạ", title: "Mã góc giới hạn", prompt: "Tia đi từ thủy tinh có n₁ = 1,50 ra không khí có n₂ = 1,00. Tính sin của góc giới hạn, làm tròn đến hai chữ số thập phân.", kind: "number", answer: "0.67", tolerance: 0.01, explanation: "sin i₍gh₎ = 1,00/1,50 ≈ 0,67.", visual: "tir" },
    { id: "t-critical-diamond", station: 3, stationLabel: "Mê cung phản xạ", title: "Kim cương và góc giới hạn", prompt: "Kim cương có n₁ = 2,40, không khí có n₂ = 1,00. Tính sin của góc giới hạn, làm tròn đến hai chữ số thập phân.", kind: "number", answer: "0.42", tolerance: 0.01, explanation: "sin i₍gh₎ = 1,00/2,40 ≈ 0,42; giá trị nhỏ nên phản xạ toàn phần dễ xảy ra.", visual: "tir" },
  ],
  [
    { id: "p-order", station: 4, stationLabel: "Mật mã lăng kính", title: "Sắp dải màu", prompt: "Trong quang phổ qua lăng kính, màu nào lệch ít nhất và màu nào lệch nhiều nhất?", kind: "choice", answer: "red-violet", choices: [{ value: "red-violet", label: "Đỏ ít nhất · tím nhiều nhất" }, { value: "violet-red", label: "Tím ít nhất · đỏ nhiều nhất" }, { value: "same", label: "Mọi màu lệch như nhau" }], explanation: "Chiết suất của lăng kính với ánh sáng tím lớn hơn với ánh sáng đỏ.", visual: "prism" },
    { id: "p-white", station: 4, stationLabel: "Mật mã lăng kính", title: "Nguồn của dải màu", prompt: "Ánh sáng trắng qua lăng kính tách thành nhiều màu vì sao?", kind: "choice", answer: "index", choices: [{ value: "index", label: "Chiết suất phụ thuộc màu ánh sáng" }, { value: "paint", label: "Lăng kính chứa sẵn các màu" }, { value: "heat", label: "Lăng kính bị nóng lên" }], explanation: "Mỗi thành phần màu có chiết suất khác nhau nên bị lệch khác nhau.", visual: "prism" },
    { id: "p-second", station: 4, stationLabel: "Mật mã lăng kính", title: "Ghép lại ánh sáng", prompt: "Đặt lăng kính thứ hai ngược chiều phù hợp sau lăng kính thứ nhất. Kết quả có thể là gì?", kind: "choice", answer: "white", choices: [{ value: "white", label: "Các màu ghép lại gần thành ánh sáng trắng" }, { value: "black", label: "Ánh sáng biến mất hoàn toàn" }, { value: "violet", label: "Chỉ còn tia tím" }], explanation: "Lăng kính thứ hai có thể bù độ lệch và tổng hợp các thành phần màu.", visual: "prism" },
    { id: "p-red", station: 4, stationLabel: "Mật mã lăng kính", title: "Một tia đỏ đơn sắc", prompt: "Chiếu ánh sáng đỏ đơn sắc qua lăng kính. Quan sát nào đúng?", kind: "choice", answer: "red-only", choices: [{ value: "red-only", label: "Chỉ có tia đỏ bị lệch" }, { value: "spectrum", label: "Xuất hiện đủ bảy màu" }, { value: "no-light", label: "Không có tia ló" }], explanation: "Ánh sáng đơn sắc không bị phân tích thành các màu khác.", visual: "prism" },
    { id: "p-violet-speed", station: 4, stationLabel: "Mật mã lăng kính", title: "Tốc độ tia tím", prompt: "Với tia tím, lăng kính có n = 1,50. Lấy c = 300 000 km/s. Tính tốc độ truyền của tia tím trong lăng kính.", kind: "number", answer: "200000", unit: "km/s", tolerance: 1, explanation: "v = c/n = 300 000/1,50 = 200 000 km/s.", visual: "prism" },
    { id: "p-color-speed", station: 4, stationLabel: "Mật mã lăng kính", title: "So tốc độ hai màu", prompt: "Trong lăng kính, chiết suất đối với tia đỏ là 1,50 và tia tím là 1,60. Tốc độ ánh sáng trong chân không là 300 000 km/s. Tính độ chênh lệch tốc độ giữa hai tia.", kind: "number", answer: "12500", unit: "km/s", tolerance: 1, explanation: "vđỏ = 200 000 km/s; vtím = 187 500 km/s; chênh lệch 12 500 km/s.", visual: "prism" },
  ],
  [
    { id: "c-red-white", station: 5, stationLabel: "Phòng màu sắc", title: "Vật đỏ dưới ánh sáng trắng", prompt: "Vì sao mắt thấy một vật màu đỏ dưới ánh sáng trắng?", kind: "choice", answer: "reflect-red", choices: [{ value: "reflect-red", label: "Vật phản xạ ánh sáng đỏ vào mắt và hấp thụ phần lớn màu khác" }, { value: "make-red", label: "Vật tự tạo ra ánh sáng đỏ" }, { value: "eye-paint", label: "Mắt nhuộm ánh sáng thành đỏ" }], explanation: "Màu quan sát phụ thuộc ánh sáng vật phản xạ truyền tới mắt.", visual: "color" },
    { id: "c-blue-red", station: 5, stationLabel: "Phòng màu sắc", title: "Vật xanh dưới đèn đỏ", prompt: "Vật chỉ phản xạ tốt ánh sáng xanh lam được chiếu bằng ánh sáng đỏ. Ta thường thấy vật thế nào?", kind: "choice", answer: "dark", choices: [{ value: "dark", label: "Rất tối hoặc gần đen" }, { value: "blue", label: "Vẫn xanh lam sáng" }, { value: "white", label: "Trắng" }], explanation: "Nguồn không có ánh sáng xanh để vật phản xạ vào mắt.", visual: "color" },
    { id: "c-white-blue", station: 5, stationLabel: "Phòng màu sắc", title: "Giấy trắng dưới đèn xanh", prompt: "Tờ giấy trắng đặt dưới nguồn sáng xanh lam sẽ trông màu gì?", kind: "choice", answer: "blue", choices: [{ value: "blue", label: "Xanh lam" }, { value: "white", label: "Luôn trắng" }, { value: "black", label: "Đen" }], explanation: "Giấy trắng phản xạ tốt màu đang chiếu tới, nên phản xạ ánh sáng xanh vào mắt.", visual: "color" },
    { id: "c-black", station: 5, stationLabel: "Phòng màu sắc", title: "Vật đen", prompt: "Vật đen dưới ánh sáng trắng có đặc điểm nào?", kind: "choice", answer: "absorb", choices: [{ value: "absorb", label: "Hấp thụ phần lớn ánh sáng nhìn thấy" }, { value: "reflect-all", label: "Phản xạ mạnh mọi màu" }, { value: "emit", label: "Phát ánh sáng đen vào mắt" }], explanation: "Rất ít ánh sáng từ vật đen truyền đến mắt nên ta thấy nó tối.", visual: "color" },
    { id: "c-rgb-power", station: 5, stationLabel: "Phòng màu sắc", title: "Năng lượng màu tới mắt", prompt: "Mô hình đơn giản: chùm trắng 12 mW gồm ba phần đỏ, lục, lam bằng nhau. Vật đỏ chỉ phản xạ phần đỏ. Công suất ánh sáng phản xạ vào mắt là bao nhiêu?", kind: "number", answer: "4", unit: "mW", tolerance: 0.01, explanation: "Mỗi thành phần có 12/3 = 4 mW; vật đỏ phản xạ phần đỏ 4 mW.", visual: "color" },
    { id: "c-yellow-power", station: 5, stationLabel: "Phòng màu sắc", title: "Đèn vàng trên vật đỏ", prompt: "Mô hình đơn giản: ánh sáng vàng 10 mW gồm đỏ và lục bằng nhau. Vật đỏ chỉ phản xạ phần đỏ. Công suất phản xạ vào mắt là bao nhiêu?", kind: "number", answer: "5", unit: "mW", tolerance: 0.01, explanation: "Phần đỏ chiếm 10/2 = 5 mW và được vật đỏ phản xạ vào mắt.", visual: "color" },
  ],
  [
    { id: "b-pool-fiber", station: 6, stationLabel: "Boss hải đăng", title: "Hai hiện tượng, một lối thoát", prompt: "Camera dưới nước gửi ảnh qua sợi quang lên bờ. Cặp hiện tượng nào lần lượt giúp tạo ảnh và dẫn tín hiệu?", kind: "choice", answer: "ref-tir", choices: [{ value: "ref-tir", label: "Khúc xạ · phản xạ toàn phần" }, { value: "tir-disp", label: "Phản xạ toàn phần · tán sắc" }, { value: "disp-abs", label: "Tán sắc · hấp thụ" }], explanation: "Tia đổi hướng khi qua mặt nước; tín hiệu được giữ trong sợi bằng phản xạ toàn phần.", visual: "boss" },
    { id: "b-rainbow-shirt", station: 6, stationLabel: "Boss hải đăng", title: "Sân khấu quang học", prompt: "Ánh sáng trắng được tách qua lăng kính rồi dải đỏ chiếu vào áo xanh. Kết quả phù hợp nhất?", kind: "choice", answer: "spectrum-dark", choices: [{ value: "spectrum-dark", label: "Có dải màu; vùng áo nhận tia đỏ trông tối" }, { value: "blue", label: "Áo vẫn xanh sáng dưới tia đỏ" }, { value: "white", label: "Lăng kính cho tia trắng không đổi" }], explanation: "Lăng kính tán sắc; áo xanh không phản xạ tốt ánh sáng đỏ.", visual: "boss" },
    { id: "b-critical-color", station: 6, stationLabel: "Boss hải đăng", title: "Đổi màu, đổi đường đi", prompt: "Trong cùng lăng kính, tia tím có chiết suất lớn hơn tia đỏ. Nhận định nào hợp lí?", kind: "choice", answer: "violet", choices: [{ value: "violet", label: "Tia tím lệch mạnh hơn và có góc giới hạn nhỏ hơn" }, { value: "red", label: "Tia đỏ lệch mạnh hơn và có góc giới hạn nhỏ hơn" }, { value: "same", label: "Hai tia luôn có đường đi giống nhau" }], explanation: "n tím lớn hơn nên tím khúc xạ mạnh hơn; sin i₍gh₎ = n₂/n₁ nên góc giới hạn nhỏ hơn.", visual: "boss" },
    { id: "b-lighthouse", station: 6, stationLabel: "Boss hải đăng", title: "Khôi phục hải đăng", prompt: "Muốn gom tín hiệu màu, dẫn ánh sáng qua sợi và cho chùm thoát ra không lệch ở cửa cuối, chọn chuỗi giải pháp nào?", kind: "choice", answer: "prism-fiber-normal", choices: [{ value: "prism-fiber-normal", label: "Lăng kính · sợi quang · chiếu theo pháp tuyến" }, { value: "mirror-filter-oblique", label: "Gương · kính lọc · chiếu xiên" }, { value: "water-lens-parallel", label: "Nước · thấu kính · chiếu song song mặt phân cách" }], explanation: "Lăng kính xử lí màu, sợi quang dẫn sáng và tia theo pháp tuyến không đổi hướng.", visual: "boss" },
    { id: "b-snell-speed", station: 6, stationLabel: "Boss hải đăng", title: "Hai mã khóa liên tiếp", prompt: "Môi trường có n = 1,50. Một tia từ không khí tới với sin i = 0,75. Chọn cặp kết quả đúng cho sin r và tốc độ v (c = 3×10⁸ m/s).", kind: "choice", answer: "05-2e8", choices: [{ value: "05-2e8", label: "sin r = 0,50; v = 2,0×10⁸ m/s" }, { value: "1125-45e8", label: "sin r = 1,125; v = 4,5×10⁸ m/s" }, { value: "05-3e8", label: "sin r = 0,50; v = 3,0×10⁸ m/s" }], explanation: "sin r = 0,75/1,50 = 0,50 và v = c/n = 2,0×10⁸ m/s.", visual: "boss" },
    { id: "b-critical-code", station: 6, stationLabel: "Boss hải đăng", title: "Mở khóa cửa cuối", prompt: "Tia đi từ môi trường có n₁ = 1,60 ra không khí có n₂ = 1,00. Tính sin của góc giới hạn.", kind: "number", answer: "0.625", tolerance: 0.005, explanation: "sin i₍gh₎ = 1,00/1,60 = 0,625.", visual: "boss" },
  ],
];

function parseDecimal(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function isOpticsQuestAnswerCorrect(question: OpticsQuestQuestion, response: string) {
  if (question.kind === "number") {
    const actual = parseDecimal(response);
    const expected = parseDecimal(question.answer);
    return actual !== null && expected !== null && Math.abs(actual - expected) <= (question.tolerance ?? 0.01);
  }
  return response === question.answer;
}

export function getOpticsQuestQuestion(id: string) {
  return stations.flat().find((question) => question.id === id);
}

export function getOpticsQuestQuestions(studentNumber: number, round: number) {
  return stations.flatMap((station, index) => {
    const conceptIndex = Math.abs(studentNumber * 3 + round + index * 5) % 4;
    const applicationIndex = 4 + (Math.abs(studentNumber + round * 3 + index) % 2);
    return [station[conceptIndex], station[applicationIndex]];
  });
}

export function createEmptyOpticsQuestAnswers(round: number): OpticsQuestAnswers {
  return { round, groupName: "", questionIds: [], responses: {}, clearedQuestionIds: [], deferredQuestionIds: [], attemptCounts: {} };
}

export function calculateOpticsEnergy(questionIds: string[], clearedIds: Set<string>, attempts: Record<string, unknown>) {
  return questionIds.reduce((total, id) => {
    if (!clearedIds.has(id)) return total;
    const count = Math.max(1, Math.trunc(Number(attempts[id] ?? 1)));
    return total + (count === 1 ? 3 : count === 2 ? 2 : 1);
  }, 0);
}
