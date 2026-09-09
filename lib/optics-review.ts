export const OPTICS_REVIEW_QUESTION_COUNT = 20;

export type OpticsReviewTopic = "refraction" | "tir" | "prism" | "color";
export type OpticsReviewDifficulty = 1 | 2 | 3;
export type OpticsReviewQuestionKind = "true-false" | "single" | "multiple";
export type OpticsReviewResponse = string | string[];

export type OpticsReviewQuestion = {
  id: string;
  topic: OpticsReviewTopic;
  difficulty: OpticsReviewDifficulty;
  kind: OpticsReviewQuestionKind;
  prompt: string;
  context?: string;
  choices: ReadonlyArray<{ value: string; label: string }>;
  answers: readonly string[];
  explanation: string;
};

export type OpticsReviewAnswers = {
  questionIds: string[];
  responses: Record<string, OpticsReviewResponse>;
  checkedQuestionIds: string[];
  currentIndex: number;
};

export const opticsReviewTopics: Record<OpticsReviewTopic, { label: string; symbol: string }> = {
  refraction: { label: "Khúc xạ", symbol: "↘" },
  tir: { label: "Phản xạ toàn phần", symbol: "⌁" },
  prism: { label: "Lăng kính", symbol: "△" },
  color: { label: "Màu sắc", symbol: "◉" },
};

export const opticsReviewLevels: Record<OpticsReviewDifficulty, { label: string; shortLabel: string }> = {
  1: { label: "Củng cố nền tảng", shortLabel: "Nền tảng" },
  2: { label: "Vận dụng", shortLabel: "Vận dụng" },
  3: { label: "Tư duy mở rộng", shortLabel: "Thử thách" },
};

const trueFalseChoices = [
  { value: "true", label: "Đúng" },
  { value: "false", label: "Sai" },
] as const;

export const opticsReviewQuestions: readonly OpticsReviewQuestion[] = [
  {
    id: "r1-normal-angle", topic: "refraction", difficulty: 1, kind: "true-false",
    prompt: "Góc tới được đo giữa tia tới và pháp tuyến tại điểm tới.",
    choices: trueFalseChoices, answers: ["true"],
    explanation: "Góc tới và góc khúc xạ đều được đo với pháp tuyến, không đo với mặt phân cách.",
  },
  {
    id: "r1-air-glass", topic: "refraction", difficulty: 1, kind: "single",
    prompt: "Tia sáng truyền xiên từ không khí vào thủy tinh. Tia khúc xạ lệch theo hướng nào?",
    choices: [
      { value: "toward", label: "Gần pháp tuyến hơn" },
      { value: "away", label: "Xa pháp tuyến hơn" },
      { value: "surface", label: "Đi sát mặt phân cách" },
    ],
    answers: ["toward"], explanation: "Thủy tinh chiết quang hơn không khí nên tia khúc xạ lệch về phía pháp tuyến.",
  },
  {
    id: "r1-straight", topic: "refraction", difficulty: 1, kind: "multiple",
    prompt: "Chọn các trường hợp tia sáng truyền qua mặt phân cách mà không đổi hướng.",
    choices: [
      { value: "normal", label: "Tia tới đi theo pháp tuyến" },
      { value: "same-index", label: "Hai môi trường có cùng chiết suất" },
      { value: "oblique", label: "Tia tới xiên giữa hai môi trường có chiết suất khác nhau" },
      { value: "parallel", label: "Tia tới song song với mặt phân cách" },
    ],
    answers: ["normal", "same-index"], explanation: "Tia theo pháp tuyến có i = 0°, còn hai môi trường cùng chiết suất không làm tia đổi hướng.",
  },
  {
    id: "r2-sine", topic: "refraction", difficulty: 2, kind: "single",
    context: "Từ không khí vào môi trường X: sin i / sin r = 1,50 và sin i = 0,72.",
    prompt: "Giá trị sin r bằng bao nhiêu?",
    choices: [
      { value: "0.48", label: "0,48" },
      { value: "0.72", label: "0,72" },
      { value: "1.08", label: "1,08" },
      { value: "2.08", label: "2,08" },
    ],
    answers: ["0.48"], explanation: "sin r = 0,72 : 1,50 = 0,48.",
  },
  {
    id: "r2-outlier", topic: "refraction", difficulty: 2, kind: "single",
    context: "Ba lần đo sin i / sin r lần lượt là 1,50; 1,48; 1,16.",
    prompt: "Lần đo nào cần được kiểm tra lại trước tiên?",
    choices: [
      { value: "1", label: "Lần 1" },
      { value: "2", label: "Lần 2" },
      { value: "3", label: "Lần 3" },
      { value: "all", label: "Cả ba lần" },
    ],
    answers: ["3"], explanation: "Với cùng hai môi trường, tỉ số gần như không đổi; 1,16 lệch hẳn hai giá trị còn lại.",
  },
  {
    id: "r2-properties", topic: "refraction", difficulty: 2, kind: "multiple",
    prompt: "Tia sáng truyền từ không khí vào thủy tinh. Chọn các nhận định đúng.",
    choices: [
      { value: "slower", label: "Tốc độ truyền ánh sáng giảm" },
      { value: "r-less-i", label: "Góc khúc xạ nhỏ hơn góc tới" },
      { value: "frequency", label: "Tần số ánh sáng không đổi" },
      { value: "faster", label: "Tốc độ truyền ánh sáng tăng" },
    ],
    answers: ["slower", "r-less-i", "frequency"], explanation: "Sang môi trường chiết quang hơn, ánh sáng chậm hơn, lệch gần pháp tuyến; tần số do nguồn quyết định nên không đổi.",
  },
  {
    id: "r3-compare-media", topic: "refraction", difficulty: 3, kind: "single",
    context: "Với cùng góc tới từ không khí, môi trường A có n = 1,33 và B có n = 1,52.",
    prompt: "So sánh đường truyền và tốc độ ánh sáng trong hai môi trường.",
    choices: [
      { value: "b", label: "Trong B: tia gần pháp tuyến hơn và truyền chậm hơn" },
      { value: "a", label: "Trong A: tia gần pháp tuyến hơn và truyền chậm hơn" },
      { value: "same", label: "Hai tia có cùng hướng và cùng tốc độ" },
      { value: "mixed", label: "Trong B: tia xa pháp tuyến hơn nhưng truyền chậm hơn" },
    ],
    answers: ["b"], explanation: "Chiết suất B lớn hơn nên tốc độ nhỏ hơn và tia bị bẻ gần pháp tuyến hơn.",
  },
  {
    id: "r3-parallel-layers", topic: "refraction", difficulty: 3, kind: "single",
    context: "Tia đi xiên lần lượt qua ba lớp song song: không khí → nước → thủy tinh, với n tăng dần.",
    prompt: "Góc của tia với pháp tuyến thay đổi thế nào?",
    choices: [
      { value: "decrease", label: "Giảm dần qua mỗi lớp" },
      { value: "increase", label: "Tăng dần qua mỗi lớp" },
      { value: "constant", label: "Không đổi ở mọi lớp" },
      { value: "random", label: "Không thể suy luận từ chiết suất" },
    ],
    answers: ["decrease"], explanation: "Mỗi lần đi sang môi trường có chiết suất lớn hơn, tia lại lệch gần pháp tuyến hơn.",
  },
  {
    id: "r3-reliable-test", topic: "refraction", difficulty: 3, kind: "multiple",
    prompt: "Chọn các cách làm giúp kết luận thí nghiệm khúc xạ đáng tin cậy hơn.",
    choices: [
      { value: "repeat", label: "Đo lặp lại và lấy giá trị phù hợp" },
      { value: "fixed-media", label: "Giữ nguyên cặp môi trường khi so sánh" },
      { value: "graph", label: "Vẽ đồ thị sin i theo sin r" },
      { value: "change", label: "Đổi môi trường ở mỗi lần đo nhưng gộp chung dữ liệu" },
    ],
    answers: ["repeat", "fixed-media", "graph"], explanation: "Đo lặp, kiểm soát môi trường và dùng đồ thị giúp nhận ra quy luật lẫn số liệu bất thường.",
  },

  {
    id: "t1-conditions", topic: "tir", difficulty: 1, kind: "multiple",
    prompt: "Phản xạ toàn phần xảy ra khi đồng thời có những điều kiện nào?",
    choices: [
      { value: "dense-thin", label: "Tia đi từ môi trường chiết quang hơn sang kém hơn" },
      { value: "large-angle", label: "Góc tới lớn hơn góc giới hạn" },
      { value: "thin-dense", label: "Tia đi từ môi trường kém hơn sang chiết quang hơn" },
      { value: "any-angle", label: "Góc tới có thể có giá trị bất kỳ" },
    ],
    answers: ["dense-thin", "large-angle"], explanation: "Cả chiều truyền và điều kiện i > i giới hạn đều bắt buộc.",
  },
  {
    id: "t1-critical", topic: "tir", difficulty: 1, kind: "true-false",
    prompt: "Khi góc tới bằng góc giới hạn, tia khúc xạ đi sát mặt phân cách.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Tại góc giới hạn, góc khúc xạ bằng 90°.",
  },
  {
    id: "t1-fiber", topic: "tir", difficulty: 1, kind: "single",
    prompt: "Thiết bị nào khai thác nhiều lần phản xạ toàn phần để dẫn ánh sáng?",
    choices: [
      { value: "fiber", label: "Sợi quang" },
      { value: "filter", label: "Kính lọc màu" },
      { value: "screen", label: "Màn hứng" },
      { value: "diffuser", label: "Tấm tán quang" },
    ],
    answers: ["fiber"], explanation: "Ánh sáng được giữ trong lõi sợi quang nhờ phản xạ toàn phần liên tiếp.",
  },
  {
    id: "t2-critical-sine", topic: "tir", difficulty: 2, kind: "single",
    context: "Tia đi từ thủy tinh n₁ = 1,50 ra không khí n₂ = 1,00.",
    prompt: "Sin của góc giới hạn gần bằng giá trị nào?",
    choices: [
      { value: "0.67", label: "0,67" },
      { value: "1.50", label: "1,50" },
      { value: "0.50", label: "0,50" },
      { value: "2.50", label: "2,50" },
    ],
    answers: ["0.67"], explanation: "sin i giới hạn = n₂/n₁ = 1,00/1,50 ≈ 0,67.",
  },
  {
    id: "t2-below-critical", topic: "tir", difficulty: 2, kind: "single",
    context: "Tia đi từ nước ra không khí. Góc giới hạn là 49° và góc tới là 35°.",
    prompt: "Hiện tượng nào xảy ra tại mặt phân cách?",
    choices: [
      { value: "both", label: "Có tia khúc xạ và một phần tia phản xạ" },
      { value: "tir", label: "Chỉ có phản xạ toàn phần" },
      { value: "absorb", label: "Ánh sáng bị hấp thụ hoàn toàn" },
      { value: "normal", label: "Tia truyền thẳng theo pháp tuyến" },
    ],
    answers: ["both"], explanation: "Vì 35° < 49°, chưa đủ điều kiện phản xạ toàn phần nên vẫn có tia khúc xạ.",
  },
  {
    id: "t2-more-likely", topic: "tir", difficulty: 2, kind: "multiple",
    prompt: "Chọn các thay đổi làm phản xạ toàn phần dễ xảy ra hơn khi tia đi từ môi trường 1 sang 2.",
    choices: [
      { value: "n1-up", label: "Tăng chiết suất môi trường 1" },
      { value: "n2-down", label: "Giảm chiết suất môi trường 2" },
      { value: "i-up", label: "Tăng góc tới" },
      { value: "i-down", label: "Giảm góc tới" },
    ],
    answers: ["n1-up", "n2-down", "i-up"], explanation: "Tăng tỉ số n₁/n₂ làm góc giới hạn nhỏ hơn; tăng i giúp vượt góc giới hạn.",
  },
  {
    id: "t3-glass-water", topic: "tir", difficulty: 3, kind: "single",
    context: "Tia đi từ thủy tinh n₁ = 1,50 sang nước n₂ = 1,33. Biết sin i = 0,90.",
    prompt: "Kết luận nào đúng?",
    choices: [
      { value: "tir", label: "Có phản xạ toàn phần vì sin i > n₂/n₁" },
      { value: "refract", label: "Chắc chắn có tia khúc xạ vì nước trong suốt" },
      { value: "impossible", label: "Không thể có phản xạ toàn phần giữa hai môi trường này" },
      { value: "normal", label: "Tia ló truyền theo pháp tuyến" },
    ],
    answers: ["tir"], explanation: "n₂/n₁ ≈ 0,887; sin i = 0,90 lớn hơn giá trị giới hạn nên xảy ra phản xạ toàn phần.",
  },
  {
    id: "t3-two-colors", topic: "tir", difficulty: 3, kind: "single",
    context: "Trong cùng một khối thủy tinh, n tím > n đỏ nên góc giới hạn của tia tím nhỏ hơn tia đỏ. Góc tới nằm giữa hai góc giới hạn.",
    prompt: "Điều gì có thể xảy ra?",
    choices: [
      { value: "violet-only", label: "Tia tím phản xạ toàn phần, tia đỏ vẫn ló ra" },
      { value: "red-only", label: "Tia đỏ phản xạ toàn phần, tia tím vẫn ló ra" },
      { value: "both", label: "Cả hai chắc chắn phản xạ toàn phần" },
      { value: "neither", label: "Cả hai chắc chắn đều ló ra" },
    ],
    answers: ["violet-only"], explanation: "Góc tới đã vượt góc giới hạn nhỏ hơn của tím nhưng chưa vượt góc giới hạn lớn hơn của đỏ.",
  },
  {
    id: "t3-prism-turn", topic: "tir", difficulty: 3, kind: "multiple",
    context: "Trong lăng kính vuông, tia tới mặt huyền với i = 45°; góc giới hạn thủy tinh–không khí là 42°.",
    prompt: "Chọn các nhận định đúng.",
    choices: [
      { value: "tir", label: "Tia phản xạ toàn phần ở mặt huyền" },
      { value: "no-refract", label: "Không có tia khúc xạ truyền ra không khí ở mặt huyền" },
      { value: "mirror", label: "Mặt huyền có thể đổi hướng chùm sáng như một gương" },
      { value: "below", label: "Vì 45° < 42° nên tia ló ra ngoài" },
    ],
    answers: ["tir", "no-refract", "mirror"], explanation: "45° > 42° nên mặt huyền phản xạ toàn bộ chùm sáng trở lại trong lăng kính.",
  },

  {
    id: "p1-cause", topic: "prism", difficulty: 1, kind: "single",
    prompt: "Vì sao ánh sáng trắng qua lăng kính tách thành dải màu?",
    choices: [
      { value: "index", label: "Chiết suất của lăng kính khác nhau với từng màu" },
      { value: "paint", label: "Lăng kính chứa sẵn các lớp sơn màu" },
      { value: "heat", label: "Lăng kính làm ánh sáng nóng lên" },
      { value: "shadow", label: "Bóng của lăng kính tạo ra màu" },
    ],
    answers: ["index"], explanation: "Mỗi thành phần màu bị khúc xạ một mức khác nhau nên chùm trắng bị tán sắc.",
  },
  {
    id: "p1-order", topic: "prism", difficulty: 1, kind: "true-false",
    prompt: "Qua cùng một lăng kính, tia đỏ thường lệch ít hơn tia tím.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Chiết suất đối với tia tím lớn hơn nên tia tím bị lệch nhiều hơn.",
  },
  {
    id: "p1-mono", topic: "prism", difficulty: 1, kind: "single",
    prompt: "Chiếu một chùm đỏ đơn sắc qua lăng kính. Kết quả phù hợp nhất là gì?",
    choices: [
      { value: "red", label: "Một tia đỏ bị lệch" },
      { value: "spectrum", label: "Một dải đủ các màu" },
      { value: "white", label: "Một tia trắng" },
      { value: "dark", label: "Không có ánh sáng ló" },
    ],
    answers: ["red"], explanation: "Ánh sáng đơn sắc có một màu nên không bị tách thành dải màu.",
  },
  {
    id: "p2-speed", topic: "prism", difficulty: 2, kind: "single",
    context: "Trong lăng kính, n đỏ = 1,50 và n tím = 1,54.",
    prompt: "So sánh tốc độ của hai tia trong lăng kính.",
    choices: [
      { value: "red-faster", label: "Tia đỏ truyền nhanh hơn tia tím" },
      { value: "violet-faster", label: "Tia tím truyền nhanh hơn tia đỏ" },
      { value: "same", label: "Hai tia truyền nhanh như nhau" },
      { value: "zero", label: "Tia tím không truyền được" },
    ],
    answers: ["red-faster"], explanation: "v = c/n; n tím lớn hơn nên tốc độ tia tím nhỏ hơn.",
  },
  {
    id: "p2-red-filter", topic: "prism", difficulty: 2, kind: "single",
    context: "Đặt kính lọc đỏ trước lăng kính rồi chiếu ánh sáng trắng vào kính lọc.",
    prompt: "Trên màn sau lăng kính quan sát được gì?",
    choices: [
      { value: "red", label: "Chủ yếu một vệt đỏ bị lệch" },
      { value: "full", label: "Dải đủ các màu như khi không có kính lọc" },
      { value: "violet", label: "Chỉ một vệt tím" },
      { value: "white", label: "Một vệt trắng không lệch" },
    ],
    answers: ["red"], explanation: "Kính lọc chỉ cho phần đỏ truyền qua; lăng kính không thể tạo thêm các màu đã bị loại.",
  },
  {
    id: "p2-two-prisms", topic: "prism", difficulty: 2, kind: "multiple",
    prompt: "Hai lăng kính giống nhau đặt ngược chiều phù hợp có thể tạo ra những kết quả nào?",
    choices: [
      { value: "recombine", label: "Ghép các màu trở lại gần thành ánh sáng trắng" },
      { value: "reduce", label: "Giảm sự phân tách màu của lăng kính thứ nhất" },
      { value: "new", label: "Tạo ra màu hoàn toàn mới không có trong chùm tới" },
      { value: "always-dark", label: "Luôn làm ánh sáng biến mất" },
    ],
    answers: ["recombine", "reduce"], explanation: "Lăng kính thứ hai có thể bù độ lệch và tổng hợp lại các thành phần màu.",
  },
  {
    id: "p3-dispersion", topic: "prism", difficulty: 3, kind: "single",
    context: "Vật liệu A có n tím − n đỏ = 0,02; vật liệu B có n tím − n đỏ = 0,08 với cùng hình dạng lăng kính.",
    prompt: "Lăng kính nào tạo dải màu rộng hơn?",
    choices: [
      { value: "b", label: "B, vì chiết suất thay đổi theo màu nhiều hơn" },
      { value: "a", label: "A, vì độ chênh chiết suất nhỏ hơn" },
      { value: "same", label: "Hai dải luôn rộng bằng nhau" },
      { value: "unknown", label: "Không thể so sánh dù hình dạng giống nhau" },
    ],
    answers: ["b"], explanation: "Độ chênh chiết suất giữa các màu càng lớn thì độ chênh lệch góc lệch càng lớn.",
  },
  {
    id: "p3-isolate-green", topic: "prism", difficulty: 3, kind: "single",
    prompt: "Muốn lấy riêng ánh sáng xanh lục từ chùm trắng, cách bố trí nào hợp lí nhất?",
    choices: [
      { value: "prism-slit", label: "Tán sắc bằng lăng kính rồi đặt khe tại vị trí dải xanh lục" },
      { value: "slit-prism", label: "Chỉ đặt một khe trước lăng kính và bỏ màn chọn màu" },
      { value: "mirror", label: "Phản xạ chùm trắng bằng gương phẳng" },
      { value: "water", label: "Cho chùm trắng truyền vuông góc qua tấm kính" },
    ],
    answers: ["prism-slit"], explanation: "Lăng kính tách các màu theo vị trí; khe sau lăng kính chọn riêng vùng xanh lục.",
  },
  {
    id: "p3-deviation-factors", topic: "prism", difficulty: 3, kind: "multiple",
    prompt: "Trong một thí nghiệm lăng kính, những yếu tố nào có thể làm góc lệch của tia thay đổi?",
    choices: [
      { value: "color", label: "Màu của ánh sáng" },
      { value: "material", label: "Vật liệu làm lăng kính" },
      { value: "geometry", label: "Góc chiết quang hoặc góc tới" },
      { value: "brightness", label: "Độ sáng của màn quan sát" },
    ],
    answers: ["color", "material", "geometry"], explanation: "Góc lệch phụ thuộc chiết suất, màu và hình học đường truyền; độ sáng màn không đổi hướng tia.",
  },

  {
    id: "c1-red-object", topic: "color", difficulty: 1, kind: "single",
    prompt: "Dưới ánh sáng trắng, vì sao mắt nhìn thấy một vật màu đỏ?",
    choices: [
      { value: "reflect", label: "Vật phản xạ tốt ánh sáng đỏ vào mắt" },
      { value: "emit", label: "Vật luôn tự phát ra ánh sáng đỏ" },
      { value: "eye", label: "Mắt tự đổi mọi ánh sáng thành đỏ" },
      { value: "none", label: "Không có ánh sáng nào từ vật tới mắt" },
    ],
    answers: ["reflect"], explanation: "Mắt nhận phần ánh sáng đỏ do vật phản xạ nên ta cảm nhận vật có màu đỏ.",
  },
  {
    id: "c1-white-blue", topic: "color", difficulty: 1, kind: "single",
    prompt: "Một tờ giấy trắng được chiếu chỉ bằng ánh sáng xanh lam sẽ trông có màu gì?",
    choices: [
      { value: "blue", label: "Xanh lam" },
      { value: "white", label: "Trắng như dưới ánh sáng trắng" },
      { value: "red", label: "Đỏ" },
      { value: "black", label: "Đen hoàn toàn" },
    ],
    answers: ["blue"], explanation: "Giấy trắng phản xạ tốt ánh sáng chiếu tới; ở đây chỉ có ánh sáng xanh lam.",
  },
  {
    id: "c1-black", topic: "color", difficulty: 1, kind: "true-false",
    prompt: "Vật màu đen dưới ánh sáng trắng hấp thụ phần lớn ánh sáng nhìn thấy chiếu vào nó.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Rất ít ánh sáng được phản xạ từ vật đen tới mắt nên vật trông tối.",
  },
  {
    id: "c2-red-green", topic: "color", difficulty: 2, kind: "single",
    prompt: "Một vật chỉ phản xạ tốt ánh sáng đỏ được đặt dưới đèn xanh lục. Vật thường trông thế nào?",
    choices: [
      { value: "dark", label: "Rất tối hoặc gần đen" },
      { value: "red", label: "Đỏ sáng như dưới ánh sáng trắng" },
      { value: "green", label: "Xanh lục sáng" },
      { value: "white", label: "Trắng" },
    ],
    answers: ["dark"], explanation: "Nguồn không có thành phần đỏ để vật phản xạ tốt vào mắt.",
  },
  {
    id: "c2-yellow-surface", topic: "color", difficulty: 2, kind: "multiple",
    context: "Trong mô hình đơn giản, bề mặt vàng phản xạ tốt ánh sáng đỏ và lục, hấp thụ phần lớn ánh sáng lam.",
    prompt: "Chọn các nguồn làm bề mặt này trông sáng.",
    choices: [
      { value: "red", label: "Đèn đỏ" },
      { value: "green", label: "Đèn lục" },
      { value: "yellow", label: "Đèn vàng gồm đỏ và lục" },
      { value: "blue", label: "Đèn lam" },
    ],
    answers: ["red", "green", "yellow"], explanation: "Bề mặt vàng phản xạ đỏ và lục; dưới lam gần như không có phần ánh sáng được phản xạ tốt.",
  },
  {
    id: "c2-observations", topic: "color", difficulty: 2, kind: "multiple",
    prompt: "Chọn các mô tả đúng về màu sắc của vật không tự phát sáng.",
    choices: [
      { value: "source", label: "Màu quan sát phụ thuộc ánh sáng của nguồn" },
      { value: "surface", label: "Màu quan sát phụ thuộc khả năng phản xạ của bề mặt" },
      { value: "eye-light", label: "Phải có ánh sáng từ vật truyền đến mắt" },
      { value: "fixed", label: "Vật luôn có cùng màu dưới mọi nguồn sáng" },
    ],
    answers: ["source", "surface", "eye-light"], explanation: "Màu nhìn thấy là kết quả của nguồn sáng, bề mặt vật và ánh sáng thực sự tới mắt.",
  },
  {
    id: "c3-additive", topic: "color", difficulty: 3, kind: "single",
    context: "Hai đèn đỏ và lục có độ sáng phù hợp cùng chiếu lên một màn trắng.",
    prompt: "Vùng hai chùm sáng chồng lên nhau thường có màu gì?",
    choices: [
      { value: "yellow", label: "Vàng" },
      { value: "blue", label: "Xanh lam" },
      { value: "black", label: "Đen" },
      { value: "violet", label: "Tím" },
    ],
    answers: ["yellow"], explanation: "Đây là trộn ánh sáng theo phép cộng: đỏ và lục tạo cảm giác màu vàng.",
  },
  {
    id: "c3-yellow-blue", topic: "color", difficulty: 3, kind: "single",
    context: "Một bề mặt vàng chỉ phản xạ tốt đỏ và lục. Nguồn chiếu chỉ phát ánh sáng lam.",
    prompt: "Chuỗi suy luận nào đúng?",
    choices: [
      { value: "absorb-dark", label: "Bề mặt hấp thụ phần lớn tia lam → ít ánh sáng tới mắt → trông tối" },
      { value: "create-yellow", label: "Bề mặt tự tạo đỏ và lục → mắt vẫn thấy vàng" },
      { value: "reflect-blue", label: "Bề mặt phản xạ mạnh tia lam → mắt thấy xanh" },
      { value: "white", label: "Mắt cộng thêm màu còn thiếu → thấy trắng" },
    ],
    answers: ["absorb-dark"], explanation: "Vật không thể phản xạ thành phần màu mà nguồn không cung cấp và bề mặt không phản xạ tốt.",
  },
  {
    id: "c3-detective", topic: "color", difficulty: 3, kind: "multiple",
    context: "Một vật trông xanh lục dưới ánh sáng trắng nhưng gần như đen dưới nguồn đỏ đơn sắc.",
    prompt: "Chọn các kết luận phù hợp.",
    choices: [
      { value: "green-reflect", label: "Vật phản xạ tốt thành phần xanh lục" },
      { value: "red-poor", label: "Vật phản xạ kém ánh sáng đỏ" },
      { value: "need-source", label: "Màu nhìn thấy phụ thuộc phổ của nguồn chiếu" },
      { value: "emit", label: "Vật đang tự phát ra ánh sáng xanh lục mạnh" },
    ],
    answers: ["green-reflect", "red-poor", "need-source"], explanation: "Hai quan sát cho thấy bề mặt chọn lọc màu phản xạ và màu nguồn quyết định phần ánh sáng có thể tới mắt.",
  },

  {
    id: "r1-normal-perpendicular", topic: "refraction", difficulty: 1, kind: "true-false",
    prompt: "Pháp tuyến tại điểm tới vuông góc với mặt phân cách giữa hai môi trường.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Pháp tuyến là đường thẳng vuông góc với mặt phân cách tại đúng điểm tia sáng tới.",
  },
  {
    id: "r1-normal-incidence", topic: "refraction", difficulty: 1, kind: "single",
    prompt: "Tia sáng truyền từ không khí vào nước theo phương vuông góc với mặt nước. Cặp góc tới i và góc khúc xạ r là gì?",
    choices: [
      { value: "zero", label: "i = 0° và r = 0°" },
      { value: "ninety", label: "i = 90° và r = 90°" },
      { value: "mixed", label: "i = 0° và r = 90°" },
      { value: "unknown", label: "Không thể xác định" },
    ],
    answers: ["zero"], explanation: "Tia đi theo pháp tuyến nên không đổi hướng; cả hai góc đo với pháp tuyến đều bằng 0°.",
  },
  {
    id: "r2-ratio-calculate", topic: "refraction", difficulty: 2, kind: "single",
    context: "Trong một lần đo, sin i = 0,60 và sin r = 0,45.",
    prompt: "Tỉ số sin i / sin r gần bằng bao nhiêu?",
    choices: [
      { value: "1.33", label: "1,33" },
      { value: "0.75", label: "0,75" },
      { value: "1.05", label: "1,05" },
      { value: "2.25", label: "2,25" },
    ],
    answers: ["1.33"], explanation: "0,60 : 0,45 ≈ 1,33.",
  },
  {
    id: "r2-water-air-properties", topic: "refraction", difficulty: 2, kind: "multiple",
    prompt: "Tia sáng truyền xiên từ nước ra không khí và chưa xảy ra phản xạ toàn phần. Chọn các nhận định đúng.",
    choices: [
      { value: "faster", label: "Ánh sáng truyền nhanh hơn trong không khí" },
      { value: "away", label: "Tia khúc xạ lệch xa pháp tuyến" },
      { value: "frequency", label: "Tần số ánh sáng không đổi" },
      { value: "r-less", label: "Góc khúc xạ nhỏ hơn góc tới" },
    ],
    answers: ["faster", "away", "frequency"], explanation: "Sang môi trường chiết quang kém hơn, ánh sáng nhanh hơn và tia lệch xa pháp tuyến; tần số vẫn do nguồn quyết định.",
  },
  {
    id: "r3-graph-slopes", topic: "refraction", difficulty: 3, kind: "single",
    context: "Với tia đi từ không khí, đồ thị y = sin i theo x = sin r của môi trường A có hệ số góc 1,33; của B có hệ số góc 1,52.",
    prompt: "Kết luận nào phù hợp nhất?",
    choices: [
      { value: "b-higher", label: "B có chiết suất lớn hơn A" },
      { value: "a-higher", label: "A có chiết suất lớn hơn B" },
      { value: "same", label: "Hai môi trường có cùng chiết suất" },
      { value: "no-link", label: "Hệ số góc không liên quan đến chiết suất" },
    ],
    answers: ["b-higher"], explanation: "Khi tia đi từ không khí, hệ số góc sin i / sin r gần bằng chiết suất của môi trường khúc xạ.",
  },
  {
    id: "r3-parallel-slab", topic: "refraction", difficulty: 3, kind: "multiple",
    context: "Một tia sáng đi xiên từ không khí qua một bản kính có hai mặt song song rồi trở lại không khí.",
    prompt: "Chọn các nhận định đúng về tia ló cuối cùng.",
    choices: [
      { value: "parallel", label: "Tia ló song song với tia tới" },
      { value: "shift", label: "Tia ló có thể bị dịch ngang so với tia tới" },
      { value: "frequency", label: "Tần số ánh sáng không đổi trong cả quá trình" },
      { value: "toward", label: "Tia ló cuối cùng luôn gần pháp tuyến hơn tia tới" },
    ],
    answers: ["parallel", "shift", "frequency"], explanation: "Hai mặt song song làm độ lệch góc ở mặt ra bù lại mặt vào; tia ló song song nhưng có thể bị dịch ngang.",
  },

  {
    id: "t1-air-glass-impossible", topic: "tir", difficulty: 1, kind: "true-false",
    prompt: "Tia sáng truyền từ không khí vào thủy tinh không thể xảy ra phản xạ toàn phần tại mặt phân cách đó.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Phản xạ toàn phần chỉ có thể xảy ra khi tia đi từ môi trường chiết quang hơn sang môi trường kém chiết quang hơn.",
  },
  {
    id: "t1-less-than-critical", topic: "tir", difficulty: 1, kind: "single",
    prompt: "Tia đi từ thủy tinh ra không khí với góc tới nhỏ hơn góc giới hạn. Hiện tượng nào phù hợp?",
    choices: [
      { value: "refract", label: "Vẫn có tia khúc xạ truyền ra ngoài" },
      { value: "tir", label: "Chỉ có phản xạ toàn phần" },
      { value: "stop", label: "Tia sáng dừng tại mặt phân cách" },
      { value: "absorb", label: "Toàn bộ ánh sáng bị hấp thụ" },
    ],
    answers: ["refract"], explanation: "Khi i chưa vượt góc giới hạn, điều kiện phản xạ toàn phần chưa được thỏa mãn.",
  },
  {
    id: "t2-critical-160", topic: "tir", difficulty: 2, kind: "single",
    context: "Tia sáng đi từ môi trường có n₁ = 1,60 ra không khí có n₂ = 1,00.",
    prompt: "Sin của góc giới hạn bằng bao nhiêu?",
    choices: [
      { value: "0.625", label: "0,625" },
      { value: "1.60", label: "1,60" },
      { value: "0.60", label: "0,60" },
      { value: "2.60", label: "2,60" },
    ],
    answers: ["0.625"], explanation: "sin i giới hạn = n₂/n₁ = 1,00/1,60 = 0,625.",
  },
  {
    id: "t2-mirror-compare", topic: "tir", difficulty: 2, kind: "multiple",
    prompt: "Chọn các đặc điểm đúng của phản xạ toàn phần so với phản xạ trên gương thường.",
    choices: [
      { value: "transparent", label: "Có thể xảy ra tại mặt phân cách của hai môi trường trong suốt" },
      { value: "no-coating", label: "Không cần lớp kim loại phản xạ" },
      { value: "no-transmitted", label: "Khi đủ điều kiện, không còn tia khúc xạ truyền sang môi trường kia" },
      { value: "any-direction", label: "Xảy ra với mọi chiều truyền và mọi góc tới" },
    ],
    answers: ["transparent", "no-coating", "no-transmitted"], explanation: "Phản xạ toàn phần là hiện tượng tại mặt phân cách trong suốt, có điều kiện xác định và lí tưởng không có tia truyền qua.",
  },
  {
    id: "t3-threshold-test", topic: "tir", difficulty: 3, kind: "single",
    context: "Tia đi từ môi trường n₁ = 1,50 sang n₂ = 1,20. Tại một thời điểm, sin i = 0,85.",
    prompt: "Hiện tượng nào xảy ra tại mặt phân cách?",
    choices: [
      { value: "tir", label: "Phản xạ toàn phần vì 0,85 > 1,20/1,50" },
      { value: "refract", label: "Có tia khúc xạ vì 0,85 < 1,20/1,50" },
      { value: "critical", label: "Tia khúc xạ đi sát mặt phân cách" },
      { value: "unknown", label: "Không thể kết luận từ các dữ kiện" },
    ],
    answers: ["tir"], explanation: "Sin góc giới hạn = 1,20/1,50 = 0,80; sin i = 0,85 lớn hơn nên i vượt góc giới hạn.",
  },
  {
    id: "t3-fiber-design", topic: "tir", difficulty: 3, kind: "multiple",
    prompt: "Một sợi quang muốn giữ ánh sáng trong lõi bằng phản xạ toàn phần cần những điều kiện thiết kế nào?",
    choices: [
      { value: "core-index", label: "Chiết suất lõi lớn hơn chiết suất lớp vỏ" },
      { value: "angle", label: "Tia trong lõi tới mặt lõi–vỏ với góc đủ lớn" },
      { value: "transparent", label: "Lõi và vỏ cho ánh sáng truyền qua với hao phí nhỏ" },
      { value: "coat-higher", label: "Chiết suất lớp vỏ phải lớn hơn chiết suất lõi" },
    ],
    answers: ["core-index", "angle", "transparent"], explanation: "Lõi chiết quang hơn vỏ và góc tới vượt giới hạn giúp ánh sáng phản xạ toàn phần liên tiếp trong lõi.",
  },

  {
    id: "p1-white-components", topic: "prism", difficulty: 1, kind: "true-false",
    prompt: "Ánh sáng trắng là hỗn hợp của nhiều ánh sáng màu khác nhau.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Lăng kính làm các thành phần màu lệch khác nhau và bộc lộ dải màu vốn có trong ánh sáng trắng.",
  },
  {
    id: "p1-not-create-color", topic: "prism", difficulty: 1, kind: "single",
    prompt: "Nhận định nào đúng nhất về vai trò của lăng kính khi tán sắc ánh sáng trắng?",
    choices: [
      { value: "separate", label: "Lăng kính tách các thành phần màu có sẵn trong ánh sáng trắng" },
      { value: "create", label: "Lăng kính tự tạo ra các màu mới" },
      { value: "paint", label: "Màu xuất hiện do lớp sơn bên trong lăng kính" },
      { value: "screen", label: "Màn hứng phát ra dải màu" },
    ],
    answers: ["separate"], explanation: "Tán sắc là sự phân tách các thành phần màu do chúng bị khúc xạ khác nhau.",
  },
  {
    id: "p2-speed-calculate", topic: "prism", difficulty: 2, kind: "single",
    context: "Tốc độ ánh sáng trong chân không c = 3,0 × 10⁸ m/s. Một loại thủy tinh có chiết suất n = 1,50.",
    prompt: "Tốc độ ánh sáng trong thủy tinh gần bằng bao nhiêu?",
    choices: [
      { value: "2e8", label: "2,0 × 10⁸ m/s" },
      { value: "3e8", label: "3,0 × 10⁸ m/s" },
      { value: "4.5e8", label: "4,5 × 10⁸ m/s" },
      { value: "0.5e8", label: "0,5 × 10⁸ m/s" },
    ],
    answers: ["2e8"], explanation: "v = c/n = 3,0 × 10⁸ : 1,50 = 2,0 × 10⁸ m/s.",
  },
  {
    id: "p2-red-violet-relations", topic: "prism", difficulty: 2, kind: "multiple",
    context: "Trong cùng một lăng kính, chiết suất đối với tia tím lớn hơn đối với tia đỏ.",
    prompt: "Chọn các hệ quả đúng.",
    choices: [
      { value: "violet-slower", label: "Tia tím truyền chậm hơn tia đỏ" },
      { value: "violet-more", label: "Tia tím thường lệch nhiều hơn tia đỏ" },
      { value: "red-faster", label: "Tia đỏ truyền nhanh hơn tia tím" },
      { value: "same", label: "Hai tia có cùng tốc độ và độ lệch" },
    ],
    answers: ["violet-slower", "violet-more", "red-faster"], explanation: "Vì v = c/n, chiết suất lớn hơn làm tia tím chậm hơn và bị khúc xạ mạnh hơn.",
  },
  {
    id: "p3-material-choice", topic: "prism", difficulty: 3, kind: "single",
    context: "Hai lăng kính có cùng hình dạng. Với A: n đỏ = 1,50, n tím = 1,53. Với B: n đỏ = 1,61, n tím = 1,62.",
    prompt: "Muốn dải màu tách rộng hơn, nên chọn lăng kính nào?",
    choices: [
      { value: "a", label: "A, vì độ chênh chiết suất giữa tím và đỏ lớn hơn" },
      { value: "b", label: "B, vì chiết suất trung bình lớn hơn" },
      { value: "same", label: "Hai lăng kính cho dải rộng bằng nhau" },
      { value: "none", label: "Không lăng kính nào tán sắc" },
    ],
    answers: ["a"], explanation: "A có n tím − n đỏ = 0,03, lớn hơn 0,01 của B nên phân tách hai màu mạnh hơn.",
  },
  {
    id: "p3-experiment-design", topic: "prism", difficulty: 3, kind: "multiple",
    prompt: "Chọn các thao tác phù hợp để quan sát và so sánh độ tán sắc của hai lăng kính.",
    choices: [
      { value: "narrow", label: "Dùng chùm sáng trắng hẹp" },
      { value: "screen", label: "Hứng dải màu trên màn và đo khoảng cách giữa đỏ–tím" },
      { value: "control", label: "Giữ cùng góc tới và khoảng cách tới màn" },
      { value: "many-vars", label: "Đồng thời đổi nguồn, góc tới và vị trí màn cho mỗi lăng kính" },
    ],
    answers: ["narrow", "screen", "control"], explanation: "Chùm hẹp, phép đo trên màn và kiểm soát các điều kiện giúp so sánh riêng ảnh hưởng của vật liệu lăng kính.",
  },

  {
    id: "c1-needs-light", topic: "color", difficulty: 1, kind: "true-false",
    prompt: "Muốn nhìn thấy một vật không tự phát sáng, phải có ánh sáng từ vật truyền đến mắt.",
    choices: trueFalseChoices, answers: ["true"], explanation: "Mắt chỉ nhận biết vật khi nhận được ánh sáng do vật phản xạ hoặc truyền tới.",
  },
  {
    id: "c1-green-white", topic: "color", difficulty: 1, kind: "single",
    prompt: "Dưới ánh sáng trắng, một chiếc lá trông xanh lục chủ yếu vì sao?",
    choices: [
      { value: "reflect-green", label: "Lá phản xạ tốt ánh sáng xanh lục tới mắt" },
      { value: "emit", label: "Lá tự phát ra ánh sáng xanh lục" },
      { value: "eye", label: "Mắt biến mọi ánh sáng thành xanh lục" },
      { value: "no-light", label: "Không có ánh sáng từ lá tới mắt" },
    ],
    answers: ["reflect-green"], explanation: "Ánh sáng trắng có thành phần xanh lục và bề mặt lá phản xạ thành phần này tốt hơn tới mắt.",
  },
  {
    id: "c2-magenta-green", topic: "color", difficulty: 2, kind: "single",
    context: "Trong mô hình đơn giản, bề mặt màu đỏ tía phản xạ tốt ánh sáng đỏ và lam nhưng hấp thụ phần lớn ánh sáng lục.",
    prompt: "Bề mặt này thường trông thế nào dưới nguồn xanh lục đơn sắc?",
    choices: [
      { value: "dark", label: "Rất tối hoặc gần đen" },
      { value: "magenta", label: "Đỏ tía sáng" },
      { value: "green", label: "Xanh lục sáng" },
      { value: "white", label: "Trắng" },
    ],
    answers: ["dark"], explanation: "Nguồn chỉ cung cấp ánh sáng lục nhưng bề mặt hấp thụ phần lớn thành phần này nên rất ít ánh sáng tới mắt.",
  },
  {
    id: "c2-color-filters", topic: "color", difficulty: 2, kind: "multiple",
    prompt: "Chọn các nhận định đúng về kính lọc màu lí tưởng.",
    choices: [
      { value: "transmit", label: "Cho ánh sáng gần màu của kính truyền qua tốt" },
      { value: "absorb", label: "Hấp thụ phần lớn các màu khác" },
      { value: "overlap", label: "Hai kính lọc khác màu chồng lên nhau có thể làm chùm ló rất tối" },
      { value: "create", label: "Tự tạo ra màu mới không có trong chùm tới" },
    ],
    answers: ["transmit", "absorb", "overlap"], explanation: "Kính lọc chọn lọc thành phần ánh sáng truyền qua; nó không tự sinh ra màu còn thiếu.",
  },
  {
    id: "c3-red-blue-additive", topic: "color", difficulty: 3, kind: "single",
    context: "Một đèn đỏ và một đèn xanh lam cùng chiếu lên vùng giống nhau của màn trắng.",
    prompt: "Nếu hai chùm có độ sáng phù hợp, vùng chồng nhau thường được nhìn thấy có màu gì?",
    choices: [
      { value: "magenta", label: "Đỏ tía" },
      { value: "yellow", label: "Vàng" },
      { value: "green", label: "Xanh lục" },
      { value: "black", label: "Đen" },
    ],
    answers: ["magenta"], explanation: "Trong phép cộng ánh sáng, đỏ kết hợp với xanh lam tạo cảm giác màu đỏ tía.",
  },
  {
    id: "c3-observation-chain", topic: "color", difficulty: 3, kind: "multiple",
    context: "Một áo xanh lam được đặt trên sân khấu và lần lượt chiếu bằng đèn trắng rồi đèn đỏ đơn sắc.",
    prompt: "Chọn các suy luận hợp lí.",
    choices: [
      { value: "white-blue", label: "Dưới đèn trắng, áo có thể phản xạ xanh lam tốt nên trông xanh" },
      { value: "red-dark", label: "Dưới đèn đỏ, áo có thể trông rất tối nếu phản xạ đỏ kém" },
      { value: "source-surface", label: "Màu quan sát phụ thuộc cả nguồn chiếu và bề mặt áo" },
      { value: "always-blue", label: "Áo chắc chắn luôn xanh như nhau dưới mọi nguồn" },
    ],
    answers: ["white-blue", "red-dark", "source-surface"], explanation: "Ánh sáng tới mắt là phần nguồn cung cấp được bề mặt phản xạ; thay nguồn có thể làm màu quan sát thay đổi mạnh.",
  },
] as const;

const topicOrder: readonly OpticsReviewTopic[] = ["refraction", "tir", "prism", "color"];

export function createEmptyOpticsReviewAnswers(): OpticsReviewAnswers {
  return { questionIds: [], responses: {}, checkedQuestionIds: [], currentIndex: 0 };
}

export function getOpticsReviewQuestion(id: string) {
  return opticsReviewQuestions.find((question) => question.id === id);
}

function normalizedResponse(response: unknown) {
  if (Array.isArray(response)) return [...new Set(response.filter((item): item is string => typeof item === "string"))].sort();
  return typeof response === "string" && response ? [response] : [];
}

export function isOpticsReviewResponseAnswered(response: unknown) {
  return normalizedResponse(response).length > 0;
}

export function isOpticsReviewAnswerCorrect(question: OpticsReviewQuestion, response: unknown) {
  const actual = normalizedResponse(response);
  const expected = [...question.answers].sort();
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

export function getNextOpticsReviewDifficulty(questionIds: string[], responses: Record<string, unknown>): OpticsReviewDifficulty {
  let level: OpticsReviewDifficulty = 2;
  let correctStreak = 0;
  questionIds.forEach((id) => {
    const question = getOpticsReviewQuestion(id);
    if (!question || !isOpticsReviewResponseAnswered(responses[id])) return;
    if (isOpticsReviewAnswerCorrect(question, responses[id])) {
      correctStreak += 1;
      if (correctStreak >= 2 && level < 3) {
        level = (level + 1) as OpticsReviewDifficulty;
        correctStreak = 0;
      }
    } else {
      level = Math.max(1, level - 1) as OpticsReviewDifficulty;
      correctStreak = 0;
    }
  });
  return level;
}

export function pickOpticsReviewQuestion(studentNumber: number, questionIndex: number, difficulty: OpticsReviewDifficulty, usedIds: string[]) {
  const topic = topicOrder[questionIndex % topicOrder.length];
  const matching = opticsReviewQuestions.filter((question) => question.topic === topic && question.difficulty === difficulty && !usedIds.includes(question.id));
  const fallback = opticsReviewQuestions.filter((question) => question.topic === topic && !usedIds.includes(question.id));
  const candidates = matching.length ? matching : fallback;
  const seed = Math.abs(studentNumber * 17 + questionIndex * 11 + difficulty * 7);
  return candidates[seed % candidates.length];
}

export function getOpticsReviewMasteryLabel(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Chưa xác định";
  const answers = value as Record<string, unknown>;
  const ids = Array.isArray(answers.questionIds) ? answers.questionIds.filter((item): item is string => typeof item === "string") : [];
  const responses = answers.responses && typeof answers.responses === "object" && !Array.isArray(answers.responses)
    ? answers.responses as Record<string, unknown>
    : {};
  const highest = ids.reduce<OpticsReviewDifficulty | 0>((current, id) => {
    const question = getOpticsReviewQuestion(id);
    return question && isOpticsReviewAnswerCorrect(question, responses[id]) ? Math.max(current, question.difficulty) as OpticsReviewDifficulty : current;
  }, 0);
  return highest ? opticsReviewLevels[highest].shortLabel : "Đang củng cố";
}
