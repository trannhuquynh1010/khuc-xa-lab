import { NextResponse } from "next/server";
import { isRefractionQuizClassName, isStudentNumber } from "@/lib/classes";
import { createRefractionQuizSubmission, DuplicateRefractionQuizSubmissionError, isActivityOpen } from "@/lib/db";
import { isRefractionQuizAnswers, scoreRefractionQuiz } from "@/lib/refraction-quiz-score";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    if (!(await isActivityOpen("refraction"))) {
      return NextResponse.json({ error: "Giáo viên đã đóng bài Khúc xạ ánh sáng." }, { status: 403 });
    }
    if (!isRefractionQuizClassName(body.className)) {
      return NextResponse.json({ error: "Hãy chọn một trong các lớp 9H04, 9H05, 9H08 hoặc 9H09." }, { status: 400 });
    }
    if (!isStudentNumber(body.studentNumber)) {
      return NextResponse.json({ error: "Hãy chọn STT từ 01 đến 33." }, { status: 400 });
    }
    if (!isRefractionQuizAnswers(body.answers)) {
      return NextResponse.json({ error: "Hãy hoàn thành tất cả câu hỏi trước khi chấm điểm." }, { status: 400 });
    }

    const evaluation = scoreRefractionQuiz(body.answers);
    const result = await createRefractionQuizSubmission({
      className: body.className,
      studentNumber: body.studentNumber,
      answers: body.answers,
      evaluation,
    });
    return NextResponse.json({ ok: true, evaluation, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateRefractionQuizSubmissionError) {
      return NextResponse.json({ error: "Lớp và STT này đã nộp bài. Mỗi học sinh chỉ được nộp một lần." }, { status: 409 });
    }
    console.error("Refraction quiz submission error", error);
    return NextResponse.json({ error: "Chưa thể lưu điểm. Hãy thử lại." }, { status: 500 });
  }
}
