import { isTeacherAuthenticated } from "@/lib/auth";
import { getRosterSize, isClassName } from "@/lib/classes";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import { forceSubmitAiClass, listAiSessions } from "@/lib/optics-ai-db";
import { aiView } from "@/lib/optics-ai-engine";
import { opticsAiConfigured, opticsAiModelName, opticsAiProvider } from "@/lib/optics-ai-provider";
import { readAiBudget } from "@/lib/optics-ai-budget";
import { buildClassScoreboard } from "@/lib/ai-analytics";
import { aiLessons, isAiLessonKey, type AiLessonConfig } from "@/lib/ai-lessons";

/** Shared by both handlers so the two responses cannot drift apart. */
async function classPayload(lesson: AiLessonConfig, year: string, className: string) {
  const [sessions, budget] = await Promise.all([listAiSessions(year, className, lesson.version), readAiBudget()]);
  return {
    configured: opticsAiConfigured(), provider: opticsAiProvider(), model: opticsAiModelName(), budget,
    scoreboard: buildClassScoreboard(sessions, getRosterSize(className)),
    sessions: sessions.map(s => ({ id: s.id, studentNumber: s.studentNumber, lessonVersion: s.lessonVersion, updatedAt: s.updatedAt, view: aiView(s.state, true) })),
  };
}

export async function GET(request: Request) {
  if (!await isTeacherAuthenticated()) return Response.json({ error: "Cần đăng nhập giáo viên." }, { status: 401 });
  const params = new URL(request.url).searchParams; const className = params.get("class"); const year = params.get("year") ?? getCurrentSchoolYear();
  if (!isClassName(className) || !isSchoolYear(year)) return Response.json({ error: "Lớp hoặc năm học không hợp lệ." }, { status: 400 });
  const lessonParam = params.get("lesson");
  const lesson = isAiLessonKey(lessonParam) ? aiLessons[lessonParam] : aiLessons.optics;
  try {
    return Response.json(await classPayload(lesson, year, className), { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Không tải được lượt học AI. Kiểm tra cấu hình dữ liệu." }, { status: 503 }); }
}

/** Ends the lesson for one class. Teacher-only and same-origin only. */
export async function POST(request: Request) {
  if (!await isTeacherAuthenticated()) return Response.json({ error: "Cần đăng nhập giáo viên." }, { status: 401 });
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") ?? requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "https" || forwardedProtocol === "http" ? `${forwardedProtocol}:` : requestUrl.protocol;
  if (origin && origin !== `${protocol}//${host}`) return Response.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); }
  catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  if (body.action !== "force-submit") return Response.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
  const className = body.className; const year = typeof body.year === "string" ? body.year : getCurrentSchoolYear();
  if (!isClassName(className) || !isSchoolYear(year)) return Response.json({ error: "Lớp hoặc năm học không hợp lệ." }, { status: 400 });
  const lesson = isAiLessonKey(body.lesson) ? aiLessons[body.lesson] : aiLessons.optics;
  try {
    const result = await forceSubmitAiClass(lesson, year, className);
    return Response.json({ ...result, ...await classPayload(lesson, year, className) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Chưa thu được bài. Thử lại, hoặc kiểm tra kết nối dữ liệu." }, { status: 503 }); }
}
