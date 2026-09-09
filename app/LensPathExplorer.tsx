"use client";

import { useState } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type StageId = "surface" | "prisms" | "morph" | "focus" | "special" | "diverging";

type Stage = {
  id: StageId;
  shortLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  question: string;
  choices?: { value: string; label: string }[];
  answer?: string;
  success: string;
};

const stages: Stage[] = [
  {
    id: "surface",
    shortLabel: "Pháp tuyến",
    eyebrow: "MẶT CONG",
    title: "Mỗi điểm có một pháp tuyến riêng",
    lead: "Tia sáng không nhận biết cả thấu kính cùng lúc. Tại mỗi mặt, tia chỉ khúc xạ theo pháp tuyến ở đúng điểm tới.",
    question: "Từ không khí đi vào thủy tinh, tia khúc xạ lệch thế nào so với pháp tuyến?",
    choices: [
      { value: "near", label: "Lệch lại gần pháp tuyến" },
      { value: "away", label: "Lệch ra xa pháp tuyến" },
      { value: "straight", label: "Luôn truyền thẳng" },
    ],
    answer: "near",
    success: "Đúng. Vì chiết suất của thủy tinh lớn hơn không khí, tia trong thủy tinh gần pháp tuyến hơn tia tới.",
  },
  {
    id: "prisms",
    shortLabel: "Lăng kính nhỏ",
    eyebrow: "MÔ HÌNH GẦN ĐÚNG",
    title: "Có thể xem thấu kính như nhiều lăng kính nhỏ",
    lead: "Mỗi phần nhỏ của thấu kính làm tia lệch về phía đáy của “lăng kính nhỏ” tại phần đó.",
    question: "Muốn các tia song song lệch về trục chính, đáy các lăng kính nhỏ phải hướng về đâu?",
    choices: [
      { value: "axis", label: "Hướng về trục chính" },
      { value: "outside", label: "Hướng ra ngoài" },
      { value: "random", label: "Hướng bất kỳ" },
    ],
    answer: "axis",
    success: "Chính xác. Các phần trên lệch xuống, các phần dưới lệch lên; tổng thể tạo tác dụng hội tụ.",
  },
  {
    id: "morph",
    shortLabel: "Làm mượt",
    eyebrow: "TỪ BẬC THANG ĐẾN MẶT CONG",
    title: "Hình dạng thay đổi, quy luật khúc xạ không đổi",
    lead: "Kéo thanh trượt để làm mượt các mặt bậc. Quan sát phương của các tia sau thấu kính.",
    question: "Khi các bậc được làm mượt thành mặt cong, tác dụng chính của hệ là gì?",
    choices: [
      { value: "same", label: "Vẫn làm chùm tia hội tụ" },
      { value: "color", label: "Chỉ làm đổi màu ánh sáng" },
      { value: "none", label: "Không còn làm lệch tia" },
    ],
    answer: "same",
    success: "Đúng. Mặt cong là giới hạn của rất nhiều phần nhỏ; các tia vẫn được hướng dần về cùng một vùng.",
  },
  {
    id: "focus",
    shortLabel: "Tiêu điểm",
    eyebrow: "CHÙM TIA SONG SONG",
    title: "Vì sao xuất hiện tiêu điểm?",
    lead: "Càng xa trục chính, mặt thấu kính càng nghiêng nên pháp tuyến tại điểm tới cũng đổi hướng nhiều hơn.",
    question: "Trong mô hình thấu kính hội tụ, tia nào cần đổi hướng nhiều nhất để gặp các tia còn lại?",
    choices: [
      { value: "outer", label: "Tia ở xa trục chính nhất" },
      { value: "inner", label: "Tia gần trục chính nhất" },
      { value: "equal", label: "Mọi tia đổi hướng như nhau" },
    ],
    answer: "outer",
    success: "Đúng. Các tia ngoài lệch nhiều hơn, các tia gần trục lệch ít hơn và chùm tia gặp nhau gần F′.",
  },
  {
    id: "special",
    shortLabel: "Ba tia",
    eyebrow: "DỰNG ẢNH",
    title: "Ba tia đặc biệt không phải ba luật mới",
    lead: "Chúng là ba đường truyền dễ dựng được chọn từ vô số tia khúc xạ qua thấu kính mỏng.",
    question: "Ghép mỗi tia tới với đường truyền đúng sau thấu kính.",
    success: "Hoàn thành. Đảo chiều ánh sáng, tia vẫn đi lại đúng đường cũ — đó là tính thuận nghịch của ánh sáng.",
  },
  {
    id: "diverging",
    shortLabel: "Phân kỳ",
    eyebrow: "TIÊU ĐIỂM ẢO",
    title: "Đổi hình dạng, đổi tác dụng",
    lead: "Với thấu kính phân kỳ, các “lăng kính nhỏ” có đáy hướng ra ngoài nên chùm tia song song tách xa nhau.",
    question: "Các tia ló qua thấu kính phân kỳ cho ta xác định tiêu điểm F bằng cách nào?",
    choices: [
      { value: "extensions", label: "Kéo dài các tia ló về phía trước thấu kính" },
      { value: "meet", label: "Chờ các tia ló thật gặp nhau phía sau thấu kính" },
      { value: "center", label: "Lấy quang tâm làm tiêu điểm" },
    ],
    answer: "extensions",
    success: "Đúng. Đường kéo dài của các tia ló gặp nhau tại F; vì tia sáng thật không đi qua đó nên F là tiêu điểm ảo.",
  },
];

const specialOptions = [
  { value: "", label: "Chọn đường truyền" },
  { value: "far-focus", label: "Đi qua tiêu điểm ảnh F′" },
  { value: "straight", label: "Gần như truyền thẳng" },
  { value: "parallel", label: "Song song với trục chính" },
];

const initialMatches = { parallel: "", center: "", nearFocus: "" };

function SvgArrow({ id, color = "#ff6647" }: { id: string; color?: string }) {
  return (
    <marker id={id} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M1,1 L7,4 L1,7 Z" fill={color} />
    </marker>
  );
}

function DirectedRay({ points, markerId, className = "lens-ray" }: { points: string; markerId: string; className?: string }) {
  return <polyline className={className} points={points} markerMid={`url(#${markerId})`} />;
}

function reversiblePoints(points: [number, number][], reversed: boolean) {
  const ordered = reversed ? [...points].reverse() : points;
  return ordered.map(([x, y]) => `${x},${y}`).join(" ");
}

function LensDiagram({ stage, solved, smoothness, reversed }: { stage: StageId; solved: boolean; smoothness: number; reversed: boolean }) {
  const markerId = `lens-arrow-${stage}-${reversed ? "reverse" : "forward"}`;
  const axis = <line className="lens-axis" x1="40" y1="210" x2="680" y2="210" />;

  if (stage === "surface") {
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Tia sáng khúc xạ tại một điểm trên mặt cong">
        <defs><SvgArrow id={markerId} /></defs>
        <path className="lens-glass-field" d="M390 34 Q505 210 390 386 L720 386 L720 34 Z" />
        <path className="lens-outline" d="M390 34 Q505 210 390 386" />
        <line className="lens-normal" x1="250" y1="210" x2="650" y2="210" />
        <DirectedRay points="54,104 220,157 390,210" markerId={markerId} />
        {solved ? <DirectedRay points="390,210 520,219 674,230" markerId={markerId} /> : null}
        <circle className="lens-hit" cx="390" cy="210" r="6" />
        <text x="55" y="82">Không khí</text><text x="565" y="72">Thủy tinh</text><text className="lens-label" x="488" y="197">Pháp tuyến</text>
      </svg>
    );
  }

  if (stage === "prisms") {
    const rays = [88, 142, 278, 332];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Thấu kính hội tụ được chia thành nhiều lăng kính nhỏ">
        <defs><SvgArrow id={markerId} /></defs>
        {axis}
        <path className="lens-outline lens-fill" d="M350 42 Q268 210 350 378 Q432 210 350 42 Z" />
        <path className="lens-segment" d="M350 42 L305 116 L395 116 Z" />
        <path className="lens-segment" d="M305 116 L281 188 L419 188 L395 116 Z" />
        <path className="lens-segment" d="M281 232 L419 232 L395 304 L305 304 Z" />
        <path className="lens-segment" d="M305 304 L395 304 L350 378 Z" />
        {rays.map((y) => <DirectedRay key={y} points={`48,${y} 195,${y} 300,${y}`} markerId={markerId} className="lens-ray incoming" />)}
        {solved ? rays.map((y) => <DirectedRay key={`out-${y}`} points={`400,${y} 525,${(y + 210) / 2} 618,210`} markerId={markerId} />) : null}
        {solved ? <circle className="lens-focus" cx="618" cy="210" r="7" /> : null}
        <text className="lens-label" x="630" y="202">F′</text><text className="lens-label" x="285" y="404">Các phần nhỏ có đáy hướng về trục</text>
      </svg>
    );
  }

  if (stage === "morph") {
    const smoothOpacity = Math.max(0, (smoothness - 20) / 80);
    const stepOpacity = Math.max(0, 1 - smoothness / 80);
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Chuyển từ thấu kính bậc thành thấu kính mặt cong">
        <defs><SvgArrow id={markerId} /></defs>
        {axis}
        <g style={{ opacity: stepOpacity }}>
          <path className="lens-stepped" d="M325 48 L375 48 L375 92 L400 92 L400 145 L421 145 L421 275 L400 275 L400 328 L375 328 L375 372 L325 372 L325 328 L300 328 L300 275 L279 275 L279 145 L300 145 L300 92 L325 92 Z" />
        </g>
        <path className="lens-outline lens-fill" style={{ opacity: smoothOpacity }} d="M350 42 Q268 210 350 378 Q432 210 350 42 Z" />
        {[105, 158, 262, 315].map((y) => <DirectedRay key={y} points={`46,${y} 185,${y} 295,${y}`} markerId={markerId} className="lens-ray incoming" />)}
        {smoothness >= 80 ? [105, 158, 262, 315].map((y) => <DirectedRay key={`smooth-${y}`} points={`405,${y} 512,${(y + 210) / 2} 615,210`} markerId={markerId} />) : null}
        {smoothness >= 80 ? <circle className="lens-focus" cx="615" cy="210" r="7" /> : null}
        <text className="lens-percent" x="350" y="405" textAnchor="middle">Độ mượt {smoothness}%</text>
      </svg>
    );
  }

  if (stage === "focus") {
    const rays = [72, 132, 170, 250, 288, 348];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Các tia song song hội tụ tại tiêu điểm ảnh">
        <defs><SvgArrow id={markerId} /></defs>
        {axis}
        <path className="lens-outline lens-fill" d="M350 38 Q270 210 350 382 Q430 210 350 38 Z" />
        {rays.map((y) => <DirectedRay key={y} points={`38,${y} 184,${y} 300,${y}`} markerId={markerId} className={`lens-ray incoming ${y === 72 || y === 348 ? "outer" : ""}`} />)}
        {solved ? rays.map((y) => <DirectedRay key={`focus-${y}`} points={`400,${y} 505,${(y + 210) / 2} 610,210`} markerId={markerId} className={`lens-ray ${y === 72 || y === 348 ? "outer" : ""}`} />) : null}
        {solved ? <><circle className="lens-focus" cx="610" cy="210" r="8" /><text className="lens-label" x="620" y="201">F′</text></> : null}
        <text className="lens-label" x="47" y="50">Chùm song song</text>
      </svg>
    );
  }

  if (stage === "special") {
    const rayOne: [number, number][] = [[100, 100], [230, 100], [360, 100], [480, 205], [600, 310]];
    const rayTwo: [number, number][] = [[100, 100], [230, 155], [360, 210], [480, 260], [600, 310]];
    const rayThree: [number, number][] = [[100, 100], [236, 210], [360, 310], [480, 310], [600, 310]];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Ba tia đặc biệt qua thấu kính hội tụ">
        <defs><SvgArrow id={markerId} /></defs>
        {axis}
        <path className="lens-outline lens-fill" d="M360 38 Q282 210 360 382 Q438 210 360 38 Z" />
        <line className="lens-object" x1="100" y1="210" x2="100" y2="100" /><path className="lens-object-head" d="M100 100 L88 120 M100 100 L112 120" />
        <circle className="lens-point" cx="236" cy="210" r="5" /><circle className="lens-point" cx="486" cy="210" r="5" /><circle className="lens-point" cx="360" cy="210" r="5" />
        <text className="lens-label" x="221" y="232">F</text><text className="lens-label" x="474" y="232">F′</text><text className="lens-label" x="368" y="232">O</text>
        {solved ? <>
          <DirectedRay points={reversiblePoints(rayOne, reversed)} markerId={markerId} className="lens-ray ray-one" />
          <DirectedRay points={reversiblePoints(rayTwo, reversed)} markerId={markerId} className="lens-ray ray-two" />
          <DirectedRay points={reversiblePoints(rayThree, reversed)} markerId={markerId} className="lens-ray ray-three" />
          <line className="lens-image" x1="600" y1="210" x2="600" y2="310" /><path className="lens-image-head" d="M600 310 L588 290 M600 310 L612 290" />
        </> : null}
      </svg>
    );
  }

  return (
    <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Chùm tia qua thấu kính phân kỳ và đường kéo dài về tiêu điểm ảo">
      <defs><SvgArrow id={markerId} /></defs>
      {axis}
      <path className="lens-outline lens-fill diverging" d="M332 42 Q408 210 332 378 L408 378 Q332 210 408 42 Z" />
      {[160, 210, 260].map((y) => <DirectedRay key={y} points={`42,${y} 190,${y} 330,${y}`} markerId={markerId} className="lens-ray incoming" />)}
      {solved ? <>
        <DirectedRay points="408,160 530,112 662,60" markerId={markerId} />
        <DirectedRay points="408,210 530,210 662,210" markerId={markerId} />
        <DirectedRay points="408,260 530,308 662,360" markerId={markerId} />
        <line className="lens-extension" x1="408" y1="160" x2="280" y2="210" /><line className="lens-extension" x1="408" y1="260" x2="280" y2="210" />
        <circle className="lens-focus virtual" cx="280" cy="210" r="7" /><text className="lens-label" x="264" y="233">F</text>
      </> : null}
      <text className="lens-label" x="458" y="54">Tia ló phân kỳ</text>
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
  const [matches, setMatches] = useState(initialMatches);
  const [smoothness, setSmoothness] = useState(0);
  const [reversed, setReversed] = useState(false);
  const [feedback, setFeedback] = useState<"" | "correct" | "incorrect">("");

  const stage = stages[stageIndex];
  const solved = completed.includes(stage.id);
  const allComplete = completed.length === stages.length;
  const unlockedIndex = Math.min(stages.length - 1, completed.length);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey(presentation ? "lens-path-explorer-presentation" : "lens-path-explorer-v1"),
    { stageIndex, completed, selections, matches, smoothness, reversed },
    (value) => {
      if (!isDraftRecord(value)) return;
      const restoredCompleted = Array.isArray(value.completed) ? value.completed.filter(validStageId) : [];
      const restoredIndex = typeof value.stageIndex === "number" ? Math.max(0, Math.min(value.stageIndex, restoredCompleted.length, stages.length - 1)) : 0;
      setCompleted(restoredCompleted);
      setStageIndex(restoredIndex);
      if (isDraftRecord(value.selections)) {
        setSelections(Object.fromEntries(Object.entries(value.selections).filter((entry): entry is [string, string] => typeof entry[1] === "string")));
      }
      if (isDraftRecord(value.matches)) {
        setMatches({
          parallel: typeof value.matches.parallel === "string" ? value.matches.parallel : "",
          center: typeof value.matches.center === "string" ? value.matches.center : "",
          nearFocus: typeof value.matches.nearFocus === "string" ? value.matches.nearFocus : "",
        });
      }
      if (typeof value.smoothness === "number") setSmoothness(Math.max(0, Math.min(100, value.smoothness)));
      if (typeof value.reversed === "boolean") setReversed(value.reversed);
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
    let correct = false;
    if (stage.id === "special") {
      correct = matches.parallel === "far-focus" && matches.center === "straight" && matches.nearFocus === "parallel";
    } else if (stage.id === "morph") {
      correct = smoothness >= 80 && selections[stage.id] === stage.answer;
    } else {
      correct = selections[stage.id] === stage.answer;
    }
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
    setMatches(initialMatches);
    setSmoothness(0);
    setReversed(false);
    setFeedback("");
  }

  return (
    <section className={`lens-explorer ${presentation ? "presentation" : ""}`}>
      <header className="lens-explorer-hero">
        <div>
          <p className="eyebrow">GIẢI MÃ ĐƯỜNG ĐI CỦA TIA SÁNG</p>
          <h2>Vì sao thấu kính làm tia sáng đổi hướng?</h2>
          <p>Không học thuộc ba tia đặc biệt. Hãy tự xây lại chúng từ khúc xạ.</p>
        </div>
        <div className="lens-hero-mark" aria-hidden="true"><span>F</span><i /><b>F′</b></div>
      </header>

      <div className="lens-stage-nav" role="tablist" aria-label="Sáu chặng khám phá thấu kính">
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
          <div className="lens-visual-label"><span>MÔ HÌNH</span><small>{solved ? "Tia đúng đã hiện" : "Tia chỉ hiện khi trả lời đúng"}</small></div>
          <LensDiagram stage={stage.id} solved={solved} smoothness={smoothness} reversed={reversed} />
          {stage.id === "special" && solved ? <button type="button" className="lens-reverse-button" onClick={() => setReversed((value) => !value)}>⇄ {reversed ? "Chiều truyền ngược" : "Đảo chiều tia sáng"}</button> : null}
        </div>

        <article className="lens-mission-panel">
          <div className="lens-stage-kicker"><span>CHẶNG {stageIndex + 1}/6</span><b>{stage.eyebrow}</b></div>
          <h3>{stage.title}</h3>
          <p className="lens-stage-lead">{stage.lead}</p>

          {stage.id === "morph" ? (
            <label className="lens-smooth-control">
              <span><b>Làm mượt mặt thấu kính</b><strong>{smoothness}%</strong></span>
              <input type="range" min="0" max="100" step="10" value={smoothness} disabled={solved} onChange={(event) => { setSmoothness(Number(event.target.value)); setFeedback(""); }} />
              <small>{smoothness < 80 ? "Kéo đến ít nhất 80% để quan sát chùm tia hoàn chỉnh." : "Đã đủ mượt để kiểm tra dự đoán."}</small>
            </label>
          ) : null}

          <div className="lens-question-block">
            <strong>{stage.question}</strong>
            {stage.id === "special" ? (
              <div className="lens-match-grid">
                <label><span>Song song trục chính</span><select value={matches.parallel} disabled={solved} onChange={(event) => { setMatches((current) => ({ ...current, parallel: event.target.value })); setFeedback(""); }}>{specialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label><span>Qua quang tâm O</span><select value={matches.center} disabled={solved} onChange={(event) => { setMatches((current) => ({ ...current, center: event.target.value })); setFeedback(""); }}>{specialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label><span>Đi qua tiêu điểm F</span><select value={matches.nearFocus} disabled={solved} onChange={(event) => { setMatches((current) => ({ ...current, nearFocus: event.target.value })); setFeedback(""); }}>{specialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              </div>
            ) : (
              <div className="lens-choice-grid">
                {stage.choices?.map((choice) => <button key={choice.value} type="button" disabled={solved} className={selections[stage.id] === choice.value ? "selected" : ""} onClick={() => setChoice(choice.value)}><span>{selections[stage.id] === choice.value ? "●" : "○"}</span>{choice.label}</button>)}
              </div>
            )}
          </div>

          {solved ? <div className="lens-feedback correct"><span>✓</span><p>{stage.success}</p></div> : feedback === "incorrect" ? <div className="lens-feedback incorrect"><span>↺</span><p>Tia chưa đúng nên đã được ẩn. Xem lại pháp tuyến hoặc hướng đáy lăng kính rồi thử lại.</p></div> : null}

          <div className="lens-stage-actions">
            <button type="button" className="secondary-button" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>← Trước</button>
            {!solved ? <button type="button" className="primary-button" onClick={checkStage}>Kiểm tra tia</button> : stageIndex < stages.length - 1 ? <button type="button" className="primary-button" onClick={() => selectStage(stageIndex + 1)}>Chặng tiếp theo →</button> : null}
          </div>
          <span className="draft-status lens-draft-status">{draftStatus}</span>
        </article>
      </div>

      {allComplete ? (
        <div className="lens-conclusion">
          <div className="lens-conclusion-icon" aria-hidden="true">◎</div>
          <div><p className="eyebrow">KẾT LUẬN</p><h3>Tia đặc biệt là kết quả của hai lần khúc xạ</h3><p>Hình dạng hai mặt làm pháp tuyến đổi theo từng điểm tới. Tổng hợp hai lần khúc xạ tạo nên tác dụng hội tụ hoặc phân kỳ của thấu kính.</p></div>
          <div className="lens-conclusion-actions"><a className="primary-button" href="https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_vi.html" target="_blank" rel="noreferrer">Kiểm chứng trên PhET ↗</a><button type="button" className="secondary-button" onClick={resetActivity}>Làm lại</button></div>
        </div>
      ) : null}
    </section>
  );
}
