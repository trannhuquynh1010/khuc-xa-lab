import { NextResponse } from "next/server";
import { listActivitySettings } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activities = await listActivitySettings();
    return NextResponse.json(
      { activities },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Activity settings error", error);
    return NextResponse.json({ error: "Chưa thể tải danh sách hoạt động." }, { status: 500 });
  }
}
