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
  teacherPrompt: string;
  listenFor: string;
  revealSteps: { button: string; title: string; text: string }[];
  conclusion: string;
};

const stages: Stage[] = [
  {
    id: "surface",
    shortLabel: "Chạm mặt cong",
    eyebrow: "CÙNG MỘT ĐIỂM M",
    title: "Tia sáng gặp mặt cong tại M",
    lead: "M được đặt ở vùng phía trên của thấu kính. Tia tới kết thúc đúng tại M và mọi đường dựng tiếp theo đều đi qua điểm này.",
    teacherPrompt: "Muốn dự đoán tia khúc xạ tại M, ta cần dựng những đường nào trước?",
    listenFor: "Học sinh nêu được tiếp tuyến tại M và pháp tuyến vuông góc với tiếp tuyến.",
    revealSteps: [
      { button: "Dựng tiếp tuyến", title: "Tiếp tuyến tại M", text: "Đường thẳng chỉ tiếp xúc với mặt cong tại vùng rất nhỏ quanh M." },
      { button: "Dựng pháp tuyến", title: "Pháp tuyến tại M", text: "Pháp tuyến vuông góc với tiếp tuyến và đi qua đúng điểm M." },
      { button: "Hiện tia khúc xạ", title: "Tia đổi hướng tại M", text: "Từ không khí vào thủy tinh, tia khúc xạ gần pháp tuyến hơn nên r < i." },
    ],
    conclusion: "Tại M, tia sáng đổi hướng theo pháp tuyến của chính mặt cong tại M.",
  },
  {
    id: "prisms",
    shortLabel: "Phóng to vùng M",
    eyebrow: "TỪ MẶT CONG ĐẾN MẢNH NHỎ",
    title: "Phóng to đúng vùng quanh M",
    lead: "Không đổi sang một dụng cụ khác: ta chỉ phóng to vùng thấu kính vừa xét ở chặng 1 và thay hai đoạn cong rất ngắn bằng hai mặt phẳng nghiêng.",
    teacherPrompt: "Nếu quan sát một vùng rất nhỏ quanh M, mặt cong có thể được xem gần đúng như dạng hình học nào?",
    listenFor: "Học sinh nhận ra vùng nhỏ có hai mặt nghiêng và dày dần về phía trục chính.",
    revealSteps: [
      { button: "Khoanh vùng M", title: "Giữ nguyên vùng đang xét", text: "Khung phóng đại bám đúng vùng M ở phía trên trục chính." },
      { button: "Thay bằng hai mặt phẳng", title: "Mảnh lăng kính gần đúng", text: "Hai đoạn cong rất ngắn được thay bằng hai mặt nghiêng; phần dày hơn hướng về trục." },
      { button: "Cho tia đi qua", title: "Hai lần khúc xạ", text: "Tia khúc xạ khi vào và khi ra; tác dụng tổng hợp làm tia lệch về phía đáy, tức về trục chính." },
    ],
    conclusion: "Mảnh lăng kính chỉ là mô hình phóng to gần đúng của chính vùng cong quanh M.",
  },
  {
    id: "morph",
    shortLabel: "Ghép các vùng",
    eyebrow: "TỪ MỘT MẢNH ĐẾN CẢ THẤU KÍNH",
    title: "Lặp lại cách xét ở nhiều vị trí",
    lead: "Mảnh phía trên có đáy hướng xuống; mảnh phía dưới có đáy hướng lên. Tất cả phần dày hơn đều hướng về trục chính.",
    teacherPrompt: "Khi đặt nhiều mảnh nhỏ đối xứng qua trục chính, đường bao và hướng lệch của các tia sẽ thay đổi thế nào?",
    listenFor: "Học sinh dự đoán các mảnh tạo thành mặt cong và đều hướng tia về trục chính.",
    revealSteps: [
      { button: "Ghép nhiều mảnh", title: "Các vùng nối tiếp nhau", text: "Cùng một cách xét tại M được lặp lại ở nhiều độ cao khác nhau." },
      { button: "Chỉ hướng các đáy", title: "Đáy cùng hướng về trục", text: "Phía trên hướng xuống, phía dưới hướng lên; vùng giữa gần như song song với trục." },
      { button: "Làm mượt đường bao", title: "Trở lại mặt cong", text: "Khi các mảnh nhỏ dần, đường bao gấp khúc tiến tới hai mặt cong liên tục của thấu kính." },
    ],
    conclusion: "Thấu kính hội tụ có thể được hình dung như rất nhiều mảnh nhỏ, dày hơn về phía trục chính.",
  },
  {
    id: "focus",
    shortLabel: "Hình thành tiêu điểm",
    eyebrow: "TỔNG HỢP TÁC DỤNG",
    title: "Từ từng lần khúc xạ đến tiêu điểm",
    lead: "Mặt cong nghiêng nhiều ở xa trục và nghiêng ít ở gần trục. Vì vậy mỗi tia nhận một độ lệch khác nhau.",
    teacherPrompt: "Tia ở xa trục hay gần trục phải đổi hướng nhiều hơn để cùng gặp nhau ở một vùng?",
    listenFor: "Học sinh chọn tia xa trục và giải thích bằng độ nghiêng của mặt cong tại điểm tới.",
    revealSteps: [
      { button: "So sánh độ nghiêng", title: "Pháp tuyến không giống nhau", text: "Xa trục, mặt cong nghiêng nhiều hơn; gần trục, mặt cong ít nghiêng hơn." },
      { button: "Hiện đường truyền", title: "Độ lệch được phân bố", text: "Tia xa trục lệch nhiều, tia gần trục lệch ít và các tia đều hướng về trục." },
      { button: "Đánh dấu F′", title: "Hình thành tiêu điểm", text: "Trong mô hình thấu kính mỏng, chùm tia tới song song gặp nhau gần F′." },
    ],
    conclusion: "Tiêu điểm là kết quả tổng hợp của rất nhiều tia được điều hướng với độ lệch khác nhau.",
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

function GuidedConvergingRay({ y, markerId, insideMarkerId }: { y: number; markerId: string; insideMarkerId: string }) {
  const entry: Point = [350 - smoothHalfWidth(y), y];
  const exitY = y + (210 - y) * 0.14;
  const exit: Point = [350 + smoothHalfWidth(exitY), exitY];
  const end: Point = [650, exitY + (210 - exitY) * 0.46];

  return (
    <g>
      <RaySegment start={[42, y]} end={entry} markerId={markerId} className="lens-ray incoming" />
      <RaySegment start={entry} end={exit} markerId={insideMarkerId} className="lens-ray inside" />
      <RaySegment start={exit} end={end} markerId={markerId} />
    </g>
  );
}

function GuidanceSequence({ stage, revealed }: { stage: Stage; revealed: number }) {
  return (
    <div className="lens-guidance-sequence" aria-label="Các ý đã lần lượt được làm rõ">
      {stage.revealSteps.map((item, index) => (
        <div key={item.title} className={index < revealed ? "revealed" : index === revealed ? "next" : "pending"}>
          <b>{index < revealed ? "✓" : index + 1}</b>
          <span><strong>{item.title}</strong><small>{index < revealed ? item.text : index === revealed ? "Nội dung tiếp theo sẽ được giáo viên mở." : "Chưa hiển thị"}</small></span>
        </div>
      ))}
    </div>
  );
}

function LensDiagram({ stage, revealed }: { stage: StageId; revealed: number }) {
  const markerId = `lens-arrow-${stage}`;
  const insideMarkerId = `lens-arrow-inside-${stage}`;
  const axis = <line className="lens-axis" x1="35" y1="210" x2="685" y2="210" />;

  if (stage === "surface") {
    const pointM: Point = [377.5, 122.5];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Tia tới chạm mặt cong tại M rồi khúc xạ vào thủy tinh">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        <path className="lens-glass-field" d="M430 40 Q360 120 360 210 Q360 300 430 380 L720 380 L720 40 Z" />
        <path className="lens-outline" d="M430 40 Q360 120 360 210 Q360 300 430 380" />
        {axis}
        <RaySegment start={[48, pointM[1]]} end={pointM} markerId={markerId} />
        <circle className="lens-hit" cx={pointM[0]} cy={pointM[1]} r="7" />
        <circle className="lens-focus-ring" cx={pointM[0]} cy={pointM[1]} r="18" />
        {revealed >= 1 ? <><line className="lens-tangent" x1="342" y1="208.5" x2="413" y2="36.5" /><text className="lens-label tangent-label" x="424" y="58">Tiếp tuyến tại M</text></> : null}
        {revealed >= 2 ? <><line className="lens-normal" x1="258.5" y1="73.5" x2="632.5" y2="227.5" /><path className="lens-angle" d="M326 122.5 A52 52 0 0 0 329.5 102.5" /><text className="lens-angle-label" x="326" y="96">i</text><text className="lens-label normal-label" x="525" y="198">Pháp tuyến tại M</text></> : null}
        {revealed >= 3 ? <><RaySegment start={pointM} end={[680, 195]} markerId={insideMarkerId} className="lens-ray refracted" /><path className="lens-angle refracted" d="M428 143 A54 54 0 0 0 430 135" /><text className="lens-angle-label" x="438" y="144">r</text><text className="lens-deviation-label" x="475" y="260">r &lt; i · tia lệch về pháp tuyến</text></> : null}
        <text className="lens-label" x="55" y="82">Không khí · n ≈ 1,00</text><text className="lens-label" x="510" y="82">Thủy tinh · n ≈ 1,50</text>
        <text className="lens-label lens-point-label" x="354" y="109">M</text><text className="lens-deviation-label" x="254" y="352">M nằm ở vùng phía trên trục chính</text>
      </svg>
    );
  }

  if (stage === "prisms") {
    const entry: Point = [371.3, 165];
    const exit: Point = [523.4, 185];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Vùng quanh M được phóng to và thay gần đúng bằng một mảnh lăng kính nhỏ">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        <g className="lens-context-mini">
          <line className="lens-axis" x1="35" y1="210" x2="245" y2="210" />
          <path className="lens-outline lens-fill" d="M180 48 Q132 125 132 210 Q132 295 180 372 Q228 295 228 210 Q228 125 180 48 Z" />
          <RaySegment start={[40, 122.5]} end={[145.4, 122.5]} markerId={markerId} />
          <circle className="lens-hit" cx="145.4" cy="122.5" r="6" />
          <text className="lens-label" x="132" y="105">M</text>
          <text className="lens-deviation-label" x="82" y="400">Vùng đã xét ở chặng 1</text>
        </g>
        {revealed >= 1 ? <><rect className="lens-zoom-box" x="121" y="91" width="82" height="72" rx="14" /><path className="lens-zoom-link" d="M203 96 L318 48 M203 158 L318 356" /><text className="lens-zoom-label" x="320" y="38">PHÓNG TO VÙNG M</text><rect className="lens-zoom-frame" x="318" y="48" width="360" height="308" rx="24" /></> : null}
        {revealed >= 1 ? <><path className="lens-original-curve" d="M405 72 Q355 190 330 330" /><path className="lens-original-curve" d="M485 72 Q535 190 560 330" /><text className="lens-label" x="420" y="337">Hai đoạn cong rất ngắn</text></> : null}
        {revealed >= 2 ? <><polygon className="lens-local-prism" points="390,85 500,85 555,320 335,320" /><text className="lens-label" x="445" y="115" textAnchor="middle">Mảnh gần đúng</text><path className="lens-base-arrow" d="M620 142 L620 272 M610 258 L620 272 L630 258" /><text className="lens-deviation-label" x="570" y="300">Dày dần về phía trục</text></> : null}
        {revealed >= 3 ? <><RaySegment start={[320, 165]} end={entry} markerId={markerId} /><RaySegment start={entry} end={exit} markerId={insideMarkerId} className="lens-ray inside" /><RaySegment start={exit} end={[674, 252]} markerId={markerId} /><circle className="lens-contact" cx={entry[0]} cy={entry[1]} r="5" /><circle className="lens-contact" cx={exit[0]} cy={exit[1]} r="5" /><circle className="lens-refraction-badge" cx="350" cy="145" r="14" /><text className="lens-refraction-count" x="350" y="151" textAnchor="middle">1</text><circle className="lens-refraction-badge" cx="540" cy="174" r="14" /><text className="lens-refraction-count" x="540" y="180" textAnchor="middle">2</text><text className="lens-deviation-label" x="505" y="380">Hai lần khúc xạ → lệch về phía đáy</text></> : null}
      </svg>
    );
  }

  if (stage === "morph") {
    const rayData = [
      { y: 92, entry: [325, 92] as Point, exit: [387, 116] as Point, end: [650, 154] as Point },
      { y: 150, entry: [301, 150] as Point, exit: [403, 160] as Point, end: [650, 188] as Point },
      { y: 270, entry: [301, 270] as Point, exit: [403, 260] as Point, end: [650, 232] as Point },
      { y: 328, entry: [325, 328] as Point, exit: [389, 304] as Point, end: [650, 266] as Point },
    ];
    return (
      <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Nhiều mảnh gần đúng được ghép rồi làm mượt thành thấu kính hội tụ">
        <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
        {axis}
        <polygon className={`lens-outline lens-fill lens-faceted-base ${revealed >= 3 ? "faded" : ""}`} points="350,42 312,118 280,210 312,302 350,378 388,302 420,210 388,118" />
        {[
          "350,42 312,118 388,118",
          "312,118 280,210 420,210 388,118",
          "280,210 312,302 388,302 420,210",
          "312,302 350,378 388,302",
        ].map((points, index) => <polygon key={points} className={`lens-segment ${revealed === 0 && index !== 1 ? "muted" : ""} ${revealed === 0 && index === 1 ? "origin" : ""}`} points={points} />)}
        {revealed === 0 ? <><text className="lens-deviation-label" x="430" y="142">Mảnh quanh M</text><path className="lens-callout" d="M421 147 L385 160" /></> : null}
        {revealed >= 3 ? <polygon className="lens-outline lens-fill lens-smooth-overlay" points={morphLensPoints(100)} /> : null}
        {revealed >= 2 ? <><path className="lens-base-arrow" d="M472 72 L472 151 M462 137 L472 151 L482 137" /><text className="lens-label" x="490" y="76">Phía trên: đáy hướng xuống</text><path className="lens-base-arrow" d="M472 348 L472 269 M462 283 L472 269 L482 283" /><text className="lens-label" x="490" y="354">Phía dưới: đáy hướng lên</text></> : null}
        {revealed >= 2 && revealed < 3 ? rayData.map((ray) => <g key={ray.y}><RaySegment start={[42, ray.y]} end={ray.entry} markerId={markerId} className="lens-ray incoming" /><RaySegment start={ray.entry} end={ray.exit} markerId={insideMarkerId} className="lens-ray inside" /><RaySegment start={ray.exit} end={ray.end} markerId={markerId} /></g>) : null}
        {revealed >= 3 ? <>{[92, 150, 270, 328].map((y) => <GuidedConvergingRay key={y} y={y} markerId={markerId} insideMarkerId={insideMarkerId} />)}<text className="lens-percent" x="350" y="405" textAnchor="middle">Các mảnh nhỏ dần → mặt cong liên tục</text></> : null}
      </svg>
    );
  }

  return (
    <svg className="lens-diagram" viewBox="0 0 720 420" role="img" aria-label="Tia xa trục lệch nhiều hơn tia gần trục và gặp nhau tại tiêu điểm">
      <defs><SvgArrow id={markerId} /><SvgArrow id={insideMarkerId} /></defs>
      {axis}
      <polygon className="lens-outline lens-fill lens-morph-shape" points={morphLensPoints(100)} />
      {revealed >= 1 ? <><line className="lens-local-normal outer-normal" x1="280" y1="48" x2="370" y2="124" /><line className="lens-local-normal inner-normal" x1="235" y1="126" x2="355" y2="176" /><text className="lens-deviation-label lens-label-halo outer-text" x="470" y="70">Xa trục · mặt nghiêng nhiều</text><text className="lens-deviation-label lens-label-halo inner-text" x="485" y="138">Gần trục · mặt nghiêng ít</text></> : null}
      <ConvergingRay y={80} markerId={markerId} solved={revealed >= 2} emphasis="outer" />
      <ConvergingRay y={145} markerId={markerId} solved={revealed >= 2} emphasis="inner" />
      <RaySegment start={[42, 210]} end={[270, 210]} markerId={markerId} className="lens-ray incoming center" />
      {revealed >= 2 ? <><RaySegment start={[270, 210]} end={[430, 210]} markerId={insideMarkerId} className="lens-ray inside center" /><RaySegment start={[430, 210]} end={[620, 210]} markerId={markerId} className="lens-ray center" /></> : null}
      <ConvergingRay y={275} markerId={markerId} solved={revealed >= 2} emphasis="inner" />
      <ConvergingRay y={340} markerId={markerId} solved={revealed >= 2} emphasis="outer" />
      {revealed >= 3 ? <>
        <circle className="lens-focus" cx="620" cy="210" r="9" /><text className="lens-label focus-label" x="630" y="202">F′</text>
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
  const [revealedByStage, setRevealedByStage] = useState<Partial<Record<StageId, number>>>({});

  const stage = stages[stageIndex];
  const revealed = revealedByStage[stage.id] ?? 0;
  const stageComplete = revealed >= stage.revealSteps.length;
  const completedCount = stages.filter((item) => (revealedByStage[item.id] ?? 0) >= item.revealSteps.length).length;
  const allComplete = completedCount === stages.length;
  const unlockedIndex = Math.min(stages.length - 1, completedCount);

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey(presentation ? "lens-path-explorer-presentation-v3" : "lens-path-explorer-v3"),
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
    <section className={`lens-explorer ${presentation ? "presentation" : ""}`}>
      <header className="lens-explorer-hero">
        <div>
          <p className="eyebrow">{presentation ? "GIÁO VIÊN DẪN DẮT" : "THEO DÕI CÙNG GIÁO VIÊN"}</p>
          <h2>Từ một điểm M đến tác dụng hội tụ</h2>
          <p>Một vùng được giữ xuyên suốt: chạm mặt cong → phóng to vùng M → ghép các vùng → hình thành tiêu điểm.</p>
        </div>
        <div className="lens-hero-mark" aria-hidden="true"><span>n₁</span><i /><b>n₂</b></div>
      </header>

      <div className="lens-stage-nav" role="tablist" aria-label="Bốn chặng khám phá thấu kính hội tụ">
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

      <div className="lens-learning-layout">
        <div className="lens-visual-panel">
          <div className="lens-visual-label"><span>MÔ HÌNH DẪN DẮT</span><small>{stageComplete ? "Đã hiện đủ nội dung của chặng" : `Đã hiện ${revealed}/${stage.revealSteps.length} bước`}</small></div>
          <LensDiagram stage={stage.id} revealed={revealed} />
        </div>

        <article className="lens-mission-panel">
          <div className="lens-stage-kicker"><span>CHẶNG {stageIndex + 1}/4</span><b>{stage.eyebrow}</b></div>
          <h3>{stage.title}</h3>
          <p className="lens-stage-lead">{stage.lead}</p>

          <div className="lens-teacher-prompt">
            <span aria-hidden="true">?</span>
            <div><small>{presentation ? "GV HỎI · CHỜ HỌC SINH DỰ ĐOÁN" : "SUY NGHĨ TRƯỚC KHI GIÁO VIÊN MỞ"}</small><strong>{stage.teacherPrompt}</strong></div>
          </div>

          <details className="lens-listen-for">
            <summary>Ý cần nghe từ học sinh</summary>
            <p>{stage.listenFor}</p>
          </details>

          <GuidanceSequence stage={stage} revealed={revealed} />

          {stageComplete ? <div className="lens-stage-conclusion"><span>✓</span><p><b>Chốt chặng:</b> {stage.conclusion}</p></div> : null}

          <div className="lens-stage-actions">
            <button type="button" className="secondary-button" disabled={stageIndex === 0} onClick={() => selectStage(stageIndex - 1)}>← Trước</button>
            {!stageComplete ? <button type="button" className="primary-button lens-reveal-button" onClick={revealNext}>Hiện: {stage.revealSteps[revealed].button} →</button> : stageIndex < stages.length - 1 ? <button type="button" className="primary-button" onClick={() => selectStage(stageIndex + 1)}>Chặng tiếp theo →</button> : null}
          </div>
          <span className="draft-status lens-draft-status">{draftStatus}</span>
        </article>
      </div>

      {allComplete ? (
        <div className="lens-conclusion">
          <div className="lens-conclusion-icon" aria-hidden="true">◎</div>
          <div><p className="eyebrow">CHỐT KIẾN THỨC</p><h3>Một mạch giải thích, không phải hai thí nghiệm rời nhau</h3><p>Ta xét khúc xạ tại M, phóng to chính vùng M thành một mảnh gần đúng, lặp lại ở nhiều vị trí rồi làm mượt thành thấu kính. Hai mặt cong phân bố độ lệch thích hợp để chùm tia song song gặp nhau gần F′.</p></div>
          <div className="lens-conclusion-actions"><a className="primary-button" href="https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_vi.html" target="_blank" rel="noreferrer">Kiểm chứng trên PhET ↗</a><button type="button" className="secondary-button" onClick={resetActivity}>Làm lại</button></div>
        </div>
      ) : null}
    </section>
  );
}
