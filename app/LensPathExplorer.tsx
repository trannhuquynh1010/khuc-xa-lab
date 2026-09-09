"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StageId = "surface" | "prisms" | "morph" | "focus";

type Stage = {
  id: StageId;
  shortLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  question: string;
  choices: { value: string; label: string }[];
  answer: string;
  success: string;
  reasoning: { title: string; text: string }[];
};

const stages: Stage[] = [
  {
    id: "surface",
    shortLabel: "Một mặt cong",
    eyebrow: "ĐIỂM TỚI · PHÁP TUYẾN",
    title: "Tia đổi hướng ngay tại mặt phân cách",
    lead: "Điểm M là nơi tia tới chạm mặt cong. Tiếp tuyến chỉ chạm mặt cong tại M; pháp tuyến luôn vuông góc với tiếp tuyến ấy.",
    question: "Tia đi từ không khí vào thủy tinh. Sau điểm M, tia khúc xạ phải đi theo hướng nào?",
    choices: [
      { value: "near", label: "Gần pháp tuyến hơn tia tới" },
      { value: "away", label: "Xa pháp tuyến hơn tia tới" },
      { value: "straight", label: "Giữ nguyên phương truyền" },
    ],
    answer: "near",
    success: "Đúng. Tia tới và tia khúc xạ nối nhau chính xác tại M; khi đi vào môi trường có chiết suất lớn hơn, tia lệch lại gần pháp tuyến.",
    reasoning: [
      { title: "Chạm mặt tại M", text: "M là điểm chung của tia tới, tia khúc xạ và mặt phân cách." },
      { title: "Dựng pháp tuyến", text: "Pháp tuyến vuông góc với tiếp tuyến tại đúng điểm M." },
      { title: "So sánh góc", text: "n tăng nên góc khúc xạ r nhỏ hơn góc tới i." },
    ],
  },
  {
    id: "prisms",
    shortLabel: "Các mảnh nhỏ",
    eyebrow: "MÔ HÌNH GẦN ĐÚNG",
    title: "Tách thấu kính thành nhiều phần nhỏ",
    lead: "Mỗi phần nhỏ có hai mặt nghiêng và có thể xem gần đúng như một lăng kính. Tia qua lăng kính lệch về phía đáy.",
    question: "Để các tia phía trên và phía dưới cùng lệch về trục chính, đáy của các “lăng kính nhỏ” phải hướng thế nào?",
    choices: [
      { value: "axis", label: "Cùng hướng về trục chính" },
      { value: "outside", label: "Cùng hướng ra xa trục chính" },
      { value: "right", label: "Tất cả cùng hướng sang phải" },
    ],
    answer: "axis",
    success: "Chính xác. Phần trên có đáy hướng xuống, phần dưới có đáy hướng lên. Vì vậy các tia đều đổi hướng về phía trục chính.",
    reasoning: [
      { title: "Chia nhỏ", text: "Mặt cong được thay bằng nhiều cặp mặt phẳng rất ngắn." },
      { title: "Nhận ra đáy", text: "Mỗi phần dày hơn ở phía gần trục chính." },
      { title: "Ghép tác dụng", text: "Tất cả tia cùng lệch về trục nên chùm tia có xu hướng hội tụ." },
    ],
  },
  {
    id: "morph",
    shortLabel: "Làm mượt",
    eyebrow: "TỪ MẶT GẤP KHÚC ĐẾN MẶT CONG",
    title: "Tăng số phần nhỏ để tạo mặt cong",
    lead: "Kéo thanh trượt: các bậc nhỏ dần và đường bao tiến tới một mặt cong liên tục. Điểm chạm của từng tia luôn nằm trên đường bao.",
    question: "Khi các mặt gấp khúc được làm mượt, tác dụng chung lên chùm tia thay đổi thế nào?",
    choices: [
      { value: "same", label: "Vẫn hướng các tia về cùng một vùng" },
      { value: "color", label: "Chỉ còn làm thay đổi màu ánh sáng" },
      { value: "none", label: "Không còn làm tia đổi hướng" },
    ],
    answer: "same",
    success: "Đúng. Làm mượt không xóa tác dụng của từng phần nhỏ; nó làm hướng lệch thay đổi liên tục từ điểm này sang điểm khác.",
    reasoning: [
      { title: "Bậc nhỏ dần", text: "Số phần tăng lên nên độ đổi hướng giữa hai phần kề nhau giảm xuống." },
      { title: "Mặt cong liên tục", text: "Mỗi điểm trên mặt cong có một pháp tuyến hơi khác điểm bên cạnh." },
      { title: "Tác dụng được giữ", text: "Các tia vẫn được điều hướng dần về phía trục chính." },
    ],
  },
  {
    id: "focus",
    shortLabel: "Tạo tiêu điểm",
    eyebrow: "ĐỘ LỆCH KHÔNG GIỐNG NHAU",
    title: "Vì sao các tia song song gặp nhau?",
    lead: "Ở xa trục chính, mặt thấu kính nghiêng nhiều hơn. Pháp tuyến tại đó đổi hướng nhiều hơn so với vùng gần trục.",
    question: "Tia nào phải đổi hướng nhiều nhất để gặp các tia còn lại tại F′?",
    choices: [
      { value: "outer", label: "Tia ở xa trục chính nhất" },
      { value: "inner", label: "Tia ở gần trục chính nhất" },
      { value: "equal", label: "Mọi tia đổi hướng bằng nhau" },
    ],
    answer: "outer",
    success: "Đúng. Tia ngoài lệch nhiều, tia gần trục lệch ít, còn tia trên trục gần như truyền thẳng. Trong mô hình thấu kính mỏng, chúng gặp nhau tại F′.",
    reasoning: [
      { title: "Xa trục", text: "Mặt nghiêng nhiều → pháp tuyến đổi hướng nhiều → tia lệch nhiều." },
      { title: "Gần trục", text: "Mặt ít nghiêng → tia chỉ cần đổi hướng một lượng nhỏ." },
      { title: "Trên trục", text: "Tia đi qua vùng giữa gần vuông góc với hai mặt nên gần như truyền thẳng." },
    ],
  },
];

type Point = [number, number];

function SvgArrow({ id, color = "#ff6647" }: { id: string; color?: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M1,1 L7,4 L1,7 Z" fill={color} />
    </marker>
  );
}

function segmentPoints(start: Point, end: Point) {
  return `${start[0]},${start[1]} ${(start[0] + end[0]) / 2},${(start[1] + end[1]) / 2} ${end[0]},${end[1]}`;
}

function RaySegment({ start, end, markerId, className = "lens-ray" }: { start: Point; end: Point; markerId: string; className?: string }) {
  return <polyline className={className} points={segmentPoints(start, end)} markerMid={`url(#${markerId})`} />;
}

function smoothHalfWidth(y: number) {
  const ratio = Math.max(0, Math.min(1, (y - 40) / 340));
  return 4 + 76 * Math.sin(Math.PI * ratio);
}

function morphHalfWidth(y: number, smoothness: number) {
  const ratio = Math.max(0, Math.min(1, (y - 40) / 340));
  const steppedRatio = Math.round(ratio * 6) / 6;
  const stepped = 4 + 76 * Math.sin(Math.PI * steppedRatio);
  const smooth = smoothHalfWidth(y);
  return stepped + (smooth - stepped) * smoothness / 100;
}

function morphLensPoints(smoothness: number) {
  const left: string[] = [];
  const right: string[] = [];
  for (let index = 0; index <= 34; index += 1) {
    const y = 40 + index * 10;
    const halfWidth = morphHalfWidth(y, smoothness);
    left.push(`${350 - halfWidth},${y}`);
    right.unshift(`${350 + halfWidth},${y}`);
  }
  return [...left, ...right].join(" ");
}

function ConvergingRay({ y, markerId, solved, morph = false, smoothness = 100, emphasis = "" }: { y: number; markerId: string; solved: boolean; morph?: boolean; smoothness?: number; emphasis?: string }) {
  const halfWidth = morph ? morphHalfWidth(y, smoothness) : smoothHalfWidth(y);
  const entry: Point = [350 - halfWidth, y];
  const shift = (210 - y) * 0.14;
  const exitY = y + shift;
  const exitHalfWidth = morph ? morphHalfWidth(exitY, smoothness) : smoothHalfWidth(exitY);
  const exit: Point = [350 + exitHalfWidth, exitY];
  const incomingClass = `lens-ray incoming ${emphasis}`.trim();
  const outgoingClass = `lens-ray ${emphasis}`.trim();

  return (
    <g>
      <RaySegment start={[42, y]} end={entry} markerId={markerId} className={incomingClass} />
      {solved ? <RaySegment start={entry} end={exit} markerId={markerId} className="lens-ray inside" /> : null}
      {solved ? <RaySegment start={exit} end={[620, 210]} markerId={markerId} className={outgoingClass} /> : null}
      <circle className="lens-contact" cx={entry[0]} cy={entry[1]} r="4" />
    </g>
  );
}

function ReasoningChain({ items }: { items: Stage["reasoning"] }) {
  return (
    <div className="lens-reason-chain">
      {items.map((item, index) => <div key={item.title}><b>{index + 1}</b><span><strong>{item.title}</strong><small>{item.text}</small></span></div>)}
    </div>
  );
}

function LensDiagram({ stage, solved, smoothness }: { stage: StageId; solved: boolean; smoothness: number }) {
  const markerId = `lens-arrow-${stage}`;
  const insideMarkerId = `lens-arrow-inside-${stage}`;
  const axis = <line className="lens-axis" x1="35" y1="210" x2="685" y2="210" />;

  if (stage === "surface") {
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Tia tới chạm mặt cong tại M rồi khúc xạ vào thủy tinh">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        <path className="lens-glass-field" d="M430 40 Q360 120 360 210 Q360 300 430 380 L720 380 L720 40 Z" />
        <path className="lens-outline" d="M430 40 Q360 120 360 210 Q360 300 430 380" />
        <line className="lens-tangent" x1="360" y1="126" x2="360" y2="294" />
        <line className="lens-normal" x1="205" y1="210" x2="665" y2="210" />
        <RaySegment start={[48, 100]} end={[360, 210]} markerId={markerId} />
        {solved ? <RaySegment start={[360, 210]} end={[680, 244]} markerId={insideMarkerId} className="lens-ray refracted" /> : null}
        <circle className="lens-hit" cx="360" cy="210" r="7" />
        <path className="lens-angle" d="M306 210 A54 54 0 0 1 309 191" />
        {solved ? <path className="lens-angle refracted" d="M414 210 A54 54 0 0 1 413 216" /> : null}
        <text className="lens-angle-label" x="312" y="188">i</text>{solved ? <text className="lens-angle-label" x="418" y="226">r</text> : null}
        <text className="lens-label" x="56" y="72">Không khí · n ≈ 1,00</text><text className="lens-label" x="500" y="72">Thủy tinh · n ≈ 1,50</text>
        <text className="lens-label" x="340" y="235">M</text><text className="lens-label tangent-label" x="370" y="126">Tiếp tuyến</text><text className="lens-label normal-label" x="520" y="198">Pháp tuyến</text>
        {solved ? <text className="lens-deviation-label" x="525" y="270">r &lt; i · tia gần pháp tuyến hơn</text> : null}
      </svg>
    );
  }

  if (stage === "prisms") {
    const rayData = [
      { start: [42, 92] as Point, entry: [325, 92] as Point, exit: [387, 116] as Point },
      { start: [42, 150] as Point, entry: [301, 150] as Point, exit: [403, 160] as Point },
      { start: [42, 270] as Point, entry: [301, 270] as Point, exit: [403, 260] as Point },
      { start: [42, 328] as Point, entry: [325, 328] as Point, exit: [389, 304] as Point },
    ];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Bốn phần hình lăng kính ghép thành thấu kính hội tụ">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        {axis}
        <polygon className="lens-outline lens-fill" points="350,42 312,118 280,210 312,302 350,378 388,302 420,210 388,118" />
        <polygon className="lens-segment" points="350,42 312,118 388,118" />
        <polygon className="lens-segment" points="312,118 280,210 420,210 388,118" />
        <polygon className="lens-segment" points="280,210 312,302 388,302 420,210" />
        <polygon className="lens-segment" points="312,302 350,378 388,302" />
        {rayData.map((ray) => <g key={ray.start[1]}><RaySegment start={ray.start} end={ray.entry} markerId={markerId} className="lens-ray incoming" />{solved ? <><RaySegment start={ray.entry} end={ray.exit} markerId={insideMarkerId} className="lens-ray inside" /><RaySegment start={ray.exit} end={[620, 210]} markerId={markerId} /></> : null}<circle className="lens-contact" cx={ray.entry[0]} cy={ray.entry[1]} r="4" /></g>)}
        <path className="lens-base-arrow" d="M456 100 L456 174 M447 163 L456 174 L465 163" /><text className="lens-label" x="468" y="143">Đáy hướng xuống</text>
        <path className="lens-base-arrow" d="M456 320 L456 246 M447 257 L456 246 L465 257" /><text className="lens-label" x="468" y="287">Đáy hướng lên</text>
        {solved ? <><circle className="lens-focus" cx="620" cy="210" r="8" /><text className="lens-label" x="620" y="190" textAnchor="middle">Vùng hội tụ</text></> : null}
      </svg>
    );
  }

  if (stage === "morph") {
    const showResult = smoothness >= 80;
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Đường bao thấu kính chuyển dần từ gấp khúc sang mặt cong">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        {axis}
        <polygon className="lens-outline lens-fill lens-morph-shape" points={morphLensPoints(smoothness)} />
        {[95, 155, 265, 325].map((y) => <ConvergingRay key={y} y={y} markerId={markerId} solved={showResult} morph smoothness={smoothness} />)}
        {showResult ? <><circle className="lens-focus" cx="620" cy="210" r="8" /><text className="lens-label" x="620" y="190" textAnchor="middle">Vùng gặp nhau</text></> : null}
        <text className="lens-percent" x="350" y="408" textAnchor="middle">Mặt cong {smoothness}%</text>
        {smoothness < 80 ? <text className="lens-deviation-label" x="470" y="375">Tiếp tục làm nhỏ các bậc</text> : null}
      </svg>
    );
  }

  return (
    <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Tia xa trục lệch nhiều hơn tia gần trục và gặp nhau tại tiêu điểm">
      <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
      {axis}
      <polygon className="lens-outline lens-fill lens-morph-shape" points={morphLensPoints(100)} />
      <line className="lens-local-normal outer-normal" x1="280" y1="48" x2="370" y2="124" />
      <line className="lens-local-normal inner-normal" x1="235" y1="126" x2="355" y2="176" />
      <ConvergingRay y={80} markerId={markerId} solved={solved} emphasis="outer" />
      <ConvergingRay y={145} markerId={markerId} solved={solved} emphasis="inner" />
      <RaySegment start={[42, 210]} end={[270, 210]} markerId={markerId} className="lens-ray incoming center" />
      {solved ? <><RaySegment start={[270, 210]} end={[430, 210]} markerId={insideMarkerId} className="lens-ray inside center" /><RaySegment start={[430, 210]} end={[620, 210]} markerId={markerId} className="lens-ray center" /></> : null}
      <ConvergingRay y={275} markerId={markerId} solved={solved} emphasis="inner" />
      <ConvergingRay y={340} markerId={markerId} solved={solved} emphasis="outer" />
      {solved ? <>
        <circle className="lens-focus" cx="620" cy="210" r="9" /><text className="lens-label focus-label" x="630" y="202">F′</text>
        <text className="lens-deviation-label outer-text" x="480" y="88">Xa trục · lệch nhiều</text>
        <text className="lens-deviation-label inner-text" x="490" y="151">Gần trục · lệch ít</text>
        <text className="lens-deviation-label center-text" x="460" y="232">Trên trục · gần như thẳng</text>
      </> : null}
      <text className="lens-label" x="48" y="49">Chùm tia tới song song</text>
    </svg>
  );
}

function validStageId(value: unknown): value is StageId {
  return stages.some((stage) => stage.id === value);
}

export default function LensPathExplorer({ presentation = false }: { presentation?: boolean }) {
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState<StageId[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [smoothness, setSmoothness] = useState(0);
  const [feedback, setFeedback] = useState<"" | "correct" | "incorrect">("");

  const stage = stages[stageIndex];
  const solved = completed.includes(stage.id);
  const allComplete = completed.length === stages.length;
  const unlockedIndex = Math.min(stages.length - 1, completed.length);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey(presentation ? "lens-path-explorer-presentation-v2" : "lens-path-explorer-v2"),
    { stageIndex, completed, selections, smoothness },
    (value) => {
      if (!isDraftRecord(value)) return;
      const restoredCompleted = Array.isArray(value.completed) ? value.completed.filter(validStageId) : [];
      const restoredIndex = typeof value.stageIndex === "number" ? Math.max(0, Math.min(value.stageIndex, restoredCompleted.length, stages.length - 1)) : 0;
      setCompleted(restoredCompleted);
      setStageIndex(restoredIndex);
      if (isDraftRecord(value.selections)) {
        setSelections(Object.fromEntries(Object.entries(value.selections).filter((entry): entry is [string, string] => typeof entry[1] === "string")));
      }
      if (typeof value.smoothness === "number") setSmoothness(Math.max(0, Math.min(100, value.smoothness)));
    },
  );

  function selectStage(index: number) {
    if (index > unlockedIndex) return;
    setStageIndex(index);
    setFeedback("");
  }

  function setChoice(value: string) {
    if (solved) return;
    setSelections((current) => ({ ...current, [stage.id]: value }));
    setFeedback("");
  }

  function checkStage() {
    const correct = selections[stage.id] === stage.answer && (stage.id !== "morph" || smoothness >= 80);
    if (!correct) {
      setFeedback("incorrect");
      return;
    }
    setCompleted((current) => current.includes(stage.id) ? current : [...current, stage.id]);
    setFeedback("correct");
  }

  function resetActivity() {
    setStageIndex(0);
    setCompleted([]);
    setSelections({});
    setSmoothness(0);
    setFeedback("");
  }

  return (
    <section className={`lens-explorer ${presentation ? "presentation" : ""}`}>
      <header className="lens-explorer-hero">
        <div>
          <p className="eyebrow">GIẢI MÃ ĐƯỜNG ĐI CỦA TIA SÁNG</p>
          <h2>Vì sao thấu kính hội tụ làm tia sáng đổi hướng?</h2>
          <p>Bắt đầu từ một điểm tới, ghép nhiều phần nhỏ rồi hình thành tiêu điểm.</p>
        </div>
        <div className="lens-hero-mark" aria-hidden="true"><span>n₁</span><i /><b>n₂</b></div>
      </header>

      <div className="lens-stage-nav" role="tablist" aria-label="Bốn chặng khám phá thấu kính hội tụ">
        {stages.map((item, index) => {
          const itemComplete = completed.includes(item.id);
          const locked = index > unlockedIndex;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={index === stageIndex} aria-label={`Chặng ${index + 1}: ${item.shortLabel}${locked ? ", chưa mở" : ""}`} disabled={locked} className={`${index === stageIndex ? "active" : ""} ${itemComplete ? "complete" : ""}`} onClick={() => selectStage(index)}>
              <b>{itemComplete ? "✓" : index + 1}</b><span>{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="lens-learning-layout">
        <div className={`lens-visual-panel ${feedback === "incorrect" ? "try-again" : ""}`}>
          <div className="lens-visual-label"><span>MÔ HÌNH</span><small>{solved ? "Đường truyền đúng đã hiện" : "Tia ló chỉ hiện sau đáp án đúng"}</small></div>
          <LensDiagram stage={stage.id} solved={solved} smoothness={smoothness} />
        </div>

        <article className="lens-mission-panel">
          <div className="lens-stage-kicker"><span>CHẶNG {stageIndex + 1}/4</span><b>{stage.eyebrow}</b></div>
          <h3>{stage.title}</h3>
          <p className="lens-stage-lead">{stage.lead}</p>

          {stage.id === "morph" ? (
            <label className="lens-smooth-control">
              <span><b>Làm nhỏ các bậc</b><strong>{smoothness}%</strong></span>
              <input type="range" min="0" max="100" step="10" value={smoothness} disabled={solved} onChange={(event) => { setSmoothness(Number(event.target.value)); setFeedback(""); }} />
              <small>{smoothness < 80 ? "Đưa đến ít nhất 80% để mặt đủ mượt và quan sát tia ló." : "Mặt đã đủ mượt để kiểm tra nhận xét."}</small>
            </label>
          ) : null}

          <div className="lens-question-block">
            <strong>{stage.question}</strong>
            <div className="lens-choice-grid">
              {stage.choices.map((choice) => <button key={choice.value} type="button" disabled={solved} className={selections[stage.id] === choice.value ? "selected" : ""} onClick={() => setChoice(choice.value)}><span>{selections[stage.id] === choice.value ? "●" : "○"}</span>{choice.label}</button>)}
            </div>
          </div>

          {solved ? <><div className="lens-feedback correct"><span>✓</span><p>{stage.success}</p></div><ReasoningChain items={stage.reasoning} /></> : feedback === "incorrect" ? <div className="lens-feedback incorrect"><span>↺</span><p>Hướng tia chưa đúng nên tia ló vẫn được ẩn. Hãy kiểm tra lại điểm tới, pháp tuyến hoặc hướng đáy của phần thấu kính.</p></div> : null}

          <div className="lens-stage-actions">
            <button type="button" className="secondary-button" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>← Trước</button>
            {!solved ? <button type="button" className="primary-button" onClick={checkStage}>Kiểm tra hướng tia</button> : stageIndex < stages.length - 1 ? <button type="button" className="primary-button" onClick={() => selectStage(stageIndex + 1)}>Chặng tiếp theo →</button> : null}
          </div>
          <span className="draft-status lens-draft-status">{draftStatus}</span>
        </article>
      </div>

      {allComplete ? (
        <div className="lens-conclusion">
          <div className="lens-conclusion-icon" aria-hidden="true">◎</div>
          <div><p className="eyebrow">KẾT LUẬN</p><h3>Tiêu điểm là kết quả tổng hợp của các lần khúc xạ</h3><p>Mỗi tia đổi hướng tại hai mặt thấu kính. Hình dạng mặt cong làm tia xa trục lệch nhiều, tia gần trục lệch ít, nên chùm tia song song gặp nhau gần F′.</p></div>
          <div className="lens-conclusion-actions"><a className="primary-button" href="https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_vi.html" target="_blank" rel="noreferrer">Kiểm chứng trên PhET ↗</a><button type="button" className="secondary-button" onClick={resetActivity}>Làm lại</button></div>
        </div>
      ) : null}
    </section>
  );
}
