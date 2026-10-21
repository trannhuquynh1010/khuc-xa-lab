import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isRefractionQuizClassName } from "@/lib/classes";
import { listRefractionQuizSubmissions } from "@/lib/db";
import { isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = searchParams.get("className");
  const schoolYear = searchParams.get("schoolYear");
  if (!isRefractionQuizClassName(className) || !isSchoolYear(schoolYear)) {
    return NextResponse.json({ error: "Bộ lọc chưa hợp lệ." }, { status: 400 });
  }

  const submissions = await listRefractionQuizSubmissions(schoolYear, className, 100);
  return NextResponse.json({ submissions }, { headers: { "Cache-Control": "private, no-store" } });
}
