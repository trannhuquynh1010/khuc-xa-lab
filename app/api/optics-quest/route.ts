import { NextResponse } from "next/server";
import { isClassName, isStudentNumber } from "@/lib/classes";
import { getOpticsQuestReveal, getOpticsQuestSnapshot } from "@/lib/db";
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
    // Kết quả cá nhân cho học sinh (chỉ có chi tiết đúng/sai sau khi giáo viên công bố).
    const rawStudentNumber = searchParams.get("studentNumber");
    if (rawStudentNumber !== null) {
      const studentNumber = Number(rawStudentNumber);
      if (!isStudentNumber(studentNumber)) return NextResponse.json({ error: "STT chưa hợp lệ." }, { status: 400 });
      return NextResponse.json(await getOpticsQuestReveal(schoolYear, className, studentNumber), { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    return NextResponse.json(await getOpticsQuestSnapshot(schoolYear, className), { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Optics quest snapshot error", error);
    return NextResponse.json({ error: "Chưa thể tải Photon Quest." }, { status: 500 });
  }
}
