import type { ActivityKey } from "@/lib/activities";
import { groupNames } from "@/lib/classes";
import {
  listExperimentSubmissions,
  listSubmissions,
  type RefractionQuizSubmission,
} from "@/lib/db";
import { toggleRefractionQuizScores } from "./actions";
import { OhmResults, PrismColorResults, RefractionResults, ResistanceFactorsResults } from "./TeacherResults";
import TeacherClassFilter from "./TeacherClassFilter";
import RefractionQuizDisclosure from "./RefractionQuizDisclosure";
import ScoreReleaseSubmitButton from "./ScoreReleaseSubmitButton";

export async function loadTeacherActivityData(activity: ActivityKey, schoolYear: string, className: string) {
  if (activity === "refraction") return { activity, submissions: await listSubmissions(schoolYear, className, 8) } as const;
  if (activity === "ohm") return { activity, submissions: await listExperimentSubmissions("ohm", schoolYear, className, 8) } as const;
  if (activity === "prism-colors") return { activity, submissions: await listExperimentSubmissions("prism-colors", schoolYear, className, 8) } as const;
  return { activity, submissions: await listExperimentSubmissions("resistance-factors", schoolYear, className, 8) } as const;
}

export async function TeacherActivityData({
  dataPromise,
  selectedClass,
  selectedYear,
  selectedKey,
}: {
  dataPromise: ReturnType<typeof loadTeacherActivityData>;
  selectedClass: string;
  selectedYear: string;
  selectedKey: ActivityKey;
}) {
  const data = await dataPromise;
  const submittedGroupSet = new Set(data.submissions.map((submission) => submission.groupName));
  const submittedCount = groupNames.filter((group) => submittedGroupSet.has(group)).length;
  const resultContent = data.activity === "refraction"
    ? <RefractionResults submissions={data.submissions} />
    : data.activity === "ohm"
      ? <OhmResults submissions={data.submissions} />
      : data.activity === "prism-colors"
        ? <PrismColorResults submissions={data.submissions} />
        : <ResistanceFactorsResults submissions={data.submissions} />;

  return (
    <>
      <section className="class-progress-panel">
        <div className="class-progress-header"><div><p className="eyebrow">TIẾN ĐỘ</p><h2>{selectedClass} · {submittedCount}/8</h2></div><TeacherClassFilter selectedClass={selectedClass} selectedYear={selectedYear} activity={selectedKey} /></div>
        <div className="group-progress-grid">
          {groupNames.map((group) => {
            const submitted = submittedGroupSet.has(group);
            return <div key={group} className={`group-progress-item ${submitted ? "submitted" : "pending"}`}><span>{submitted ? "✓" : "·"}</span><div><strong>{group}</strong><small>{submitted ? "Đã nộp" : "Chờ"}</small></div></div>;
          })}
        </div>
      </section>

      <details className="teacher-data-disclosure">
        <summary><span><small>BÀI NỘP</small><strong>{selectedClass} · {data.submissions.length} nhóm</strong></span><b>Mở / thu gọn</b></summary>
        <div className="teacher-data-content">{resultContent}</div>
      </details>
    </>
  );
}

export async function RefractionQuizPanel({ submissionsPromise, selectedClass, selectedYear }: {
  submissionsPromise: Promise<RefractionQuizSubmission[]>;
  selectedClass: string;
  selectedYear: string;
}) {
  const submissions = await submissionsPromise;
  const rosterSubmissions = submissions.filter((submission) => submission.studentNumber !== null);
  const submittedCount = rosterSubmissions.length;
  const releasedCount = rosterSubmissions.filter((submission) => submission.releasedAt !== null).length;
  const allReleased = submittedCount > 0 && releasedCount === submittedCount;

  return (
    <section className="activity-control-panel construction-control-panel quiz-release-control-panel">
      <div className="quiz-release-header">
        <div className="activity-control-title"><span aria-hidden="true">✓</span><div><p className="eyebrow">ĐIỂM CỘNG CÁ NHÂN</p><h2>Công bố kết quả</h2><p>Có thể công bố hoặc thu hồi kết quả của cả lớp.</p></div></div>
        <div className="activity-control-actions">
          <span className={`status-badge ${allReleased ? "open" : "closed"}`}>{releasedCount}/{submittedCount} bài đã công bố</span>
          <form action={toggleRefractionQuizScores}>
            <input type="hidden" name="schoolYear" value={selectedYear} />
            <input type="hidden" name="className" value={selectedClass} />
            <input type="hidden" name="nextReleased" value={String(!allReleased)} />
            <ScoreReleaseSubmitButton disabled={submittedCount === 0} released={allReleased} pendingCount={submittedCount - releasedCount} />
          </form>
        </div>
      </div>
      <RefractionQuizDisclosure submissions={rosterSubmissions} className={selectedClass} />
    </section>
  );
}

export function TeacherDataSkeleton() {
  return <div className="teacher-data-skeleton" role="status"><span /><span /><span /><p>Đang tải dữ liệu lớp…</p></div>;
}
