import { NextResponse } from "next/server";
import { createSubmission, type Measurement } from "@/lib/db";

export const runtime = "nodejs";

function isText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isMeasurement(value: unknown): value is Measurement {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isInteger(item.sequence) && Number(item.sequence) > 0 &&
    typeof item.incidenceAngle === "number" && item.incidenceAngle >= 0 && item.incidenceAngle <= 90 &&
    typeof item.refractionAngle === "number" && item.refractionAngle >= 0 && item.refractionAngle <= 90 &&
    typeof item.sinIncidence === "number" && item.sinIncidence >= 0 && item.sinIncidence <= 1 &&
    typeof item.sinRefraction === "number" && item.sinRefraction >= 0 && item.sinRefraction <= 1
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });

    if (!isText(body.className, 30) || !isText(body.groupName, 60)) {
      return NextResponse.json({ error: "Thông tin lớp hoặc nhóm chưa hợp lệ." }, { status: 400 });
    }
    if (!isText(body.incidenceMedium, 80) || !isText(body.refractionMedium, 80)) {
      return NextResponse.json({ error: "Thông tin môi trường thí nghiệm chưa hợp lệ." }, { status: 400 });
    }
    if (!Array.isArray(body.measurements) || body.measurements.length < 1 || body.measurements.length > 20 || !body.measurements.every(isMeasurement)) {
      return NextResponse.json({ error: "Số liệu thí nghiệm chưa hợp lệ." }, { status: 400 });
    }

    const result = await createSubmission({
      className: body.className.trim(),
      groupName: body.groupName.trim(),
      incidenceMedium: body.incidenceMedium.trim(),
      refractionMedium: body.refractionMedium.trim(),
      measurements: body.measurements,
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Submission error", error);
    return NextResponse.json({ error: "Máy chủ chưa thể lưu số liệu. Hãy thử lại." }, { status: 500 });
  }
}
