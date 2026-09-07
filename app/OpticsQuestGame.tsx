"use client";

import { useEffect, useMemo, useState } from "react";
import { formatStudentNumber, groupNames } from "@/lib/classes";
import {
  calculateOpticsEnergy,
  getOpticsQuestQuestion,
  getOpticsQuestQuestions,
  isOpticsQuestAnswerCorrect,
  OPTICS_QUEST_MAX_ENERGY,
  OPTICS_QUEST_QUESTION_COUNT,
  OPTICS_QUEST_QUESTIONS_PER_STATION,
  OPTICS_QUEST_STATION_COUNT,
  type OpticsQuestAnswers,
  type OpticsQuestQuestion,
  type OpticsQuestSnapshot,
} from "@/lib/optics-quest";
import PracticeIdentityFields from "./PracticeIdentityFields";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";
import usePracticeAttempt from "./usePracticeAttempt";

const stationIcons = ["↘", "◉", "◇", "△", "●", "✦"];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function OpticsVisual({ question, beamHidden }: { question: OpticsQuestQuestion; beamHidden: boolean }) {
  const rayClass = beamHidden ? "quest-ray hidden" : "quest-ray";
  return (
    <svg className={`quest-visual ${question.visual}`} viewBox="0 0 520 230" role="img" aria-label={`Minh họa ${question.stationLabel}`}>
      <defs>
        <linearGradient id="spectrum" x1="0" x2="1"><stop stopColor="#ef4444"/><stop offset=".2" stopColor="#f59e0b"/><stop offset=".4" stopColor="#facc15"/><stop offset=".58" stopColor="#22c55e"/><stop offset=".78" stopColor="#3b82f6"/><stop offset="1" stopColor="#7c3aed"/></linearGradient>
      </defs>
      {question.visual === "refraction" && <><line className="quest-surface" x1="40" y1="115" x2="480" y2="115"/><line className="quest-normal" x1="260" y1="20" x2="260" y2="210"/><path className={rayClass} d="M120 35 L260 115 L320 205"/><circle cx="260" cy="115" r="7"/></>}
      {question.visual === "apparent" && <><rect className="quest-water" x="20" y="105" width="480" height="115"/><circle className="quest-object" cx="280" cy="184" r="13"/><path className={rayClass} d="M280 184 L220 105 L118 44"/><path className="quest-virtual" d="M220 105 L160 26"/><path className="quest-eye" d="M95 45 q22 -20 44 0 q-22 20 -44 0"/></>}
      {question.visual === "tir" && <><rect className="quest-glass" x="20" y="30" width="480" height="155" rx="18"/><path className={rayClass} d="M55 150 L155 65 L255 150 L355 65 L465 150"/><line className="quest-surface" x1="20" y1="185" x2="500" y2="185"/></>}
      {question.visual === "prism" && <><path className="quest-prism" d="M190 205 L300 25 L410 205 Z"/><path className={rayClass} d="M25 105 L240 105"/><path className={rayClass} d="M240 105 L465 65" style={{stroke:"url(#spectrum)",strokeWidth:18}}/></>}
      {question.visual === "color" && <><circle className="quest-lamp" cx="80" cy="70" r="30"/><rect className="quest-color-object" x="230" y="78" width="80" height="90" rx="16"/><path className={rayClass} d="M112 74 L230 108"/><path className={rayClass} d="M310 110 L420 62"/><path className="quest-eye" d="M410 62 q28 -24 56 0 q-28 24 -56 0"/></>}
      {question.visual === "boss" && <><path className="quest-lighthouse" d="M215 205 L240 58 L290 58 L315 205 Z M232 58 L247 28 L283 28 L298 58"/><path className={rayClass} d="M292 52 L488 18 M292 52 L498 72 M292 52 L470 124"/><circle className="quest-beacon" cx="265" cy="48" r="16"/></>}
      {beamHidden ? <text x="260" y="218" textAnchor="middle">Tia đã tắt · sửa đáp án để khôi phục</text> : null}
    </svg>
  );
}

export default function OpticsQuestGame({ round, running, startedAt }: { round: number; running: boolean; startedAt: string | null }) {
  const [groupName, setGroupName] = useState("");
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [clearedQuestionIds, setClearedQuestionIds] = useState<string[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ type: "idle" | "correct" | "incorrect"; text: string }>({ type: "idle", text: "" });
  const [beamHidden, setBeamHidden] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [snapshot, setSnapshot] = useState<OpticsQuestSnapshot | null>(null);

  const answers = useMemo<OpticsQuestAnswers>(() => ({ round, groupName, questionIds, responses, clearedQuestionIds, attemptCounts }), [round, groupName, questionIds, responses, clearedQuestionIds, attemptCounts]);
  const attempt = usePracticeAttempt("optics-quest", answers, clearedQuestionIds.length);
  const identityKey = `${round}:${attempt.className || "none"}:${attempt.studentNumber || "none"}`;
  const localDraftKey = deviceDraftKey(`optics-quest:${identityKey}`);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuestionIds(attempt.identityReady ? getOpticsQuestQuestions(Number(attempt.studentNumber), round).map((question) => question.id) : []);
      setResponses({}); setClearedQuestionIds([]); setAttemptCounts({}); setFeedback({ type: "idle", text: "" }); setBeamHidden(false);
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
    if (Array.isArray(value.clearedQuestionIds)) setClearedQuestionIds(value.clearedQuestionIds.filter((item): item is string => typeof item === "string" && expected.includes(item)));
    if (isDraftRecord(value.attemptCounts)) setAttemptCounts(Object.fromEntries(Object.entries(value.attemptCounts).map(([key, count]) => [key, Math.max(0, Math.trunc(Number(count) || 0))])));
  });

  const questions = useMemo(() => questionIds.map(getOpticsQuestQuestion).filter((question): question is OpticsQuestQuestion => Boolean(question)), [questionIds]);
  const clearedSet = useMemo(() => new Set(clearedQuestionIds), [clearedQuestionIds]);
  const progress = questions.filter((question) => clearedSet.has(question.id) && isOpticsQuestAnswerCorrect(question, responses[question.id] ?? "")).length;
  const currentQuestion = questions.find((question) => !clearedSet.has(question.id));
  const currentResponse = currentQuestion ? responses[currentQuestion.id] ?? "" : "";
  const energy = calculateOpticsEnergy(questionIds, clearedSet, attemptCounts);
  const finished = questions.length === OPTICS_QUEST_QUESTION_COUNT && progress === OPTICS_QUEST_QUESTION_COUNT;
  const activeStationIndex = Math.min(OPTICS_QUEST_STATION_COUNT - 1, Math.floor(progress / OPTICS_QUEST_QUESTIONS_PER_STATION));
  const questionInStation = progress % OPTICS_QUEST_QUESTIONS_PER_STATION + 1;
  const ownPlayer = snapshot?.players.find((player) => player.studentNumber === Number(attempt.studentNumber));

  useEffect(() => {
    if (!running || !startedAt) return;
    const tick = () => { const delta = (Date.now() - new Date(startedAt).getTime()) / 1000; setCountdown(Math.max(0, Math.ceil(-delta))); setElapsedSeconds(Math.max(0, Math.floor(delta))); };
    tick(); const interval = window.setInterval(tick, 1000); return () => window.clearInterval(interval);
  }, [running, startedAt]);

  useEffect(() => {
    if (!attempt.locked || !attempt.identityReady) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ className: attempt.className });
    void fetch(`/api/optics-quest?${params}`, { cache: "no-store", signal: controller.signal }).then(async (response) => { if (response.ok) setSnapshot(await response.json()); }).catch(() => undefined);
    return () => controller.abort();
  }, [attempt.className, attempt.identityReady, attempt.locked]);

  function updateResponse(value: string) {
    if (!currentQuestion) return;
    setResponses((current) => ({ ...current, [currentQuestion.id]: value }));
    setFeedback({ type: "idle", text: "" });
  }

  function checkAnswer() {
    if (!currentQuestion || !currentResponse.trim()) { setFeedback({ type: "incorrect", text: "Hãy chọn hoặc nhập đáp án." }); return; }
    setAttemptCounts((current) => ({ ...current, [currentQuestion.id]: (current[currentQuestion.id] ?? 0) + 1 }));
    if (!isOpticsQuestAnswerCorrect(currentQuestion, currentResponse)) { setBeamHidden(true); setFeedback({ type: "incorrect", text: "Chưa đúng. Tia sáng đã tắt — hãy suy luận lại." }); return; }
    setBeamHidden(false);
    setClearedQuestionIds((current) => [...current, currentQuestion.id]);
    setFeedback({ type: "correct", text: currentQuestion.explanation });
  }

  const identityLocked = progress > 0 || attempt.locked;
  return (
    <div className="optics-quest-game">
      <div className="quest-hero"><div><p className="eyebrow">VÒNG {round} · ĐUA CÁ NHÂN</p><h2>Giải cứu Hải đăng Ánh sáng</h2><p>6 trạm · mỗi trạm 2 câu. Đúng ngay lần đầu nhận 3 năng lượng.</p></div><div className="quest-energy"><span>NĂNG LƯỢNG</span><strong>{energy}/{OPTICS_QUEST_MAX_ENERGY}</strong><small>{startedAt ? formatTime(elapsedSeconds) : "--:--"}</small></div></div>

      <fieldset className="quest-identity" disabled={identityLocked}>
        <legend className="sr-only">Thông tin người chơi</legend>
        <PracticeIdentityFields practiceKey="optics-quest" className={attempt.className} studentNumber={attempt.studentNumber} onClassChange={attempt.setClassName} onStudentNumberChange={attempt.setStudentNumber} />
        <label>Nhóm<select value={groupName} onChange={(event) => setGroupName(event.target.value)}><option value="">Chọn nhóm</option>{groupNames.map((name) => <option key={name}>{name}</option>)}</select></label>
      </fieldset>

      <div className="quest-map" aria-label={`Đã hoàn thành ${progress}/${OPTICS_QUEST_QUESTION_COUNT} câu`}>
        {Array.from({ length: OPTICS_QUEST_STATION_COUNT }, (_, index) => {
          const done = progress >= (index + 1) * OPTICS_QUEST_QUESTIONS_PER_STATION;
          const state = done ? "done" : index === activeStationIndex ? "current" : "locked";
          return <div key={index} className={state}><b>{done ? "✓" : stationIcons[index]}</b><span>{index + 1}</span></div>;
        })}
        <i style={{ width: `${progress / OPTICS_QUEST_QUESTION_COUNT * 100}%` }} />
      </div>

      {!attempt.identityReady || !groupName ? <div className="quest-lobby"><span>✦</span><div><h3>Chọn lớp, STT và nhóm</h3><p>Mỗi học sinh làm cá nhân; điểm nhóm là trung bình của các thành viên.</p></div></div>
      : attempt.checking ? <div className="quest-lobby"><span className="loading-dot"/><div><h3>Đang mở hồ sơ người chơi…</h3></div></div>
      : attempt.locked ? <div className="quest-finish"><span>✦</span><div><p className="eyebrow">ĐÃ HOÀN THÀNH</p><h3>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</h3><p>Đã đóng góp {ownPlayer?.energy ?? energy}/{OPTICS_QUEST_MAX_ENERGY} năng lượng cho nhóm.</p></div></div>
      : !running ? <div className="quest-lobby ready"><span>⌁</span><div><p className="eyebrow">ĐÃ VÀO TRẠM</p><h3>Chờ giáo viên bắt đầu</h3><p>{attempt.className} · STT {formatStudentNumber(Number(attempt.studentNumber))} · {groupName}</p></div></div>
      : countdown > 0 ? <div className="race-countdown"><p>HẢI ĐĂNG KHỞI ĐỘNG SAU</p><strong>{countdown}</strong><span>Sẵn sàng!</span></div>
      : finished ? <div className="quest-final"><div><span>✦</span><p className="eyebrow">12/12 CÂU · 6/6 TRẠM</p><h3>Hải đăng đã sáng!</h3><p>Năng lượng cá nhân: {energy}/{OPTICS_QUEST_MAX_ENERGY}</p></div><button type="button" className="primary-button" disabled={attempt.submitting} onClick={() => void attempt.submit()}>{attempt.submitting ? "Đang ghi nhận…" : "Hoàn tất →"}</button></div>
      : currentQuestion ? <fieldset className="quest-question" disabled={attempt.submitting}>
          <legend className="sr-only">Trạm {currentQuestion.station}</legend>
          <div className="quest-question-head"><span>{stationIcons[currentQuestion.station - 1]}</span><div><p className="eyebrow">TRẠM {currentQuestion.station} · CÂU {questionInStation}/2 · {currentQuestion.stationLabel}</p><h3>{currentQuestion.title}</h3></div></div>
          <div className="quest-question-grid"><OpticsVisual question={currentQuestion} beamHidden={beamHidden}/><div className="quest-answer"><p>{currentQuestion.prompt}</p>{currentQuestion.kind === "choice" ? <div className="quest-choices">{currentQuestion.choices?.map((choice, index) => <button key={choice.value} type="button" className={currentResponse === choice.value ? "selected" : ""} aria-pressed={currentResponse === choice.value} onClick={() => updateResponse(choice.value)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}</div> : <label>Đáp án<div><input inputMode="decimal" value={currentResponse} onChange={(event) => updateResponse(event.target.value)} placeholder="Nhập số"/><span>{currentQuestion.unit}</span></div></label>}</div></div>
          <div className="quest-actions"><p className={feedback.type} aria-live="polite">{feedback.text}</p><button type="button" className="primary-button" onClick={checkAnswer}>Kiểm tra →</button></div>
        </fieldset> : null}
      <div className="quest-sync"><span>{attempt.saving ? "Đang đồng bộ…" : draftStatus}</span><strong>{progress}/{OPTICS_QUEST_QUESTION_COUNT} câu · {Math.floor(progress / 2)}/6 trạm</strong></div>
      {attempt.message && !attempt.locked ? <p className={`form-message ${attempt.messageType}`}>{attempt.message}</p> : null}
    </div>
  );
}
