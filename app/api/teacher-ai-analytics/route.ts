import { isTeacherAuthenticated } from "@/lib/auth";
import { getCurrentSchoolYear, isSchoolYear } from "@/lib/school-years";
import { listAiSessionsForYear } from "@/lib/optics-ai-db";
import { listPracticeAttemptsForYear } from "@/lib/db";
import { buildAnalytics, type AnalyticsAttempt } from "@/lib/ai-analytics";
import { aiLessons, isAiLessonKey } from "@/lib/ai-lessons";
import { classRosterSizes, isOnRoster, taughtClassNames } from "@/lib/classes";
import { isPracticeKey, getPracticeDefinition } from "@/lib/practice-attempt-types";

export async function GET(request: Request) {
  if (!await isTeacherAuthenticated()) return Response.json({ error: "Cần đăng nhập giáo viên." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const year = params.get("year") ?? getCurrentSchoolYear();
  if (!isSchoolYear(year)) return Response.json({ error: "Năm học không hợp lệ." }, { status: 400 });
  const lessonParam = params.get("lesson");
  // "all" aggregates both tutored lessons; a named lesson narrows to that bank.
  const lesson = isAiLessonKey(lessonParam) ? aiLessons[lessonParam] : null;
  // Trial runs happen in classes that are not taught, so they are excluded by
  // default and only included when explicitly asked for.
  const includeAllClasses = params.get("classes") === "all";
  // Roll numbers beyond a class roll belong to nobody: they are trial runs or
  // absent students, so they never enter the figures unless "all" is requested.
  const keep = (className: string, studentNumber: number) =>
    includeAllClasses || (taughtClassNames.some(name => name === className) && isOnRoster(className, studentNumber));

  try {
    const [sessions, attemptRows] = await Promise.all([
      listAiSessionsForYear(year, lesson?.version),
      listPracticeAttemptsForYear(year),
    ]);
    const attempts: AnalyticsAttempt[] = attemptRows
      .filter(row => keep(row.className, row.studentNumber) && isPracticeKey(row.practiceKey) && row.totalItems > 0)
      .map(row => ({
        className: row.className, studentNumber: row.studentNumber, practiceKey: row.practiceKey,
        label: getPracticeDefinition(row.practiceKey as Parameters<typeof getPracticeDefinition>[0]).label,
        correctCount: row.correctCount, totalItems: row.totalItems, submittedAt: row.submittedAt,
      }));
    const keptSessions = sessions.filter(s => keep(s.className, s.studentNumber));
    return Response.json({
      year, lesson: lesson?.key ?? "all", classes: includeAllClasses ? "all" : "taught",
      taughtClassNames, classRosterSizes,
      excluded: {
        sessions: sessions.length - keptSessions.length,
        attempts: attemptRows.filter(row => isPracticeKey(row.practiceKey)).length - attempts.length,
      },
      analytics: buildAnalytics(keptSessions, attempts),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Không tải được dữ liệu phân tích. Kiểm tra cấu hình dữ liệu." }, { status: 503 }); }
}
