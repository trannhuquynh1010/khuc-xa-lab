"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatStudentNumber, getRosterSize } from "@/lib/classes";
import {
  hk1ChoiceLetters,
  hk1Questions,
  hk1TopicLabels,
  HK1_REVIEW_QUESTION_COUNT,
  type Hk1QuestionStat,
  type Hk1ReviewStats,
  type Hk1Topic,
} from "@/lib/hk1-review";

type SortMode = "number" | "hardest";

const REFRESH_MS = 5000;
const MISCONCEPTION_PERCENT = 30;

function level(percent: number) {
  if (percent < 50) return "low";
  if (percent < 75) return "mid";
  return "high";
}

function percentOf(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

function QuestionCard({ stat, total, showKey }: { stat: Hk1QuestionStat; total: number; showKey: boolean }) {
  const question = hk1Questions[stat.number - 1];
  return (
    <article className={`hk1-question-card level-${total ? level(stat.correctPercent) : "none"}`}>
      <header>
        <span className="hk1-question-number">Câu {stat.number}</span>
        <span className="hk1-topic-chip">{hk1TopicLabels[question.topic]}</span>
        {total ? <strong className="hk1-correct-pill">{stat.correctPercent}% đúng</strong> : null}
      </header>
      <p className="hk1-question-text" title={question.text}>{question.text}</p>
      <ul className="hk1-option-bars">
        {hk1ChoiceLetters.map((letter, index) => {
          const percent = percentOf(stat.counts[letter], total);
          const isCorrect = showKey && letter === stat.correct;
          const isTrap = showKey && !isCorrect && percent >= MISCONCEPTION_PERCENT;
          return (
            <li key={letter} className={`${isCorrect ? "correct" : ""} ${isTrap ? "trap" : ""}`}>
              <b className="hk1-option-letter">{isCorrect ? "✓" : letter}</b>
              <div className="hk1-option-track">
                <i style={{ width: `${percent}%` }} />
                <span className="hk1-option-text" title={question.options[index]}>{isCorrect ? `${letter}. ` : ""}{question.options[index]}</span>
              </div>
              <span className="hk1-option-value"><strong>{percent}%</strong><small>{stat.counts[letter]} HS</small></span>
            </li>
          );
        })}
      </ul>
      {stat.blank ? <p className="hk1-blank-note">Bỏ trống: {stat.blank} HS</p> : null}
    </article>
  );
}

export default function Hk1ReviewDashboard({ className, schoolYear, presentation = false }: { className: string; schoolYear: string; presentation?: boolean }) {
  const [stats, setStats] = useState<Hk1ReviewStats | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [showKey, setShowKey] = useState(!presentation);
  const [sortMode, setSortMode] = useState<SortMode>("number");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams({ className, schoolYear });
      const response = await fetch(`/api/teacher-hk1-review?${params}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa tải được thống kê.");
      setStats(data as Hk1ReviewStats);
      setUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Chưa tải được thống kê.");
    }
  }, [className, schoolYear]);

  useEffect(() => {
    const controller = new AbortController();
    const first = window.setTimeout(() => void load(controller.signal), 0);
    const interval = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      controller.abort();
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [load]);

  const total = stats?.participantCount ?? 0;
  const sortedQuestions = useMemo(() => {
    const list = [...(stats?.questions ?? [])];
    if (sortMode === "hardest") list.sort((left, right) => left.correctPercent - right.correctPercent || left.number - right.number);
    return list;
  }, [stats, sortMode]);
  const mustReview = useMemo(() => (total ? (stats?.questions ?? []).filter((item) => item.correctPercent < 50).sort((left, right) => left.correctPercent - right.correctPercent) : []), [stats, total]);
  const shouldRemind = useMemo(() => (total ? (stats?.questions ?? []).filter((item) => item.correctPercent >= 50 && item.correctPercent < 75) : []), [stats, total]);
  const topicRows = useMemo(() => {
    if (!stats || !total) return [];
    const buckets = new Map<Hk1Topic, { correct: number; questions: number }>();
    for (const item of stats.questions) {
      const topic = hk1Questions[item.number - 1].topic;
      const bucket = buckets.get(topic) ?? { correct: 0, questions: 0 };
      bucket.correct += item.counts[item.correct];
      bucket.questions += 1;
      buckets.set(topic, bucket);
    }
    return [...buckets].map(([topic, bucket]) => ({ topic, questions: bucket.questions, percent: percentOf(bucket.correct, bucket.questions * total) }))
      .sort((left, right) => left.percent - right.percent);
  }, [stats, total]);
  const averagePercent = stats?.averageCorrect != null ? Math.round((stats.averageCorrect / HK1_REVIEW_QUESTION_COUNT) * 100) : null;
  const rosterSize = getRosterSize(className);
  const studentsByNumber = useMemo(() => new Map((stats?.students ?? []).map((student) => [student.studentNumber, student])), [stats]);

  if (!stats) {
    return (
      <section className={`hk1-dashboard ${presentation ? "presentation" : ""}`}>
        {error ? <div className="teacher-results-error"><p>{error}</p><button type="button" className="secondary-button" onClick={() => void load()}>Thử lại</button></div> : <div className="teacher-results-loading"><span className="loading-dot" /> Đang tải thống kê…</div>}
      </section>
    );
  }

  return (
    <section className={`hk1-dashboard ${presentation ? "presentation" : ""}`} aria-label="Thống kê trắc nghiệm Ôn thi HK1">
      <div className="hk1-dashboard-head">
        <div>
          <p className="eyebrow">THỐNG KÊ TỪNG CÂU · {className}</p>
          <h2>{total ? `Dựa trên ${total} bài đã thu` : "Chưa có bài nào được thu"}</h2>
          <p className="hk1-live-note"><i /> Tự cập nhật mỗi 5 giây{updatedAt ? ` · lần cuối ${updatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : ""}{error ? ` · ${error}` : ""}</p>
        </div>
        <div className="hk1-kpis">
          <div><span>Đã thu</span><strong>{stats.submittedCount}</strong><small>{total} bài có đáp án</small></div>
          <div><span>Đang làm</span><strong>{stats.draftCount}</strong><small>chưa nộp</small></div>
          <div><span>Điểm TB</span><strong>{stats.averageCorrect != null ? stats.averageCorrect.toFixed(1).replace(".", ",") : "–"}</strong><small>/ 28 câu</small></div>
          <div className={averagePercent != null ? `level-${level(averagePercent)}` : ""}><span>Tỉ lệ đúng</span><strong>{averagePercent != null ? `${averagePercent}%` : "–"}</strong><small>trung bình lớp</small></div>
        </div>
      </div>

      {total ? (
        <div className="hk1-focus-grid">
          <div className="hk1-focus-card must">
            <h3>Cần chữa kĩ <small>dưới 50% đúng</small></h3>
            {mustReview.length ? <div className="hk1-chip-row">{mustReview.map((item) => <a key={item.number} href={`#hk1-q${item.number}`}>Câu {item.number}<b>{item.correctPercent}%</b></a>)}</div> : <p>Không có câu nào. Cả lớp làm tốt!</p>}
          </div>
          <div className="hk1-focus-card remind">
            <h3>Nhắc lại nhanh <small>50–74% đúng</small></h3>
            {shouldRemind.length ? <div className="hk1-chip-row">{shouldRemind.map((item) => <a key={item.number} href={`#hk1-q${item.number}`}>Câu {item.number}<b>{item.correctPercent}%</b></a>)}</div> : <p>Không có câu nào.</p>}
          </div>
          <div className="hk1-focus-card topics">
            <h3>Theo chủ đề</h3>
            <ul>
              {topicRows.map((row) => (
                <li key={row.topic} className={`level-${level(row.percent)}`}>
                  <span>{hk1TopicLabels[row.topic]} <small>({row.questions} câu)</small></span>
                  <i><b style={{ width: `${row.percent}%` }} /></i>
                  <strong>{row.percent}%</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="hk1-empty">
          <strong>Thống kê sẽ hiện ở đây sau khi thu bài.</strong>
          <p>Khi hết giờ, bấm <b>Thu bài ngay</b> ở khung phía trên. Bài học sinh đang làm dở cũng được thu và đưa vào thống kê.</p>
        </div>
      )}

      <div className="hk1-toolbar">
        <div className="hk1-segmented" role="group" aria-label="Sắp xếp câu hỏi">
          <button type="button" aria-pressed={sortMode === "number"} onClick={() => setSortMode("number")}>Theo thứ tự câu</button>
          <button type="button" aria-pressed={sortMode === "hardest"} onClick={() => setSortMode("hardest")}>Sai nhiều nhất trước</button>
        </div>
        <label className="hk1-switch">
          <input type="checkbox" checked={showKey} onChange={(event) => setShowKey(event.target.checked)} />
          <span aria-hidden="true" />
          Hiện đáp án đúng
        </label>
        <div className="hk1-legend" aria-hidden="true">
          <span className="low">dưới 50%</span><span className="mid">50–74%</span><span className="high">từ 75%</span>{showKey ? <span className="trap">đáp án nhiễu ≥ {MISCONCEPTION_PERCENT}%</span> : null}
        </div>
      </div>

      <div className="hk1-question-grid">
        {sortedQuestions.map((stat) => <div key={stat.number} id={`hk1-q${stat.number}`}><QuestionCard stat={stat} total={total} showKey={showKey} /></div>)}
      </div>

      {!presentation ? (
        <details className="hk1-students">
          <summary><strong>Tiến độ từng học sinh</strong><small>{stats.students.filter((student) => student.answered > 0).length}/{rosterSize} em đã tô đáp án</small></summary>
          <div className="hk1-student-grid">
            {Array.from({ length: rosterSize }, (_, index) => index + 1).map((number) => {
              const student = studentsByNumber.get(number);
              const state = !student || student.answered === 0 ? "empty" : student.status === "submitted" ? "submitted" : "draft";
              return (
                <div key={number} className={`hk1-student ${state}`}>
                  <strong>{formatStudentNumber(number)}</strong>
                  <span>{state === "empty" ? "Chưa tô" : state === "draft" ? `Đang làm ${student!.answered}/28` : `${student!.correct}/28 đúng`}</span>
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </section>
  );
}
