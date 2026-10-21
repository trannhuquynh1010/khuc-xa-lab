"use client";

import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { formatStudentNumber, groupNames } from "@/lib/classes";
import {
  getOpticsQuestGroupColor,
  getOpticsQuestQuestion,
  getOpticsQuestQuestions,
  OPTICS_QUEST_QUESTION_COUNT,
  type OpticsQuestAnswers,
  type OpticsQuestQuestion,
  type OpticsQuestReveal,
} from "@/lib/optics-quest";
import PracticeIdentityFields from "./PracticeIdentityFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import usePracticeAttempt from "./usePracticeAttempt";

const stationIcons = ["↘", "◉", "◇", "△", "●", "✦"];

function formatTime(seconds: number | null) {
  if (seconds === null) return "--:--";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function OpticsVisual({ question }: { question: OpticsQuestQuestion }) {
  return (
    <svg className={`quest-visual ${question.visual}`} viewBox="0 0 520 230" role="img" aria-label={`Minh họa ${question.stationLabel}`}>
      <defs>
        <linearGradient id="spectrum" x1="0" x2="1"><stop stopColor="#ef4444"/><stop offset=".2" stopColor="#f59e0b"/><stop offset=".4" stopColor="#facc15"/><stop offset=".58" stopColor="#22c55e"/><stop offset=".78" stopColor="#3b82f6"/><stop offset="1" stopColor="#7c3aed"/></linearGradient>
      </defs>
      {question.visual === "refraction" && <><line className="quest-surface" x1="40" y1="115" x2="480" y2="115"/><line className="quest-normal" x1="260" y1="20" x2="260" y2="210"/><path className="quest-ray" d="M120 35 L260 115 L320 205"/><circle cx="260" cy="115" r="7"/></>}
      {question.visual === "apparent" && <><rect className="quest-water" x="20" y="105" width="480" height="115"/><circle className="quest-object" cx="280" cy="184" r="13"/><path className="quest-ray" d="M280 184 L220 105 L118 44"/><path className="quest-virtual" d="M220 105 L160 26"/><path className="quest-eye" d="M95 45 q22 -20 44 0 q-22 20 -44 0"/></>}
      {question.visual === "tir" && <><rect className="quest-glass" x="20" y="30" width="480" height="155" rx="18"/><path className="quest-ray" d="M55 150 L155 65 L255 150 L355 65 L465 150"/><line className="quest-surface" x1="20" y1="185" x2="500" y2="185"/></>}
      {question.visual === "prism" && <><path className="quest-prism" d="M190 205 L300 25 L410 205 Z"/><path className="quest-ray" d="M25 105 L240 105"/><path className="quest-ray" d="M240 105 L465 165" style={{stroke:"url(#spectrum)",strokeWidth:18}}/></>}
      {question.visual === "color" && <><circle className="quest-lamp" cx="80" cy="70" r="30"/><rect className="quest-color-object" x="230" y="78" width="80" height="90" rx="16"/><path className="quest-ray" d="M112 74 L230 108"/><path className="quest-ray" d="M310 110 L420 62"/><path className="quest-eye" d="M410 62 q28 -24 56 0 q-28 24 -56 0"/></>}
      {question.visual === "boss" && <><path className="quest-lighthouse" d="M215 205 L240 58 L290 58 L315 205 Z M232 58 L247 28 L283 28 L298 58"/><path className="quest-ray" d="M292 52 L488 18 M292 52 L498 72 M292 52 L470 124"/><circle className="quest-beacon" cx="265" cy="48" r="16"/></>}
    </svg>
  );
}

export default function OpticsQuestGame({ round, running, startedAt, endedAt }: { round: number; running: boolean; startedAt: string | null; endedAt: string | null }) {
  const [groupName, setGroupName] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reveal, setReveal] = useState<OpticsQuestReveal | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const answers = useMemo<OpticsQuestAnswers>(() => ({ round, groupName, questionIds, responses }), [round, groupName, questionIds, responses]);
  const answeredCount = useMemo(() => questionIds.filter((id) => (responses[id] ?? "").trim().length > 0).length, [questionIds, responses]);
  const attempt = usePracticeAttempt("optics-quest", answers, answeredCount, { allowEarlySubmit: true });
  const identityKey = `${round}:${attempt.className || "none"}:${attempt.studentNumber || "none"}`;
  const localDraftKey = deviceDraftKey(`optics-quest:${identityKey}`);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuestionIds(attempt.identityReady ? getOpticsQuestQuestions(Number(attempt.studentNumber), round).map((question) => question.id) : []);
      setResponses({});
      setCurrentIndex(0);
      setReveal(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [attempt.identityReady, attempt.studentNumber, identityKey, round]);

  const { draftStatus } = useDeviceDraft(localDraftKey, answers, (value) => {
    if (!attempt.identityReady || !isDraftRecord(value) || Number(value.round) !== round) return;
    const expected = getOpticsQuestQuestions(Number(attempt.studentNumber), round).map((question) => question.id);
    const stored = Array.isArray(value.questionIds) ? value.questionIds.filter((item): item is string => typeof item === "string") : [];
    if (stored.join("|") !== expected.join("|")) return;
    setQuestionIds(expected);
    if (typeof value.groupName === "string" && groupNames.includes(value.groupName as (typeof groupNames)[number])) setGroupName(value.groupName);
    if (isDraftRecord(value.responses)) setResponses(Object.fromEntries(Object.entries(value.responses).filter((entry): entry is [string, string] => typeof entry[1] === "string")));
  });

  const questions = useMemo(() => questionIds.map(getOpticsQuestQuestion).filter((question): question is OpticsQuestQuestion => Boolean(question)), [questionIds]);
  const currentQuestion = questions[Math.min(currentIndex, Math.max(0, questions.length - 1))] ?? null;
  const currentResponse = currentQuestion ? responses[currentQuestion.id] ?? "" : "";
  const groupColorStyle = { "--quest-group-color": getOpticsQuestGroupColor(groupName) } as CSSProperties;
  const identityLocked = answeredCount > 0 || attempt.locked || Boolean(endedAt);

  useEffect(() => {
    if (!running || !startedAt) return;
    const tick = () => {
      const delta = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setCountdown(Math.max(0, Math.ceil(-delta)));
      setElapsedSeconds(Math.max(0, Math.floor(delta)));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [running, startedAt]);

  useEffect(() => {
    if (!attempt.identityReady || (!endedAt && !attempt.locked)) return;
    const controller = new AbortController();
    const fetchReveal = () => {
      const params = new URLSearchParams({ className: attempt.className, studentNumber: attempt.studentNumber });
      void fetch(`/api/optics-quest?${params}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => { if (response.ok) setReveal(await response.json()); })
        .catch(() => undefined);
    };
    fetchReveal();
    const interval = window.setInterval(fetchReveal, 3000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [attempt.identityReady, attempt.className, attempt.studentNumber, endedAt, attempt.locked]);

  function updateResponse(value: string) {
    if (!currentQuestion) return;
    setResponses((current) => ({ ...current, [currentQuestion.id]: value }));
  }

  async function submitEarly() {
    if (!window.confirm(`Nộp bài sớm với ${answeredCount}/${OPTICS_QUEST_QUESTION_COUNT} câu đã trả lời? Sau khi nộp em không thể sửa nữa.`)) return;
    await attempt.submit();
  }

  return (
    <div className="optics-quest-game" style={groupColorStyle}>
      <div className="quest-hero"><div><p className="eyebrow">VÒNG {round} · ĐUA CÁ NHÂN</p><h2>Giải cứu Hải đăng Ánh sáng</h2><p>12 câu · 6 trạm. Tự do làm theo thứ tự em muốn; đáp án công bố khi giáo viên kết thúc.</p>{groupName ? <span className="quest-team-badge"><i />{groupName}</span> : null}</div><div className="quest-energy"><span>ĐÃ TRẢ LỜI</span><strong>{answeredCount}/{OPTICS_QUEST_QUESTION_COUNT}</strong><small>{startedAt ? formatTime(elapsedSeconds) : "--:--"}</small></div></div>

      <fieldset className="quest-identity" disabled={identityLocked}>
        <legend className="sr-only">Thông tin người chơi</legend>
        <PracticeIdentityFields practiceKey="optics-quest" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
        <label>Nhóm<select value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </fieldset>

      {!attempt.identityReady || !groupName ? (
        <div className="quest-lobby"><span>✦</span><div><h3>Chọn lớp, STT và nhóm</h3><p>Mỗi học sinh làm cá nhân; điểm nhóm là trung bình số câu đúng của các thành viên.</p></div></div>
      ) : reveal?.ended ? (
        <div className="quest-result">
          <div className="quest-result-head"><span>✦</span><div><p className="eyebrow">KẾT QUẢ ĐÃ CÔNG BỐ</p><h3>{reveal.correctCount}/{reveal.totalItems} câu đúng</h3><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName} · thời gian {formatTime(reveal.elapsedSeconds)}</p></div></div>
          <ol className="quest-review-list">
            {reveal.items.map((item, index) => {
              const question = getOpticsQuestQuestion(item.id);
              const yourLabel = !item.answered ? "(bỏ trống)" : question?.kind === "choice" ? (question.choices?.find((choice) => choice.value === item.response)?.label ?? item.response) : item.response;
              const correctLabel = question?.kind === "choice" ? (question.choices?.find((choice) => choice.value === item.correctAnswer)?.label ?? item.correctAnswer) : `${item.correctAnswer}${question?.unit ? ` ${question.unit}` : ""}`;
              return (
                <li key={item.id} className={item.correct ? "correct" : "incorrect"}>
                  <b>Câu {index + 1}. {question?.title ?? item.id} {item.correct ? "✓" : "✗"}</b>
                  <p>Trả lời của em: {yourLabel}</p>
                  {!item.correct ? <p className="quest-correct-answer">Đáp án đúng: {correctLabel}</p> : null}
                  <small>{item.explanation}</small>
                </li>
              );
            })}
          </ol>
        </div>
      ) : endedAt ? (
        <div className="quest-lobby"><span className="loading-dot" /><div><h3>Đang tải kết quả…</h3><p>Giáo viên đã kết thúc trò chơi.</p></div></div>
      ) : attempt.locked ? (
        <div className="quest-finish"><span>✦</span><div><p className="eyebrow">ĐÃ NỘP BÀI</p><h3>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</h3><p>Đã trả lời {answeredCount}/{OPTICS_QUEST_QUESTION_COUNT} câu. Chờ giáo viên công bố đáp án.</p></div></div>
      ) : attempt.checking ? (
        <div className="quest-lobby"><span className="loading-dot" /><div><h3>Đang mở hồ sơ người chơi…</h3></div></div>
      ) : !running ? (
        <div className="quest-lobby ready"><span>⌁</span><div><p className="eyebrow">ĐÃ VÀO TRẠM</p><h3>Chờ giáo viên bắt đầu</h3><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</p></div></div>
      ) : countdown > 0 ? (
        <div className="race-countdown"><p>HẢI ĐĂNG KHỞI ĐỘNG SAU</p><strong>{countdown}</strong><span>Sẵn sàng!</span></div>
      ) : currentQuestion ? (
        <div className="quest-play">
          <div className="quest-palette" aria-label="Danh sách 12 câu">
            {questions.map((question, index) => {
              const answered = (responses[question.id] ?? "").trim().length > 0;
              return <button key={question.id} type="button" className={`${index === currentIndex ? "current" : ""} ${answered ? "answered" : "skip"}`} title={`Câu ${index + 1}${answered ? " · đã trả lời" : " · chưa làm"}`} onClick={() => setCurrentIndex(index)}>{index + 1}</button>;
            })}
          </div>
          <fieldset className="quest-question" disabled={attempt.submitting}>
            <legend className="sr-only">Câu {currentIndex + 1}</legend>
            <div className="quest-question-head"><span>{stationIcons[currentQuestion.station - 1]}</span><div><p className="eyebrow">CÂU {currentIndex + 1}/{OPTICS_QUEST_QUESTION_COUNT} · TRẠM {currentQuestion.station} · {currentQuestion.stationLabel}</p><h3>{currentQuestion.title}</h3></div></div>
            <div className="quest-question-grid">
              <OpticsVisual question={currentQuestion} />
              <div className="quest-answer">
                <p>{currentQuestion.prompt}</p>
                {currentQuestion.kind === "choice"
                  ? <div className="quest-choices">{currentQuestion.choices?.map((choice, index) => <button key={choice.value} type="button" className={currentResponse === choice.value ? "selected" : ""} aria-pressed={currentResponse === choice.value} onClick={() => updateResponse(choice.value)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}</div>
                  : <label>Đáp án<div><input inputMode="decimal" value={currentResponse} onChange={(event) => updateResponse(event.target.value)} placeholder="Nhập số"/><span>{currentQuestion.unit}</span></div></label>}
              </div>
            </div>
            <div className="quest-actions">
              <div className="quest-nav-buttons">
                <button type="button" className="secondary-button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}>‹ Câu trước</button>
                <button type="button" className="secondary-button" disabled={currentIndex >= questions.length - 1} onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}>Câu sau ›</button>
              </div>
              {currentIndex === questions.length - 1 ? <button type="button" className="primary-button" disabled={attempt.submitting} onClick={submitEarly}>{attempt.submitting ? "Đang nộp…" : "Nộp bài sớm"}</button> : null}
            </div>
          </fieldset>
        </div>
      ) : null}

      <div className="quest-sync"><span>{attempt.saving ? "Đang đồng bộ…" : draftStatus}</span><strong>{answeredCount}/{OPTICS_QUEST_QUESTION_COUNT} câu đã trả lời{answeredCount < OPTICS_QUEST_QUESTION_COUNT ? ` · còn ${OPTICS_QUEST_QUESTION_COUNT - answeredCount} câu bỏ trống` : ""}</strong></div>
      {attempt.message && !attempt.locked ? <p className={`form-message ${attempt.messageType}`}>{attempt.message}</p> : null}
    </div>
  );
}
