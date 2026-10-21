"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { classNames, studentNumbers } from "@/lib/classes";
import { aiMasteryLabels, aiTopicLabels, OPTICS_AI_TOTAL, type AiTopic, type AiView } from "@/lib/optics-ai-types";

type SavedSession = { id?: string; token: string; className: string; studentNumber: number; preview: boolean };
type Draft = { response: string[]; explanation: string; confidence: number };
const emptyDraft: Draft = { response: [], explanation: "", confidence: 2 };
// One component drives every AI-tutored lesson; only the copy and the lesson
// key differ, so the two lessons can never drift apart in behaviour.
const lessonCopy = {
  optics: { eyebrow: "ÔN TẬP GIỮA KÌ 1", title: "Ôn tập Quang học giữa kì 1" },
  lens: { eyebrow: "THẤU KÍNH", title: "Thấu kính - Bài tập tự luyện" },
} as const;

export default function OpticsAiReview({ preview = false, lesson = "optics" }: { preview?: boolean; lesson?: keyof typeof lessonCopy }) {
  const copy = lessonCopy[lesson];
  const storageKey = `physics-${lesson}-ai-session-v1`;
  const [className, setClassName] = useState("9H04");
  const [studentNumber, setStudentNumber] = useState(1);
  const [view, setView] = useState<AiView | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<{ configured: boolean; open: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const credentials = useRef<SavedSession | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const key = `${storageKey}-${preview ? "preview" : "live"}`;

  const applyView = useCallback((next: AiView) => {
    setView(next);
    const fallback = next.needsRevision ? { response: next.entries.at(-1)!.response, explanation: next.entries.at(-1)!.explanation, confidence: next.entries.at(-1)!.confidence } : emptyDraft;
    try {
      const saved = localStorage.getItem(`${key}-draft-${next.id}-${next.version}`);
      const parsed = saved ? JSON.parse(saved) as Draft : null;
      setDraft(parsed && Array.isArray(parsed.response) && parsed.response.every(v => typeof v === "string") && typeof parsed.explanation === "string" && [1, 2, 3].includes(parsed.confidence) ? parsed : fallback);
    } catch { setDraft(fallback); }
    window.setTimeout(() => heading.current?.focus(), 0);
  }, [key]);

  const reload = useCallback(async () => {
    if (!credentials.current?.id) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/optics-ai?id=${credentials.current.id}&lesson=${lesson}${preview ? "&preview=1" : ""}`, { headers: { "X-Optics-Session": credentials.current.token }, cache: "no-store" });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      applyView(data.view);
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được phiên học."); }
    finally { setBusy(false); }
  }, [applyView, preview, lesson]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved) as SavedSession;
          if (typeof parsed.token === "string" && classNames.includes(parsed.className) && studentNumbers.includes(parsed.studentNumber)) {
            credentials.current = parsed; setHasSession(Boolean(parsed.id)); setClassName(parsed.className); setStudentNumber(parsed.studentNumber);
            if (parsed.id) await reload();
          }
        }
        const response = await fetch(`/api/optics-ai?lesson=${lesson}${preview ? "&preview=1" : ""}`, { cache: "no-store" });
        const data = await response.json(); if (!response.ok) throw new Error(data.error);
        if (!cancelled) setStatus(data);
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Chưa kết nối được bài học."); }
      finally { if (!cancelled) setReady(true); }
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [key, preview, reload, lesson]);

  function updateDraft(patch: Partial<Draft>) {
    const next = { ...draft, ...patch }; setDraft(next);
    if (view) try { localStorage.setItem(`${key}-draft-${view.id}-${view.version}`, JSON.stringify(next)); } catch { /* The server still preserves submitted work. */ }
  }
  async function act(action: "start" | "answer" | "revise" | "flag") {
    setBusy(true); setError("");
    try {
      if (action === "start") {
        const previous = credentials.current;
        credentials.current = previous && previous.className === className && previous.studentNumber === studentNumber ? previous : { token: crypto.randomUUID(), className, studentNumber, preview };
        // Save the token before requesting: a lost response can resume the same session.
        localStorage.setItem(key, JSON.stringify(credentials.current));
      }
      const response = await fetch("/api/optics-ai", { method: "POST", headers: { "Content-Type": "application/json", "X-Optics-Session": credentials.current!.token },
        body: JSON.stringify({ action, preview, lesson, className, studentNumber, id: view?.id, version: view?.version, submission: draft }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (credentials.current) { credentials.current.id = data.view.id; setHasSession(true); localStorage.setItem(key, JSON.stringify(credentials.current)); }
      if (action === "flag") localStorage.setItem(`${key}-draft-${data.view.id}-${data.view.version}`, JSON.stringify(draft));
      if (view) localStorage.removeItem(`${key}-draft-${view.id}-${view.version}`);
      applyView(data.view);
    } catch (e) { setError(e instanceof Error ? e.message : "Chưa lưu được bài."); }
    finally { setBusy(false); }
  }
  const question = view?.question;
  const currentEntry = view?.needsRevision ? view.entries.at(-1) : null;
  const answered = view?.entries.length ?? 0;
  const completed = view?.phase === "complete";
  // Read the length from the session, so a run started before the lesson grew
  // keeps counting to its own total instead of jumping denominator.
  const total = view?.summary.total ?? OPTICS_AI_TOTAL;
  // Sessions created before grading moved to the selected answer may still carry
  // a question that demands written reasoning; honour it rather than trap them.
  const needsExplanation = question ? question.requiresExplanation !== false : false;
  const canAnswer = draft.response.length > 0 && (!needsExplanation || draft.explanation.trim().length >= 10);
  // Result of the answer just resolved, shown above the next question so the
  // student always learns whether they were right.
  const lastEntry = view?.entries.at(-1);
  const outcome = view && !view.needsRevision && lastEntry?.phase === "practice" && lastEntry.correct !== undefined
    ? { correct: lastEntry.revision ? lastEntry.revision.correct : lastEntry.correct, reference: lastEntry.reference }
    : null;

  // Closing report in the student's own terms: how many were right, which
  // questions to revisit, and which topics still need work. Phase names
  // (diagnostic/practice/transfer) are the teacher's design, not the student's
  // concern, so they never appear here.
  const report = useMemo(() => {
    const entries = view?.phase === "complete" ? view.entries : [];
    const byTopic = new Map<string, { topic: AiTopic; attempts: number; correct: number }>();
    // Highest difficulty answered right on the first try, per topic — read
    // straight off the first attempt, not the retry, since a hint-assisted fix
    // reflects coaching rather than independent mastery of that level.
    const masteryLevel = new Map<string, number>();
    for (const entry of entries) {
      const bucket = byTopic.get(entry.question.topic) ?? { topic: entry.question.topic, attempts: 0, correct: 0 };
      bucket.attempts++;
      if (entry.revision ? entry.revision.correct : entry.correct) bucket.correct++;
      byTopic.set(entry.question.topic, bucket);
      if (entry.correct) {
        const current = masteryLevel.get(entry.question.topic) ?? 0;
        if (entry.question.difficulty > current) masteryLevel.set(entry.question.topic, entry.question.difficulty);
      }
    }
    return {
      firstCorrect: entries.filter(e => e.correct).length,
      fixed: entries.filter(e => !e.correct && e.revision?.correct).length,
      // Every first-attempt miss is worth revisiting, even the ones later fixed.
      wrong: entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.correct === false),
      weakTopics: [...byTopic.values()].filter(t => t.correct < t.attempts).sort((a, b) => a.correct / a.attempts - b.correct / b.attempts),
      mastery: [...byTopic.values()].map(t => ({ topic: t.topic, level: masteryLevel.get(t.topic) ?? 0 })),
    };
  }, [view]);

  return <section className="ai-review-shell" aria-busy={busy}>
    <header className="ai-review-intro">
      <span className="ai-review-orbit" aria-hidden="true">✦</span>
      <div><p className="eyebrow">{copy.eyebrow}</p><h2>{copy.title}</h2><p>Chọn đáp án · nhận gợi ý · tự sửa</p></div>
      <span className="ai-review-tag">{preview ? "XEM THỬ · KHÔNG GỌI AI" : "AI TRỢ GIẢNG"}</span>
    </header>
    {preview && <div className="ai-review-notice">Bản xem thử: gợi ý theo quy tắc, không gọi AI, không lưu dữ liệu học sinh. Hết hạn sau 1 giờ. {hasSession && <button type="button" className="secondary-button" disabled={busy} onClick={() => { localStorage.removeItem(key); credentials.current = null; setHasSession(false); setView(null); setDraft(emptyDraft); setError(""); }}>Xem thử lại từ đầu</button>}</div>}
    {error && <div className="ai-review-error" role="alert">{error}{hasSession && <button className="secondary-button" type="button" disabled={busy} onClick={reload}>Tải lại phiên học</button>}</div>}
    {!view ? <div className="ai-review-start">
      <h3>{OPTICS_AI_TOTAL} câu trắc nghiệm · chỉ cần chọn đáp án</h3>
      <p>Bài ôn tập trước kì thi giữa kì. Em chọn đáp án, không phải viết gì. Nếu chọn sai ở phần giữa, em sẽ được gợi ý rồi chọn lại một lần. Cuối bài em nhận nhận xét và danh sách kiến thức cần ôn thêm.</p>
      <p className="ai-review-bonus-note"><b>Điểm cộng:</b> đúng {OPTICS_AI_TOTAL}/{OPTICS_AI_TOTAL} câu được <b>+2</b>, đúng {OPTICS_AI_TOTAL - 1}/{OPTICS_AI_TOTAL} câu được <b>+1</b>. Mỗi em chỉ làm một lần, nên em đọc kỹ từng câu nhé.</p>
      <details className="ai-review-privacy">
        <summary>Cách AI được dùng trong bài này</summary>
        <p>Khi em chọn sai, hệ thống gửi nội dung câu hỏi và phương án em đã chọn tới dịch vụ AI để viết gợi ý. Lớp và số thứ tự của em không được gửi đi.</p>
        <p>Đáp án được chấm bằng quy tắc cố định, không phải do AI quyết định. Nếu gợi ý nào chưa phù hợp, em bấm báo để cô xem lại.</p>
      </details>
      <div className="ai-review-identity"><label>Lớp<select value={className} disabled={busy} onChange={e => setClassName(e.target.value)}>{classNames.map(c => <option key={c}>{c}</option>)}</select></label><label>Số thứ tự<select value={studentNumber} disabled={busy} onChange={e => setStudentNumber(Number(e.target.value))}>{studentNumbers.map(n => <option value={n} key={n}>{String(n).padStart(2, "0")}</option>)}</select></label></div>
      {!ready ? <p role="status">Đang kiểm tra bài học…</p> : status && !status.configured ? <p className="ai-review-notice">Bài đã được xây dựng. Giáo viên cần kết nối dịch vụ AI để bắt đầu.</p> : status && !status.open ? <p className="ai-review-notice">Chờ giáo viên mở bài mới này.</p> : null}
      <button type="button" className="primary-button" disabled={busy || !ready || !status?.configured || !status.open} onClick={() => act("start")}>{busy ? "Đang mở lượt học…" : "Bắt đầu lộ trình →"}</button>
      {preview && hasSession && <button type="button" className="secondary-button" disabled={busy} onClick={() => { localStorage.removeItem(key); credentials.current = null; setHasSession(false); setError(""); }}>Xóa phiên xem thử trên máy này</button>}
    </div> : <>
      <div className="ai-review-progress"><div><b>{className} · STT {String(studentNumber).padStart(2, "0")}</b><span>Câu {Math.min(answered + (completed ? 0 : 1), total)}/{total}</span></div><progress max={total} value={answered} aria-label="Số câu đã trả lời" /></div>
      {question && <form className="ai-review-question" onSubmit={e => { e.preventDefault(); act(view.needsRevision ? "revise" : "answer"); }}>
        {outcome && <div className={`ai-review-outcome ${outcome.correct ? "right" : "wrong"}`} role="status">
          <b>{outcome.correct ? "✓ Câu trước: đúng rồi" : "Câu trước: vẫn chưa đúng"}</b>
          {outcome.reference && <p>{outcome.reference}</p>}
        </div>}
        {view.needsRevision && currentEntry?.feedback && <aside className="ai-review-feedback" aria-label="Gợi ý cho em">
          <p className="ai-review-verdict">✗ Chưa đúng — em thử lại nhé</p>
          <div className="ai-review-hint-block"><b>Kiến thức liên quan</b><p>{currentEntry.feedback.hint}</p></div>
          <div className="ai-review-hint-block"><b>Em thử nghĩ xem</b><p>{currentEntry.feedback.reflection}</p></div>
          <div className="ai-review-feedback-foot">
            <small>{currentEntry.feedback.source === "ai" ? "Gợi ý do AI viết riêng cho lựa chọn của em" : "AI tạm chưa trả lời, đây là gợi ý theo kiến thức chuẩn"}</small>
            <button type="button" className="ai-review-flag" disabled={busy || currentEntry.flagged} onClick={() => act("flag")}>{currentEntry.flagged ? "Đã gửi báo cáo cho cô" : "Gợi ý chưa phù hợp"}</button>
          </div>
        </aside>}
        <div className="ai-review-ask">
          <span className="ai-review-chip">{aiTopicLabels[question.topic]}{view.needsRevision ? " · chọn lại" : ""}</span>
          {question.context && <p className="ai-review-context">{question.context}</p>}
          <h3 ref={heading} tabIndex={-1}>{question.prompt}</h3>
        </div>
        <fieldset className="ai-review-choices" disabled={busy}><legend>{question.kind === "multiple" ? "Chọn tất cả đáp án đúng" : "Chọn một đáp án"}</legend>{question.choices.map(choice => <label key={choice.value} className={draft.response.includes(choice.value) ? "selected" : ""}><input type={question.kind === "multiple" ? "checkbox" : "radio"} name="ai-answer" checked={draft.response.includes(choice.value)} onChange={() => updateDraft({ response: question.kind === "multiple" ? draft.response.includes(choice.value) ? draft.response.filter(v => v !== choice.value) : [...draft.response, choice.value] : [choice.value] })} /><span>{choice.label}</span></label>)}</fieldset>
        <div className="ai-review-actions"><button type="submit" className="primary-button" disabled={busy || !canAnswer}>{busy ? "Đang lưu…" : view.needsRevision ? "Chọn lại xong →" : "Trả lời →"}</button><button type="button" className="secondary-button" disabled={busy} onClick={reload}>Tải lại</button></div>
      </form>}
      {completed && <div className="ai-review-results">
        <p className="eyebrow">ĐÃ HOÀN THÀNH</p>
        <h3 ref={heading} tabIndex={-1}>{view.forcedAt ? `Cô đã thu bài sau ${answered} câu` : `Em đã làm xong ${total} câu`}</h3>
        {view.forcedAt && <p className="ai-review-notice">Cô đã dừng bài trước khi em làm hết. Kết quả tính trên {answered}/{total} câu em đã trả lời, câu đang chờ sửa (nếu có) được tính theo lựa chọn ban đầu.</p>}
        <div className="ai-review-score-line">
          <b>{view.summary.finalCorrect}/{total}</b>
          <span>câu em làm đúng{report.fixed > 0 ? `, trong đó ${report.fixed} câu em sửa đúng sau khi đọc gợi ý` : ""}. Đúng ngay lần đầu: {report.firstCorrect}/{total}.</span>
        </div>
        <div className={`ai-review-bonus ${view.summary.bonusPoint > 0 ? "earned" : ""}`}>
          {view.summary.bonusPoint > 0
            ? <><b>+{view.summary.bonusPoint} điểm cộng</b><span>Chúc mừng em. Cô sẽ xác nhận lại trước khi vào điểm.</span></>
            : <><b>Chưa đạt điểm cộng</b><span>Đúng {total}/{total} được +2, đúng {total - 1}/{total} được +1.</span></>}
        </div>
        <div className="ai-review-advice">
          <h4>Năng lực của em theo từng chủ đề</h4>
          <p className="ai-review-mastery-note">Mức này tính theo câu khó nhất em làm đúng ngay lần đầu (không tính câu sửa đúng sau gợi ý), nên là một ước lượng, không phải điểm số chính xác.</p>
          <ul className="ai-review-mastery-list">{report.mastery.map(m => <li key={m.topic} className={`mastery-${m.level}`}><b>{aiTopicLabels[m.topic]}</b><span>{aiMasteryLabels[m.level as 0 | 1 | 2 | 3]}</span></li>)}</ul>
        </div>
        {report.weakTopics.length > 0 ? <div className="ai-review-advice">
          <h4>Kiến thức em nên ôn thêm</h4>
          <ul>{report.weakTopics.map(t => <li key={t.topic}><b>{aiTopicLabels[t.topic]}</b> — đúng {t.correct}/{t.attempts} câu</li>)}</ul>
        </div> : <div className="ai-review-advice"><h4>Nhận xét</h4><p>Em làm đúng ở tất cả các chủ đề. Hãy giữ cách làm cẩn thận này khi ôn thi.</p></div>}
        {report.wrong.length > 0 && <div className="ai-review-advice">
          <h4>Những câu em cần xem lại ({report.wrong.length} câu)</h4>
          {report.wrong.map(({ entry, index }) => {
            const pickedFirst = entry.response;
            const pickedFinal = entry.revision ? entry.revision.response : entry.response;
            const correctSet = new Set(entry.correctChoices ?? []);
            return <article key={entry.question.id} className="ai-review-wrong">
              <p className="ai-review-wrong-head">Câu {index + 1} · {aiTopicLabels[entry.question.topic]}{entry.revision?.correct ? " · em đã sửa đúng" : ""}</p>
              {entry.question.context && <p className="ai-review-context">{entry.question.context}</p>}
              <p className="ai-review-wrong-prompt"><b>{entry.question.prompt}</b></p>
              <ul className="ai-review-wrong-choices">
                {entry.question.choices.map(choice => {
                  const isCorrect = correctSet.has(choice.value);
                  const wasPickedFirst = pickedFirst.includes(choice.value);
                  const wasPickedFinal = pickedFinal.includes(choice.value);
                  const tags = [wasPickedFirst && !entry.revision ? "em đã chọn" : null, entry.revision && wasPickedFirst ? "em chọn lần đầu" : null, entry.revision && wasPickedFinal ? "em chọn sau khi sửa" : null].filter(Boolean).join(" · ");
                  return <li key={choice.value} className={isCorrect ? "correct" : (wasPickedFirst || wasPickedFinal) ? "picked-wrong" : ""}>
                    <span>{isCorrect ? "✓" : (wasPickedFirst || wasPickedFinal) ? "✗" : ""}</span>
                    <span>{choice.label}{tags ? <i> — {tags}</i> : null}</span>
                  </li>;
                })}
              </ul>
              {entry.reference && <p className="ai-review-reference"><b>Giải thích:</b> {entry.reference}</p>}
            </article>;
          })}
        </div>}
      </div>}
    </>}
  </section>;
}
