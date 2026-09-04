import type { ActivityKey } from "@/lib/activities";
import { groupNames } from "@/lib/classes";
import {
  listSubmittedGroups,
  type RefractionQuizClassSummary,
} from "@/lib/db";
import { getPracticeDefinition, type PracticeKey } from "@/lib/practice-attempt-types";
import { forceSubmitPractice, togglePracticeScores, toggleRefractionQuizScores } from "./actions";
import ForceSubmitPracticeButton from "./ForceSubmitPracticeButton";
import PracticeAttemptDisclosure from "./PracticeAttemptDisclosure";
import TeacherClassFilter from "./TeacherClassFilter";
import RefractionQuizDisclosure from "./RefractionQuizDisclosure";
import ScoreReleaseSubmitButton from "./ScoreReleaseSubmitButton";
import TeacherSubmissionDisclosure from "./TeacherSubmissionDisclosure";

export async function loadTeacherActivityData(activity: ActivityKey, schoolYear: string, className: string) {
  return { activity, submittedGroups: await listSubmittedGroups(activity, schoolYear, className) } as const;
}

type TeacherActivityDataProps = {
  dataPromise: ReturnType<typeof loadTeacherActivityData>;
  selectedClass: string;
  selectedYear: string;
  selectedKey: ActivityKey;
};

export async function TeacherClassProgress({
  dataPromise,
  selectedClass,
  selectedYear,
  selectedKey,
}: TeacherActivityDataProps) {
  const data = await dataPromise;
  const submittedGroupSet = new Set(data.submittedGroups);
  const submittedCount = groupNames.filter((group) => submittedGroupSet.has(group)).length;

  return (
    <section className="class-progress-panel">
      <div className="class-progress-header"><div><p className="eyebrow">TIẾN ĐỘ</p><h2>{selectedClass} · {submittedCount}/8</h2></div><TeacherClassFilter selectedClass={selectedClass} selectedYear={selectedYear} activity={selectedKey} /></div>
      <div className="group-progress-grid">
        {groupNames.map((group) => {
          const submitted = submittedGroupSet.has(group);
          return <div key={group} className={`group-progress-item ${submitted ? "submitted" : "pending"}`}><span>{submitted ? "✓" : "·"}</span><div><strong>{group}</strong><small>{submitted ? "Đã nộp" : "Chờ"}</small></div></div>;
        })}
      </div>
    </section>
  );
}

export async function TeacherSubmissionData({
  dataPromise,
  selectedClass,
  selectedYear,
  selectedKey,
}: TeacherActivityDataProps) {
  const data = await dataPromise;
  const submittedCount = groupNames.filter((group) => data.submittedGroups.includes(group)).length;
  return <TeacherSubmissionDisclosure key={`${selectedKey}:${selectedYear}:${selectedClass}`} activity={selectedKey} className={selectedClass} schoolYear={selectedYear} submittedCount={submittedCount} />;
}

export async function RefractionQuizPanel({ summaryPromise, selectedClass, selectedYear }: {
  summaryPromise: Promise<RefractionQuizClassSummary>;
  selectedClass: string;
  selectedYear: string;
}) {
  const { submittedCount, releasedCount } = await summaryPromise;
  const allReleased = submittedCount > 0 && releasedCount === submittedCount;

  return (
    <section className="activity-control-panel construction-control-panel quiz-release-control-panel">
      <div className="quiz-release-header">
        <div className="activity-control-title"><span aria-hidden="true">✓</span><div><p className="eyebrow">ĐIỂM CỘNG CÁ NHÂN</p><h2>Công bố kết quả</h2><p>Có thể công bố hoặc thu hồi kết quả của cả lớp.</p></div></div>
        <div className="activity-control-actions">
          <span className={`status-badge ${allReleased ? "open" : "closed"}`}>{releasedCount}/{submittedCount} bài đã công bố</span>
          <form action={forceSubmitPractice}>
            <input type="hidden" name="schoolYear" value={selectedYear} />
            <input type="hidden" name="className" value={selectedClass} />
            <input type="hidden" name="practiceKey" value="refraction-application" />
            <ForceSubmitPracticeButton disabled={submittedCount >= 33} />
          </form>
          <form action={toggleRefractionQuizScores}>
            <input type="hidden" name="schoolYear" value={selectedYear} />
            <input type="hidden" name="className" value={selectedClass} />
            <input type="hidden" name="nextReleased" value={String(!allReleased)} />
            <ScoreReleaseSubmitButton disabled={submittedCount === 0} released={allReleased} pendingCount={submittedCount - releasedCount} />
          </form>
        </div>
      </div>
      <RefractionQuizDisclosure key={`${selectedYear}:${selectedClass}:${submittedCount}:${releasedCount}`} submittedCount={submittedCount} className={selectedClass} schoolYear={selectedYear} />
    </section>
  );
}

export async function PracticeCollectionPanel({ summaryPromise, practiceKey, selectedClass, selectedYear }: {
  summaryPromise: Promise<{ submittedCount: number; releasedCount: number; forcedCount: number }>;
  practiceKey: PracticeKey;
  selectedClass: string;
  selectedYear: string;
}) {
  const { submittedCount, releasedCount, forcedCount } = await summaryPromise;
  const definition = getPracticeDefinition(practiceKey);
  const allReleased = submittedCount > 0 && releasedCount === submittedCount;

  return (
    <section className="activity-control-panel construction-control-panel quiz-release-control-panel practice-collection-panel">
      <div className="quiz-release-header">
        <div className="activity-control-title"><span aria-hidden="true">⇥</span><div><p className="eyebrow">THU BÀI CÁ NHÂN</p><h2>{definition.label}</h2><p>{submittedCount}/33 đã thu{forcedCount ? ` · ${forcedCount} bài thu tự động` : ""}</p></div></div>
        <div className="activity-control-actions">
          <form action={forceSubmitPractice}>
            <input type="hidden" name="schoolYear" value={selectedYear} />
            <input type="hidden" name="className" value={selectedClass} />
            <input type="hidden" name="practiceKey" value={practiceKey} />
            <ForceSubmitPracticeButton disabled={submittedCount >= 33} />
          </form>
          <form action={togglePracticeScores}>
            <input type="hidden" name="schoolYear" value={selectedYear} />
            <input type="hidden" name="className" value={selectedClass} />
            <input type="hidden" name="practiceKey" value={practiceKey} />
            <input type="hidden" name="nextReleased" value={String(!allReleased)} />
            <ScoreReleaseSubmitButton disabled={submittedCount === 0} released={allReleased} pendingCount={submittedCount - releasedCount} />
          </form>
        </div>
      </div>
      <PracticeAttemptDisclosure key={`${practiceKey}:${selectedYear}:${selectedClass}:${submittedCount}:${releasedCount}:${forcedCount}`} submittedCount={submittedCount} practiceKey={practiceKey} className={selectedClass} schoolYear={selectedYear} />
    </section>
  );
}

export function TeacherDataSkeleton() {
  return <div className="teacher-data-skeleton" role="status"><span /><span /><span /><p>Đang tải dữ liệu lớp…</p></div>;
}
