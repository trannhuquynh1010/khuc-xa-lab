import { NextResponse } from "next/server";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName } from "@/lib/classes";
import { listHk1ReviewRows } from "@/lib/db";
import { buildHk1ReviewStats } from "@/lib/hk1-review-score";
import { isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = searchParams.get("className");
  const schoolYear = searchParams.get("schoolYear");
  if (!isClassName(className) || !isSchoolYear(schoolYear)) {
    return NextResponse.json({ error: "Bộ lọc chưa hợp lệ." }, { status: 400 });
  }

  try {
    const stats = buildHk1ReviewStats(await listHk1ReviewRows(schoolYear, className));
    return NextResponse.json(stats, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("HK1 review stats error", error);
    return NextResponse.json({ error: "Chưa tải được thống kê." }, { status: 500 });
  }
}
