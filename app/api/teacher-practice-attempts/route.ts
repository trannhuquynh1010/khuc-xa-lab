import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName, isRefractionQuizClassName } from "@/lib/classes";
import { listPracticeAttempts } from "@/lib/db";
import { isPracticeKey } from "@/lib/practice-attempt-types";
import { isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const practiceKey = searchParams.get("practiceKey");
  const className = searchParams.get("className");
  const schoolYear = searchParams.get("schoolYear");
  if (!isPracticeKey(practiceKey) || !isClassName(className) || !isSchoolYear(schoolYear)) {
    return NextResponse.json({ error: "Bộ lọc chưa hợp lệ." }, { status: 400 });
  }
  if (practiceKey === "refraction-application" && !isRefractionQuizClassName(className)) {
    return NextResponse.json({ error: "Lớp chưa được mở bài khúc xạ." }, { status: 400 });
  }

  const attempts = await listPracticeAttempts(schoolYear, practiceKey, className);
  return NextResponse.json({ attempts }, { headers: { "Cache-Control": "private, no-store" } });
}
