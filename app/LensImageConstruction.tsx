"use client";

import { useMemo, useState, type ReactNode } from "react";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type LensKind = "convex" | "concave";
type RayId = "parallel" | "center" | "focal";
type RayPhase = "hidden" | "incident" | "complete";

type PositionOption = {
  id: string;
  label: string;
  d: number;
};

const FOCAL_LENGTH = 3;
const OBJECT_HEIGHT = 2;
const UNIT = 46;
const GRID_HALF_COLS = 11;
const GRID_HALF_ROWS = 6;

const convexPositions: PositionOption[] = [
  { id: "d-lt-f", label: "d < f", d: 1.5 },
  { id: "d-eq-f", label: "d = f", d: FOCAL_LENGTH },
  { id: "f-lt-d-lt-2f", label: "f < d < 2f", d: 4.5 },
  { id: "d-eq-2f", label: "d = 2f", d: 2 * FOCAL_LENGTH },
  { id: "d-gt-2f", label: "d > 2f", d: 8 },
];

const concavePositions: PositionOption[] = [
  { id: "d-lt-f", label: "d < f", d: 1.5 },
  { id: "d-eq-f", label: "d = f", d: FOCAL_LENGTH },
  { id: "d-gt-f", label: "d > f", d: 6 },
];

const rayLabels: Record<RayId, { incidentLabel: string; emergentLabel: string; incidentDesc: string; emergentDescConvex: string; emergentDescConcave: string }> = {
  parallel: {
    incidentLabel: "Tia tới song song với trục chính",
    emergentLabel: "Tia ló đi qua tiêu điểm F′",
    incidentDesc: "Xuất phát từ đỉnh vật, đi song song với trục chính tới thấu kính.",
    emergentDescConvex: "Sau khi qua thấu kính hội tụ, tia ló đi qua tiêu điểm ảnh F′.",
    emergentDescConcave: "Sau khi qua thấu kính phân kì, đường kéo dài của tia ló đi qua tiêu điểm F (cùng phía với tia tới).",
  },
  center: {
    incidentLabel: "Tia tới đi qua quang tâm O",
    emergentLabel: "Tia ló truyền thẳng (không đổi hướng)",
    incidentDesc: "Xuất phát từ đỉnh vật, đi thẳng qua quang tâm O.",
    emergentDescConvex: "Tia đi qua quang tâm truyền thẳng, không đổi hướng.",
    emergentDescConcave: "Tia đi qua quang tâm truyền thẳng, không đổi hướng.",
  },
  focal: {
    incidentLabel: "Tia tới đi qua tiêu điểm F",
    emergentLabel: "Tia ló song song với trục chính",
    incidentDesc: "Xuất phát từ đỉnh vật, có đường đi qua tiêu điểm vật F, tới thấu kính.",
    emergentDescConvex: "Sau khi qua thấu kính hội tụ, tia ló song song với trục chính.",
    emergentDescConcave: "Tia tới hướng thẳng tới tiêu điểm F′ phía sau thấu kính; tia ló song song với trục chính.",
  },
};

type Point = [number, number];

function toPixel([x, y]: Point): Point {
  return [x * UNIT + GRID_HALF_COLS * UNIT, GRID_HALF_ROWS * UNIT - y * UNIT];
}

function computeImage(kind: LensKind, d: number) {
  const f = FOCAL_LENGTH;
  if (kind === "convex") {
    if (Math.abs(d - f) < 0.001) {
      return { dPrime: null, magnification: null, real: false, atInfinity: true };
    }
    const dPrime = (d * f) / (d - f);
    const magnification = -dPrime / d;
    return { dPrime, magnification, real: dPrime > 0, atInfinity: false };
  }
  const dPrime = -(d * f) / (d + f);
  const magnification = -dPrime / d;
  return { dPrime, magnification, real: false, atInfinity: false };
}

function GridBackground() {
  const lines: ReactNode[] = [];
  for (let col = -GRID_HALF_COLS; col <= GRID_HALF_COLS; col += 1) {
    const [x] = toPixel([col, 0]);
    lines.push(<line key={`v${col}`} className={col === 0 ? "lens-construction-axis-line" : "lens-construction-grid-line"} x1={x} y1={0} x2={x} y2={GRID_HALF_ROWS * 2 * UNIT} />);
  }
  for (let row = -GRID_HALF_ROWS; row <= GRID_HALF_ROWS; row += 1) {
    const [, y] = toPixel([0, row]);
    lines.push(<line key={`h${row}`} className={row === 0 ? "lens-construction-axis-line" : "lens-construction-grid-line"} x1={0} y1={y} x2={GRID_HALF_COLS * 2 * UNIT} y2={y} />);
  }
  return <g className="lens-construction-grid">{lines}</g>;
}

function LensGlyph({ kind }: { kind: LensKind }) {
  const [x0, yTop] = toPixel([0, GRID_HALF_ROWS - 0.4]);
  const [, yBottom] = toPixel([0, -(GRID_HALF_ROWS - 0.4)]);
  const mid = (yTop + yBottom) / 2;
  if (kind === "convex") {
    // Thấu kính hội tụ: rìa mỏng, giữa dày — hai cạnh phình ra xa trục trung tâm ở giữa.
    return (
      <g className="lens-construction-glyph">
        <line x1={x0} y1={yTop} x2={x0} y2={yBottom} className="lens-construction-lens-body" />
        <path d={`M${x0} ${yTop} Q${x0 - 9} ${mid} ${x0} ${yBottom}`} className="lens-construction-lens-edge" />
        <path d={`M${x0} ${yTop} Q${x0 + 9} ${mid} ${x0} ${yBottom}`} className="lens-construction-lens-edge" />
      </g>
    );
  }
  // Thấu kính phân kì: rìa dày, giữa mỏng — hai cạnh lõm vào gần trục trung tâm ở giữa.
  return (
    <g className="lens-construction-glyph">
      <line x1={x0} y1={yTop} x2={x0} y2={yBottom} className="lens-construction-lens-body" />
      <path d={`M${x0 - 9} ${yTop} Q${x0} ${mid} ${x0 - 9} ${yBottom}`} className="lens-construction-lens-edge" fill="none" />
      <path d={`M${x0 + 9} ${yTop} Q${x0} ${mid} ${x0 + 9} ${yBottom}`} className="lens-construction-lens-edge" fill="none" />
    </g>
  );
}

function rayAtLens(kind: LensKind, rayId: RayId, d: number, height: number): { atLens: Point; afterDirection: Point } {
  if (rayId === "parallel") {
    const atLens: Point = [0, height];
    if (kind === "convex") {
      // Thấu kính hội tụ: tia ló đi qua tiêu điểm ảnh F′(f, 0) phía sau thấu kính.
      const dir: Point = [FOCAL_LENGTH - 0, 0 - height];
      return { atLens, afterDirection: dir };
    }
    // Thấu kính phân kì: tia ló đi ra xa trục chính, đường kéo dài của nó (về phía sau, x âm)
    // đi qua tiêu điểm F(-f, 0) cùng phía với vật. Vậy tia ló đi theo hướng từ F tới điểm tới atLens,
    // tức là hướng (atLens - F) = (0 - (-f), height - 0) = (f, height), tiếp tục truyền về phía trước (x dương).
    const dir: Point = [FOCAL_LENGTH - 0, height - 0];
    return { atLens, afterDirection: dir };
  }
  if (rayId === "center") {
    // Tia đi qua quang tâm O truyền thẳng không đổi hướng: hướng ló ra giữ nguyên hướng tia tới,
    // đi từ đỉnh vật A(-d, height) tới O(0, 0), tức là hướng (d, -height).
    const atLens: Point = [0, 0];
    const dir: Point = [d, -height];
    return { atLens, afterDirection: dir };
  }
  if (kind === "convex") {
    // Tia tới đi từ đỉnh vật A(-d, height) qua tiêu điểm vật F(-f, 0), kéo dài tới mặt thấu kính (x = 0).
    // Tham số hoá: điểm = A + t * (F - A); tại x = 0 => t = d / (d - f).
    const t = d / (d - FOCAL_LENGTH);
    const yAtLens = height + t * (0 - height);
    const atLens: Point = [0, yAtLens];
    return { atLens, afterDirection: [1, 0] };
  }
  // Thấu kính phân kì: tia tới hướng thẳng về tiêu điểm ảnh F'(f, 0) phía sau thấu kính, kéo dài tới mặt thấu kính (x = 0).
  const t = d / (d + FOCAL_LENGTH);
  const yAtLens = height + t * (0 - height);
  const atLens: Point = [0, yAtLens];
  return { atLens, afterDirection: [1, 0] };
}

/**
 * Tính độ dài tham số t (tính theo đơn vị lưới) để tia ló đi từ `atLens` theo hướng `direction`
 * vừa chạm biên của lưới hiển thị (±GRID_HALF_COLS, ±GRID_HALF_ROWS), để tia ló luôn vẽ gọn trong
 * khung nhìn thay vì vươn ra ngoài viewBox khiến mũi tên giữa đường bị khuất.
 */
function distanceToGridEdge(atLens: Point, direction: Point): number {
  const [x0, y0] = atLens;
  const [dx, dy] = direction;
  const candidates: number[] = [];
  if (dx > 0) candidates.push((GRID_HALF_COLS - x0) / dx);
  if (dx < 0) candidates.push((-GRID_HALF_COLS - x0) / dx);
  if (dy > 0) candidates.push((GRID_HALF_ROWS - y0) / dy);
  if (dy < 0) candidates.push((-GRID_HALF_ROWS - y0) / dy);
  const positive = candidates.filter((t) => t > 0);
  return positive.length > 0 ? Math.min(...positive) : 14;
}

function buildRayPaths(kind: LensKind, rayId: RayId, d: number, height: number) {
  const objectTip: Point = [-d, height];
  const { atLens, afterDirection } = rayAtLens(kind, rayId, d, height);
  const extendFactor = distanceToGridEdge(atLens, afterDirection);
  const emergentEnd: Point = [atLens[0] + afterDirection[0] * extendFactor, atLens[1] + afterDirection[1] * extendFactor];
  return { objectTip, atLens, emergentEnd, afterDirection };
}

/**
 * Vẽ một đầu mũi tên (tam giác) đặc, đặt tại điểm `at`, hướng theo (dx, dy).
 * Dùng path/transform trực tiếp thay cho kỹ thuật "marker trên đoạn thẳng dài ~0" vì cách đó
 * không đáng tin cậy trên mọi trình duyệt khi đoạn thẳng quá ngắn (độ dài gần 0).
 */
function ArrowHead({ at, dx, dy, fill }: { at: Point; dx: number; dy: number; fill: string }) {
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <path
      d="M-10,-6 L2,0 L-10,6 Z"
      fill={fill}
      transform={`translate(${at[0]} ${at[1]}) rotate(${angleDeg})`}
    />
  );
}

/** Vẽ một mũi tên nhỏ ngay giữa đoạn (px1,py1)-(px2,py2), hướng theo chiều truyền của tia sáng. */
function MidArrow({ p1, p2, fill }: { p1: Point; p2: Point; fill: string }) {
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return <ArrowHead at={[mx, my]} dx={dx} dy={dy} fill={fill} />;
}

/** Vẽ mũi tên ngay tại đầu mút p2 của đoạn (dùng cho vật và ảnh, mũi tên luôn ở đỉnh mũi tên biểu diễn). */
function TipArrow({ p1, p2, fill }: { p1: Point; p2: Point; fill: string }) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return <ArrowHead at={p2} dx={dx} dy={dy} fill={fill} />;
}

export default function LensImageConstruction() {
  const [lensKind, setLensKind] = useState<LensKind>("convex");
  const [positionId, setPositionId] = useState(convexPositions[3].id);
  const [selectedRayIds, setSelectedRayIds] = useState<RayId[]>([]);
  const [rayPhases, setRayPhases] = useState<Record<RayId, RayPhase>>({ parallel: "hidden", center: "hidden", focal: "hidden" });
  const [pendingEmergentChoice, setPendingEmergentChoice] = useState<RayId | null>(null);
  const [feedback, setFeedback] = useState<{ rayId: RayId; correct: boolean } | null>(null);
  const [extensionRevealed, setExtensionRevealed] = useState(false);

  const positions = lensKind === "convex" ? convexPositions : concavePositions;
  const position = positions.find((item) => item.id === positionId) ?? positions[0];
  const d = position.d;

  const { draftStatus } = useDeviceDraft(
    deviceDraftKey("lens-image-construction-v1"),
    { lensKind, positionId },
    (value) => {
      if (!isDraftRecord(value)) return;
      if (value.lensKind === "convex" || value.lensKind === "concave") setLensKind(value.lensKind);
      if (typeof value.positionId === "string") setPositionId(value.positionId);
    },
  );

  const availableRays: RayId[] = useMemo(() => {
    if (lensKind === "concave") return ["parallel", "center", "focal"];
    if (d <= FOCAL_LENGTH) return ["parallel", "center"];
    return ["parallel", "center", "focal"];
  }, [lensKind, d]);

  const imageInfo = useMemo(() => computeImage(lensKind, d), [lensKind, d]);
  const bothRaysComplete = selectedRayIds.length === 2 && selectedRayIds.every((rayId) => rayPhases[rayId] === "complete");

  function changeLensKind(kind: LensKind) {
    setLensKind(kind);
    setPositionId(kind === "convex" ? convexPositions[3].id : concavePositions[2].id);
    setSelectedRayIds([]);
    setRayPhases({ parallel: "hidden", center: "hidden", focal: "hidden" });
    setPendingEmergentChoice(null);
    setFeedback(null);
    setExtensionRevealed(false);
  }

  function changePosition(nextId: string) {
    setPositionId(nextId);
    setSelectedRayIds([]);
    setRayPhases({ parallel: "hidden", center: "hidden", focal: "hidden" });
    setPendingEmergentChoice(null);
    setFeedback(null);
    setExtensionRevealed(false);
  }

  function toggleRaySelection(rayId: RayId) {
    if (selectedRayIds.includes(rayId)) {
      setSelectedRayIds((current) => current.filter((item) => item !== rayId));
      setRayPhases((current) => ({ ...current, [rayId]: "hidden" }));
      if (pendingEmergentChoice === rayId) setPendingEmergentChoice(null);
      setExtensionRevealed(false);
      return;
    }
    if (selectedRayIds.length >= 2) return;
    if (pendingEmergentChoice) return;
    setSelectedRayIds((current) => [...current, rayId]);
    setRayPhases((current) => ({ ...current, [rayId]: "incident" }));
    setPendingEmergentChoice(rayId);
    setFeedback(null);
  }

  function chooseEmergentDescription(rayId: RayId, chosenLabel: string) {
    const correctLabel = rayLabels[rayId].emergentLabel;
    const correct = chosenLabel === correctLabel;
    setFeedback({ rayId, correct });
    if (correct) {
      setRayPhases((current) => ({ ...current, [rayId]: "complete" }));
      setPendingEmergentChoice(null);
    }
  }

  function resetActivity() {
    setSelectedRayIds([]);
    setRayPhases({ parallel: "hidden", center: "hidden", focal: "hidden" });
    setPendingEmergentChoice(null);
    setFeedback(null);
    setExtensionRevealed(false);
  }

  const emergentOptions = pendingEmergentChoice
    ? [rayLabels[pendingEmergentChoice].emergentLabel, ...availableRays.filter((item) => item !== pendingEmergentChoice).map((item) => rayLabels[item].emergentLabel)].sort()
    : [];

  const completedRays = selectedRayIds.filter((rayId) => rayPhases[rayId] === "complete");
  const rayGeometry = completedRays.map((rayId) => ({ rayId, ...buildRayPaths(lensKind, rayId, d, OBJECT_HEIGHT) }));

  let imageTip: Point | null = null;
  let imageIsVirtual = false;
  if (bothRaysComplete && rayGeometry.length === 2) {
    const [first, second] = rayGeometry;
    const denom = first.afterDirection[1] * second.afterDirection[0] - second.afterDirection[1] * first.afterDirection[0];
    if (Math.abs(denom) > 1e-6) {
      const dx = second.atLens[0] - first.atLens[0];
      const dy = second.atLens[1] - first.atLens[1];
      const t = (dy * second.afterDirection[0] - dx * second.afterDirection[1]) / denom;
      imageTip = [first.atLens[0] + first.afterDirection[0] * t, first.atLens[1] + first.afterDirection[1] * t];
      // Ảnh ảo khi giao điểm nằm ở phía sau tia ló thực (t < 0), phải kéo dài ngược tia ló bằng nét đứt để tới được ảnh.
      imageIsVirtual = t < 0;
    }
  }

  return (
    <div className="lens-construction">
      <div className="lens-construction-intro">
        <div><p className="eyebrow">DỰNG ẢNH QUA THẤU KÍNH</p><h3>Chọn 2 tia sáng đặc biệt để dựng ảnh</h3><p>Chọn loại thấu kính, vị trí đặt vật, rồi chọn 2 trong 3 tia đặc biệt để dựng ảnh của vật.</p></div>
      </div>

      <div className="lens-construction-controls">
        <div className="lens-construction-control-group">
          <span>Loại thấu kính</span>
          <div className="practice-options practice-options-horizontal">
            <button type="button" className={lensKind === "convex" ? "selected" : ""} onClick={() => changeLensKind("convex")}>Thấu kính hội tụ</button>
            <button type="button" className={lensKind === "concave" ? "selected" : ""} onClick={() => changeLensKind("concave")}>Thấu kính phân kì</button>
          </div>
        </div>
        <div className="lens-construction-control-group">
          <span>Vị trí đặt vật</span>
          <div className="practice-options practice-options-horizontal">
            {positions.map((item) => <button key={item.id} type="button" className={positionId === item.id ? "selected" : ""} onClick={() => changePosition(item.id)}>{item.label}</button>)}
          </div>
        </div>
      </div>

      <div className="lens-construction-workspace">
      <div className="lens-construction-stage">
        <svg className="lens-construction-diagram" viewBox={`0 0 ${GRID_HALF_COLS * 2 * UNIT} ${GRID_HALF_ROWS * 2 * UNIT}`} role="img" aria-label="Sơ đồ dựng ảnh qua thấu kính trên lưới ô ly">
          <GridBackground />
          <LensGlyph kind={lensKind} />

          {(() => {
            const [fx, fy] = toPixel([-FOCAL_LENGTH, 0]);
            const [fpx, fpy] = toPixel([FOCAL_LENGTH, 0]);
            const [ox, oy] = toPixel([0, 0]);
            return (
              <>
                <circle className="lens-construction-point" cx={fx} cy={fy} r="4" /><text className="lens-construction-label" x={fx - 8} y={fy + 22}>F</text>
                <circle className="lens-construction-point" cx={fpx} cy={fpy} r="4" /><text className="lens-construction-label" x={fpx - 8} y={fpy + 22}>F′</text>
                <circle className="lens-construction-point" cx={ox} cy={oy} r="4" /><text className="lens-construction-label" x={ox + 8} y={oy - 10}>O</text>
              </>
            );
          })()}

          {(() => {
            const objBase: Point = [-d, 0];
            const objTip: Point = [-d, OBJECT_HEIGHT];
            const [ox, oy] = toPixel(objBase);
            const [tx, ty] = toPixel(objTip);
            return (
              <>
                <line className="lens-construction-object" x1={ox} y1={oy} x2={tx} y2={ty} />
                <TipArrow p1={[ox, oy]} p2={[tx, ty]} fill="#ef8b00" />
              </>
            );
          })()}

          {selectedRayIds.map((rayId) => {
            const phase = rayPhases[rayId];
            const { objectTip, atLens, emergentEnd } = buildRayPaths(lensKind, rayId, d, OBJECT_HEIGHT);
            const [ox, oy] = toPixel(objectTip);
            const [lx, ly] = toPixel(atLens);
            const [ex, ey] = toPixel(emergentEnd);
            const showExtension = phase === "complete" && bothRaysComplete && imageIsVirtual && extensionRevealed && imageTip;
            const [vx, vy] = showExtension ? toPixel(imageTip!) : [lx, ly];
            return (
              <g key={rayId}>
                <line className="lens-construction-ray incident" x1={ox} y1={oy} x2={lx} y2={ly} />
                <MidArrow p1={[ox, oy]} p2={[lx, ly]} fill="#ef8b00" />
                {phase === "complete" ? (
                  <>
                    <line className="lens-construction-ray emergent" x1={lx} y1={ly} x2={ex} y2={ey} />
                    <MidArrow p1={[lx, ly]} p2={[ex, ey]} fill="#1677b8" />
                  </>
                ) : null}
                {showExtension ? (
                  <line className="lens-construction-ray emergent-extension" x1={lx} y1={ly} x2={vx} y2={vy} />
                ) : null}
              </g>
            );
          })}

          {bothRaysComplete && imageTip && (!imageIsVirtual || extensionRevealed) ? (() => {
            const [ix, iy] = toPixel([imageTip![0], 0]);
            const [tx, ty] = toPixel(imageTip!);
            return (
              <>
                <line className={`lens-construction-image${imageIsVirtual ? " virtual" : ""}`} x1={ix} y1={iy} x2={tx} y2={ty} />
                <TipArrow p1={[ix, iy]} p2={[tx, ty]} fill="#7b5be7" />
              </>
            );
          })() : null}
        </svg>
      </div>

      <div className="lens-construction-rays-panel">
        <p className="lens-construction-rays-heading">Chọn 2 tia đặc biệt (đã chọn {selectedRayIds.length}/2)</p>
        <div className="lens-construction-ray-buttons">
          {availableRays.map((rayId) => {
            const selected = selectedRayIds.includes(rayId);
            const disabled = !selected && (selectedRayIds.length >= 2 || pendingEmergentChoice !== null);
            return (
              <button key={rayId} type="button" className={selected ? "selected" : ""} disabled={disabled} onClick={() => toggleRaySelection(rayId)}>
                {selected ? <strong>✓ {rayLabels[rayId].incidentLabel}</strong> : rayLabels[rayId].incidentLabel}
              </button>
            );
          })}
        </div>

        {pendingEmergentChoice ? (
          <div className="lens-construction-emergent-quiz">
            <p className="lens-construction-emergent-question">Tia ló tương ứng đi như thế nào?</p>
            <div className="practice-options">
              {emergentOptions.map((optionLabel) => (
                <button key={optionLabel} type="button" onClick={() => chooseEmergentDescription(pendingEmergentChoice, optionLabel)} className={feedback && feedback.rayId === pendingEmergentChoice ? (optionLabel === rayLabels[pendingEmergentChoice].emergentLabel ? resultBadge(feedback.correct) : "") : ""}>
                  {optionLabel}
                </button>
              ))}
            </div>
            {feedback && feedback.rayId === pendingEmergentChoice && !feedback.correct ? <p className="lens-construction-feedback incorrect">Chưa đúng. Hãy đọc lại mô tả tia tới rồi chọn lại.</p> : null}
          </div>
        ) : null}

        {selectedRayIds.length > 0 && !pendingEmergentChoice ? (
          <div className="lens-construction-completed-list">
            {selectedRayIds.map((rayId) => (
              <p key={rayId} className={rayPhases[rayId] === "complete" ? "lens-construction-feedback correct" : ""}>
                {rayPhases[rayId] === "complete" ? "✓ " : ""}{rayLabels[rayId].incidentLabel} → {lensKind === "convex" ? rayLabels[rayId].emergentDescConvex : rayLabels[rayId].emergentDescConcave}
              </p>
            ))}
          </div>
        ) : null}

        {bothRaysComplete && imageIsVirtual && !extensionRevealed ? (
          <div className="lens-construction-emergent-quiz">
            <p>Hai tia ló không cắt nhau ở phía trước thấu kính — ảnh là ảnh ảo. Hãy vẽ đường kéo dài của 2 tia ló (nét đứt) để tìm ảnh.</p>
            <button type="button" className="secondary-button" onClick={() => setExtensionRevealed(true)}>Vẽ đường kéo dài</button>
          </div>
        ) : null}
      </div>
      </div>

      {bothRaysComplete && (!imageIsVirtual || extensionRevealed) ? (
        <div className="lens-construction-result">
          <p className="eyebrow">Kết quả dựng ảnh</p>
          {imageInfo.atInfinity ? (
            <p>
              Khi d = f, vật nằm đúng tại tiêu điểm F. Tia tới song song với trục chính sau khi qua thấu kính sẽ đi qua tiêu điểm ảnh F′,
              còn tia tới đi qua quang tâm O truyền thẳng không đổi hướng — hai tia ló này song song với nhau (không cắt nhau ở bất kỳ điểm nào phía trước hay phía sau thấu kính).
              Vì ảnh được xác định là giao điểm của các tia ló, hai tia song song chỉ “gặp nhau” ở vô cực, nên ảnh ở vô cực và không thể dựng được ảnh rõ nét trên mặt phẳng hữu hạn.
            </p>
          ) : (
            <p>
              Ảnh {imageInfo.real ? "thật" : "ảo"}, {(imageInfo.magnification ?? 0) < 0 ? "ngược chiều" : "cùng chiều"} với vật,
              {" "}{Math.abs(imageInfo.magnification ?? 0) > 1 ? "lớn hơn" : Math.abs(imageInfo.magnification ?? 0) < 1 ? "nhỏ hơn" : "bằng"} vật.
            </p>
          )}
        </div>
      ) : null}

      <div className="practice-actions lens-construction-actions">
        <span className="draft-status">{draftStatus}</span>
        <button type="button" className="secondary-button" onClick={resetActivity}>Làm lại</button>
      </div>
    </div>
  );
}

function resultBadge(correct: boolean) {
  return correct ? "practice-correct" : "practice-incorrect";
}
