import { NextResponse } from "next/server";
import { isClassName } from "@/lib/classes";
import { getOhmRaceSnapshot } from "@/lib/db";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const className = searchParams.get("className");
    const requestedYear = searchParams.get("schoolYear");
    const schoolYear = requestedYear && isSchoolYear(requestedYear) ? requestedYear : getCurrentSchoolYear();
    if (!isClassName(className)) {
      return NextResponse.json({ error: "Lớp chưa hợp lệ." }, { status: 400 });
    }
    const snapshot = await getOhmRaceSnapshot(schoolYear, className);
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Ohm race snapshot error", error);
    return NextResponse.json({ error: "Chưa thể tải đường đua." }, { status: 500 });
  }
}

