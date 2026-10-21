"use client";

import { useCallback, useEffect, useState } from "react";
import { aiTopicLabels, type AiTopic } from "@/lib/optics-ai-types";
import type { Analytics } from "@/lib/ai-analytics";

type LessonFilter = "all" | "optics" | "lens";
const lessonLabels: Record<LessonFilter, string> = { all: "Cả hai bài AI", optics: "Quang học", lens: "Thấu kính" };
const show = (value: number | null, suffix = "%") => value === null ? "—" : `${value}${suffix}`;
const signed = (value: number | null) => value === null ? "—" : `${value > 0 ? "+" : ""}${value} đpt`;
const tone = (value: number | null) => value === null ? "" : value > 0 ? "up" : value < 0 ? "down" : "flat";
const day = (value: string | null) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
// Most urgent first, so the teacher reads the top of the table and acts.
const bandOrder = ["needs-teacher", "rushing", "incomplete", "mixed", "self-corrects", "secure"] as const;
const bandLabels: Record<string, string> = {
  "needs-teacher": "Cần cô hỗ trợ",
  rushing: "Làm quá nhanh",
  incomplete: "Chưa hoàn thành",
  mixed: "Trung bình",
  "self-corrects": "Tự sửa tốt",
  secure: "Nắm vững",
};

export default function AiAnalyticsDashboard({ schoolYear }: { schoolYear: string }) {
  const [lesson, setLesson] = useState<LessonFilter>("all");
  const [allClasses, setAllClasses] = useState(false);
  const [taught, setTaught] = useState<string[]>([]);
  const [rosters, setRosters] = useState<Record<string, number>>({});
  const [excluded, setExcluded] = useState<{ sessions: number; attempts: number } | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teacher-ai-analytics?year=${schoolYear}&lesson=${lesson}&classes=${allClasses ? "all" : "taught"}`, { cache: "no-store" });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
      setData(payload.analytics); setTaught(payload.taughtClassNames ?? []);
      setRosters(payload.classRosterSizes ?? {}); setExcluded(payload.excluded ?? null); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được dữ liệu."); }
    finally { setLoading(false); }
  }, [schoolYear, lesson, allClasses]);
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);

  function exportCsv() {
    if (!data) return;
    const header = ["lop", "stt", "hoan_thanh", "so_cau", "tong_cau", "dung_cuoi_cung", "diem_cong", "dung_lan_dau", "chan_doan_dung", "chan_doan_tong", "van_dung_dung", "van_dung_tong", "chenh_lech_dpt", "luyen_dung_lan_dau", "luyen_dung_sau_sua", "luyen_tong", "tu_sua_duoc", "luot_ai", "luot_quy_tac", "bao_goi_y", "chu_de_yeu_nhat", "cap_nhat"];
    const rows = data.students.map(s => [s.className, s.studentNumber, s.completed ? 1 : 0, s.answered, s.total, s.finalCorrectAll, s.bonusPoint, s.firstCorrectAll, s.diagnostic, s.diagnosticTotal, s.transfer, s.transferTotal, s.deltaPercent ?? "", s.practiceFirst, s.practiceRevised, s.practiceTotal, s.selfCorrected, s.aiCalls, s.ruleFallbacks, s.flagged, s.weakestTopic ? aiTopicLabels[s.weakestTopic as AiTopic] : "", s.updatedAt]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    // BOM so Excel on Windows reads the Vietnamese column names correctly.
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `phan-tich-ai-${lesson}-${schoolYear}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  const t = data?.totals;
  return <section className="ai-analytics">
    <div className="class-progress-header">
      <div>
        <p className="eyebrow">PHÂN TÍCH TỔNG HỢP · {schoolYear}</p>
        <h2>Mức độ hiệu quả theo học sinh và theo lớp</h2>
        <p>Tổng hợp kết quả của <b>tất cả các bài</b> học sinh đã nộp trong năm học, kèm phần riêng cho hai bài có AI trợ giảng. Dùng để nhìn xu hướng, không dùng để xếp loại học sinh.</p>
      </div>
      <div className="ai-analytics-filters">
        {(Object.keys(lessonLabels) as LessonFilter[]).map(key => (
          <button key={key} type="button" className={lesson === key ? "selected" : ""} onClick={() => setLesson(key)}>{lessonLabels[key]}</button>
        ))}
      </div>
    </div>

    <div className="ai-teacher-toolbar">
      <button type="button" className={allClasses ? "secondary-button" : "secondary-button selected"} onClick={() => setAllClasses(false)}>Chỉ lớp đang dạy{taught.length ? ` (${taught.join(", ")})` : ""}</button>
      <button type="button" className={allClasses ? "secondary-button selected" : "secondary-button"} onClick={() => setAllClasses(true)}>Tất cả lớp, gồm cả dữ liệu thử</button>
      <button type="button" className="secondary-button" onClick={load}>Làm mới</button>
      <button type="button" className="secondary-button" onClick={exportCsv} disabled={!data?.students.length}>Tải CSV bài AI</button>
    </div>

    {!allClasses && Object.keys(rosters).length > 0 && <p className="ai-review-footnote">
      Đang tính theo sĩ số thật: {taught.map(c => `${c} (${rosters[c] ?? "?"} em)`).join(" · ")}. Số thứ tự vượt sĩ số được coi là lượt thử hoặc học sinh không làm nên đã loại khỏi mọi con số.
      {excluded && (excluded.sessions > 0 || excluded.attempts > 0) ? ` Đã loại ${excluded.sessions} lượt học AI và ${excluded.attempts} lượt nộp bài khác.` : ""}
    </p>}

    {error && <p className="ai-review-error" role="alert">{error}</p>}
    {loading && !data ? <p role="status">Đang tổng hợp dữ liệu…</p> : null}

    {data && data.activities.length === 0 && data.students.length === 0
      ? <p>Chưa có bài nào được nộp trong năm học này cho mục đã chọn.</p> : null}

    {data && data.activities.length > 0 && <>
      <div className="ai-review-scorecards">
        <div><b>{data.activityTotals.submissions}</b><span>Bài đã nộp</span></div>
        <div><b>{data.activityTotals.students}</b><span>Học sinh có dữ liệu</span></div>
        <div><b>{show(data.activityTotals.accuracyPercent)}</b><span>Tỉ lệ đúng chung</span></div>
        <div><b>{data.activities.length}</b><span>Hoạt động có dữ liệu</span></div>
      </div>

      <div className="ai-analytics-block">
        <h3>Kết quả theo từng bài</h3>
        <p className="ai-review-footnote">Mọi bài luyện tập cá nhân học sinh đã nộp. Xếp từ thấp đến cao theo tỉ lệ đúng, nên dòng đầu là bài cả lớp làm yếu nhất.</p>
        <table className="ai-analytics-table">
          <thead><tr><th>Bài</th><th>Tỉ lệ đúng</th><th>Số ý đúng</th><th>Lượt nộp</th><th>Học sinh</th><th>Lần nộp gần nhất</th></tr></thead>
          <tbody>{data.activities.map(row => <tr key={row.practiceKey}>
            <th scope="row">{row.label}</th>
            <td><span className="ai-analytics-bar" aria-hidden="true"><i style={{ width: `${row.accuracyPercent}%` }} /></span>{row.accuracyPercent}%</td>
            <td>{row.correct}/{row.total}</td><td>{row.submissions}</td><td>{row.students}</td><td>{day(row.lastSubmittedAt)}</td>
          </tr>)}</tbody>
        </table>
      </div>

      {data.activityTimeline.length > 1 && <div className="ai-analytics-block">
        <h3>Tỉ lệ đúng theo thời gian · tất cả các bài</h3>
        <p className="ai-review-footnote">Nhóm theo ngày học sinh nộp bài. Mỗi ngày thường là một bài khác nhau nên đây là bức tranh theo chặng học, không phải cùng một đề lặp lại.</p>
        <table className="ai-analytics-table">
          <thead><tr><th>Ngày</th><th>Lượt nộp</th><th>Tỉ lệ đúng</th></tr></thead>
          <tbody>{data.activityTimeline.map(row => <tr key={row.date}>
            <th scope="row">{new Date(row.date).toLocaleDateString("vi-VN")}</th>
            <td>{row.submissions}</td><td>{show(row.accuracyPercent)}</td>
          </tr>)}</tbody>
        </table>
      </div>}

      <div className="ai-analytics-block">
        <h3>Tổng hợp theo từng học sinh · tất cả các bài</h3>
        <table className="ai-analytics-table">
          <thead><tr><th>Lớp · STT</th><th>Số bài đã nộp</th><th>Tỉ lệ đúng</th><th>Số ý đúng</th></tr></thead>
          <tbody>{data.overall.map(row => <tr key={`${row.className}-${row.studentNumber}`}>
            <th scope="row">{row.className} · {String(row.studentNumber).padStart(2, "0")}</th>
            <td>{row.activities}</td>
            <td><span className="ai-analytics-bar" aria-hidden="true"><i style={{ width: `${row.accuracyPercent}%` }} /></span>{row.accuracyPercent}%</td>
            <td>{row.correct}/{row.total}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}

    {t && t.sessions > 0 && <>
        <div className="ai-analytics-divider"><h3>Riêng hai bài có AI trợ giảng</h3></div>
        <div className="ai-review-scorecards">
          <div><b>{t.sessions}</b><span>Lượt học</span></div>
          <div><b>{t.completed}</b><span>Hoàn thành</span></div>
          <div><b>{show(t.diagnosticPercent)}</b><span>Đúng ở chặng chẩn đoán</span></div>
          <div><b>{show(t.transferPercent)}</b><span>Đúng ở chặng vận dụng</span></div>
          <div className={`delta ${tone(t.deltaPercent)}`}><b>{signed(t.deltaPercent)}</b><span>Chênh lệch chẩn đoán → vận dụng</span></div>
          <div><b>{show(t.selfCorrectedPercent)}</b><span>Câu sai được tự sửa đúng</span></div>
          <div><b>{t.bonusTwo} · {t.bonusOne} · {t.bonusNone}</b><span>Đạt +2 · +1 · chưa đạt</span></div>
        </div>

        <p className="ai-review-footnote">
          <b>Cách đọc hai con số cuối.</b> Chặng chẩn đoán và chặng vận dụng là hai bộ câu <b>khác nhau</b>, cùng hướng tới những ý tưởng tương tự nhưng <b>chưa được chuẩn hóa tương đương</b>. Vì vậy chênh lệch chỉ mô tả điều đã thay đổi trong tiết học, <b>không phải ước lượng tác động của AI</b>. Muốn kết luận nhân quả cần thiết kế có nhóm đối chứng. Tỉ lệ tự sửa đúng là bằng chứng trực tiếp và đáng tin hơn: nó đo đúng việc em đọc gợi ý rồi sửa được lựa chọn của mình.
        </p>

        {data!.topics.length > 0 && <div className="ai-analytics-block">
          <h3>Chủ đề yếu phổ biến</h3>
          <p className="ai-review-footnote">Xếp từ thấp đến cao theo tỉ lệ đúng sau cùng của mọi học sinh. Dòng đầu là chỗ cả lớp cần ôn thêm.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Chủ đề</th><th>Tỉ lệ đúng</th><th>Số lượt trả lời</th><th>Số học sinh</th></tr></thead>
            <tbody>{data!.topics.map(row => <tr key={row.topic}>
              <th scope="row">{row.label}</th>
              <td><span className="ai-analytics-bar" aria-hidden="true"><i style={{ width: `${row.accuracyPercent}%` }} /></span>{row.accuracyPercent}%</td>
              <td>{row.correct}/{row.attempts}</td><td>{row.students}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.classes.length > 0 && <div className="ai-analytics-block">
          <h3>So sánh theo lớp</h3>
          <table className="ai-analytics-table">
            <thead><tr><th>Lớp</th><th>Lượt</th><th>Hoàn thành</th><th>Chẩn đoán</th><th>Vận dụng</th><th>Chênh lệch</th><th>Tự sửa đúng</th></tr></thead>
            <tbody>{data!.classes.map(row => <tr key={row.className}>
              <th scope="row">{row.className}</th>
              <td>{row.sessions}</td><td>{row.completed}</td>
              <td>{show(row.diagnosticPercent)}</td><td>{show(row.transferPercent)}</td>
              <td className={`delta ${tone(row.deltaPercent)}`}>{signed(row.deltaPercent)}</td>
              <td>{show(row.selfCorrectedPercent)}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.timeline.length > 1 && <div className="ai-analytics-block">
          <h3>Theo thời gian</h3>
          <p className="ai-review-footnote">Nhóm theo ngày bắt đầu lượt học. Cần ít nhất hai mốc mới thấy xu hướng.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Ngày</th><th>Lượt</th><th>Hoàn thành</th><th>Chẩn đoán</th><th>Vận dụng</th></tr></thead>
            <tbody>{data!.timeline.map(row => <tr key={row.date}>
              <th scope="row">{new Date(row.date).toLocaleDateString("vi-VN")}</th>
              <td>{row.sessions}</td><td>{row.completed}</td>
              <td>{show(row.diagnosticPercent)}</td><td>{show(row.transferPercent)}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        <div className="ai-analytics-block">
          <h3>Theo từng học sinh</h3>
          <p className="ai-review-footnote">Lời giải thích của học sinh vẫn cần giáo viên đọc và chấm; bảng này chỉ đếm lựa chọn đáp án.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Lớp · STT</th><th>Tiến độ</th><th>Đúng</th><th>Điểm cộng</th><th>Chẩn đoán</th><th>Vận dụng</th><th>Chênh lệch</th><th>Luyện tập</th><th>Tự sửa</th><th>Chủ đề yếu nhất</th><th>AI / quy tắc</th></tr></thead>
            <tbody>{data!.students.map(row => <tr key={`${row.className}-${row.studentNumber}`}>
              <th scope="row">{row.className} · {String(row.studentNumber).padStart(2, "0")}</th>
              <td>{row.completed ? "Xong" : `${row.answered}/${row.total}`}</td>
              <td>{row.finalCorrectAll}/{row.total}</td>
              <td>{row.bonusPoint > 0 ? <b className="ai-analytics-bonus">+{row.bonusPoint}</b> : "—"}</td>
              <td>{row.diagnostic}/{row.diagnosticTotal || "—"}</td>
              <td>{row.transfer}/{row.transferTotal || "—"}</td>
              <td className={`delta ${tone(row.deltaPercent)}`}>{signed(row.deltaPercent)}</td>
              <td>{row.practiceFirst} → {row.practiceRevised}/{row.practiceTotal}</td>
              <td>{row.selfCorrected}</td>
              <td>{row.weakestTopic ? aiTopicLabels[row.weakestTopic as AiTopic] : "—"}</td>
              <td>{row.aiCalls} / {row.ruleFallbacks}{row.flagged ? ` · ${row.flagged} báo lỗi` : ""}</td>
            </tr>)}</tbody>
          </table>
        </div>

        {data!.hintEffect.length > 0 && <div className="ai-analytics-block">
          <h3>Gợi ý có giúp học sinh sửa được không</h3>
          <p className="ai-review-footnote">Đo trên cùng một câu hỏi: em chọn sai, đọc gợi ý, rồi chọn lại. Đây là bằng chứng trực tiếp nhất về tác dụng của gợi ý.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Nguồn gợi ý</th><th>Số lượt gợi ý</th><th>Sửa đúng sau gợi ý</th><th>Tỉ lệ thành công</th></tr></thead>
            <tbody>{data!.hintEffect.map(row => <tr key={row.source}>
              <th scope="row">{row.source === "ai" ? "AI viết riêng" : "Theo kiến thức chuẩn"}</th>
              <td>{row.hints}</td><td>{row.selfCorrected}</td>
              <td><span className="ai-analytics-bar" aria-hidden="true"><i style={{ width: `${row.successPercent ?? 0}%` }} /></span>{show(row.successPercent)}</td>
            </tr>)}</tbody>
          </table>
          {data!.hintEffect.length > 1 && <p className="ai-review-footnote">So sánh hai dòng này <b>không phải thí nghiệm có đối chứng</b>: gợi ý theo quy tắc chỉ xuất hiện khi AI lỗi hoặc hết hạn mức, nên hai nhóm không tương đương. Chỉ nên đọc là ghi nhận ban đầu.</p>}
        </div>}

        {data!.topicShift.length > 0 && <div className="ai-analytics-block">
          <h3>Từng chủ đề: khởi động so với tự làm</h3>
          <p className="ai-review-footnote">Chi tiết hơn một con số chung. Chủ đề có chênh lệch âm là chỗ cần ôn lại trước tiên.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Chủ đề</th><th>Khởi động</th><th>Tự làm cuối</th><th>Chênh lệch</th></tr></thead>
            <tbody>{data!.topicShift.map(row => <tr key={row.topic}>
              <th scope="row">{row.label}</th>
              <td>{show(row.diagnosticPercent)}</td><td>{show(row.transferPercent)}</td>
              <td className={`delta ${tone(row.shiftPoints)}`}>{signed(row.shiftPoints)}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.items.length > 0 && <div className="ai-analytics-block">
          <h3>Phân tích từng câu hỏi</h3>
          <p className="ai-review-footnote">
            <b>Tỉ lệ đúng</b> cho biết câu dễ hay khó. <b>Độ phân biệt</b> so sánh nhóm mạnh nhất với nhóm yếu nhất: giá trị thấp hoặc âm thường là dấu hiệu câu hỏi khó hiểu chứ không phải học sinh yếu. <b>Phương án sai phổ biến</b> cho thấy cách hiểu sai mà cả lớp cùng mắc.
          </p>
          <table className="ai-analytics-table">
            <thead><tr><th>Câu hỏi</th><th>Chủ đề</th><th>Tỉ lệ đúng</th><th>Độ phân biệt</th><th>Phương án sai phổ biến nhất</th><th>Gợi ý thành công</th></tr></thead>
            <tbody>{data!.items.map(row => <tr key={row.questionId}>
              <th scope="row" className="ai-analytics-prompt" title={row.prompt}>{row.prompt}</th>
              <td>{aiTopicLabels[row.topic as AiTopic] ?? row.topic}</td>
              <td><span className="ai-analytics-bar" aria-hidden="true"><i style={{ width: `${row.difficultyPercent}%` }} /></span>{row.difficultyPercent}% ({row.correctFirst}/{row.served})</td>
              <td className={row.discriminationPoints !== null && row.discriminationPoints < 0 ? "delta down" : ""}>{row.discriminationPoints === null ? "—" : `${row.discriminationPoints} đpt`}</td>
              <td>{row.topDistractor ? <>{row.topDistractor.label} <small>({row.topDistractor.count} em · {row.topDistractor.sharePercent}%)</small></> : "—"}</td>
              <td>{row.hintsGiven ? `${row.selfCorrected}/${row.hintsGiven} · ${show(row.hintSuccessPercent)}` : "—"}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.triage.length > 0 && <div className="ai-analytics-block">
          <h3>Học sinh cần chú ý</h3>
          <p className="ai-review-footnote">Phân nhóm tự động để biết nên gặp em nào trước. Đây là gợi ý cho giáo viên, <b>không phải xếp loại học sinh</b>.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Lớp · STT</th><th>Nhóm</th><th>Ghi nhận</th></tr></thead>
            <tbody>{[...data!.triage].sort((a, b) => bandOrder.indexOf(a.band) - bandOrder.indexOf(b.band)).map(row => <tr key={`${row.className}-${row.studentNumber}`}>
              <th scope="row">{row.className} · {String(row.studentNumber).padStart(2, "0")}</th>
              <td><span className={`ai-analytics-band ${row.band}`}>{bandLabels[row.band]}</span></td>
              <td>{row.note}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.pace.length > 0 && <div className="ai-analytics-block">
          <h3>Nhịp làm bài</h3>
          <p className="ai-review-footnote">Thời gian giữa hai câu trả lời. Trung vị rất thấp hoặc nhiều câu dưới 6 giây là dấu hiệu em bấm mà chưa đọc. Khoảng ngắt dài hơn 10 phút đã được loại để không làm lệch trung vị.</p>
          <table className="ai-analytics-table">
            <thead><tr><th>Lớp · STT</th><th>Trung vị mỗi câu</th><th>Số câu dưới 6 giây</th><th>Thời gian đọc gợi ý</th><th>Sửa lại dưới 5 giây</th></tr></thead>
            <tbody>{data!.pace.map(row => <tr key={`${row.className}-${row.studentNumber}`}>
              <th scope="row">{row.className} · {String(row.studentNumber).padStart(2, "0")}</th>
              <td className={row.medianSeconds !== null && row.medianSeconds < 8 ? "delta down" : ""}>{row.medianSeconds === null ? "—" : `${row.medianSeconds}s`}</td>
              <td>{row.fastAnswers}</td>
              <td>{row.medianHintSeconds === null ? "—" : `${row.medianHintSeconds}s`}</td>
              <td>{row.rushedRevisions}</td>
            </tr>)}</tbody>
          </table>
        </div>}

        {data!.unusedQuestions.length > 0 && <div className="ai-analytics-block">
          <h3>Câu hỏi chưa em nào gặp ({data!.unusedQuestions.length} câu)</h3>
          <p className="ai-review-footnote">Bộ chọn câu thích ứng chưa dùng tới các câu này. Bình thường, vì mỗi em chỉ làm 14 trong số câu của ngân hàng. Chỉ cần xem lại nếu một câu không bao giờ được dùng qua nhiều lớp.</p>
          <ul className="ai-analytics-unused">{data!.unusedQuestions.map(q => <li key={q.questionId}><b>{aiTopicLabels[q.topic as AiTopic] ?? q.topic}</b> — {q.prompt}</li>)}</ul>
        </div>}
      </>}
  </section>;
}
