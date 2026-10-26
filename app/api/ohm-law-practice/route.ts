import { NextResponse } from "next/server";
import { isClassName, isStudentNumber } from "@/lib/classes";
import { getOhmLawPracticeResult } from "@/lib/db";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const studentNumber = Number(searchParams.get("studentNumber"));
    const requestedYear = searchParams.get("schoolYear");
    const schoolYear = requestedYear && isSchoolYear(requestedYear) ? requestedYear : getCurrentSchoolYear();
    if (!isClassName(className) || !isStudentNumber(studentNumber)) {
      return NextResponse.json({ error: "Lớp hoặc STT chưa hợp lệ." }, { status: 400 });
    }
    // Hàm bên dưới chỉ kèm đáp án và giải thích khi học sinh đã nộp bài.
    const result = await getOhmLawPracticeResult(schoolYear, className, studentNumber);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Ohm law practice result error", error);
    return NextResponse.json({ error: "Chưa thể tải kết quả bài luyện tập." }, { status: 500 });
  }
}
