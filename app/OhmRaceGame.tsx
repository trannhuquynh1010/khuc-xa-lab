"use client";

import { useEffect, useMemo, useState } from "react";
import { formatStudentNumber } from "@/lib/classes";
import {
  getOhmRaceQuestion,
  getOhmRaceQuestions,
  isOhmRaceAnswerCorrect,
  OHM_RACE_PENALTY_SECONDS,
  OHM_RACE_STATION_COUNT,
  type OhmRaceAnswers,
  type OhmRaceSnapshot,
} from "@/lib/ohm-race";
import PracticeIdentityFields from "./PracticeIdentityFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import usePracticeAttempt from "./usePracticeAttempt";

const meterNeedlePositions: Record<string, number> = {
  "meter-034": 17 / 30,
  "meter-9": 18 / 30,
  "meter-14": 7 / 15,
  "meter-75": 15 / 24,
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function OhmRaceGame({ round, running, startedAt }: { round: number; running: boolean; startedAt: string | null }) {
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [clearedQuestionIds, setClearedQuestionIds] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "idle" | "correct" | "incorrect"; text: string }>({ type: "idle", text: "" });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [snapshot, setSnapshot] = useState<OhmRaceSnapshot | null>(null);

  const answers = useMemo<OhmRaceAnswers>(() => ({ round, questionIds, responses, clearedQuestionIds, wrongCount }), [clearedQuestionIds, questionIds, responses, round, wrongCount]);
  const attempt = usePracticeAttempt("ohm-race", answers, clearedQuestionIds.length);
  const identityKey = `${round}:${attempt.className || "none"}:${attempt.studentNumber || "none"}`;
  const localDraftKey = deviceDraftKey(`ohm-race:${identityKey}`);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuestionIds(attempt.identityReady ? getOhmRaceQuestions(Number(attempt.studentNumber), round).map((question) => question.id) : []);
      setResponses({});
      setClearedQuestionIds([]);
      setWrongCount(0);
      setFeedback({ type: "idle", text: "" });
      setSnapshot(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [attempt.identityReady, attempt.studentNumber, identityKey, round]);

  const { draftStatus } = useDeviceDraft(localDraftKey, answers, (value) => {
    if (!attempt.identityReady || !isDraftRecord(value) || Number(value.round) !== round) return;
    const expectedIds = getOhmRaceQuestions(Number(attempt.studentNumber), round).map((question) => question.id);
    const storedIds = Array.isArray(value.questionIds) ? value.questionIds.filter((item): item is string => typeof item === "string") : [];
    if (storedIds.join("|") !== expectedIds.join("|")) return;
    setQuestionIds(expectedIds);
    if (isDraftRecord(value.responses)) {
      setResponses(Object.fromEntries(Object.entries(value.responses).filter((entry): entry is [string, string] => typeof entry[1] === "string")));
    }
    if (Array.isArray(value.clearedQuestionIds)) {
      setClearedQuestionIds(value.clearedQuestionIds.filter((item): item is string => typeof item === "string" && expectedIds.includes(item)));
    }
    const restoredWrongCount = Number(value.wrongCount);
    if (Number.isFinite(restoredWrongCount)) setWrongCount(Math.min(99, Math.max(0, Math.trunc(restoredWrongCount))));
  });

  const questions = useMemo(() => questionIds.map(getOhmRaceQuestion).filter((question) => question !== undefined), [questionIds]);
  const clearedSet = useMemo(() => new Set(clearedQuestionIds), [clearedQuestionIds]);
  const progress = questions.filter((question) => clearedSet.has(question.id) && isOhmRaceAnswerCorrect(question, responses[question.id] ?? "")).length;
  const currentQuestion = questions.find((question) => !clearedSet.has(question.id));
  const currentResponse = currentQuestion ? responses[currentQuestion.id] ?? "" : "";
  const finishedLocally = questions.length === OHM_RACE_STATION_COUNT && progress === OHM_RACE_STATION_COUNT;
  const ownRacer = snapshot?.racers.find((racer) => racer.studentNumber === Number(attempt.studentNumber));

  useEffect(() => {
    if (!running || !startedAt) return;
    const updateClock = () => {
      const deltaSeconds = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setCountdownSeconds(Math.max(0, Math.ceil(-deltaSeconds)));
      setElapsedSeconds(Math.max(0, Math.floor(deltaSeconds)));
    };
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, [running, startedAt]);

  useEffect(() => {
    if (!attempt.locked || !attempt.identityReady) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ className: attempt.className });
    void fetch(`/api/ohm-race?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) setSnapshot(data as OhmRaceSnapshot);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [attempt.className, attempt.identityReady, attempt.locked]);

  function updateResponse(value: string) {
    if (!currentQuestion) return;
    setResponses((current) => ({ ...current, [currentQuestion.id]: value }));
    setFeedback({ type: "idle", text: "" });
  }

  function checkCurrentStation() {
    if (!currentQuestion || !currentResponse.trim()) {
      setFeedback({ type: "incorrect", text: "Hãy chọn hoặc nhập một đáp án." });
      return;
    }
    if (!isOhmRaceAnswerCorrect(currentQuestion, currentResponse)) {
      setWrongCount((count) => Math.min(99, count + 1));
      setFeedback({ type: "incorrect", text: `Chưa đúng · cộng ${OHM_RACE_PENALTY_SECONDS} giây. Hãy kiểm tra lại.` });
      return;
    }
    setClearedQuestionIds((current) => current.includes(currentQuestion.id) ? current : [...current, currentQuestion.id]);
    setFeedback({ type: "correct", text: currentQuestion.station === OHM_RACE_STATION_COUNT ? "Đã mở khóa trạm năng lượng!" : `Qua trạm ${currentQuestion.station}! Đang chuyển tới thử thách tiếp theo.` });
  }

  async function finishRace() {
    await attempt.submit();
  }

  const meterPosition = currentQuestion ? meterNeedlePositions[currentQuestion.id] : undefined;

  return (
    <div className="ohm-race-game">
      <div className="race-hero">
        <div><p className="eyebrow">VÒNG {round} · ĐUA CÁ NHÂN</p><h3>Khôi phục trạm năng lượng</h3><p>Đúng mới được đi tiếp. Mỗi lần sai cộng {OHM_RACE_PENALTY_SECONDS} giây.</p></div>
        <div className="race-clock"><span>THỜI GIAN</span><strong>{startedAt ? formatTime(elapsedSeconds) : "--:--"}</strong><small>Phạt +{wrongCount * OHM_RACE_PENALTY_SECONDS}s</small></div>
      </div>

      <PracticeIdentityFields practiceKey="ohm-race" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />

      <div className="race-track" aria-label={`Đã vượt ${progress} trên ${OHM_RACE_STATION_COUNT} trạm`}>
        <div className="race-track-line"><span style={{ width: `${progress / OHM_RACE_STATION_COUNT * 100}%` }} /></div>
        {Array.from({ length: OHM_RACE_STATION_COUNT }, (_, index) => {
          const station = index + 1;
          const state = station <= progress ? "done" : station === progress + 1 ? "current" : "locked";
          return <div key={station} className={`race-station ${state}`}><b>{station <= progress ? "✓" : station}</b><span>{station === OHM_RACE_STATION_COUNT ? "Đích" : `Trạm ${station}`}</span></div>;
        })}
        <span className="race-runner" style={{ left: `${Math.min(96, progress / OHM_RACE_STATION_COUNT * 96)}%` }} aria-hidden="true">ϟ</span>
      </div>

      {!attempt.identityReady ? (
        <div className="race-lobby"><span aria-hidden="true">⌁</span><div><h4>Chọn lớp và STT</h4><p>Thông tin này xác định làn đua và lưu tiến độ của em.</p></div></div>
      ) : attempt.checking ? (
        <div className="race-lobby"><span className="loading-dot" /><div><h4>Đang kiểm tra làn đua…</h4></div></div>
      ) : attempt.locked ? (
        <div className="race-finish-card">
          <span aria-hidden="true">⚡</span>
          <div><p className="eyebrow">ĐÃ VỀ ĐÍCH</p><h4>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))}</h4><p>{ownRacer?.rank ? `Hạng tạm thời: ${ownRacer.rank}/${snapshot?.finishedCount ?? "—"}` : "Kết quả đã được ghi nhận trên đường đua của lớp."}</p></div>
          {ownRacer?.adjustedSeconds !== null && ownRacer?.adjustedSeconds !== undefined ? <strong>{formatTime(ownRacer.adjustedSeconds)}</strong> : null}
        </div>
      ) : !running ? (
        <div className="race-lobby ready"><span aria-hidden="true">⚡</span><div><p className="eyebrow">ĐÃ VÀO LÀN</p><h4>Chờ giáo viên bắt đầu</h4><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))}</p></div></div>
      ) : countdownSeconds > 0 ? (
        <div className="race-countdown" aria-live="assertive"><p>CUỘC ĐUA BẮT ĐẦU SAU</p><strong>{countdownSeconds}</strong><span>Chuẩn bị!</span></div>
      ) : finishedLocally ? (
        <div className="race-final-gate">
          <div><span aria-hidden="true">⚡</span><p className="eyebrow">6/6 TRẠM</p><h4>Trạm năng lượng đã sáng!</h4><p>Bấm về đích để ghi thời gian lên bảng xếp hạng.</p></div>
          <button type="button" className="primary-button" disabled={attempt.submitting} onClick={() => void finishRace()}>{attempt.submitting ? "Đang ghi thời gian…" : "Về đích →"}</button>
        </div>
      ) : currentQuestion ? (
        <fieldset className="race-question-card" disabled={attempt.submitting}>
          <legend className="sr-only">Trạm {currentQuestion.station}</legend>
          <div className="race-question-heading"><span>0{currentQuestion.station}</span><div><p className="eyebrow">{currentQuestion.stationLabel}</p><h4>{currentQuestion.title}</h4></div></div>
          {meterPosition !== undefined ? (
            <div className="race-meter" aria-hidden="true"><div className="race-meter-scale"><i style={{ left: `${meterPosition * 100}%` }} /><span>0</span><span>GHĐ</span></div></div>
          ) : null}
          <p className="race-prompt">{currentQuestion.prompt}</p>
          {currentQuestion.detail ? <p className="race-detail">{currentQuestion.detail}</p> : null}
          {currentQuestion.kind === "choice" ? (
            <div className="race-choice-grid" role="group" aria-label="Chọn đáp án">
              {currentQuestion.choices?.map((choice, index) => <button key={choice.value} type="button" aria-pressed={currentResponse === choice.value} className={currentResponse === choice.value ? "selected" : ""} onClick={() => updateResponse(choice.value)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}
            </div>
          ) : (
            <label className="race-number-answer">Đáp án<div><input inputMode="decimal" autoComplete="off" value={currentResponse} onChange={(event) => updateResponse(event.target.value)} placeholder="Nhập số" /><span>{currentQuestion.unit}</span></div></label>
          )}
          <div className="race-answer-actions">
            <p className={feedback.type} aria-live="polite">{feedback.text}</p>
            <button type="button" className="primary-button" onClick={checkCurrentStation}>Chốt đáp án →</button>
          </div>
        </fieldset>
      ) : null}

      <div className="race-sync-row"><span>{attempt.saving ? "Đang đồng bộ tiến độ…" : draftStatus}</span><strong>{progress}/{OHM_RACE_STATION_COUNT} trạm</strong></div>
      {attempt.message && !attempt.locked ? <p className={`form-message ${attempt.messageType}`} role={attempt.messageType === "error" ? "alert" : "status"}>{attempt.message}</p> : null}
    </div>
  );
}
