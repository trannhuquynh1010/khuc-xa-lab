import { NextResponse } from "next/server";
import { isRefractionQuizClassName, isStudentNumber } from "@/lib/classes";
import {
  createRefractionQuizSubmission,
  DuplicateRefractionQuizSubmissionError,
  getRefractionQuizSubmissionStatus,
  listActivitySettings,
} from "@/lib/db";
import { isRefractionQuizAnswers, scoreRefractionQuiz } from "@/lib/refraction-quiz-score";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const studentNumber = Number(searchParams.get("studentNumber"));
    if (!isRefractionQuizClassName(className)) {
      return NextResponse.json({ error: "Lớp không hợp lệ." }, { status: 400 });
    }
    if (!isStudentNumber(studentNumber)) {
      return NextResponse.json({ error: "STT không hợp lệ." }, { status: 400 });
    }
    const status = await getRefractionQuizSubmissionStatus(className, studentNumber);
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Refraction quiz status error", error);
    return NextResponse.json({ error: "Chưa thể kiểm tra bài nộp." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    const refractionSetting = (await listActivitySettings()).find((setting) => setting.key === "refraction");
    if (!refractionSetting?.isOpen) {
      return NextResponse.json({ error: "Giáo viên đã đóng bài Khúc xạ ánh sáng." }, { status: 403 });
    }
    if (!refractionSetting.applicationOpen) {
      return NextResponse.json({ error: "Giáo viên chưa mở bài vận dụng." }, { status: 403 });
    }
    if (!isRefractionQuizClassName(body.className)) {
      return NextResponse.json({ error: "Hãy chọn một trong các lớp 9H04, 9H05, 9H08 hoặc 9H09." }, { status: 400 });
    }
    if (!isStudentNumber(body.studentNumber)) {
      return NextResponse.json({ error: "Hãy chọn STT từ 01 đến 33." }, { status: 400 });
    }
    if (!isRefractionQuizAnswers(body.answers)) {
      return NextResponse.json({ error: "Hãy hoàn thành tất cả câu hỏi trước khi nộp bài." }, { status: 400 });
    }

    const evaluation = scoreRefractionQuiz(body.answers);
    const result = await createRefractionQuizSubmission({
      className: body.className,
      studentNumber: body.studentNumber,
      answers: body.answers,
      evaluation,
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateRefractionQuizSubmissionError) {
      return NextResponse.json({ error: "Lớp và STT này đã nộp bài. Mỗi học sinh chỉ được nộp một lần." }, { status: 409 });
    }
    console.error("Refraction quiz submission error", error);
    return NextResponse.json({ error: "Chưa thể lưu bài. Hãy thử lại." }, { status: 500 });
  }
}
