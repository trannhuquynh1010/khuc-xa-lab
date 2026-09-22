export const LENS_PRACTICE_QUESTION_COUNT = 10;

export type LensPracticeQuestionKind = "true-false" | "single";
export type LensPracticeResponse = string;

export type LensPracticeQuestion = {
  id: string;
  kind: LensPracticeQuestionKind;
  prompt: string;
  context?: string;
  choices: ReadonlyArray<{ value: string; label: string }>;
  answer: string;
  explanation: string;
};

export type LensPracticeAnswers = {
  responses: Record<string, LensPracticeResponse>;
};

const trueFalseChoices = [
  { value: "true", label: "Đúng" },
  { value: "false", label: "Sai" },
] as const;

export const lensPracticeQuestions: readonly LensPracticeQuestion[] = [
  {
    id: "lp-optical-center",
    kind: "single",
    prompt: "Quang tâm O của thấu kính có đặc điểm nào sau đây?",
    choices: [
      { value: "straight", label: "Tia sáng tới quang tâm truyền thẳng, không đổi hướng" },
      { value: "converge", label: "Mọi tia tới quang tâm đều hội tụ tại tiêu điểm" },
      { value: "reflect", label: "Tia tới quang tâm bị phản xạ trở lại" },
      { value: "edge", label: "Quang tâm luôn nằm ở mép ngoài của thấu kính" },
    ],
    answer: "straight",
    explanation: "Tia sáng đi qua quang tâm O truyền thẳng, không bị đổi hướng.",
  },
  {
    id: "lp-principal-axis",
    kind: "true-false",
    prompt: "Trục chính của thấu kính là đường thẳng đi qua quang tâm O và vuông góc với mặt thấu kính.",
    choices: trueFalseChoices,
    answer: "true",
    explanation: "Trục chính đi qua quang tâm O, vuông góc với mặt thấu kính tại O.",
  },
  {
    id: "lp-focus-parallel-converging",
    kind: "single",
    prompt: "Chiếu một tia sáng song song với trục chính vào thấu kính hội tụ. Sau khi qua thấu kính, tia sáng sẽ:",
    choices: [
      { value: "focus", label: "Đi qua tiêu điểm chính F′" },
      { value: "parallel", label: "Vẫn truyền song song với trục chính" },
      { value: "diverge", label: "Loe ra xa trục chính" },
      { value: "stop", label: "Dừng lại tại quang tâm" },
    ],
    answer: "focus",
    explanation: "Với thấu kính hội tụ, tia tới song song trục chính cho tia ló đi qua tiêu điểm chính F′.",
  },
  {
    id: "lp-focus-parallel-diverging",
    kind: "single",
    prompt: "Chiếu một tia sáng song song với trục chính vào thấu kính phân kì. Đường kéo dài của tia ló sẽ:",
    choices: [
      { value: "through-f", label: "Đi qua tiêu điểm chính F (cùng phía với tia tới)" },
      { value: "through-fprime", label: "Đi qua tiêu điểm chính F′ (khác phía với tia tới)" },
      { value: "axis", label: "Trùng với trục chính" },
      { value: "center", label: "Đi qua quang tâm O" },
    ],
    answer: "through-f",
    explanation: "Ở thấu kính phân kì, tia tới song song trục chính cho tia ló loe ra sao cho đường kéo dài đi qua tiêu điểm F cùng phía với tia tới.",
  },
  {
    id: "lp-focal-length-def",
    kind: "single",
    prompt: "Tiêu cự f của thấu kính là khoảng cách từ:",
    choices: [
      { value: "o-to-f", label: "Quang tâm O đến tiêu điểm chính" },
      { value: "f-to-fprime", label: "Tiêu điểm F đến tiêu điểm F′" },
      { value: "edge-to-o", label: "Mép thấu kính đến quang tâm O" },
      { value: "object-to-o", label: "Vật đến quang tâm O" },
    ],
    answer: "o-to-f",
    explanation: "Tiêu cự f = OF = OF′, là khoảng cách từ quang tâm đến một tiêu điểm chính.",
  },
  {
    id: "lp-converging-shape",
    kind: "single",
    prompt: "Đặc điểm hình dạng nào giúp nhận biết thấu kính hội tụ (phần rìa mỏng)?",
    choices: [
      { value: "thick-center", label: "Phần giữa dày hơn phần mép" },
      { value: "thick-edge", label: "Phần mép dày hơn phần giữa" },
      { value: "flat", label: "Hai mặt đều là mặt phẳng song song" },
      { value: "equal", label: "Độ dày đều nhau ở mọi vị trí" },
    ],
    answer: "thick-center",
    explanation: "Thấu kính hội tụ thường có phần giữa dày hơn phần mép (rìa mỏng).",
  },
  {
    id: "lp-diverging-symbol",
    kind: "single",
    prompt: "Trong hình vẽ quang học, thấu kính phân kì được kí hiệu bằng đường thẳng có hai đầu mũi tên hướng:",
    choices: [
      { value: "inward", label: "Chụm vào trong" },
      { value: "outward", label: "Choãi ra ngoài" },
      { value: "up", label: "Hướng lên trên" },
      { value: "down", label: "Hướng xuống dưới" },
    ],
    answer: "outward",
    explanation: "Kí hiệu thấu kính phân kì có hai đầu mũi tên choãi ra ngoài; thấu kính hội tụ có hai đầu mũi tên chụm vào trong.",
  },
  {
    id: "lp-through-center-ray",
    kind: "true-false",
    prompt: "Đối với cả thấu kính hội tụ và phân kì, tia sáng tới quang tâm O đều cho tia ló truyền thẳng, không đổi hướng.",
    choices: trueFalseChoices,
    answer: "true",
    explanation: "Đây là tính chất chung của quang tâm, không phụ thuộc thấu kính là hội tụ hay phân kì.",
  },
  {
    id: "lp-two-focal-points",
    kind: "true-false",
    prompt: "Mỗi thấu kính có hai tiêu điểm chính F và F′ nằm đối xứng nhau qua quang tâm O trên trục chính.",
    choices: trueFalseChoices,
    answer: "true",
    explanation: "F và F′ đối xứng qua O, với OF = OF′ = f.",
  },
  {
    id: "lp-image-real-object-outside-f",
    kind: "single",
    prompt: "Đặt vật ngoài khoảng tiêu cự của thấu kính hội tụ (d > f). Ảnh thu được qua thấu kính là:",
    choices: [
      { value: "real-inverted", label: "Ảnh thật, ngược chiều với vật" },
      { value: "virtual-upright", label: "Ảnh ảo, cùng chiều với vật" },
      { value: "real-upright", label: "Ảnh thật, cùng chiều với vật" },
      { value: "no-image", label: "Không tạo được ảnh" },
    ],
    answer: "real-inverted",
    explanation: "Khi vật đặt ngoài khoảng tiêu cự của thấu kính hội tụ, ảnh thu được luôn là ảnh thật, ngược chiều với vật.",
  },
];

export function getLensPracticeQuestion(id: string): LensPracticeQuestion | undefined {
  return lensPracticeQuestions.find((question) => question.id === id);
}

export function createEmptyLensPracticeAnswers(): LensPracticeAnswers {
  return { responses: {} };
}

export function isLensPracticeAnswerCorrect(question: LensPracticeQuestion | undefined, response: unknown): boolean {
  if (!question) return false;
  return typeof response === "string" && response === question.answer;
}
