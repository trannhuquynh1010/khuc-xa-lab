import { NextResponse } from "next/server";
import { isClassName, isRefractionQuizClassName, isStudentNumber } from "@/lib/classes";
import { createRefractionQuizSubmission, DuplicateRefractionQuizSubmissionError, getPracticeAttemptStatus, getRefractionQuizSubmissionStatus, listActivitySettings, savePracticeDraft, submitPracticeAttempt } from "@/lib/db";
import { scorePracticeAttempt } from "@/lib/practice-attempt-score";
import { getPracticeDefinition, isPracticeKey, type PracticeKey } from "@/lib/practice-attempt-types";
import { isRefractionQuizAnswers, scoreRefractionQuiz } from "@/lib/refraction-quiz-score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowedClass(practiceKey: PracticeKey, className: unknown): className is string {
  return practiceKey === "refraction-application" ? isRefractionQuizClassName(className) : isClassName(className);
}

async function isPracticeOpen(practiceKey: PracticeKey) {
  const setting = (await listActivitySettings()).find((item) => item.key === getPracticeDefinition(practiceKey).activityKey);
  if (!setting?.isOpen) return false;
  if (practiceKey === "refraction-application") return setting.applicationOpen;
  if (practiceKey === "current-voltage-practice") return setting.iuPracticeOpen;
  if (practiceKey === "ohm-law-practice") return setting.ohmLawPracticeOpen;
  return setting.resistanceFactorsPracticeOpen;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const practiceKey = searchParams.get("practiceKey");
    const className = searchParams.get("className");
    const studentNumber = Number(searchParams.get("studentNumber"));
    if (!isPracticeKey(practiceKey) || !isAllowedClass(practiceKey, className) || !isStudentNumber(studentNumber)) {
      return NextResponse.json({ error: "Thông tin bài làm chưa hợp lệ." }, { status: 400 });
    }
    if (practiceKey === "refraction-application") {
      const existingQuiz = await getRefractionQuizSubmissionStatus(className, studentNumber);
      if (existingQuiz.submitted) {
        return NextResponse.json({ ...existingQuiz, forced: false, completedCount: 16, totalItems: 16 }, { headers: { "Cache-Control": "no-store, max-age=0" } });
      }
    }
    const status = await getPracticeAttemptStatus(practiceKey, className, studentNumber);
    return NextResponse.json(status, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Practice attempt status error", error);
    return NextResponse.json({ error: "Chưa thể kiểm tra trạng thái bài làm." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });
    if (!isPracticeKey(body.practiceKey) || !isAllowedClass(body.practiceKey, body.className) || !isStudentNumber(body.studentNumber)) {
      return NextResponse.json({ error: "Hãy chọn đúng lớp và STT." }, { status: 400 });
    }
    if (body.mode !== "draft" && body.mode !== "submit") {
      return NextResponse.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
    }
    if (!body.answers || typeof body.answers !== "object" || JSON.stringify(body.answers).length > 100_000) {
      return NextResponse.json({ error: "Dữ liệu bài làm không hợp lệ." }, { status: 400 });
    }
    if (!(await isPracticeOpen(body.practiceKey))) {
      return NextResponse.json({ error: "Giáo viên đang đóng bài này." }, { status: 403 });
    }
    const evaluation = scorePracticeAttempt(body.practiceKey, body.answers);
    if (body.mode === "submit" && evaluation.completedCount < evaluation.totalItems) {
      return NextResponse.json({ error: `Còn ${evaluation.totalItems - evaluation.completedCount} ý chưa hoàn thành.` }, { status: 400 });
    }
    const input = { practiceKey: body.practiceKey, className: body.className, studentNumber: body.studentNumber, answers: body.answers };
    if (body.mode === "submit" && body.practiceKey === "refraction-application") {
      if (!isRefractionQuizAnswers(body.answers)) {
        return NextResponse.json({ error: "Hãy hoàn thành tất cả câu hỏi trước khi nộp bài." }, { status: 400 });
      }
      await createRefractionQuizSubmission({
        className: body.className,
        studentNumber: body.studentNumber,
        answers: body.answers,
        evaluation: scoreRefractionQuiz(body.answers),
      });
    }
    const status = body.mode === "submit" ? await submitPracticeAttempt(input) : await savePracticeDraft(input);
    return NextResponse.json({ ok: true, ...status }, { status: body.mode === "submit" ? 201 : 200 });
  } catch (error) {
    if (error instanceof DuplicateRefractionQuizSubmissionError) {
      return NextResponse.json({ error: "Lớp và STT này đã nộp bài. Mỗi học sinh chỉ được nộp một lần." }, { status: 409 });
    }
    console.error("Practice attempt save error", error);
    return NextResponse.json({ error: "Chưa thể lưu bài. Hãy thử lại." }, { status: 500 });
  }
}
