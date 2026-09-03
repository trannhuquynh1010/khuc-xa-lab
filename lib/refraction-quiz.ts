export type TrueFalseAnswer = "true" | "false" | "";
export type RefractionSortBucket = "toward" | "away" | "";

export type RefractionQuizAnswers = {
  trueFalse: Record<string, TrueFalseAnswer>;
  phenomenon: string;
  refractiveIndex: string;
  sorting: Record<string, RefractionSortBucket>;
  statements: string[];
};

export const trueFalseQuestions = [
  { id: "angles-from-normal", text: "Góc tới và góc khúc xạ đều được đo từ pháp tuyến." },
  { id: "air-to-glass-away", text: "Từ không khí vào thủy tinh, tia khúc xạ lệch xa pháp tuyến." },
  { id: "same-plane", text: "Tia tới, tia khúc xạ và pháp tuyến cùng nằm trong một mặt phẳng." },
  { id: "higher-index-faster", text: "Môi trường có chiết suất lớn hơn thì ánh sáng truyền nhanh hơn." },
] as const;

export const phenomenonChoices = [
  { id: "chopstick-water", text: "Chiếc đũa cắm nghiêng trong cốc nước trông như bị gãy tại mặt nước." },
  { id: "plane-mirror", text: "Ta nhìn thấy ảnh của mình trong gương phẳng." },
  { id: "object-shadow", text: "Một vật tạo bóng khi chắn ánh sáng từ nguồn." },
] as const;

export const refractiveIndexChoices = [
  { id: "speed-c-over-1-5", text: "Ánh sáng truyền trong môi trường với tốc độ c/1,5." },
  { id: "speed-times-1-5", text: "Ánh sáng truyền trong môi trường nhanh gấp 1,5 lần chân không." },
  { id: "angle-always-1-5", text: "Góc khúc xạ luôn bằng 1,5 lần góc tới." },
] as const;

export const sortingItems = [
  { id: "air-water", text: "Không khí → nước" },
  { id: "water-air", text: "Nước → không khí" },
  { id: "air-glass", text: "Không khí → thủy tinh" },
  { id: "glass-air", text: "Thủy tinh → không khí" },
] as const;

export const refractionStatementChoices = [
  { id: "a", label: "A", text: "Có thể nói mặt phẳng tạo bởi tia tới và tia khúc xạ cũng là mặt phẳng tới." },
  { id: "b", label: "B", text: "Góc tới là góc tạo bởi tia tới và mặt phân cách." },
  { id: "c", label: "C", text: "Góc khúc xạ bao giờ cũng nhỏ hơn góc tới." },
  { id: "d", label: "D", text: "Khi tia sáng chiếu xiên từ không khí vào nước, góc tới luôn lớn hơn góc khúc xạ." },
  { id: "e", label: "E", text: "Góc khúc xạ tăng tỉ lệ thuận với góc tới." },
  { id: "f", label: "F", text: "Khi tia sáng chiếu vuông góc vào mặt phân cách giữa hai môi trường trong suốt, tia sáng truyền thẳng." },
] as const;

export function createEmptyRefractionQuizAnswers(): RefractionQuizAnswers {
  return {
    trueFalse: Object.fromEntries(trueFalseQuestions.map((question) => [question.id, ""])),
    phenomenon: "",
    refractiveIndex: "",
    sorting: Object.fromEntries(sortingItems.map((item) => [item.id, ""])),
    statements: [],
  };
}

export function countCompletedQuizItems(answers: RefractionQuizAnswers) {
  return [
    ...trueFalseQuestions.map((question) => answers.trueFalse[question.id]),
    answers.phenomenon,
    answers.refractiveIndex,
    ...sortingItems.map((item) => answers.sorting[item.id]),
    answers.statements.length ? "answered" : "",
  ].filter(Boolean).length;
}

export const refractionQuizItemCount = 11;
export const refractionQuizBonusThreshold = 10;
export const refractionQuizBonusPoint = 1;
