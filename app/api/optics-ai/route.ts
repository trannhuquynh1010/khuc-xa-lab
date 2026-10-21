import { randomUUID } from "node:crypto";
import { isTeacherAuthenticated } from "@/lib/auth";
import { isClassName, isStudentNumber } from "@/lib/classes";
import { getCurrentSchoolYear } from "@/lib/school-years";
import { aiView, answerAiState, createLessonState, flagAiState, reviseAiState, type AiState } from "@/lib/optics-ai-engine";
import { claimAiSession, commitAiSession, isAiLessonOpen, readAiSession, releaseAiSession, startAiSession } from "@/lib/optics-ai-db";
import { generateOpticsFeedback, opticsAiConfigured } from "@/lib/optics-ai-provider";
import { aiLessons, isAiLessonKey } from "@/lib/ai-lessons";

export const runtime = "nodejs";
export const maxDuration = 60;
const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
const previews = new Map<string, { state: AiState; token: string; expires: number; busy: boolean }>();
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function previewAllowed() { return process.env.NODE_ENV !== "production" || await isTeacherAuthenticated(); }
function tokenFrom(request: Request) { const token = request.headers.get("X-Optics-Session") ?? ""; return uuid.test(token) ? token : ""; }
function previewRecord(id: string, token: string) { const row = previews.get(id); return row && row.token === token && row.expires > Date.now() ? row : null; }
// One endpoint serves every AI-tutored lesson; `lesson` picks the question bank
// and the activity row the teacher opens. Defaults to optics for older clients.
function lessonFrom(value: unknown) { return isAiLessonKey(value) ? aiLessons[value] : aiLessons.optics; }

export async function GET(request: Request) {
  const url = new URL(request.url); const preview = url.searchParams.get("preview") === "1";
  const lesson = lessonFrom(url.searchParams.get("lesson"));
  if (preview && !await previewAllowed()) return reply({ error: "Đăng nhập giáo viên để xem thử." }, 403);
  try {
    const id = url.searchParams.get("id");
    if (id) {
      if (!uuid.test(id) || !tokenFrom(request)) return reply({ error: "Phiên học không hợp lệ." }, 400);
      const state = preview ? previewRecord(id, tokenFrom(request))?.state : await readAiSession(id, tokenFrom(request));
      return state ? reply({ view: aiView(state) }) : reply({ error: "Không tìm thấy phiên học trên thiết bị này." }, 404);
    }
    return reply({ configured: preview || opticsAiConfigured(), open: preview || await isAiLessonOpen(lesson), preview });
  } catch { return reply({ error: "Chưa kết nối được dữ liệu bài học. Giáo viên kiểm tra DATABASE_URL." }, 503); }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  // Next's internal request URL can use localhost behind a proxy/dev server.
  const host = request.headers.get("host") ?? requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "https" || forwardedProtocol === "http" ? `${forwardedProtocol}:` : requestUrl.protocol;
  if (origin && origin !== `${protocol}//${host}`) return reply({ error: "Yêu cầu không hợp lệ." }, 403);
  if (!tokenFrom(request)) return reply({ error: "Thiếu mã phiên học." }, 400);
  const raw = await request.text(); if (raw.length > 6000) return reply({ error: "Nội dung quá dài." }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); }
  catch { return reply({ error: "Dữ liệu không hợp lệ." }, 400); }
  const preview = body.preview === true;
  const lesson = lessonFrom(body.lesson);
  if (preview && !await previewAllowed()) return reply({ error: "Đăng nhập giáo viên để xem thử." }, 403);
  try {
    if (!preview && !await isAiLessonOpen(lesson)) return reply({ error: "Giáo viên đang đóng bài học này." }, 403);
    if (body.action === "start") {
      if (!preview && !opticsAiConfigured()) return reply({ error: "Chưa chọn nguồn gợi ý. Giáo viên đặt GEMINI_API_KEY, hoặc OPTICS_AI_PROVIDER=rules để chạy bằng quy tắc." }, 503);
      if (!isClassName(body.className) || !isStudentNumber(body.studentNumber)) return reply({ error: "Hãy chọn lớp và số thứ tự." }, 400);
      let state: AiState;
      if (preview) {
        for (const [key, row] of previews) if (row.expires < Date.now()) previews.delete(key);
        if (previews.size >= 100) return reply({ error: "Đã đủ lượt xem thử. Thử lại sau." }, 429);
        state = createLessonState(lesson, randomUUID(), true); previews.set(state.id, { state, token: tokenFrom(request), expires: Date.now() + 3600000, busy: false });
      } else state = await startAiSession(lesson, getCurrentSchoolYear(), body.className, body.studentNumber, tokenFrom(request));
      return reply({ view: aiView(state) });
    }
    if (typeof body.id !== "string" || !uuid.test(body.id) || !Number.isInteger(body.version) || Number(body.version) < 0 || !["answer", "revise", "flag"].includes(String(body.action))) return reply({ error: "Thao tác không hợp lệ." }, 400);
    const row = preview ? previewRecord(body.id, tokenFrom(request)) : null;
    const claim = preview ? row && !row.busy && row.state.version === body.version ? { state: row.state, lockId: "preview" } : null : await claimAiSession(body.id, tokenFrom(request), Number(body.version));
    if (!claim) return reply({ error: "Lượt học vừa thay đổi hoặc đang xử lý. Bấm tải lại phiên để tiếp tục." }, 409);
    if (row) row.busy = true;
    try {
      const next = body.action === "answer" ? await answerAiState(claim.state, body.submission, generateOpticsFeedback) : body.action === "revise" ? reviseAiState(claim.state, body.submission) : flagAiState(claim.state);
      if (row) row.state = next;
      else await commitAiSession(next, claim.lockId, Number(body.version));
      return reply({ view: aiView(next) });
    } finally {
      if (row) row.busy = false;
      else await releaseAiSession(body.id, claim.lockId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "identity_in_use") return reply({ error: "Số thứ tự này đã có lượt học. Hãy tiếp tục trên thiết bị đã bắt đầu; nhờ giáo viên kiểm tra nếu chọn nhầm." }, 409);
    if (/^(Hãy |Không có |Chỉ báo |Câu trả lời |Không tìm thấy câu hỏi)/.test(message)) return reply({ error: message }, 400);
    return reply({ error: "Chưa lưu được dữ liệu. Giữ nguyên trang và tải lại phiên trước khi thử tiếp." }, 503);
  }
}
