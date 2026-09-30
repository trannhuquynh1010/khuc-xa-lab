"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StageId = "pivot" | "center-of-mass" | "restoring" | "apply";

type Stage = {
  id: StageId;
  shortLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  teacherPrompt: string;
  revealSteps: { button: string; title: string; text: string }[];
  conclusion: string;
};

const stages: Stage[] = [
  {
    id: "pivot",
    shortLabel: "Đặt lên điểm tựa",
    eyebrow: "QUAN SÁT HIỆN TƯỢNG",
    title: "Đặt đầu chuồn chuồn lên đầu ngón tay",
    lead: "Chỉ có một điểm tiếp xúc duy nhất giữa đồ chơi và ngón tay: đó là điểm tựa O. Toàn bộ thân và hai cánh treo lơ lửng quanh điểm này.",
    teacherPrompt: "Nếu chỉ chạm một điểm mà chuồn chuồn không rơi, theo em điều gì phải xảy ra với phần còn lại của vật?",
    revealSteps: [
      { button: "Đánh dấu điểm tựa O", title: "Điểm tựa O", text: "Đầu chuồn chuồn (mỏ) tiếp xúc với đầu ngón tay tại một điểm duy nhất." },
      { button: "Hiện hai cánh", title: "Hai cánh cong xuống", text: "Hai cánh dài, mảnh, được uốn cong chúc xuống phía dưới điểm tựa." },
      { button: "Thử nghiêng nhẹ", title: "Chuồn chuồn tự lắc rồi dừng", text: "Chạm nhẹ vào một cánh, vật nghiêng đi rồi tự trở lại vị trí cân bằng ban đầu." },
    ],
    conclusion: "Chuồn chuồn tre chỉ tựa vào một điểm nhưng luôn tự tìm lại một vị trí cân bằng nhất định.",
  },
  {
    id: "center-of-mass",
    shortLabel: "Tìm trọng tâm",
    eyebrow: "TỪ HÌNH DẠNG ĐẾN TRỌNG TÂM",
    title: "Trọng tâm G nằm ở đâu?",
    lead: "Trọng tâm là điểm đặt của toàn bộ trọng lực tác dụng lên vật. Với vật có hình dạng phức tạp, trọng tâm phụ thuộc vào cách phân bố khối lượng.",
    teacherPrompt: "Hai cánh nặng cong xuống dưới điểm tựa, còn thân phía trên nhẹ hơn. Trọng tâm G của cả vật sẽ nằm gần phía nào: trên hay dưới điểm tựa O?",
    revealSteps: [
      { button: "Hiện khối lượng hai cánh", title: "Phần lớn khối lượng ở dưới", text: "Hai cánh dài và cong xuống chiếm phần lớn khối lượng, đều nằm thấp hơn điểm tựa O." },
      { button: "Hiện trọng tâm G", title: "G nằm dưới O", text: "Trọng tâm G của toàn vật nằm thấp hơn điểm tựa O, gần vị trí hai cánh giao nhau." },
      { button: "So sánh với trục OG", title: "Đường thẳng OG luôn thẳng đứng khi cân bằng", text: "Ở vị trí cân bằng, G nằm ngay dưới O theo phương thẳng đứng — đây là vị trí trọng lực và phản lực tại O cùng phương." },
    ],
    conclusion: "Nhờ hai cánh cong xuống, trọng tâm G của chuồn chuồn tre nằm thấp hơn điểm tựa O.",
  },
  {
    id: "restoring",
    shortLabel: "Vì sao tự hồi phục",
    eyebrow: "MÔ MEN LỰC KÉO VỀ CÂN BẰNG",
    title: "Điều gì xảy ra khi vật bị nghiêng?",
    lead: "Khi chuồn chuồn nghiêng đi một góc nhỏ, điểm tựa O giữ nguyên nhưng trọng tâm G bị lệch sang một bên so với đường thẳng đứng qua O.",
    teacherPrompt: "Khi G lệch sang một bên so với O, trọng lực (luôn hướng thẳng đứng xuống, đặt tại G) sẽ tạo ra tác dụng gì đối với vật quay quanh O?",
    revealSteps: [
      { button: "Nghiêng vật một góc", title: "G lệch khỏi đường thẳng đứng qua O", text: "Khi nghiêng, trọng tâm G không còn nằm ngay dưới O mà lệch sang một bên." },
      { button: "Hiện lực trọng lực tại G", title: "Trọng lực luôn thẳng đứng", text: "Trọng lực P luôn có phương thẳng đứng, hướng xuống, bất kể vật nghiêng thế nào." },
      { button: "Hiện mô men hồi phục", title: "Mô men lực kéo vật quay trở lại", text: "Vì G lệch sang bên, trọng lực P tạo ra mô men quay quanh O theo hướng đưa G trở lại đúng dưới O — đó là mô men hồi phục." },
    ],
    conclusion: "Mỗi khi lệch khỏi vị trí cân bằng, trọng lực tự tạo ra mô men kéo trọng tâm G trở lại đúng dưới điểm tựa O — đây là cân bằng bền.",
  },
  {
    id: "apply",
    shortLabel: "Ứng dụng thực tế",
    eyebrow: "TỪ CHUỒN CHUỒN TRE ĐẾN ĐỜI SỐNG",
    title: "Nguyên lý này còn xuất hiện ở đâu?",
    lead: "Bất cứ khi nào một vật cần đứng vững tại một điểm tựa hẹp mà không cần giữ, người ta đều tận dụng nguyên lý: đưa trọng tâm xuống thấp hơn điểm tựa.",
    teacherPrompt: "Người đi trên dây thường cầm một cây sào dài, hai đầu sào cong nhẹ xuống. Theo em cây sào đó ảnh hưởng thế nào đến trọng tâm của cả hệ người + sào?",
    revealSteps: [
      { button: "Hiện người đi dây với sào", title: "Sào cong xuống hạ thấp trọng tâm hệ", text: "Cây sào dài, hai đầu chúc xuống, làm trọng tâm của cả hệ người + sào hạ thấp và ổn định hơn, giống hai cánh chuồn chuồn." },
      { button: "Hiện đồ chơi lật đật", title: "Lật đật cũng dùng cùng nguyên lý", text: "Đáy lật đật nặng và tròn, trọng tâm luôn ở vị trí thấp nên vật luôn tự đứng thẳng trở lại." },
      { button: "Tổng kết nguyên lý chung", title: "Một nguyên lý — nhiều ứng dụng", text: "Trọng tâm nằm dưới điểm tựa (hoặc dưới điểm đỡ) luôn tạo ra cân bằng bền: vật tự động trở về vị trí cân bằng khi bị làm lệch." },
    ],
    conclusion: "Từ chuồn chuồn tre đến sào đi dây, lật đật: hạ trọng tâm xuống dưới điểm tựa là cách tạo ra cân bằng bền.",
  },
];

function GuidanceSequence({ stage, revealed }: { stage: Stage; revealed: number }) {
  return (
    <div className="balance-guidance-sequence" aria-label="Các ý đã lần lượt được làm rõ">
      {stage.revealSteps.map((item, index) => (
        <div key={item.title} className={index < revealed ? "revealed" : index === revealed ? "next" : "pending"}>
          <b>{index < revealed ? "✓" : index + 1}</b>
          <span><strong>{item.title}</strong><small>{index < revealed ? item.text : index === revealed ? "Nội dung tiếp theo sẽ được giáo viên mở." : "Chưa hiển thị"}</small></span>
        </div>
      ))}
    </div>
  );
}

function BalanceDiagram({ stage, revealed }: { stage: StageId; revealed: number }) {
  const pivot: [number, number] = [360, 90];

  if (stage === "pivot") {
    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label="Chuồn chuồn tre đặt trên đầu ngón tay">
        <line className="balance-finger" x1="360" y1="360" x2="360" y2="105" />
        <ellipse className="balance-fingertip" cx="360" cy="360" rx="26" ry="14" />
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
        <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="150" />
        {revealed >= 1 ? <><circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" /><text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>Điểm tựa O</text></> : null}
        {revealed >= 2 ? <><path className="balance-wing left" d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" /><path className="balance-wing right" d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" /></> : null}
        {revealed >= 3 ? <g className="balance-tilt-demo"><text className="balance-deviation-label" x="360" y="395" textAnchor="middle">Nghiêng rồi tự trở lại vị trí ban đầu</text></g> : null}
      </svg>
    );
  }

  if (stage === "center-of-mass") {
    const centerOfMass: [number, number] = [360, 205];
    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label="Trọng tâm của chuồn chuồn nằm dưới điểm tựa">
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>Điểm tựa O</text>
        <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={pivot[0]} y2="150" />
        <path className={`balance-wing left ${revealed >= 1 ? "heavy" : ""}`} d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" />
        <path className={`balance-wing right ${revealed >= 1 ? "heavy" : ""}`} d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" />
        {revealed >= 1 ? <><text className="balance-deviation-label" x="360" y="300" textAnchor="middle">Phần lớn khối lượng nằm ở đây</text></> : null}
        {revealed >= 2 ? <><circle className="balance-com-marker" cx={centerOfMass[0]} cy={centerOfMass[1]} r="9" /><text className="balance-label com-label" x={centerOfMass[0] + 22} y={centerOfMass[1] + 5}>Trọng tâm G</text></> : null}
        {revealed >= 3 ? <><line className="balance-axis-line" x1={pivot[0]} y1={pivot[1]} x2={centerOfMass[0]} y2={centerOfMass[1]} /><text className="balance-deviation-label" x="470" y="150">O và G cùng nằm trên một đường thẳng đứng</text></> : null}
      </svg>
    );
  }

  if (stage === "restoring") {
    const tiltAngle = revealed >= 1 ? 18 : 0;
    const bodyEnd: [number, number] = [
      pivot[0] + 60 * Math.sin((tiltAngle * Math.PI) / 180),
      pivot[1] + 60 * Math.cos((tiltAngle * Math.PI) / 180),
    ];
    const centerOfMass: [number, number] = [
      pivot[0] + 115 * Math.sin((tiltAngle * Math.PI) / 180),
      pivot[1] + 115 * Math.cos((tiltAngle * Math.PI) / 180),
    ];
    const verticalBelowPivot: [number, number] = [pivot[0], pivot[1] + 115];

    return (
      <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label="Trọng lực tạo mô men kéo vật trở lại vị trí cân bằng">
        <circle className="balance-pivot-dot" cx={pivot[0]} cy={pivot[1]} r="6" />
        <circle className="balance-pivot-ring" cx={pivot[0]} cy={pivot[1]} r="16" />
        <text className="balance-label" x={pivot[0] + 24} y={pivot[1] - 6}>Điểm tựa O</text>
        <g transform={revealed >= 1 ? `rotate(${tiltAngle} ${pivot[0]} ${pivot[1]})` : undefined}>
          <line className="balance-body" x1={pivot[0]} y1={pivot[1]} x2={bodyEnd[0]} y2={bodyEnd[1]} />
          <path className="balance-wing left heavy" d="M360 150 Q230 175 205 260 Q225 275 260 250 Q320 205 360 150 Z" />
          <path className="balance-wing right heavy" d="M360 150 Q490 175 515 260 Q495 275 460 250 Q400 205 360 150 Z" />
          <circle className="balance-com-marker" cx="360" cy="205" r="9" />
        </g>
        {revealed >= 2 ? <><line className="balance-gravity-arrow" x1={centerOfMass[0]} y1={centerOfMass[1]} x2={centerOfMass[0]} y2={centerOfMass[1] + 70} /><text className="balance-label" x={centerOfMass[0] + 14} y={centerOfMass[1] + 55}>P (trọng lực)</text></> : null}
        {revealed >= 3 ? <><line className="balance-vertical-guide" x1={verticalBelowPivot[0]} y1={pivot[1]} x2={verticalBelowPivot[0]} y2={verticalBelowPivot[1]} /><path className="balance-torque-arc" d="M330 145 A55 55 0 0 0 315 195" /><text className="balance-deviation-label" x="180" y="140">Mô men lực kéo G trở lại đúng dưới O</text></> : null}
      </svg>
    );
  }

  return (
    <svg className="balance-diagram" viewBox="0 0 720 420" role="img" aria-label="Ứng dụng nguyên lý cân bằng bền trong đời sống">
      <g className="balance-tightrope-figure">
        <line className="balance-rope" x1="60" y1="330" x2="660" y2="330" />
        <circle className="balance-figure-head" cx="360" cy="240" r="16" />
        <line className="balance-figure-body" x1="360" y1="256" x2="360" y2="320" />
      </g>
      {revealed >= 1 ? <><path className="balance-pole" d="M150 205 Q255 260 360 268 Q465 260 570 205" /><circle className="balance-com-marker" cx="360" cy="270" r="8" /><text className="balance-label" x="380" y="285">Trọng tâm hệ hạ thấp</text></> : null}
      {revealed >= 2 ? <g className="balance-roly-poly" transform="translate(80 250)"><ellipse className="balance-roly-body" cx="0" cy="70" rx="46" ry="58" /><circle className="balance-roly-face" cx="0" cy="40" r="16" /><circle className="balance-com-marker" cx="0" cy="92" r="8" /><text className="balance-label" x="-46" y="150">Lật đật</text></g> : null}
      {revealed >= 3 ? <text className="balance-percent" x="360" y="390" textAnchor="middle">Trọng tâm thấp hơn điểm tựa → luôn tự trở lại cân bằng</text> : null}
    </svg>
  );
}

function validStageId(value: unknown): value is StageId {
  return stages.some((stage) => stage.id === value);
}

export default function DragonflyBalanceExplorer({ presentation = false }: { presentation?: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [revealedByStage, setRevealedByStage] = useState<Partial<Record<StageId, number>>>({});

  const stage = stages[stageIndex];
  const revealed = revealedByStage[stage.id] ?? 0;
  const stageComplete = revealed >= stage.revealSteps.length;
  const completedCount = stages.filter((item) => (revealedByStage[item.id] ?? 0) >= item.revealSteps.length).length;
  const allComplete = completedCount === stages.length;
  const unlockedIndex = Math.min(stages.length - 1, completedCount);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey(presentation ? "dragonfly-balance-explorer-presentation-v1" : "dragonfly-balance-explorer-v1"),
    { stageIndex, revealedByStage },
    (value) => {
      if (!isDraftRecord(value)) return;
      const restoredReveals: Partial<Record<StageId, number>> = {};
      if (isDraftRecord(value.revealedByStage)) {
        Object.entries(value.revealedByStage).forEach(([key, count]) => {
          if (!validStageId(key) || typeof count !== "number") return;
          const matchingStage = stages.find((item) => item.id === key);
          restoredReveals[key] = Math.max(0, Math.min(count, matchingStage?.revealSteps.length ?? 0));
        });
      }
      const restoredCompleteCount = stages.filter((item) => (restoredReveals[item.id] ?? 0) >= item.revealSteps.length).length;
      const restoredIndex = typeof value.stageIndex === "number" ? Math.max(0, Math.min(value.stageIndex, restoredCompleteCount, stages.length - 1)) : 0;
      setRevealedByStage(restoredReveals);
      setStageIndex(restoredIndex);
    },
  );

  function selectStage(index: number) {
    if (index > unlockedIndex) return;
    setStageIndex(index);
  }

  function revealNext() {
    if (stageComplete) return;
    setRevealedByStage((current) => ({ ...current, [stage.id]: Math.min(revealed + 1, stage.revealSteps.length) }));
  }

  function resetActivity() {
    setStageIndex(0);
    setRevealedByStage({});
  }

  return (
    <section className={`balance-explorer ${presentation ? "presentation" : ""}`}>
      <header className="balance-explorer-hero">
        <div>
          <p className="eyebrow">{presentation ? "GIÁO VIÊN DẪN DẮT" : "THEO DÕI CÙNG GIÁO VIÊN"}</p>
          <h2>Vì sao chuồn chuồn tre không ngã?</h2>
          <p>Bốn chặng khám phá: tìm điểm tựa → tìm trọng tâm → hiểu mô men hồi phục → liên hệ ứng dụng thực tế.</p>
        </div>
        <div className="balance-hero-mark" aria-hidden="true"><span>O</span><i /><b>G</b></div>
      </header>

      <div className="balance-stage-nav" role="tablist" aria-label="Bốn chặng khám phá cân bằng bền">
        {stages.map((item, index) => {
          const itemComplete = (revealedByStage[item.id] ?? 0) >= item.revealSteps.length;
          const locked = index > unlockedIndex;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={index === stageIndex} aria-label={`Chặng ${index + 1}: ${item.shortLabel}${locked ? ", chưa mở" : ""}`} disabled={locked} className={`${index === stageIndex ? "active" : ""} ${itemComplete ? "complete" : ""}`} onClick={() => selectStage(index)}>
              <b>{itemComplete ? "✓" : index + 1}</b><span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="balance-learning-layout">
        <div className="balance-visual-panel">
          <div className="balance-visual-label"><span>MÔ HÌNH DẪN DẮT</span><small>{stageComplete ? "Đã hiện đủ nội dung của chặng" : `Đã hiện ${revealed}/${stage.revealSteps.length} bước`}</small></div>
          <BalanceDiagram stage={stage.id} revealed={revealed} />
        </div>

        <article className="balance-mission-panel">
          <div className="balance-stage-kicker"><span>CHẶNG {stageIndex + 1}/4</span><b>{stage.eyebrow}</b></div>
          <h3>{stage.title}</h3>
          <p className="balance-stage-lead">{stage.lead}</p>

          <div className="balance-teacher-prompt">
            <span aria-hidden="true">?</span>
            <div><small>{presentation ? "GV HỎI · CHỜ HỌC SINH DỰ ĐOÁN" : "Question"}</small><strong>{stage.teacherPrompt}</strong></div>
          </div>

          <GuidanceSequence stage={stage} revealed={revealed} />

          {stageComplete ? <div className="balance-stage-conclusion"><span>✓</span><p><b>Chốt chặng:</b> {stage.conclusion}</p></div> : null}

          <div className="balance-stage-actions">
            <button type="button" className="secondary-button" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>← Trước</button>
            {!stageComplete ? <button type="button" className="primary-button balance-reveal-button" onClick={revealNext}>Hiện: {stage.revealSteps[revealed].button} →</button> : stageIndex < stages.length - 1 ? <button type="button" className="primary-button" onClick={() => selectStage(stageIndex + 1)}>Chặng tiếp theo →</button> : null}
          </div>
          <span className="draft-status balance-draft-status">{draftStatus}</span>
        </article>
      </div>

      {allComplete ? (
        <div className="balance-conclusion">
          <div className="balance-conclusion-icon" aria-hidden="true">⚖</div>
          <div><p className="eyebrow">Thí nghiệm ảo</p><p>Điểm tựa O cố định, còn trọng tâm G luôn nằm dưới O nhờ hai cánh cong nặng ở dưới. Khi bị làm lệch, trọng lực đặt tại G tạo mô men kéo G trở lại đúng dưới O — đó là cân bằng bền. Cùng nguyên lý này xuất hiện ở sào đi dây và đồ chơi lật đật.</p></div>
          <div className="balance-conclusion-actions"><button type="button" className="secondary-button" onClick={resetActivity}>Làm lại</button></div>
        </div>
      ) : null}
    </section>
  );
}
