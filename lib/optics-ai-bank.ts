import { opticsReviewQuestions } from "./optics-review";
import { type AiBankQuestion } from "./optics-ai-types";

// This lesson is a midterm review, not a first encounter: the anchors are
// written as "pick every correct statement" items rather than small drills.
// The two forms assess similar ideas but are not a validated equivalent test.
export const aiDiagnosticIds = ["ai-pre-sine", "ai-pre-tir", "ai-pre-prism", "ai-pre-filter"];
export const aiTransferIds = ["ai-post-sine", "ai-post-tir", "ai-post-prism", "ai-post-filter"];

// Light mixing is out of scope: students study the colour of objects under
// different light, not additive mixing of beams.
const excludedMixing = [
  "c3-additive",            // overlap of a red and a green beam
  "c3-red-blue-additive",   // overlap of a red and a blue beam
  "p2-two-prisms",          // recombining a spectrum back to white
  "c2-yellow-surface",      // one option defines a yellow lamp as red + green
];
// Near-duplicates of the four sealed pre/post anchors. Practising the anchor
// itself would teach the exact item the lesson uses to measure, so the
// diagnostic and transfer scores would stop describing anything.
const excludedAnchorTwins = [
  "t1-conditions",            // == ai-pre-tir, and keeps the old "lớn hơn góc giới hạn" wording
  "t1-air-glass-impossible",  // == the point of ai-post-tir
  "p1-cause",                 // == ai-pre-prism
  "p1-not-create-color",      // == ai-pre-prism
  "p1-mono",                  // == ai-post-prism
  "p2-red-filter",            // == ai-post-prism (red filter, then prism)
  "c2-color-filters",         // == ai-pre-filter / ai-post-filter
  "r1-air-glass",             // == ai-bend-into
];
const excludedFromLesson = new Set([...excludedMixing, ...excludedAnchorTwins]);

const anchors: AiBankQuestion[] = [
  {
    id: "ai-pre-sine", topic: "refraction", difficulty: 2, kind: "multiple",
    prompt: "Chọn tất cả các nhận định ĐÚNG về sự khúc xạ ánh sáng.",
    choices: [
      { value: "increase", label: "Với cùng hai môi trường, khi góc tới tăng thì góc khúc xạ cũng tăng" },
      { value: "ratio-angles", label: "Với cùng hai môi trường, tỉ số i/r luôn không đổi" },
      { value: "ratio-sines", label: "Với cùng hai môi trường, tỉ số sin i / sin r luôn không đổi" },
      { value: "perpendicular", label: "Tia sáng chiếu vuông góc với mặt phân cách thì truyền thẳng, không bị đổi hướng" },
      { value: "always-smaller", label: "Góc khúc xạ bao giờ cũng nhỏ hơn góc tới" },
    ],
    answers: ["increase", "ratio-sines", "perpendicular"],
    explanation: "Theo định luật khúc xạ, với cùng hai môi trường thì sin i / sin r là hằng số, còn tỉ số i/r nói chung thay đổi. Hai góc cùng tăng nhưng không tỉ lệ thuận. Tia tới vuông góc mặt phân cách (i = 0) thì truyền thẳng. Góc khúc xạ nhỏ hơn góc tới chỉ khi đi vào môi trường chiết quang hơn; đi theo chiều ngược lại thì lớn hơn.",
  },
  {
    id: "ai-post-sine", topic: "refraction", difficulty: 2, kind: "single",
    context: "Hai lần đo với cùng hai môi trường cho i/r lần lượt 1,52 và 1,61, nhưng sin i/sin r đều gần 1,50.",
    prompt: "Kết luận nào phù hợp nhất với dữ liệu?",
    choices: [
      { value: "angles", label: "i và r tỉ lệ thuận vì chúng cùng tăng" },
      { value: "sines", label: "Dữ liệu ủng hộ tỉ số sin i/sin r không đổi, không ủng hộ i/r không đổi" },
      { value: "equal", label: "i luôn bằng r" },
    ],
    answers: ["sines"],
    explanation: "Dữ liệu phân biệt rõ tỉ số của góc với tỉ số của sin các góc. Tỉ số sin i/sin r ổn định trong sai số đo, phù hợp định luật khúc xạ.",
  },
  {
    id: "ai-pre-tir", topic: "tir", difficulty: 2, kind: "multiple",
    prompt: "Chọn tất cả điều kiện cần để xảy ra phản xạ toàn phần ở mặt phân cách giữa hai môi trường trong suốt.",
    choices: [
      { value: "dense", label: "Tia sáng truyền từ môi trường chiết quang hơn sang môi trường chiết quang kém hơn" },
      { value: "angle", label: "Góc tới lớn hơn hoặc bằng góc giới hạn" },
      { value: "reverse", label: "Tia sáng truyền từ môi trường chiết quang kém sang môi trường chiết quang hơn" },
      { value: "any", label: "Chỉ cần góc tới đủ lớn, không cần xét chiều truyền giữa hai môi trường" },
    ],
    answers: ["dense", "angle"],
    explanation: "Phải thỏa mãn đồng thời hai điều kiện: tia sáng đi từ môi trường chiết quang hơn sang môi trường chiết quang kém hơn, và góc tới lớn hơn hoặc bằng góc giới hạn (sin i giới hạn = n₂/n₁). Chỉ riêng góc tới lớn thì chưa đủ.",
  },
  {
    id: "ai-post-tir", topic: "tir", difficulty: 2, kind: "single",
    context: "Tia A truyền trong thủy tinh ra không khí, góc tới 50°, góc giới hạn 42°. Tia B truyền từ không khí vào thủy tinh, góc tới 60°.",
    prompt: "Tia nào có thể xảy ra phản xạ toàn phần tại mặt phân cách?",
    choices: [
      { value: "a", label: "Chỉ tia A" },
      { value: "b", label: "Chỉ tia B vì góc tới lớn hơn" },
      { value: "both", label: "Cả hai tia" },
      { value: "neither", label: "Không tia nào" },
    ],
    answers: ["a"],
    explanation: "Tia A thỏa mãn cả hai điều kiện: truyền từ thủy tinh (chiết quang hơn) ra không khí, và góc tới 50° lớn hơn góc giới hạn 42°. Tia B truyền theo chiều ngược lại nên không bao giờ xảy ra phản xạ toàn phần, dù góc tới lớn.",
  },
  {
    id: "ai-pre-prism", topic: "prism", difficulty: 2, kind: "single",
    prompt: "Chiếu ánh sáng trắng qua lăng kính thấy một dải màu. Giải thích nào đúng?",
    choices: [
      { value: "create", label: "Lăng kính tạo thêm các ánh sáng màu chưa có trong ánh sáng trắng" },
      { value: "separate", label: "Các thành phần màu có sẵn trong ánh sáng trắng bị khúc xạ khác nhau" },
      { value: "eye", label: "Mắt tự tạo ra màu, các tia đều lệch như nhau" },
    ],
    answers: ["separate"],
    explanation: "Ánh sáng trắng gồm nhiều thành phần màu. Chiết suất của lăng kính phụ thuộc màu nên các thành phần bị lệch khác nhau, tạo dải màu; lăng kính không tạo thêm màu.",
  },
  {
    id: "ai-post-prism", topic: "prism", difficulty: 2, kind: "single",
    context: "Dùng kính lọc lí tưởng chỉ cho thành phần đỏ đi qua từ một chùm ánh sáng trắng, rồi cho chùm đỏ đó qua lăng kính.",
    prompt: "Dự đoán kết quả và chọn lý do đúng.",
    choices: [
      { value: "spectrum", label: "Thành dải nhiều màu vì lăng kính tạo màu" },
      { value: "red", label: "Chùm đỏ bị lệch nhưng không thành dải nhiều màu vì chỉ còn một thành phần màu" },
      { value: "straight", label: "Chùm đỏ luôn truyền thẳng vì ánh sáng đỏ không khúc xạ" },
    ],
    answers: ["red"],
    explanation: "Kính lọc đã loại các thành phần màu khác, chỉ còn thành phần đỏ. Lăng kính làm chùm đỏ khúc xạ và lệch đi, nhưng không thể tách nó thành dải nhiều màu vì không còn thành phần nào khác để tách.",
  },
  {
    id: "ai-pre-filter", topic: "color", difficulty: 2, kind: "single",
    context: "Ánh sáng trắng lần lượt đi qua kính lọc đỏ lí tưởng (chỉ truyền đỏ), rồi kính lọc xanh lục lí tưởng (chỉ truyền xanh lục).",
    prompt: "Màn phía sau cả hai kính lọc sẽ như thế nào?",
    choices: [
      { value: "dark", label: "Tối, vì thành phần đỏ còn lại bị kính xanh lục chặn" },
      { value: "white", label: "Trắng, vì nguồn ban đầu là ánh sáng trắng" },
      { value: "red", label: "Đỏ, vì kính lọc đỏ đặt trước nên quyết định màu" },
      { value: "green", label: "Xanh lục, vì kính lọc sau cùng quyết định màu" },
    ],
    answers: ["dark"],
    explanation: "Kính lọc chỉ cho một số thành phần màu đi qua và chặn phần còn lại; nó không tạo ra màu mới. Sau kính đỏ chỉ còn thành phần đỏ, và kính xanh lục không truyền đỏ, nên không còn ánh sáng nào tới màn.",
  },
  {
    id: "ai-post-filter", topic: "color", difficulty: 2, kind: "single",
    context: "Ánh sáng trắng lần lượt đi qua kính lọc xanh lam lí tưởng (chỉ truyền xanh lam), rồi kính lọc đỏ lí tưởng (chỉ truyền đỏ).",
    prompt: "Sau kính lọc thứ hai còn ánh sáng nào không?",
    choices: [
      { value: "none", label: "Không còn ánh sáng, vì kính đỏ chặn thành phần xanh lam còn lại" },
      { value: "red", label: "Còn ánh sáng đỏ, vì kính lọc đỏ tạo ra ánh sáng đỏ" },
      { value: "blue", label: "Còn ánh sáng xanh lam, vì kính lọc đầu đã quyết định màu" },
      { value: "white", label: "Trở lại ánh sáng trắng như nguồn ban đầu" },
    ],
    answers: ["none"],
    explanation: "Sau kính lọc đầu chỉ còn thành phần xanh lam. Kính lọc đỏ lí tưởng chỉ truyền đỏ nên chặn hết xanh lam. Kính lọc không phát thêm thành phần màu mới, vì vậy không còn ánh sáng nào đi qua.",
  },
];

// Extra review items requested for the midterm: which way the refracted ray
// bends, and how refraction shifts where we see things across a water surface.
const extraPractice: AiBankQuestion[] = [
  {
    id: "ai-bend-into", topic: "refraction", difficulty: 1, kind: "single",
    prompt: "Tia sáng truyền xiên từ không khí vào nước thì tia khúc xạ lệch thế nào so với pháp tuyến?",
    choices: [
      { value: "closer", label: "Lệch gần pháp tuyến hơn so với tia tới" },
      { value: "farther", label: "Lệch xa pháp tuyến hơn so với tia tới" },
      { value: "same", label: "Trùng với tia tới, không bị lệch" },
    ],
    answers: ["closer"],
    explanation: "Nước chiết quang hơn không khí. Khi ánh sáng đi vào môi trường chiết quang hơn, góc khúc xạ nhỏ hơn góc tới, nên tia khúc xạ lệch lại gần pháp tuyến.",
  },
  {
    id: "ai-bend-cases", topic: "refraction", difficulty: 2, kind: "multiple",
    prompt: "Chọn tất cả trường hợp mà tia khúc xạ lệch XA pháp tuyến hơn so với tia tới.",
    choices: [
      { value: "water-air", label: "Truyền xiên từ nước ra không khí" },
      { value: "glass-air", label: "Truyền xiên từ thủy tinh ra không khí" },
      { value: "air-water", label: "Truyền xiên từ không khí vào nước" },
      { value: "air-glass", label: "Truyền xiên từ không khí vào thủy tinh" },
    ],
    answers: ["water-air", "glass-air"],
    explanation: "Tia khúc xạ lệch xa pháp tuyến khi ánh sáng đi từ môi trường chiết quang hơn sang môi trường chiết quang kém hơn, tức là đi ra không khí. Khi đi vào nước hay thủy tinh thì ngược lại, tia lệch gần pháp tuyến.",
  },
  {
    id: "ai-see-pebble", topic: "refraction", difficulty: 2, kind: "single",
    context: "Từ trên bờ, ta nhìn một hòn sỏi nằm dưới đáy một bể nước trong.",
    prompt: "Ta thấy hòn sỏi ở đâu so với vị trí thật của nó, và vì sao?",
    choices: [
      { value: "shallower", label: "Thấy nông hơn vị trí thật, vì tia sáng từ sỏi bị khúc xạ khi ra khỏi mặt nước" },
      { value: "deeper", label: "Thấy sâu hơn vị trí thật, vì nước làm ánh sáng truyền chậm lại" },
      { value: "same", label: "Thấy đúng vị trí thật, vì nước trong suốt nên không ảnh hưởng" },
    ],
    answers: ["shallower"],
    explanation: "Tia sáng từ hòn sỏi đi từ nước ra không khí bị khúc xạ, lệch xa pháp tuyến. Mắt nhìn theo phương của tia đi tới mắt và kéo dài ngược lại, nên thấy ảnh ảo của hòn sỏi ở vị trí cao hơn, tức là bể trông nông hơn thực tế.",
  },
  {
    id: "ai-see-branch", topic: "refraction", difficulty: 3, kind: "single",
    context: "Một người lặn dưới nước, nhìn lên một cành cây ở phía trên mặt nước.",
    prompt: "So với vị trí thật, người đó thấy cành cây thế nào?",
    choices: [
      { value: "higher", label: "Thấy cành cây cao hơn vị trí thật" },
      { value: "lower", label: "Thấy cành cây thấp hơn vị trí thật" },
      { value: "same", label: "Thấy đúng vị trí thật vì ánh sáng truyền thẳng" },
    ],
    answers: ["higher"],
    explanation: "Tia sáng từ cành cây đi từ không khí vào nước nên lệch lại gần pháp tuyến. Mắt ở dưới nước nhìn theo phương tia tới mắt và kéo dài ngược lại, cho ảnh ảo nằm cao hơn vị trí thật của cành cây. Đây là trường hợp ngược với khi nhìn hòn sỏi từ trên bờ.",
  },
];

export function buildOpticsAiBank(): AiBankQuestion[] {
  const practice = (JSON.parse(JSON.stringify(opticsReviewQuestions)) as AiBankQuestion[])
    .filter(q => !excludedFromLesson.has(q.id));
  // Clarify the incidence condition in this lesson only; the standalone review
  // activity keeps its original wording and scoring.
  const properties = practice.find(q => q.id === "r2-properties");
  if (properties) properties.prompt = "Tia sáng truyền xiên từ không khí vào thủy tinh (0° < i < 90°). Chọn các nhận định đúng.";
  return [
    ...JSON.parse(JSON.stringify(anchors)) as AiBankQuestion[],
    ...JSON.parse(JSON.stringify(extraPractice)) as AiBankQuestion[],
    ...practice,
  ];
}
