import { NextResponse } from "next/server";
import { isClassName } from "@/lib/classes";
import { createRefractionQuizSubmission, isActivityOpen } from "@/lib/db";
import { isRefractionQuizAnswers, scoreRefractionQuiz } from "@/lib/refraction-quiz-score";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    if (!(await isActivityOpen("refraction"))) {
      return NextResponse.json({ error: "Giáo viên đã đóng bài Khúc xạ ánh sáng." }, { status: 403 });
    }
    if (!isClassName(body.className)) {
      return NextResponse.json({ error: "Hãy chọn lớp ở mục 1." }, { status: 400 });
    }
    if (typeof body.studentName !== "string" || body.studentName.trim().length < 2 || body.studentName.trim().length > 100) {
      return NextResponse.json({ error: "Hãy nhập họ và tên học sinh." }, { status: 400 });
    }
    if (!isRefractionQuizAnswers(body.answers)) {
      return NextResponse.json({ error: "Hãy hoàn thành tất cả câu hỏi trước khi chấm điểm." }, { status: 400 });
    }

    const evaluation = scoreRefractionQuiz(body.answers);
    const result = await createRefractionQuizSubmission({
      className: body.className,
      studentName: body.studentName.trim().replace(/\s+/g, " "),
      answers: body.answers,
      evaluation,
    });
    return NextResponse.json({ ok: true, evaluation, ...result }, { status: 201 });
  } catch (error) {
    console.error("Refraction quiz submission error", error);
    return NextResponse.json({ error: "Chưa thể lưu điểm. Hãy thử lại." }, { status: 500 });
  }
}
