"use client";

import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { formatStudentNumber, groupNames } from "@/lib/classes";
import {
  getOhmRaceGroupColor,
  getOhmRaceQuestion,
  getOhmRaceQuestions,
  OHM_RACE_QUESTION_COUNT,
  type OhmRaceAnswers,
  type OhmRaceQuestion,
  type OhmRaceReveal,
} from "@/lib/ohm-race";
import PracticeIdentityFields from "./PracticeIdentityFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import usePracticeAttempt from "./usePracticeAttempt";

const stationIcons = ["↗", "≋", "◎", "⚠", "ϟ"];

function formatTime(seconds: number | null) {
  if (seconds === null) return "--:--";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function OhmRaceGame({ round, running, startedAt, endedAt }: { round: number; running: boolean; startedAt: string | null; endedAt: string | null }) {
  const [groupName, setGroupName] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reveal, setReveal] = useState<OhmRaceReveal | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const answers = useMemo<OhmRaceAnswers>(() => ({ round, groupName, questionIds, responses }), [round, groupName, questionIds, responses]);
  const answeredCount = useMemo(() => questionIds.filter((id) => (responses[id] ?? "").trim().length > 0).length, [questionIds, responses]);
  const attempt = usePracticeAttempt("ohm-race", answers, answeredCount, { allowEarlySubmit: true });
  const identityKey = `${round}:${attempt.className || "none"}:${attempt.studentNumber || "none"}`;
  const localDraftKey = deviceDraftKey(`ohm-race:${identityKey}`);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuestionIds(attempt.identityReady ? getOhmRaceQuestions(Number(attempt.studentNumber), round).map((question) => question.id) : []);
      setResponses({});
      setCurrentIndex(0);
      setReveal(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [attempt.identityReady, attempt.studentNumber, identityKey, round]);

  const { draftStatus } = useDeviceDraft(localDraftKey, answers, (value) => {
    if (!attempt.identityReady || !isDraftRecord(value) || Number(value.round) !== round) return;
    const expected = getOhmRaceQuestions(Number(attempt.studentNumber), round).map((question) => question.id);
    const stored = Array.isArray(value.questionIds) ? value.questionIds.filter((item): item is string => typeof item === "string") : [];
    if (stored.join("|") !== expected.join("|")) return;
    setQuestionIds(expected);
    if (typeof value.groupName === "string" && groupNames.includes(value.groupName as (typeof groupNames)[number])) setGroupName(value.groupName);
    if (isDraftRecord(value.responses)) setResponses(Object.fromEntries(Object.entries(value.responses).filter((entry): entry is [string, string] => typeof entry[1] === "string")));
  });

  const questions = useMemo(() => questionIds.map(getOhmRaceQuestion).filter((question): question is OhmRaceQuestion => Boolean(question)), [questionIds]);
  const currentQuestion = questions[Math.min(currentIndex, Math.max(0, questions.length - 1))] ?? null;
  const currentResponse = currentQuestion ? responses[currentQuestion.id] ?? "" : "";
  const groupColorStyle = { "--quest-group-color": getOhmRaceGroupColor(groupName) } as CSSProperties;
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
      void fetch(`/api/ohm-race?${params}`, { cache: "no-store", signal: controller.signal })
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
    if (!window.confirm(`Nộp bài sớm với ${answeredCount}/${OHM_RACE_QUESTION_COUNT} câu đã trả lời? Sau khi nộp em không thể sửa nữa.`)) return;
    await attempt.submit();
  }

  return (
    <div className="ohm-race-game optics-quest-game" style={groupColorStyle}>
      <div className="quest-hero race-hero-quest"><div><p className="eyebrow">VÒNG {round} · ĐUA THEO NHÓM</p><h2>Đường đua Điện học</h2><p>15 câu · 5 trạm. Tự do làm theo thứ tự em muốn; đáp án công bố khi giáo viên kết thúc.</p>{groupName ? <span className="quest-team-badge"><i />{groupName}</span> : null}</div><div className="quest-energy"><span>ĐÃ TRẢ LỜI</span><strong>{answeredCount}/{OHM_RACE_QUESTION_COUNT}</strong><small>{startedAt ? formatTime(elapsedSeconds) : "--:--"}</small></div></div>

      <fieldset className="quest-identity" disabled={identityLocked}>
        <legend className="sr-only">Thông tin người chơi</legend>
        <PracticeIdentityFields practiceKey="ohm-race" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
        <label>Nhóm<select value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </fieldset>

      {!attempt.identityReady || !groupName ? (
        <div className="quest-lobby"><span>ϟ</span><div><h3>Chọn lớp, STT và nhóm</h3><p>Mỗi học sinh làm cá nhân; điểm nhóm là trung bình số câu đúng của các thành viên.</p></div></div>
      ) : reveal?.ended ? (
        <div className="quest-result">
          <div className="quest-result-head"><span>ϟ</span><div><p className="eyebrow">KẾT QUẢ ĐÃ CÔNG BỐ</p><h3>{reveal.correctCount}/{reveal.totalItems} câu đúng</h3><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName} · thời gian {formatTime(reveal.elapsedSeconds)}</p></div></div>
          <ol className="quest-review-list">
            {reveal.items.map((item, index) => {
              const question = getOhmRaceQuestion(item.id);
              const yourLabel = !item.answered ? "(bỏ trống)" : question?.kind === "choice" ? (question.choices?.find((choice) => choice.value === item.response)?.label ?? item.response) : item.response;
              const correctLabel = question?.kind === "choice" ? (question.choices?.find((choice) => choice.value === item.correctAnswer)?.label ?? item.correctAnswer) : `${item.correctAnswer}${question?.unit ? ` ${question.unit}` : ""}`;
              return (
                <li key={item.id} className={item.correct ? "correct" : "incorrect"}>
                  <b>Câu {index + 1}. {question?.title ?? item.id} {item.correct ? "✓" : "✗"}</b>
                  {/* Hiện lại đề bài để em nhớ câu hỏi cho gì, không chỉ thấy đáp án. */}
                  {question ? <p className="quest-review-prompt">{question.prompt}</p> : null}
                  {question?.detail ? <p className="quest-review-detail">{question.detail}</p> : null}
                  {question?.kind === "choice" && question.choices ? (
                    <ul className="quest-review-choices">
                      {question.choices.map((choice, choiceIndex) => {
                        const isCorrect = choice.value === item.correctAnswer;
                        const isMine = choice.value === item.response;
                        return (
                          <li key={choice.value} className={isCorrect ? "correct" : isMine ? "picked-wrong" : ""}>
                            <span>{isCorrect ? "✓" : isMine ? "✗" : String.fromCharCode(65 + choiceIndex)}</span>
                            <span>{choice.label}{isMine ? <i> — em đã chọn</i> : null}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p>Trả lời của em: {yourLabel}{question?.unit && item.answered ? ` ${question.unit}` : ""}</p>
                  )}
                  {!item.correct ? <p className="quest-correct-answer">Đáp án đúng: {correctLabel}</p> : null}
                  {!item.correct ? <small><b>Cách làm:</b> {item.explanation}</small> : <small>{item.explanation}</small>}
                </li>
              );
            })}
          </ol>
        </div>
      ) : endedAt ? (
        <div className="quest-lobby"><span className="loading-dot" /><div><h3>Đang tải kết quả…</h3><p>Giáo viên đã kết thúc trò chơi.</p></div></div>
      ) : attempt.locked ? (
        <div className="quest-finish"><span>ϟ</span><div><p className="eyebrow">ĐÃ NỘP BÀI</p><h3>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</h3><p>Đã trả lời {answeredCount}/{OHM_RACE_QUESTION_COUNT} câu. Chờ giáo viên công bố đáp án.</p></div></div>
      ) : attempt.checking ? (
        <div className="quest-lobby"><span className="loading-dot" /><div><h3>Đang mở hồ sơ người chơi…</h3></div></div>
      ) : !running ? (
        <div className="quest-lobby ready"><span>⌁</span><div><p className="eyebrow">ĐÃ VÀO LÀN</p><h3>Chờ giáo viên bắt đầu</h3><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</p></div></div>
      ) : countdown > 0 ? (
        <div className="race-countdown"><p>CUỘC ĐUA BẮT ĐẦU SAU</p><strong>{countdown}</strong><span>Chuẩn bị!</span></div>
      ) : currentQuestion ? (
        <div className="quest-play">
          <div className="quest-palette" aria-label="Danh sách 15 câu">
            {questions.map((question, index) => {
              const answered = (responses[question.id] ?? "").trim().length > 0;
              return <button key={question.id} type="button" className={`${index === currentIndex ? "current" : ""} ${answered ? "answered" : "skip"}`} title={`Câu ${index + 1} · trạm ${question.station}${answered ? " · đã trả lời" : " · chưa làm"}`} onClick={() => setCurrentIndex(index)}>{index + 1}</button>;
            })}
          </div>
          <fieldset className="quest-question" disabled={attempt.submitting}>
            <legend className="sr-only">Câu {currentIndex + 1}</legend>
            <div className="quest-question-head"><span>{stationIcons[currentQuestion.station - 1]}</span><div><p className="eyebrow">CÂU {currentIndex + 1}/{OHM_RACE_QUESTION_COUNT} · TRẠM {currentQuestion.station} · {currentQuestion.stationLabel}</p><h3>{currentQuestion.title}</h3></div></div>
            <div className="quest-answer-only">
              <p>{currentQuestion.prompt}</p>
              {currentQuestion.detail ? <p className="race-detail">{currentQuestion.detail}</p> : null}
              {currentQuestion.kind === "choice"
                ? <div className="quest-choices">{currentQuestion.choices?.map((choice, index) => <button key={choice.value} type="button" className={currentResponse === choice.value ? "selected" : ""} aria-pressed={currentResponse === choice.value} onClick={() => updateResponse(choice.value)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}</div>
                : <label>Đáp án<div><input inputMode="decimal" value={currentResponse} onChange={(event) => updateResponse(event.target.value)} placeholder="Nhập số"/><span>{currentQuestion.unit}</span></div></label>}
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

      <div className="quest-sync"><span>{attempt.saving ? "Đang đồng bộ…" : draftStatus}</span><strong>{answeredCount}/{OHM_RACE_QUESTION_COUNT} câu đã trả lời{answeredCount < OHM_RACE_QUESTION_COUNT ? ` · còn ${OHM_RACE_QUESTION_COUNT - answeredCount} câu bỏ trống` : ""}</strong></div>
      {attempt.message && !attempt.locked ? <p className={`form-message ${attempt.messageType}`}>{attempt.message}</p> : null}
    </div>
  );
}
