import { NextResponse } from "next/server";
import { isActivityKey } from "@/lib/activities";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName } from "@/lib/classes";
import { listExperimentSubmissions, listSubmissions } from "@/lib/db";
import { isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await isTeacherAuthenticated())) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activity = searchParams.get("activity");
  const className = searchParams.get("className");
  const schoolYear = searchParams.get("schoolYear");
  if (!isActivityKey(activity) || !isClassName(className) || !isSchoolYear(schoolYear)) {
    return NextResponse.json({ error: "Bộ lọc chưa hợp lệ." }, { status: 400 });
  }

  const responseOptions = { headers: { "Cache-Control": "private, no-store" } };
  if (activity === "refraction") {
    return NextResponse.json({ activity, submissions: await listSubmissions(schoolYear, className, 8) }, responseOptions);
  }
  if (activity === "ohm") {
    return NextResponse.json({ activity, submissions: await listExperimentSubmissions("ohm", schoolYear, className, 8) }, responseOptions);
  }
  if (activity === "prism-colors") {
    return NextResponse.json({ activity, submissions: await listExperimentSubmissions("prism-colors", schoolYear, className, 8) }, responseOptions);
  }
  return NextResponse.json({ activity, submissions: await listExperimentSubmissions("resistance-factors", schoolYear, className, 8) }, responseOptions);
}
