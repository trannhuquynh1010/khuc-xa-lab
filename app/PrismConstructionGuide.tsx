"use client";

type PrismStep = {
  instruction: string;
  prompt: string;
  choices: string[];
  correctChoice: string;
  correctFeedback: string;
  wrongFeedback: string;
};

export type PrismConstructionProgress = {
  step: number;
  answers: string[];
};

const steps: PrismStep[] = [
  {
    instruction: "Dựng tia sáng trắng tới lăng kính.",
    prompt: "Tia tới được vẽ theo hướng nào?",
    choices: ["Từ lăng kính về nguồn sáng", "Từ nguồn sáng đến mặt bên thứ nhất của lăng kính", "Song song với mặt đáy lăng kính nhưng không chạm lăng kính"],
    correctChoice: "Từ nguồn sáng đến mặt bên thứ nhất của lăng kính",
    correctFeedback: "Đúng. Tia sáng trắng truyền từ nguồn đến mặt phân cách không khí – thủy tinh.",
    wrongFeedback: "Chưa đúng. Hãy bắt đầu từ nguồn phát sáng và xác định điểm tia gặp lăng kính.",
  },
  {
    instruction: "Dựng pháp tuyến tại điểm tới.",
    prompt: "Pháp tuyến phải được vẽ như thế nào?",
    choices: ["Song song với mặt lăng kính", "Vuông góc với mặt lăng kính tại điểm tới", "Vuông góc với mặt đáy lăng kính"],
    correctChoice: "Vuông góc với mặt lăng kính tại điểm tới",
    correctFeedback: "Đúng. Pháp tuyến vuông góc với mặt phân cách ngay tại điểm tới.",
    wrongFeedback: "Chưa đúng. Pháp tuyến luôn vuông góc với mặt phân cách tại điểm tới.",
  },
  {
    instruction: "Dựng hướng tia khi đi vào thủy tinh.",
    prompt: "Từ không khí vào thủy tinh, tia sáng lệch theo hướng nào?",
    choices: ["Lệch về phía pháp tuyến", "Lệch xa pháp tuyến", "Không đổi phương"],
    correctChoice: "Lệch về phía pháp tuyến",
    correctFeedback: "Đúng. Tia đi vào môi trường có chiết suất lớn hơn nên lệch gần pháp tuyến.",
    wrongFeedback: "Chưa đúng. So sánh chiết suất của không khí và thủy tinh.",
  },
  {
    instruction: "So sánh tốc độ của tia đỏ và tia tím.",
    prompt: "Dựa vào n và v = c/n, tia nào truyền chậm hơn trong lăng kính?",
    choices: ["Tia đỏ", "Tia tím", "Hai tia truyền nhanh như nhau"],
    correctChoice: "Tia tím",
    correctFeedback: "Đúng. n tím lớn hơn nên tốc độ của tia tím nhỏ hơn.",
    wrongFeedback: "Chưa đúng. Khi n lớn hơn thì v = c/n nhỏ hơn.",
  },
  {
    instruction: "Dựng hai tia màu bên trong lăng kính.",
    prompt: "Từ dữ liệu chiết suất, tia nào lệch nhiều hơn?",
    choices: ["Tia đỏ lệch nhiều hơn tia tím", "Tia tím lệch nhiều hơn tia đỏ", "Hai tia lệch như nhau"],
    correctChoice: "Tia tím lệch nhiều hơn tia đỏ",
    correctFeedback: "Đúng. Tia tím có chiết suất lớn hơn, truyền chậm hơn và lệch về phía đáy nhiều hơn.",
    wrongFeedback: "Chưa đúng. Tia có chiết suất lớn hơn sẽ bị lệch nhiều hơn.",
  },
  {
    instruction: "Dựng các tia ló ra khỏi lăng kính.",
    prompt: "Từ thủy tinh ra không khí, các tia ló lệch theo hướng nào so với pháp tuyến?",
    choices: ["Lệch xa pháp tuyến", "Lệch gần pháp tuyến", "Trùng với pháp tuyến"],
    correctChoice: "Lệch xa pháp tuyến",
    correctFeedback: "Đúng. Chùm sáng ló bị tách thành dải màu và lệch về phía đáy lăng kính.",
    wrongFeedback: "Chưa đúng. Tia đang đi từ môi trường có chiết suất lớn sang môi trường có chiết suất nhỏ.",
  },
  {
    instruction: "Hoàn thành thứ tự dải màu trên màn.",
    prompt: "Kết luận nào đúng về độ lệch của hai màu biên?",
    choices: ["Đỏ lệch ít nhất, tím lệch nhiều nhất", "Tím lệch ít nhất, đỏ lệch nhiều nhất", "Đỏ và tím lệch như nhau"],
    correctChoice: "Đỏ lệch ít nhất, tím lệch nhiều nhất",
    correctFeedback: "Chính xác. Hình dựng tán sắc ánh sáng trắng qua lăng kính đã hoàn thành.",
    wrongFeedback: "Chưa đúng. Hãy đối chiếu lại n đỏ, n tím và hai đường truyền vừa dựng.",
  },
];

export function emptyPrismConstructionProgress(): PrismConstructionProgress {
  return { step: 0, answers: [] };
}

export function isPrismConstructionProgress(value: unknown): value is PrismConstructionProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Record<string, unknown>;
  return Number.isInteger(progress.step) && Number(progress.step) >= 0 && Number(progress.step) < steps.length &&
    Array.isArray(progress.answers) && progress.answers.every((answer) => typeof answer === "string");
}

export function isPrismConstructionComplete(progress: PrismConstructionProgress) {
  return steps.every((step, index) => progress.answers[index] === step.correctChoice);
}

export default function PrismConstructionGuide({ value, onChange }: { value: PrismConstructionProgress; onChange: (progress: PrismConstructionProgress) => void }) {
  const stepIndex = Math.max(0, Math.min(steps.length - 1, value.step));
  const currentStep = steps[stepIndex];
  const selectedAnswer = value.answers[stepIndex] ?? "";
  const currentCorrect = selectedAnswer === currentStep.correctChoice;
  const completed = steps.map((step, index) => value.answers[index] === step.correctChoice);
  const incidentVisible = completed[0];
  const entryNormalVisible = completed[1];
  const internalVisible = completed[2];
  const comparisonVisible = stepIndex >= 3 || completed[3];
  const splitVisible = completed[4];
  const exitNormalVisible = stepIndex >= 5 || completed[5];
  const outgoingVisible = completed[5];
  const labelsVisible = completed[6];

  function chooseAnswer(choice: string) {
    const answers = [...value.answers];
    answers[stepIndex] = choice;
    onChange({ step: stepIndex, answers });
  }

  function changeStep(nextStep: number) {
    if (nextStep > stepIndex && !currentCorrect) return;
    onChange({ ...value, step: Math.max(0, Math.min(steps.length - 1, nextStep)) });
  }

  const spectrum = [
    { key: "red", label: "Đỏ", exit: "448,220", screenY: 258 },
    { key: "orange", label: "Cam", exit: "451,224", screenY: 271 },
    { key: "yellow", label: "Vàng", exit: "454,228", screenY: 284 },
    { key: "green", label: "Lục", exit: "458,233", screenY: 298 },
    { key: "blue", label: "Lam", exit: "462,238", screenY: 313 },
    { key: "indigo", label: "Chàm", exit: "465,242", screenY: 328 },
    { key: "violet", label: "Tím", exit: "468,246", screenY: 344 },
  ];

  return (
    <div className="prism-guide">
      <div className="ray-step-indicator" aria-label={`Bước ${stepIndex + 1} trên ${steps.length}`}>
        {steps.map((step, index) => <span key={step.instruction} className={`${completed[index] ? "done" : ""} ${index === stepIndex ? "current" : ""}`.trim()}>{index + 1}</span>)}
      </div>

      <div className="prism-guide-layout">
        <svg className="prism-diagram" viewBox="0 0 760 390" role="img" aria-labelledby="prism-title prism-description">
          <title id="prism-title">Dựng đường truyền ánh sáng trắng qua lăng kính</title>
          <desc id="prism-description">Các pháp tuyến và tia sáng chỉ xuất hiện sau khi học sinh trả lời đúng từng bước.</desc>
          <defs>
            <linearGradient id="white-beam" x1="0" x2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff4b5" /></linearGradient>
            <marker id="prism-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L10 5 L0 10 Z" /></marker>
          </defs>
          <rect className="prism-stage" width="760" height="390" />
          <g className="lamp-symbol"><circle cx="45" cy="193" r="23" /><path d="M16 193 h-13 M74 193 h13 M45 164 v-13 M45 222 v13" /><text x="45" y="240">Nguồn trắng</text></g>
          <polygon className="glass-prism" points="300,48 170,338 548,338" />
          <text className="prism-label" x="340" y="320">Lăng kính thủy tinh</text>
          <line className="screen-line" x1="704" y1="238" x2="704" y2="362" />
          <text className="screen-label" x="704" y="226">Màn</text>

          {incidentVisible && <polyline className="white-ray" points="68,193 151,193 235,193" markerMid="url(#prism-arrow)" />}
          {entryNormalVisible && <g className="prism-normal"><line x1="164" y1="161" x2="306" y2="225" /><path d="M231 181 l-8 18 18 8" /><text x="174" y="151">Pháp tuyến</text></g>}
          {internalVisible && !splitVisible && <polyline className="white-ray internal" points="235,193 345,213 456,233" markerMid="url(#prism-arrow)" />}
          {splitVisible && <g className="internal-colors">
            <polyline className="spectrum-red" points="235,193 341,207 448,220" markerMid="url(#prism-arrow)" />
            <polyline className="spectrum-violet" points="235,193 351,220 468,246" markerMid="url(#prism-arrow)" />
            <text className="red-label" x="350" y="196">đỏ: lệch ít</text>
            <text className="violet-label" x="358" y="246">tím: lệch nhiều</text>
          </g>}
          {exitNormalVisible && <g className="prism-normal exit-normal"><line x1="408" y1="263" x2="508" y2="184" /><text x="487" y="176">Pháp tuyến</text></g>}
          {outgoingVisible && <g className="outgoing-spectrum">
            {spectrum.map((ray) => {
              const [exitX, exitY] = ray.exit.split(",").map(Number);
              return <polyline key={ray.key} className={`spectrum-${ray.key}`} points={`${ray.exit} ${(exitX + 704) / 2},${(exitY + ray.screenY) / 2} 704,${ray.screenY}`} markerMid="url(#prism-arrow)" />;
            })}
          </g>}
          {labelsVisible && <g className="spectrum-labels">
            {spectrum.map((ray) => <text key={ray.key} className={`spectrum-${ray.key}-text`} x="716" y={ray.screenY + 5}>{ray.label}</text>)}
          </g>}
        </svg>

        <div className="ray-step-panel prism-step-panel" aria-live="polite">
          <p className="eyebrow">BƯỚC {stepIndex + 1}/{steps.length}</p>
          <h3>{currentStep.instruction}</h3>
          {comparisonVisible && <div className="dispersion-data" aria-label="Dữ liệu quang học của tia đỏ và tia tím">
            <div className="red"><strong>Tia đỏ</strong><span>λ ≈ 656 nm</span><span>n ≈ 1,514</span><span>v ≈ 1,98 × 10⁸ m/s</span></div>
            <div className="violet"><strong>Tia tím</strong><span>λ ≈ 405 nm</span><span>n ≈ 1,530</span><span>v ≈ 1,96 × 10⁸ m/s</span></div>
            <p>v = c/n · Giá trị gần đúng với thủy tinh quang học N-BK7.</p>
          </div>}
          <div className="ray-question">
            <p>{currentStep.prompt}</p>
            <div>{currentStep.choices.map((choice) => {
              const selected = selectedAnswer === choice;
              const answerClass = selected ? currentCorrect ? "selected correct-choice" : "selected incorrect-choice" : "";
              return <button key={choice} type="button" className={answerClass} aria-pressed={selected} onClick={() => chooseAnswer(choice)}>{choice}</button>;
            })}</div>
            {selectedAnswer && <p className={currentCorrect ? "correct" : "incorrect"}>{currentCorrect ? `✓ ${currentStep.correctFeedback}` : currentStep.wrongFeedback}</p>}
          </div>
          <div className="ray-step-actions">
            <button type="button" className="secondary-button" onClick={() => changeStep(stepIndex - 1)} disabled={stepIndex === 0}>← Trước</button>
            {stepIndex < steps.length - 1 ? <button type="button" className="primary-button" onClick={() => changeStep(stepIndex + 1)} disabled={!currentCorrect}>Tiếp →</button> : <span className={`ray-complete-badge ${currentCorrect ? "complete" : ""}`}>{currentCorrect ? "✓ Hoàn thành" : "Chọn kết luận"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
