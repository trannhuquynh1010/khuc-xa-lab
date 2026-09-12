import { NextResponse } from "next/server";
import { isClassName } from "@/lib/classes";
import { getPrismLiveStudentQuestion, isActivityOpen, savePrismLiveResponse } from "@/lib/db";

export const runtime = "nodejs";

function isStudentNumber(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 33;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const className = searchParams.get("className");
  const studentNumber = Number(searchParams.get("studentNumber"));
  if (!isClassName(className) || !isStudentNumber(studentNumber)) {
    return NextResponse.json({ error: "Hãy chọn đúng lớp và STT." }, { status: 400 });
  }

  const snapshot = await getPrismLiveStudentQuestion(className, studentNumber);
  return NextResponse.json({ ...snapshot, serverNow: new Date().toISOString() }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || body.website) return NextResponse.json({ error: "Dữ liệu chưa hợp lệ." }, { status: 400 });
  const className = body.className;
  const studentNumber = Number(body.studentNumber);
  if (!isClassName(className) || !isStudentNumber(studentNumber) || !isUuid(body.questionId)) {
    return NextResponse.json({ error: "Thông tin học sinh hoặc câu hỏi chưa hợp lệ." }, { status: 400 });
  }
  if (!(await isActivityOpen("prism-colors"))) {
    return NextResponse.json({ error: "Giáo viên đã đóng bài Lăng kính và màu sắc." }, { status: 409 });
  }

  try {
    const response = await savePrismLiveResponse({
      questionId: body.questionId,
      className,
      studentNumber,
      answer: body.answer,
    });
    return NextResponse.json({ response }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể lưu câu trả lời." }, { status: 409 });
  }
}
