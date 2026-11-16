import "server-only";

import {
  HK1_REVIEW_QUESTION_COUNT,
  normalizeHk1ReviewAnswers,
  type Hk1ChoiceLetter,
  type Hk1QuestionStat,
  type Hk1ReviewStats,
  type Hk1StudentRow,
} from "@/lib/hk1-review";

/**
 * Đáp án 28 câu trắc nghiệm đề cương HK1 Lý 9 (năm học 26-27), theo thứ tự câu.
 * Sửa tại đây nếu đề in khác đề cương; mọi thống kê và điểm tự tính lại.
 */
const answerKey: Hk1ChoiceLetter[] = [
  "D", "B", "B", "D", "B", "A", "A", "C", "A", "B", // 1–10
  "A", "B", "A", "B", "B", "B", "A", "B", "A", "B", // 11–20
  "D", "A", "B", "A", "C", "A", "B", "C", //          21–28
];

if (answerKey.length !== HK1_REVIEW_QUESTION_COUNT) throw new Error("Đáp án HK1 phải đủ 28 câu.");

export function gradeHk1Review(value: unknown) {
  const { choices } = normalizeHk1ReviewAnswers(value);
  const answeredCount = choices.filter(Boolean).length;
  const correctCount = choices.filter((choice, index) => choice === answerKey[index]).length;
  return { answeredCount, correctCount, totalItems: HK1_REVIEW_QUESTION_COUNT, choices };
}

export function buildHk1ReviewStats(rows: Array<{ studentNumber: number; status: "draft" | "submitted"; forced: boolean; answers: unknown }>): Hk1ReviewStats {
  const students: Hk1StudentRow[] = [];
  const counted: Array<ReturnType<typeof gradeHk1Review>> = [];

  for (const row of rows) {
    const graded = gradeHk1Review(row.answers);
    const submitted = row.status === "submitted";
    // Bài thu tự động mà học sinh chưa nhập câu nào thì không tính vào thống kê,
    // để ô trống của bạn vắng mặt không kéo tụt tỉ lệ đúng của cả lớp.
    if (submitted && graded.answeredCount > 0) counted.push(graded);
    students.push({
      studentNumber: row.studentNumber,
      status: row.status,
      forced: row.forced,
      answered: graded.answeredCount,
      correct: submitted ? graded.correctCount : null,
    });
  }

  const participantCount = counted.length;
  const questions: Hk1QuestionStat[] = answerKey.map((correct, index) => {
    const counts = { A: 0, B: 0, C: 0, D: 0 } as Record<Hk1ChoiceLetter, number>;
    let blank = 0;
    for (const graded of counted) {
      const choice = graded.choices[index];
      if (choice) counts[choice] += 1;
      else blank += 1;
    }
    return {
      number: index + 1,
      correct,
      counts,
      blank,
      correctPercent: participantCount ? Math.round((counts[correct] / participantCount) * 100) : 0,
    };
  });

  return {
    participantCount,
    submittedCount: students.filter((student) => student.status === "submitted").length,
    draftCount: students.filter((student) => student.status === "draft").length,
    averageCorrect: participantCount ? counted.reduce((total, graded) => total + graded.correctCount, 0) / participantCount : null,
    questions,
    students: students.sort((left, right) => left.studentNumber - right.studentNumber),
  };
}
