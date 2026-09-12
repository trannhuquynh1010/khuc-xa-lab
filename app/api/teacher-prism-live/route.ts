import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName } from "@/lib/classes";
import {
  closePrismLiveQuestion,
  createPrismLiveQuestion,
  deletePrismLiveQuestion,
  getPrismLiveQuestionResults,
  listPrismLiveQuestions,
  startPrismLiveQuestion,
} from "@/lib/db";
import { isPrismLiveQuestionType } from "@/lib/prism-live";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const schoolYear = searchParams.get("schoolYear");
  const className = searchParams.get("className");
  const questionId = searchParams.get("questionId");
  if (!isSchoolYear(schoolYear) || !isClassName(className) || (questionId !== null && !isUuid(questionId))) {
    return NextResponse.json({ error: "Bộ lọc chưa hợp lệ." }, { status: 400 });
  }
  if (questionId) {
    const result = await getPrismLiveQuestionResults(schoolYear, className, questionId);
    return NextResponse.json({ result, serverNow: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const questions = await listPrismLiveQuestions(schoolYear, className);
  return NextResponse.json({ questions, serverNow: new Date().toISOString() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  if (!(await isTeacherAuthenticated())) return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Dữ liệu chưa hợp lệ." }, { status: 400 });
  const action = body.action;
  const schoolYear = body.schoolYear;
  const className = body.className;
  if (!isSchoolYear(schoolYear) || !isClassName(className)) {
    return NextResponse.json({ error: "Lớp hoặc năm học chưa hợp lệ." }, { status: 400 });
  }

  try {
    if (action === "create") {
      if (!isPrismLiveQuestionType(body.type) || !Array.isArray(body.options)) {
        return NextResponse.json({ error: "Loại câu hỏi chưa hợp lệ." }, { status: 400 });
      }
      const question = await createPrismLiveQuestion({
        schoolYear,
        className,
        type: body.type,
        prompt: typeof body.prompt === "string" ? body.prompt : "",
        options: body.options.filter((option): option is string => typeof option === "string"),
        durationSeconds: Number(body.durationSeconds),
      });
      return NextResponse.json({ question });
    }

    if (!isUuid(body.questionId)) return NextResponse.json({ error: "Câu hỏi chưa hợp lệ." }, { status: 400 });
    if (action === "start") {
      if (schoolYear !== getCurrentSchoolYear()) return NextResponse.json({ error: "Chỉ có thể chạy câu hỏi trong năm học hiện tại." }, { status: 409 });
      const question = await startPrismLiveQuestion(schoolYear, className, body.questionId);
      if (!question) return NextResponse.json({ error: "Không tìm thấy câu hỏi." }, { status: 404 });
      return NextResponse.json({ question });
    }
    if (action === "close") {
      return NextResponse.json({ changed: await closePrismLiveQuestion(schoolYear, className, body.questionId) });
    }
    if (action === "delete") {
      const deleted = await deletePrismLiveQuestion(schoolYear, className, body.questionId);
      if (!deleted) return NextResponse.json({ error: "Hãy dừng câu hỏi trước khi xóa." }, { status: 409 });
      return NextResponse.json({ deleted: true });
    }
    return NextResponse.json({ error: "Thao tác chưa hợp lệ." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể thực hiện thao tác." }, { status: 400 });
  }
}
