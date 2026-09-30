"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StageId = "pivot" | "center-of-mass" | "restoring" | "apply";
type Lang = "vi" | "en";

type StageText = {
  shortLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  question: string;
  answer: string;
  conclusion: string;
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
      shortLabel: "Đặt lên điểm tựa",
      eyebrow: "QUAN SÁT HIỆN TƯỢNG",
      title: "Đặt đầu chuồn chuồn lên đầu ngón tay",
      lead: "Chỉ có một điểm tiếp xúc duy nhất giữa đồ chơi và ngón tay: đó là điểm tựa O. Toàn bộ thân và hai cánh treo lơ lửng quanh điểm này.",
      question: "Nếu chỉ chạm một điểm mà chuồn chuồn không rơi và tự trở lại vị trí cũ khi bị chạm nhẹ, theo em điều gì đang xảy ra?",
      answer: "Chuồn chuồn tre chỉ tựa vào một điểm O duy nhất (đầu mỏ). Hai cánh dài, mảnh, cong chúc xuống phía dưới điểm tựa. Khi bị chạm nhẹ, vật nghiêng đi rồi tự trở lại đúng vị trí ban đầu — nghĩa là vật đang ở trạng thái cân bằng bền.",
      conclusion: "Chuồn chuồn tre chỉ tựa vào một điểm nhưng luôn tự tìm lại một vị trí cân bằng nhất định.",
    },
    en: {
      shortLabel: "Balance point",
      eyebrow: "OBSERVE THE PHENOMENON",
      title: "Place the dragonfly's head on a fingertip",
      lead: "There is only one contact point between the toy and the finger: the pivot O. The whole body and both wings hang freely around this point.",
      question: "If the dragonfly touches only one point without falling, and returns to its original position after a gentle nudge, what do you think is happening?",
      answer: "The bamboo dragonfly rests on a single pivot point O (its head). Its two long, thin wings curve downward below the pivot. When nudged, it tilts and then returns to its original position — meaning the object is in stable equilibrium.",
      conclusion: "The bamboo dragonfly touches only one point, yet it always settles back into a fixed balanced position.",
    },
  },
  {
    id: "center-of-mass",
    vi: {
      shortLabel: "Tìm trọng tâm",
      eyebrow: "TỪ HÌNH DẠNG ĐẾN TRỌNG TÂM",
      title: "Trọng tâm G nằm ở đâu?",
      lead: "Trọng tâm là điểm đặt của toàn bộ trọng lực tác dụng lên vật. Với vật có hình dạng phức tạp, trọng tâm phụ thuộc vào cách phân bố khối lượng.",
      question: "Hai cánh nặng cong xuống dưới điểm tựa, còn thân phía trên nhẹ hơn. Trọng tâm G của cả vật sẽ nằm gần phía nào: trên hay dưới điểm tựa O?",
      answer: "Vì hai cánh dài và cong xuống chiếm phần lớn khối lượng, trọng tâm G của toàn vật nằm thấp hơn điểm tựa O — ngay dưới O theo phương thẳng đứng khi vật đang cân bằng. Đường thẳng OG lúc này trùng với phương thẳng đứng.",
      conclusion: "Nhờ hai cánh cong xuống, trọng tâm G của chuồn chuồn tre nằm thấp hơn điểm tựa O.",
    },
    en: {
      shortLabel: "Find the center of mass",
      eyebrow: "FROM SHAPE TO CENTER OF MASS",
      title: "Where is the center of mass G?",
      lead: "The center of mass is the point where the total weight of an object effectively acts. For irregularly shaped objects, it depends on how mass is distributed.",
      question: "The two heavy wings curve downward below the pivot, while the body above is lighter. Will the center of mass G be closer to above or below the pivot O?",
      answer: "Since the two long, curved wings hold most of the mass, the center of mass G of the whole object lies below the pivot O — directly below O along the vertical when the object is balanced. The line OG is then vertical.",
      conclusion: "Thanks to the downward-curving wings, the center of mass G of the dragonfly lies below the pivot O.",
    },
  },
  {
    id: "restoring",
    vi: {
      shortLabel: "Vì sao tự hồi phục",
      eyebrow: "MÔ MEN LỰC KÉO VỀ CÂN BẰNG",
      title: "Điều gì xảy ra khi vật bị nghiêng?",
      lead: "Khi chuồn chuồn nghiêng đi một góc nhỏ, điểm tựa O giữ nguyên nhưng trọng tâm G bị lệch sang một bên so với đường thẳng đứng qua O.",
      question: "Khi G lệch sang một bên so với O, trọng lực P (luôn hướng thẳng đứng xuống, đặt tại G) sẽ tạo ra tác dụng gì đối với vật đang quay quanh O?",
      answer: "Trọng lực P luôn thẳng đứng hướng xuống. Khi G lệch khỏi đường thẳng đứng qua O, lực P có cánh tay đòn với O, tạo ra mô men lực. Mô men này luôn có chiều kéo G quay trở lại đúng vị trí thẳng đứng dưới O — đó là mô men hồi phục, làm vật dao động rồi tắt dần về vị trí cân bằng.",
      conclusion: "Mỗi khi lệch khỏi vị trí cân bằng, trọng lực tự tạo ra mô men kéo trọng tâm G trở lại đúng dưới điểm tựa O — đây là cân bằng bền.",
    },
    en: {
      shortLabel: "Why it self-corrects",
      eyebrow: "TORQUE PULLING BACK TO EQUILIBRIUM",
      title: "What happens when the object is tilted?",
      lead: "When the dragonfly tilts by a small angle, the pivot O stays fixed but the center of mass G shifts sideways away from the vertical line through O.",
      question: "When G shifts sideways from O, what effect does gravity P (always vertical, acting at G) have on the object as it rotates about O?",
      answer: "Gravity P always points straight down. When G moves off the vertical line through O, force P gains a lever arm relative to O, creating a torque. This torque always acts to rotate G back to directly below O — this is the restoring torque, which makes the object oscillate and settle back to equilibrium.",
      conclusion: "Whenever it drifts from equilibrium, gravity itself creates a torque pulling the center of mass G back below the pivot O — this is stable equilibrium.",
    },
  },
  {
    id: "apply",
    vi: {
      shortLabel: "Ứng dụng thực tế",
      eyebrow: "TỪ CHUỒN CHUỒN TRE ĐẾN ĐỜI SỐNG",
      title: "Nguyên lý này còn xuất hiện ở đâu?",
      lead: "Bất cứ khi nào một vật cần đứng vững tại một điểm tựa hẹp mà không cần giữ, người ta đều tận dụng nguyên lý: đưa trọng tâm xuống thấp hơn điểm tựa.",
      question: "Người đi trên dây thường cầm một cây sào dài, hai đầu sào cong nhẹ xuống. Theo em cây sào đó ảnh hưởng thế nào đến trọng tâm của cả hệ người + sào? Đồ chơi lật đật cũng đứng vững nhờ nguyên lý nào?",
      answer: "Cây sào dài với hai đầu chúc xuống làm trọng tâm của cả hệ người + sào hạ thấp và ổn định hơn, giống hai cánh chuồn chuồn. Đồ chơi lật đật có đáy nặng và tròn nên trọng tâm luôn ở vị trí thấp, giúp vật tự đứng thẳng trở lại. Cả hai đều dùng chung nguyên lý: hạ trọng tâm xuống dưới điểm tựa để tạo cân bằng bền.",
      conclusion: "Từ chuồn chuồn tre đến sào đi dây, lật đật: hạ trọng tâm xuống dưới điểm tựa là cách tạo ra cân bằng bền.",
    },
    en: {
      shortLabel: "Real-world applications",
      eyebrow: "FROM DRAGONFLY TO EVERYDAY LIFE",
      title: "Where else does this principle appear?",
      lead: "Whenever an object needs to stand stably on a narrow support without being held, people use the same trick: lowering the center of mass below the pivot.",
      question: "Tightrope walkers often carry a long pole with both ends curving slightly downward. How does that pole affect the center of mass of the person + pole system? What principle keeps a roly-poly toy upright?",
      answer: "The long pole with drooping ends lowers and stabilizes the center of mass of the whole person + pole system, just like the dragonfly's wings. A roly-poly toy has a heavy, rounded base, so its center of mass stays low, letting it right itself automatically. Both rely on the same principle: lowering the center of mass below the support point creates stable equilibrium.",
      conclusion: "From the bamboo dragonfly to tightrope poles and roly-poly toys: lowering the center of mass below the pivot is what creates stable equilibrium.",
    },
  },
];

const ui = {
  vi: {
    presentationEyebrow: "GIÁO VIÊN DẪN DẮT",
    studentEyebrow: "THEO DÕI CÙNG GIÁO VIÊN",
    heroTitle: "Vì sao chuồn chuồn tre không ngã?",
    heroLead: "Bốn câu hỏi khám phá: tìm điểm tựa → tìm trọng tâm → hiểu mô men hồi phục → liên hệ ứng dụng thực tế.",
    stageOf: (index: number) => `CÂU HỎI ${index + 1}/4`,
    showAnswer: "Hiện đáp án →",
    next: "Câu tiếp theo →",
    prev: "← Câu trước",
    answerLabel: "Đáp án",
    conclusionLabel: "Chốt chặng",
    finalEyebrow: "Thí nghiệm ảo",
    finalConclusion: "Điểm tựa O cố định, còn trọng tâm G luôn nằm dưới O nhờ hai cánh cong nặng ở dưới. Khi bị làm lệch, trọng lực đặt tại G tạo mô men kéo G trở lại đúng dưới O — đó là cân bằng bền. Cùng nguyên lý này xuất hiện ở sào đi dây và đồ chơi lật đật.",
    restart: "Làm lại",
    waitingNote: "Chờ giáo viên bấm Hiện đáp án…",
  },
  en: {
    presentationEyebrow: "TEACHER-LED",
    studentEyebrow: "FOLLOW ALONG WITH YOUR TEACHER",
    heroTitle: "Why doesn't the bamboo dragonfly fall?",
    heroLead: "Four guiding questions: find the pivot → find the center of mass → understand the restoring torque → connect to real life.",
    stageOf: (index: number) => `QUESTION ${index + 1}/4`,
    showAnswer: "Show answer →",
    next: "Next question →",
    prev: "← Previous",
    answerLabel: "Answer",
    conclusionLabel: "Key takeaway",
    finalEyebrow: "Virtual experiment",
    finalConclusion: "The pivot O stays fixed while the center of mass G always lies below O thanks to the heavy, downward-curving wings. When disturbed, gravity acting at G creates a torque that pulls G back below O — this is stable equilibrium. The same principle appears in tightrope poles and roly-poly toys.",
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
  const pivot: [number, number] = [360, 90];
  const oLabel = lang === "vi" ? "Điểm tựa O" : "Pivot O";
  const gLabel = lang === "vi" ? "Trọng tâm G" : "Center of mass G";

  if (stage === "pivot") {
    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label={lang === "vi" ? "Chuồn chuồn tre đặt trên đầu ngón tay" : "Bamboo dragonfly balanced on a fingertip"}>
        <line className="balance-finger" x1="360" y1="360" x2="360" y2="105" />
        <ellipse className="balance-fingertip" cx="360" cy="360" rx="26" ry="14" />
        <g className={answered ? "balance-settle-wobble" : ""}>
          <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
          <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="150" />
          <path className="balance-wing left" d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" />
          <path className="balance-wing right" d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" />
        </g>
        {answered ? <><circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" /><text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text></> : null}
      </svg>
    );
  }

  if (stage === "center-of-mass") {
    const centerOfMass: [number, number] = [360, 205];
    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label={lang === "vi" ? "Trọng tâm của chuồn chuồn nằm dưới điểm tựa" : "The dragonfly's center of mass lies below the pivot"}>
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text>
        <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="150" />
        <path className="balance-wing left heavy" d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" />
        <path className="balance-wing right heavy" d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" />
        <text className="balance-deviation-label" x="360" y="300" textAnchor="middle">{lang === "vi" ? "Phần lớn khối lượng nằm ở đây" : "Most of the mass is here"}</text>
        {answered ? <>
          <circle className="balance-com-marker" cx={centerOfMass[0]} cy={centerOfMass[1]} r="9" />
          <text className="balance-label com-label" x={centerOfMass[0] + 22} y={centerOfMass[1] + 5}>{gLabel}</text>
          <line className="balance-axis-line" x1={pivot[0]} y1={pivot[1]} x2={centerOfMass[0]} y2={centerOfMass[1]} />
          <text className="balance-deviation-label" x="470" y="150">{lang === "vi" ? "O và G cùng nằm trên một đường thẳng đứng" : "O and G lie on the same vertical line"}</text>
        </> : null}
      </svg>
    );
  }

  if (stage === "restoring") {
    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label={lang === "vi" ? "Trọng lực tạo mô men kéo vật trở lại vị trí cân bằng" : "Gravity creates a torque that restores balance"}>
        <ArrowMarkerDefs />
        <line className="balance-vertical-guide" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2={pivot[1] + 190} />
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="7" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>{oLabel}</text>

        <g className={answered ? "balance-restore-swing" : "balance-tilt-still"}>
          <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="150" />
          <path className="balance-wing left heavy" d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" />
          <path className="balance-wing right heavy" d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" />
          <circle className="balance-com-marker" cx="360" cy="205" r="9" />
          <text className="balance-label com-label balance-com-follow" x="384" y="200">G</text>

          {answered ? (
            <>
              <line className="balance-gravity-arrow" x1="360" y1="205" x2="360" y2="290" />
              <path className="balance-lever-arm" d="M360 90 L360 205" />
            </>
          ) : null}
        </g>

        {answered ? <>
          <text className="balance-label" x="378" y="300">{lang === "vi" ? "P (trọng lực)" : "P (gravity)"}</text>
          <path className="balance-torque-arc" d="M320 130 A70 70 0 0 0 300 195" />
          <text className="balance-deviation-label" x="120" y="230">{lang === "vi" ? "Mô men lực kéo G trở lại đúng dưới O" : "Torque pulls G back below O"}</text>
        </> : null}
      </svg>
    );
  }

  return (
    <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label={lang === "vi" ? "Ứng dụng nguyên lý cân bằng bền trong đời sống" : "Real-world applications of stable equilibrium"}>
      <g className="balance-tightrope-figure">
        <line className="balance-rope" x1="60" y1="330" x2="660" y2="330" />
        <circle className="balance-figure-head" cx="360" cy="240" r="16" />
        <line className="balance-figure-body" x1="360" y1="256" x2="360" y2="320" />
      </g>
      <path className="balance-pole" d="M150 205 Q255 260 360 268 Q465 260 570 205" />
      <circle className="balance-com-marker" cx="360" cy="270" r="8" />
      <text className="balance-label" x="380" y="285">{lang === "vi" ? "Trọng tâm hệ hạ thấp" : "Lowered system center of mass"}</text>
      {answered ? <>
        <g className="balance-roly-poly" transform="translate(80 250)">
          <ellipse className="balance-roly-body" cx="0" cy="70" rx="46" ry="58" />
          <circle className="balance-roly-face" cx="0" cy="40" r="16" />
          <circle className="balance-com-marker" cx="0" cy="92" r="8" />
          <text className="balance-label" x="-46" y="150">{lang === "vi" ? "Lật đật" : "Roly-poly"}</text>
        </g>
        <text className="balance-percent" x="360" y="390" textAnchor="middle">{lang === "vi" ? "Trọng tâm thấp hơn điểm tựa → luôn tự trở lại cân bằng" : "Center of mass below pivot → always self-balancing"}</text>
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
    deviceDraftKey(presentation ? "dragonfly-balance-explorer-presentation-v2" : "dragonfly-balance-explorer-v2"),
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
          <p>{t.heroLead}</p>
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
              <h3>{text.title}</h3>
              <p className="balance-question-lead">{text.lead}</p>
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
