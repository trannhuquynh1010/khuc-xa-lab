import { NextResponse } from "next/server";
import { isClassName } from "@/lib/classes";
import { getOpticsQuestSnapshot } from "@/lib/db";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const requestedYear = searchParams.get("schoolYear");
    const schoolYear = requestedYear && isSchoolYear(requestedYear) ? requestedYear : getCurrentSchoolYear();
    if (!isClassName(className)) return NextResponse.json({ error: "Lớp chưa hợp lệ." }, { status: 400 });
    return NextResponse.json(await getOpticsQuestSnapshot(schoolYear, className), { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Optics quest snapshot error", error);
    return NextResponse.json({ error: "Chưa thể tải Photon Quest." }, { status: 500 });
  }
}
