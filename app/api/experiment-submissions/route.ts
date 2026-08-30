import { NextResponse } from "next/server";
import { isActivityKey } from "@/lib/activities";
import { createExperimentSubmission, isActivityOpen } from "@/lib/db";
import type { OhmMeasurement, ResistanceFactorMeasurement, ResistanceFactorsPayload } from "@/lib/experiments";

export const runtime = "nodejs";

function isText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isNumberInRange(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isOhmMeasurement(value: unknown): value is OhmMeasurement {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return Number.isInteger(item.sequence) && Number(item.sequence) > 0 &&
    isNumberInRange(item.voltage, 0, 1000) &&
    isNumberInRange(item.current, 0, 100);
}

function isFactorMeasurement(value: unknown): value is ResistanceFactorMeasurement {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return Number.isInteger(item.sequence) && Number(item.sequence) > 0 &&
    isText(item.material, 80) &&
    isNumberInRange(item.length, 0.000001, 10000) &&
    isNumberInRange(item.area, 0.000001, 10000) &&
    isNumberInRange(item.resistance, 0, 1000000);
}

function validMeasurementList(value: unknown, validator: (item: unknown) => boolean) {
  return Array.isArray(value) && value.length >= 1 && value.length <= 20 && value.every(validator);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.website) return NextResponse.json({ ok: true });

    if (!isActivityKey(body.activityKey) || body.activityKey === "refraction") {
      return NextResponse.json({ error: "Hoạt động chưa hợp lệ." }, { status: 400 });
    }
    if (!(await isActivityOpen(body.activityKey))) {
      return NextResponse.json({ error: "Giáo viên đã đóng hoạt động này." }, { status: 403 });
    }
    if (!isText(body.className, 30) || !isText(body.groupName, 60)) {
      return NextResponse.json({ error: "Thông tin lớp hoặc nhóm chưa hợp lệ." }, { status: 400 });
    }

    if (body.activityKey === "ohm") {
      if (!isText(body.payload?.resistorName, 80) || !validMeasurementList(body.payload?.measurements, isOhmMeasurement)) {
        return NextResponse.json({ error: "Số liệu thí nghiệm định luật Ohm chưa hợp lệ." }, { status: 400 });
      }
      const result = await createExperimentSubmission({
        activityKey: "ohm",
        className: body.className.trim(),
        groupName: body.groupName.trim(),
        payload: {
          resistorName: body.payload.resistorName.trim(),
          measurements: body.payload.measurements,
        },
      });
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }

    const investigations = body.payload?.investigations as ResistanceFactorsPayload["investigations"] | undefined;
    if (
      !investigations ||
      !validMeasurementList(investigations.material, isFactorMeasurement) ||
      !validMeasurementList(investigations.length, isFactorMeasurement) ||
      !validMeasurementList(investigations.area, isFactorMeasurement)
    ) {
      return NextResponse.json({ error: "Số liệu khảo sát các yếu tố của điện trở chưa hợp lệ." }, { status: 400 });
    }

    const result = await createExperimentSubmission({
      activityKey: "resistance-factors",
      className: body.className.trim(),
      groupName: body.groupName.trim(),
      payload: { investigations },
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Experiment submission error", error);
    return NextResponse.json({ error: "Máy chủ chưa thể lưu số liệu. Hãy thử lại." }, { status: 500 });
  }
}
