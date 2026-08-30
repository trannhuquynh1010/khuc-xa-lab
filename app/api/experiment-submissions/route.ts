import { NextResponse } from "next/server";
import { isActivityKey } from "@/lib/activities";
import { isClassName, isGroupName } from "@/lib/classes";
import { createExperimentSubmission, isActivityOpen } from "@/lib/db";
import type { OhmMeasurement, ResistanceFactorMeasurement, ResistanceFactorsPayload } from "@/lib/experiments";
import { calculateResistance } from "@/lib/physics";

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
  const expectedResistance = calculateResistance(
    typeof item.voltage === "number" ? item.voltage : null,
    typeof item.current === "number" ? item.current : null,
  );
  return Number.isInteger(item.sequence) && Number(item.sequence) > 0 &&
    isText(item.material, 80) &&
    isNumberInRange(item.length, 0.000001, 10000) &&
    isNumberInRange(item.area, 0.000001, 10000) &&
    isNumberInRange(item.voltage, 0, 1000) &&
    isNumberInRange(item.current, 0.000001, 100) &&
    isNumberInRange(item.resistance, 0, 1000000) &&
    expectedResistance !== null &&
    Math.abs(Number(item.resistance) - expectedResistance) <= Math.max(0.000001, expectedResistance * 0.000001);
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
    if (!isClassName(body.className) || !isGroupName(body.groupName)) {
      return NextResponse.json({ error: "Thông tin lớp hoặc nhóm chưa hợp lệ." }, { status: 400 });
    }

    if (body.activityKey === "ohm") {
      if (!isText(body.payload?.conclusion, 600) || !validMeasurementList(body.payload?.measurements, isOhmMeasurement)) {
        return NextResponse.json({ error: "Số liệu khảo sát mối liên hệ I – U chưa hợp lệ." }, { status: 400 });
      }
      const result = await createExperimentSubmission({
        activityKey: "ohm",
        className: body.className.trim(),
        groupName: body.groupName.trim(),
        payload: {
          measurements: body.payload.measurements,
          conclusion: body.payload.conclusion.trim(),
        },
      });
      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }

    const investigations = body.payload?.investigations as ResistanceFactorsPayload["investigations"] | undefined;
    const conclusions = body.payload?.conclusions as ResistanceFactorsPayload["conclusions"] | undefined;
    if (
      !investigations ||
      !conclusions ||
      !isText(conclusions.material, 600) ||
      !isText(conclusions.length, 600) ||
      !isText(conclusions.area, 600) ||
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
      payload: {
        investigations,
        conclusions: {
          material: conclusions.material.trim(),
          length: conclusions.length.trim(),
          area: conclusions.area.trim(),
        },
      },
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Experiment submission error", error);
    return NextResponse.json({ error: "Máy chủ chưa thể lưu số liệu. Hãy thử lại." }, { status: 500 });
  }
}
