"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StageId = "pivot" | "center-of-mass" | "restoring" | "apply";
type Lang = "vi" | "en";

type StageText = {
  shortLabel: string;
  eyebrow: string;
  question: string;
  answer: string;
};

type Stage = {
  id: StageId;
  vi: StageText;
  en: StageText;
};

const stages: Stage[] = [
  {
    id: "pivot",
    vi: {
      shortLabel: "Điểm tựa",
      eyebrow: "QUAN SÁT",
      question: "Chuồn chuồn chỉ chạm 1 điểm mà không rơi. Vì sao?",
      answer: "Chuồn chuồn chỉ chạm 1 điểm O ở đầu. Hai cánh cong xuống, treo đều hai bên O. Chạm nhẹ, nó lắc rồi tự đứng thẳng lại — đó là vì nó đang ở trạng thái cân bằng bền.",
    },
    en: {
      shortLabel: "Pivot point",
      eyebrow: "OBSERVE",
      question: "The dragonfly touches only 1 point without falling. Why?",
      answer: "It touches only 1 point O at its head. Both wings curve down, hanging evenly on each side. A gentle push makes it wobble, then stand still again — this is called stable equilibrium.",
    },
  },
  {
    id: "center-of-mass",
    vi: {
      shortLabel: "Trọng tâm",
      eyebrow: "TÌM ĐIỂM CÂN",
      question: "Trọng tâm G của chuồn chuồn nằm ở đâu?",
      answer: "Hai cánh nặng bằng nhau và đối xứng hai bên. Vì hai cánh cong xuống, trọng tâm G nằm dưới điểm tựa O, ngay trên đường thẳng đứng qua O.",
    },
    en: {
      shortLabel: "Center of mass",
      eyebrow: "FIND THE BALANCE POINT",
      question: "Where is the dragonfly's center of mass G?",
      answer: "Both wings are equally heavy and symmetric. Since the wings curve down, the center of mass G lies below the pivot O, right on the vertical line through O.",
    },
  },
  {
    id: "restoring",
    vi: {
      shortLabel: "Tự đứng lại",
      eyebrow: "VÌ SAO KHÔNG NGÃ",
      question: "Khi bị nghiêng, trọng tâm G lệch sang một bên. Điều gì kéo nó về lại?",
      answer: "Trọng lực luôn kéo thẳng xuống. Khi G lệch sang bên, lực này làm vật xoay quay lại, cho tới khi G về đúng vị trí dưới O.",
    },
    en: {
      shortLabel: "Self-righting",
      eyebrow: "WHY IT DOESN'T FALL",
      question: "When tilted, the center of mass G shifts sideways. What pulls it back?",
      answer: "Gravity always pulls straight down. When G shifts sideways, this pull makes the object spin back, until G returns right below O.",
    },
  },
  {
    id: "apply",
    vi: {
      shortLabel: "Liên hệ thực tế",
      eyebrow: "ỨNG DỤNG",
      question: "Đồ chơi lật đật cũng không bao giờ ngã. Vì sao?",
      answer: "Đáy lật đật nặng và tròn, nên trọng tâm luôn ở vị trí thấp. Đẩy nghiêng, nó lắc rồi tự đứng thẳng lại — giống chuồn chuồn tre.",
    },
    en: {
      shortLabel: "Real-life link",
      eyebrow: "APPLICATION",
      question: "A roly-poly toy also never falls over. Why?",
      answer: "Its base is heavy and round, keeping its center of mass low. Push it, it wobbles, then stands up straight again — just like the bamboo dragonfly.",
    },
  },
];

const ui = {
  vi: {
    presentationEyebrow: "GIÁO VIÊN DẪN DẮT",
    studentEyebrow: "THEO DÕI CÙNG GIÁO VIÊN",
    heroTitle: "Vì sao chuồn chuồn tre không ngã?",
    heroLead: "4 câu hỏi khám phá cân bằng.",
    stageOf: (index: number) => `CÂU ${index + 1}/4`,
    showAnswer: "Hiện đáp án →",
    next: "Câu tiếp theo →",
    prev: "← Câu trước",
    answerLabel: "Đáp án",
    finalEyebrow: "Kết luận",
    finalConclusion: "Trọng tâm nằm dưới điểm tựa → vật luôn tự trở lại vị trí cân bằng khi bị nghiêng.",
    restart: "Làm lại",
    waitingNote: "Chờ giáo viên bấm Hiện đáp án…",
  },
  en: {
    presentationEyebrow: "TEACHER-LED",
    studentEyebrow: "FOLLOW ALONG WITH YOUR TEACHER",
    heroTitle: "Why doesn't the bamboo dragonfly fall?",
    heroLead: "4 questions exploring balance.",
    stageOf: (index: number) => `Q${index + 1}/4`,
    showAnswer: "Show answer →",
    next: "Next question →",
    prev: "← Previous",
    answerLabel: "Answer",
    finalEyebrow: "Conclusion",
    finalConclusion: "Center of mass below the pivot → the object always returns to balance when tilted.",
    restart: "Restart",
    waitingNote: "Waiting for the teacher to show the answer…",
  },
};

function validStageId(value: unknown): value is StageId {
  return stages.some((stage) => stage.id === value);
}

function ArrowMarkerDefs() {
  return (
    <defs>
      <marker id="balance-arrowhead" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4.5 L0,9 Z" fill="#ef523d" />
      </marker>
      <marker id="balance-arrowhead-torque" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L8,4.5 L0,9 Z" fill="#1f4a1c" />
      </marker>
    </defs>
  );
}

function BalanceDiagram({ stage, answered, lang }: { stage: StageId; answered: boolean; lang: Lang }) {
  const pivot: [number, number] = [360, 60];
  const oLabel = lang === "vi" ? "Điểm tựa O" : "Pivot O";
  const gLabel = lang === "vi" ? "Trọng tâm G" : "Center of mass G";

  if (stage === "pivot") {
    return (
      <svg className="balance-diagram" viewBox="0 0 720 300" role="img" aria-label={lang === "vi" ? "Chuồn chuồn tre đặt trên đầu ngón tay" : "Bamboo dragonfly balanced on a fingertip"}>
        <line className="balance-finger" x1="360" y1="270" x2="360" y2="75" />
        <ellipse className="balance-fingertip" cx="360" cy="270" rx="24" ry="13" />
        <g className={answered ? "balance-settle-wobble" : ""}>
          <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
          <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="118" />
          <path className="balance-wing left" d="M360 118 Q245 140 222 210 Q240 224 272 202 Q325 165 360 118 Z" />
          <path className="balance-wing right" d="M360 118 Q475 140 498 210 Q480 224 448 202 Q395 165 360 118 Z" />
        </g>
        {answered ? <><circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" /><text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text></> : null}
      </svg>
    );
  }

  if (stage === "center-of-mass") {
    const centerOfMass: [number, number] = [360, 165];
    return (
      <svg className="balance-diagram" viewBox="0 0 720 300" role="img" aria-label={lang === "vi" ? "Trọng tâm của chuồn chuồn nằm dưới điểm tựa" : "The dragonfly's center of mass lies below the pivot"}>
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text>
        <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="118" />
        <path className="balance-wing left heavy" d="M360 118 Q245 140 222 210 Q240 224 272 202 Q325 165 360 118 Z" />
        <path className="balance-wing right heavy" d="M360 118 Q475 140 498 210 Q480 224 448 202 Q395 165 360 118 Z" />
        {answered ? <>
          <circle className="balance-com-marker" cx={centerOfMass[0]} cy={centerOfMass[1]} r="9" />
          <text className="balance-label com-label" x={centerOfMass[0] + 22} y={centerOfMass[1] + 5}>{gLabel}</text>
          <line className="balance-axis-line" x1={pivot[0]} y1={pivot[1]} x2={centerOfMass[0]} y2={centerOfMass[1]} />
        </> : null}
      </svg>
    );
  }

  if (stage === "restoring") {
    return (
      <svg className="balance-diagram" viewBox="0 0 720 300" role="img" aria-label={lang === "vi" ? "Trọng lực kéo vật trở lại vị trí cân bằng" : "Gravity pulls the object back to balance"}>
        <ArrowMarkerDefs />
        <line className="balance-vertical-guide" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2={pivot[1] + 140} />
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="7" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text>

        <g className={answered ? "balance-restore-swing" : "balance-tilt-still"}>
          <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="118" />
          <path className="balance-wing left heavy" d="M360 118 Q245 140 222 210 Q240 224 272 202 Q325 165 360 118 Z" />
          <path className="balance-wing right heavy" d="M360 118 Q475 140 498 210 Q480 224 448 202 Q395 165 360 118 Z" />
          <circle className="balance-com-marker" cx="360" cy="165" r="9" />
          <text className="balance-label com-label balance-com-follow" x="384" y="160">G</text>
          {answered ? <line className="balance-gravity-arrow" x1="360" y1="165" x2="360" y2="235" /> : null}
        </g>

        {answered ? <>
          <text className="balance-label" x="378" y="248">{lang === "vi" ? "Lực kéo xuống" : "Pull down"}</text>
          <path className="balance-torque-arc" d="M320 100 A65 65 0 0 0 300 160" />
        </> : null}
      </svg>
    );
  }

  return (
    <svg className="balance-diagram" viewBox="0 0 720 300" role="img" aria-label={lang === "vi" ? "Đồ chơi lật đật minh họa cân bằng bền" : "A roly-poly toy illustrating stable equilibrium"}>
      <g className={answered ? "balance-roly-swing" : ""} transform="translate(360 190)">
        <ellipse className="balance-roly-body" cx="0" cy="0" rx="90" ry="105" />
        <circle className="balance-roly-face" cx="0" cy="-58" r="30" />
        <circle className="balance-com-marker" cx="0" cy="26" r="9" />
      </g>
      {answered ? <>
        <line className="balance-vertical-guide" x1="360" y1="216" x2="360" y2="270" />
        <text className="balance-label" x="378" y="260">{lang === "vi" ? "Trọng tâm ở thấp" : "Low center of mass"}</text>
      </> : null}
    </svg>
  );
}

export default function DragonflyBalanceExplorer({ presentation = false }: { presentation?: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [answeredByStage, setAnsweredByStage] = useState<Partial<Record<StageId, boolean>>>({});
  const [lang, setLang] = useState<Lang>("vi");

  const stage = stages[stageIndex];
  const text = stage[lang];
  const t = ui[lang];
  const answered = answeredByStage[stage.id] ?? false;
  const completedCount = stages.filter((item) => answeredByStage[item.id]).length;
  const allComplete = completedCount === stages.length;
  const unlockedIndex = Math.min(stages.length - 1, completedCount);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey(presentation ? "dragonfly-balance-explorer-presentation-v3" : "dragonfly-balance-explorer-v3"),
    { stageIndex, answeredByStage, lang },
    (value) => {
      if (!isDraftRecord(value)) return;
      const restoredAnswered: Partial<Record<StageId, boolean>> = {};
      if (isDraftRecord(value.answeredByStage)) {
        Object.entries(value.answeredByStage).forEach(([key, done]) => {
          if (!validStageId(key)) return;
          restoredAnswered[key] = Boolean(done);
        });
      }
      const restoredCompleteCount = stages.filter((item) => restoredAnswered[item.id]).length;
      const restoredIndex = typeof value.stageIndex === "number" ? Math.max(0, Math.min(value.stageIndex, restoredCompleteCount, stages.length - 1)) : 0;
      setAnsweredByStage(restoredAnswered);
      setStageIndex(restoredIndex);
      if (value.lang === "vi" || value.lang === "en") setLang(value.lang);
    },
  );

  function selectStage(index: number) {
    if (index > unlockedIndex) return;
    setStageIndex(index);
  }

  function showAnswer() {
    setAnsweredByStage((current) => ({ ...current, [stage.id]: true }));
  }

  function goNext() {
    if (stageIndex < stages.length - 1) selectStage(stageIndex + 1);
  }

  function resetActivity() {
    setStageIndex(0);
    setAnsweredByStage({});
  }

  return (
    <section className={`balance-explorer ${presentation ? "presentation" : ""}`}>
      <header className="balance-explorer-hero">
        <div>
          <div className="balance-hero-top-row">
            <p className="eyebrow">{presentation ? t.presentationEyebrow : t.studentEyebrow}</p>
            <div className="balance-lang-toggle" role="group" aria-label="Language / Ngôn ngữ">
              <button type="button" className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
              <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
            </div>
          </div>
          <h2>{t.heroTitle}</h2>
        </div>
        <div className="balance-hero-mark" aria-hidden="true"><span>O</span><i /><b>G</b></div>
      </header>

      <div className="balance-stage-nav" role="tablist" aria-label={lang === "vi" ? "Bốn câu hỏi khám phá cân bằng bền" : "Four guiding questions on stable equilibrium"}>
        {stages.map((item, index) => {
          const itemComplete = Boolean(answeredByStage[item.id]);
          const locked = index > unlockedIndex;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={index === stageIndex} aria-label={`${index + 1}: ${item[lang].shortLabel}${locked ? (lang === "vi" ? ", chưa mở" : ", locked") : ""}`} disabled={locked} className={`${index === stageIndex ? "active" : ""} ${itemComplete ? "complete" : ""}`} onClick={() => selectStage(index)}>
              <b>{itemComplete ? "✓" : index + 1}</b><span>{item[lang].shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="balance-stage-visual">
        <div className="balance-visual-label"><span>{t.stageOf(stageIndex)}</span><small>{stage[lang].eyebrow}</small></div>
        <BalanceDiagram stage={stage.id} answered={answered} lang={lang} />

        <div className="balance-question-overlay">
          <div className="balance-question-card">
            <span className="balance-question-mark" aria-hidden="true">?</span>
            <div className="balance-question-body">
              <p className="balance-question-text">{text.question}</p>
              {answered ? (
                <div className="balance-answer-block">
                  <b>{t.answerLabel}</b>
                  <p>{text.answer}</p>
                </div>
              ) : <p className="balance-waiting-note">{t.waitingNote}</p>}
            </div>
          </div>

          <div className="balance-overlay-actions">
            <button type="button" className="secondary-button" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>{t.prev}</button>
            {!answered ? (
              <button type="button" className="primary-button balance-reveal-button" onClick={showAnswer}>{t.showAnswer}</button>
            ) : stageIndex < stages.length - 1 ? (
              <button type="button" className="primary-button" onClick={goNext}>{t.next}</button>
            ) : null}
          </div>
        </div>
      </div>

      <span className="draft-status balance-draft-status">{draftStatus}</span>

      {allComplete ? (
        <div className="balance-conclusion">
          <div className="balance-conclusion-icon" aria-hidden="true">⚖</div>
          <div><p className="eyebrow">{t.finalEyebrow}</p><p>{t.finalConclusion}</p></div>
          <div className="balance-conclusion-actions"><button type="button" className="secondary-button" onClick={resetActivity}>{t.restart}</button></div>
        </div>
      ) : null}
    </section>
  );
}
