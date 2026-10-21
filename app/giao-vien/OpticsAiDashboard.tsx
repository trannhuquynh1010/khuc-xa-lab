"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { aiPhaseLabels, aiTopicLabels, type AiView } from "@/lib/optics-ai-types";
import type { ScoreboardRow } from "@/lib/ai-analytics";
import TeacherClassFilter from "./TeacherClassFilter";
type Row = { id: string; studentNumber: number; lessonVersion: string; updatedAt: string; view: AiView };
type Budget = { used: number; limit: number; remaining: number; quotaDay: string };
type Status = { configured: boolean; provider: "openai" | "gemini" | "rules" | null; model: string | null; budget: Budget | null };
const providerLabels: Record<string, string> = { gemini: "Gemini", openai: "OpenAI", rules: "Quy tắc (không gọi AI)" };

const dashboardCopy = {
  optics: { heading: "Ôn tập Quang học giữa kì 1", activity: "optics-ai-review", previewHref: "/on-tap-quang-hoc-ai/xem-thu", file: "quang-hoc-ai" },
  lens: { heading: "Thấu kính - Bài tập tự luyện", activity: "lens-ai-review", previewHref: "/thau-kinh-ai/xem-thu", file: "thau-kinh-ai" },
} as const;

export default function OpticsAiDashboard({ className, schoolYear, lesson = "optics" }: { className: string; schoolYear: string; lesson?: keyof typeof dashboardCopy }) {
  const copy = dashboardCopy[lesson];
  const [rows, setRows] = useState<Row[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [notice, setNotice] = useState("");
  function apply(data: { sessions: Row[]; scoreboard: ScoreboardRow[]; configured: boolean; provider: Status["provider"]; model: string | null; budget: Budget | null }) {
    setRows(data.sessions); setScoreboard(data.scoreboard);
    setStatus({ configured: data.configured, provider: data.provider, model: data.model, budget: data.budget });
    setError(""); setLoaded(true);
  }
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/teacher-optics-ai?class=${className}&year=${schoolYear}&lesson=${lesson}`, { cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      apply(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được dữ liệu."); }
  }, [className, schoolYear, lesson]);
  // Ending the lesson is the teacher's call and cannot be undone, so it asks
  // first and says exactly how many attempts it is about to seal.
  async function forceSubmit() {
    const open = scoreboard.filter(r => r.started && !r.completed).length;
    const message = open > 0
      ? `Thu bài ${className}? ${open} em đang làm dở sẽ bị dừng tại chỗ và chấm theo số câu đã làm. Không thể hoàn tác.`
      : `Mọi em đã bắt đầu đều làm xong. Vẫn thu bài ${className}?`;
    if (!window.confirm(message)) return;
    setStopping(true); setNotice("");
    try {
      const response = await fetch("/api/teacher-optics-ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "force-submit", className, year: schoolYear, lesson }),
      });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      apply(data);
      setNotice(`Đã thu bài ${className}: dừng ${data.stopped} lượt đang làm dở trên ${data.sessions} lượt. Bảng điểm bên dưới đã cập nhật.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa thu được bài."); }
    finally { setStopping(false); }
  }
  function exportScoreboard() {
    const header = ["lop", "stt", "trong_danh_sach", "da_bat_dau", "da_hoan_thanh", "thu_tu_dong", "so_cau_da_lam", "tong_cau", "so_cau_dung", "diem_cong"];
    const body = scoreboard.map(r => [className, r.studentNumber, r.onRoster ? 1 : 0, r.started ? 1 : 0, r.completed ? 1 : 0, r.forced ? 1 : 0, r.answered, r.total, r.finalCorrect, r.bonusPoint]);
    const csv = [header, ...body].map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    // BOM so Excel on Windows reads the Vietnamese headers correctly.
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${copy.file}-diem-cong-${className}-${schoolYear}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  useEffect(() => { const timer = window.setTimeout(load, 0); const interval = window.setInterval(load, 10000); return () => { window.clearTimeout(timer); window.clearInterval(interval); }; }, [load]);
  function exportEvidence() {
    // No device token or answer-bank dump in teacher exports.
    const evidence = { exportedAt: new Date().toISOString(), schoolYear, className, interpretation: "Điểm các câu đầu và cuối khác nhau không phải ước lượng nhân quả. Lời giải thích cần giáo viên chấm theo rubric.", sessions: rows };
    const url = URL.createObjectURL(new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${copy.file}-${className}-${schoolYear}.json`; link.click(); URL.revokeObjectURL(url);
  }
  const completed = rows.filter(row => row.view.phase === "complete").length;
  const feedbacks = rows.flatMap(row => row.view.entries).map(e => e.feedback).filter(Boolean);
  const flags = rows.flatMap(row => row.view.entries).filter(e => e.flagged).length;
  const aiCalls = rows.reduce((total, row) => total + row.view.summary.aiCalls, 0);
  const ruleFallbacks = feedbacks.filter(f => f!.source === "rules").length;
  // Surfaces whether a fallback was a deliberate choice or a quota/outage event.
  const quotaStops = feedbacks.filter(f => f!.fallbackReason === "daily_budget" || f!.fallbackReason === "provider_429").length;
  const budget = status?.budget ?? null;
  const bonusTwo = rows.filter(row => row.view.summary.bonusPoint === 2).length;
  const bonusOne = rows.filter(row => row.view.summary.bonusPoint === 1).length;
  return <section className="ai-teacher-dashboard">
    <div className="class-progress-header"><div><p className="eyebrow">BÀI MỚI · DỮ LIỆU RIÊNG</p><h2>{className} · {copy.heading}</h2><p>4 chẩn đoán → 10 luyện tập và sửa → 4 vận dụng độc lập. Chỉ câu sai mới nhận gợi ý. Không tự cộng điểm.</p></div><TeacherClassFilter selectedClass={className} selectedYear={schoolYear} activity={copy.activity} /></div>
    <div className="ai-teacher-toolbar"><Link className="secondary-button" href="/giao-vien/phan-tich" target="_blank">▤ Phân tích tổng hợp ↗</Link><Link className="secondary-button" href={copy.previewHref} target="_blank">Xem thử không gọi AI ↗</Link><button type="button" className="secondary-button" onClick={load}>Làm mới</button><button type="button" className="secondary-button" onClick={exportEvidence} disabled={!rows.length}>Tải minh chứng JSON</button><button type="button" className="secondary-button force-submit-button" onClick={forceSubmit} disabled={stopping || !rows.length}>{stopping ? "Đang thu bài…" : "⏹ Dừng & thu bài cả lớp"}</button></div>
    {notice && <p className="ai-review-notice" role="status">{notice}</p>}
    {status?.configured === false && <p className="ai-review-notice">Chưa chọn nguồn gợi ý trên máy chủ, học sinh chưa bắt đầu được. Đặt GEMINI_API_KEY, hoặc OPTICS_AI_PROVIDER=rules để chạy miễn phí bằng quy tắc. Bản xem thử vẫn chạy bình thường.</p>}
    {status?.provider && <p className="ai-review-notice">Nguồn gợi ý: <b>{providerLabels[status.provider] ?? status.provider}</b>{status.model ? ` · ${status.model}` : ""}.
      {budget ? ` Đã dùng ${budget.used}/${budget.limit} lượt trong ngày quota ${budget.quotaDay} (reset 0h giờ Pacific, khoảng 14h giờ VN), còn ${budget.remaining}.` : ""}
      {budget && budget.remaining < 60 ? " Sắp cạn: các lượt sau sẽ tự dùng gợi ý theo quy tắc." : ""}</p>}
    {error && <p className="ai-review-error" role="alert">{error}</p>}
    <div className="ai-review-scorecards"><div><b>{rows.length}</b><span>Lượt đã bắt đầu</span></div><div><b>{completed}</b><span>Đã hoàn thành</span></div><div><b>{flags}</b><span>Gợi ý học sinh báo lỗi</span></div><div><b>{aiCalls}</b><span>Phản hồi AI đã lưu</span></div><div><b>{ruleFallbacks}</b><span>Gợi ý theo quy tắc</span></div><div><b>{quotaStops}</b><span>Do hết quota hoặc bị chặn</span></div><div><b>{bonusTwo} · {bonusOne}</b><span>Đạt +2 điểm · đạt +1 điểm</span></div></div>
    <p className="ai-review-footnote">Đáp án được chấm theo ngân hàng; AI không chấm lời giải thích. Hãy xem các lần sửa đúng và sai, số lượt dùng quy tắc dự phòng, và gợi ý bị báo lỗi. Chẩn đoán và vận dụng cuối là hai bộ câu khác nhau, chưa được chuẩn hóa tương đương.</p>
    {!loaded && !error ? <p role="status">Đang tải lượt học…</p> : !rows.length && !error ? <p>Chưa có học sinh bắt đầu bài mới ở lớp và năm học này.</p> : null}
    {scoreboard.length > 0 && <div className="ai-scoreboard">
      <div className="ai-scoreboard-head">
        <div><h3>Bảng điểm cộng cả lớp</h3><p>Mọi số thứ tự của {className}, kể cả em chưa bắt đầu. Điểm cộng chỉ tính khi bài đã kết thúc. Cô xác nhận lại trước khi vào điểm.</p></div>
        <button type="button" className="secondary-button" onClick={exportScoreboard}>Tải bảng điểm CSV</button>
      </div>
      <table className="ai-analytics-table">
        <caption className="sr-only">Số câu đúng và điểm cộng theo số thứ tự</caption>
        <thead><tr><th scope="col">STT</th><th scope="col">Trạng thái</th><th scope="col">Đã làm</th><th scope="col">Đúng</th><th scope="col">Điểm cộng</th></tr></thead>
        <tbody>{scoreboard.map(row => <tr key={row.studentNumber} className={!row.onRoster ? "off-roster" : row.started ? "" : "not-started"}>
          <th scope="row">{String(row.studentNumber).padStart(2, "0")}{row.onRoster ? "" : " ⚑"}</th>
          <td>{!row.started ? "Chưa bắt đầu" : row.forced ? "Cô đã thu bài" : row.completed ? "Tự hoàn thành" : "Đang làm"}</td>
          <td>{row.started ? `${row.answered}/${row.total}` : "—"}</td>
          <td>{row.started ? row.finalCorrect : "—"}</td>
          <td>{row.bonusPoint > 0 ? <b className="ai-teacher-bonus">+{row.bonusPoint}</b> : row.completed ? "0" : "—"}</td>
        </tr>)}</tbody>
      </table>
      <p className="ai-review-footnote">⚑ là số thứ tự ngoài danh sách lớp ({scoreboard.filter(r => r.onRoster).length} em): lượt thử của cô hoặc em chọn sai STT. Cột “Đúng” tính trên câu trả lời cuối cùng, nên câu sửa đúng sau khi đọc gợi ý vẫn được tính.</p>
    </div>}
    <div className="ai-teacher-sessions">{rows.map(row => <details key={row.id}>
      <summary><b>STT {String(row.studentNumber).padStart(2, "0")}</b><span>{aiPhaseLabels[row.view.phase]} · {row.view.entries.length}/{row.view.summary.total}</span><span>{row.view.phase === "complete" ? `Đúng ${row.view.summary.finalCorrect}/${row.view.summary.total} · Đầu ${row.view.summary.diagnostic}/4 · Cuối ${row.view.summary.transfer}/4` : "Đang làm"}</span>{row.view.summary.bonusPoint > 0 ? <span className="ai-teacher-bonus">+{row.view.summary.bonusPoint} điểm</span> : null}</summary>
      <p>{row.lessonVersion} · Cập nhật {new Date(row.updatedAt).toLocaleString("vi-VN")}</p>
      {row.view.entries.map((entry, i) => <article key={entry.question.id} className={`ai-teacher-entry ${entry.flagged ? "flagged" : ""}`}>
        <p className="eyebrow">CÂU {i + 1} · {aiTopicLabels[entry.question.topic]} · {aiPhaseLabels[entry.phase]} {entry.flagged ? "· CẦN XEM GỢI Ý" : ""}</p>
        <h3>{entry.question.prompt}</h3>{entry.question.context && <p>{entry.question.context}</p>}
        <p><b>Lần đầu ({entry.correct ? "đúng" : "chưa đúng"}, tự tin {entry.confidence}/3):</b> {entry.question.choices.filter(c => entry.response.includes(c.value)).map(c => c.label).join("; ")}</p><blockquote>{entry.explanation}</blockquote>
        {entry.feedback && <div className="ai-review-feedback"><b>{entry.feedback.source === "ai" ? "Gợi ý AI" : "Gợi ý theo quy tắc"} · {entry.feedback.model ?? entry.feedback.fallbackReason} · {entry.feedback.promptVersion}</b><p>{entry.feedback.hint}</p><p>{entry.feedback.reflection}</p><small>Chọn câu tiếp: {entry.feedback.nextQuestionId} · {entry.feedback.reason}</small></div>}
        {entry.revision ? <><p><b>Sau sửa ({entry.revision.correct ? "đúng" : "chưa đúng"}):</b> {entry.question.choices.filter(c => entry.revision!.response.includes(c.value)).map(c => c.label).join("; ")}</p><blockquote>{entry.revision.explanation}</blockquote></> : entry.phase === "practice" ? <p>Chưa có lần sửa.</p> : null}
        <p className="ai-review-reference"><b>Kiến thức chuẩn:</b> {entry.reference}</p>
      </article>)}
    </details>)}</div>
  </section>;
}
