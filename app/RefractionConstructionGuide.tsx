"use client";

import { useState } from "react";

type ScenarioKey = "pebble" | "fish" | "pool" | "branch";

type Scenario = {
  key: ScenarioKey;
  label: string;
  objectLabel: string;
  objectBelowWater: boolean;
  steps: string[];
  question: string;
  choices: string[];
  correctChoice: string;
};

const scenarios: Scenario[] = [
  {
    key: "pebble",
    label: "Nhìn hòn sỏi dưới nước",
    objectLabel: "Hòn sỏi",
    objectBelowWater: true,
    steps: [
      "Xác định hòn sỏi ở trong nước và mắt người quan sát ở trong không khí.",
      "Từ hòn sỏi, vẽ một tia tới theo phương pháp tuyến và một tia tới xiên đến mặt nước.",
      "Tại điểm tới của tia xiên, dựng pháp tuyến vuông góc với mặt nước.",
      "Vẽ tia khúc xạ ra không khí lệch xa pháp tuyến.",
      "Kéo dài các tia khúc xạ ngược vào nước. Giao điểm của các đường kéo dài là ảnh ảo.",
      "So sánh vị trí ảnh ảo với hòn sỏi thật và chọn kết luận.",
    ],
    question: "Khi nhìn từ trên xuống, hòn sỏi trông như thế nào?",
    choices: ["Nông hơn", "Sâu hơn", "Không đổi"],
    correctChoice: "Nông hơn",
  },
  {
    key: "fish",
    label: "Nhìn con cá dưới nước",
    objectLabel: "Con cá",
    objectBelowWater: true,
    steps: [
      "Xác định con cá ở trong nước và mắt người quan sát ở trong không khí.",
      "Từ con cá, vẽ một tia tới theo phương pháp tuyến và một tia tới xiên đến mặt nước.",
      "Tại điểm tới của tia xiên, dựng pháp tuyến vuông góc với mặt nước.",
      "Vẽ tia khúc xạ ra không khí lệch xa pháp tuyến.",
      "Kéo dài các tia khúc xạ ngược vào nước. Giao điểm của các đường kéo dài là ảnh ảo.",
      "So sánh vị trí ảnh ảo với con cá thật và chọn kết luận.",
    ],
    question: "Con cá thật nằm ở đâu so với vị trí ta nhìn thấy?",
    choices: ["Sâu hơn", "Nông hơn", "Trùng vị trí"],
    correctChoice: "Sâu hơn",
  },
  {
    key: "pool",
    label: "Nhìn đáy hồ",
    objectLabel: "Đáy hồ",
    objectBelowWater: true,
    steps: [
      "Xác định đáy hồ ở trong nước và mắt người quan sát ở trong không khí.",
      "Từ một điểm ở đáy, vẽ một tia tới theo phương pháp tuyến và một tia tới xiên đến mặt nước.",
      "Tại điểm tới của tia xiên, dựng pháp tuyến vuông góc với mặt nước.",
      "Vẽ tia khúc xạ ra không khí lệch xa pháp tuyến.",
      "Kéo dài các tia khúc xạ ngược vào nước để xác định ảnh ảo của điểm ở đáy.",
      "So sánh độ sâu biểu kiến với độ sâu thật và chọn kết luận.",
    ],
    question: "Hồ nước nhìn từ trên xuống có vẻ như thế nào?",
    choices: ["Nông hơn thực tế", "Sâu hơn thực tế", "Không thay đổi"],
    correctChoice: "Nông hơn thực tế",
  },
  {
    key: "branch",
    label: "Dưới nước nhìn cành cây",
    objectLabel: "Cành cây",
    objectBelowWater: false,
    steps: [
      "Xác định cành cây ở trong không khí và mắt người quan sát ở trong nước.",
      "Từ cành cây, vẽ một tia tới theo phương pháp tuyến và một tia tới xiên đến mặt nước.",
      "Tại điểm tới của tia xiên, dựng pháp tuyến vuông góc với mặt nước.",
      "Vẽ tia khúc xạ vào nước lệch gần pháp tuyến.",
      "Kéo dài các tia khúc xạ ngược lên không khí. Giao điểm của các đường kéo dài là ảnh ảo.",
      "So sánh vị trí ảnh ảo với cành cây thật và chọn kết luận.",
    ],
    question: "Người ở dưới nước thấy cành cây ở vị trí nào?",
    choices: ["Cao hơn thực tế", "Thấp hơn thực tế", "Không thay đổi"],
    correctChoice: "Cao hơn thực tế",
  },
];

function ScenarioObject({ scenario }: { scenario: Scenario }) {
  const y = scenario.objectBelowWater ? 320 : 80;
  if (scenario.key === "fish") {
    return <g className="ray-object"><ellipse cx="280" cy={y} rx="25" ry="13" /><path d={`M255 ${y} l-17 -12 v24 z`} /><circle cx="291" cy={y - 3} r="2.5" /></g>;
  }
  if (scenario.key === "pool") {
    return <g className="ray-object"><path d="M190 321 Q235 306 280 321 T370 321" /><circle cx="280" cy="315" r="5" /></g>;
  }
  if (scenario.key === "branch") {
    return <g className="ray-object"><path d="M236 81 Q277 64 321 81 M273 72 l-14 -18 M299 73 l18 -17" /><circle cx="280" cy="80" r="5" /></g>;
  }
  return <g className="ray-object"><path d="M254 324 Q260 298 284 302 Q311 304 308 326 Q284 338 254 324Z" /><circle cx="280" cy="315" r="5" /></g>;
}

export default function RefractionConstructionGuide() {
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("pebble");
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const scenario = scenarios.find((item) => item.key === scenarioKey) ?? scenarios[0];
  const below = scenario.objectBelowWater;
  const objectY = below ? 320 : 80;
  const imageY = below ? 289 : 34;
  const verticalEndY = below ? 50 : 342;
  const obliqueEndX = below ? 610 : 550;
  const obliqueEndY = below ? 55 : 335;
  const eyeX = below ? 640 : 580;
  const eyeY = below ? 58 : 334;

  function changeScenario(value: string) {
    setScenarioKey(value as ScenarioKey);
    setStep(0);
    setAnswer("");
  }

  function changeStep(nextStep: number) {
    setStep(Math.max(0, Math.min(scenario.steps.length - 1, nextStep)));
    setAnswer("");
  }

  return (
    <div className="ray-guide">
      <div className="ray-guide-toolbar">
        <label>Tình huống
          <select value={scenario.key} onChange={(event) => changeScenario(event.target.value)}>
            {scenarios.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <div className="ray-step-indicator" aria-label={`Bước ${step + 1} trên ${scenario.steps.length}`}>
          {scenario.steps.map((_, index) => <span key={index} className={index <= step ? "done" : ""}>{index + 1}</span>)}
        </div>
      </div>

      <div className="ray-guide-layout">
        <svg className="ray-diagram" viewBox="0 0 720 380" role="img" aria-labelledby="ray-diagram-title ray-diagram-description">
          <title id="ray-diagram-title">Dựng tia sáng: {scenario.label}</title>
          <desc id="ray-diagram-description">Sơ đồ mặt nước, vật, tia tới, pháp tuyến, tia khúc xạ và ảnh ảo xuất hiện lần lượt theo bước.</desc>
          <defs>
            <marker id="ray-arrow" markerWidth="11" markerHeight="11" refX="10" refY="5.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L11 5.5 L0 11 Z" /></marker>
          </defs>
          <rect className="air-zone" x="0" y="0" width="720" height="190" />
          <rect className="water-zone" x="0" y="190" width="720" height="190" />
          <line className="water-boundary" x1="0" y1="190" x2="720" y2="190" />
          <text className="medium-label" x="22" y="30">Không khí</text>
          <text className="medium-label" x="22" y="220">Nước</text>
          <ScenarioObject scenario={scenario} />
          <text className="object-label" x={below ? 280 : 220} y={below ? 354 : 110}>{scenario.objectLabel} thật</text>
          <g className="eye-symbol" transform={`translate(${eyeX} ${eyeY})`}>
            <path d="M-28 0 Q0 -22 28 0 Q0 22 -28 0Z" /><circle cx="0" cy="0" r="7" />
            <text x="0" y={below ? 36 : -25}>Mắt</text>
          </g>

          {step >= 1 && <g className="incident-rays">
            <line x1="280" y1={objectY} x2="280" y2="190" markerEnd="url(#ray-arrow)" />
            <line x1="280" y1={objectY} x2="420" y2="190" markerEnd="url(#ray-arrow)" />
            <text x={below ? 344 : 355} y={below ? 244 : 145}>Tia tới</text>
          </g>}
          {step >= 2 && <g className="normal-line">
            <line x1="420" y1="104" x2="420" y2="276" />
            <text x="432" y="118">Pháp tuyến</text>
            <path d="M420 174 h16 v16" />
          </g>}
          {step >= 3 && <g className="refracted-rays">
            <line x1="280" y1="190" x2="280" y2={verticalEndY} markerEnd="url(#ray-arrow)" />
            <line x1="420" y1="190" x2={obliqueEndX} y2={obliqueEndY} markerEnd="url(#ray-arrow)" />
            <text x={below ? 550 : 490} y={below ? 96 : 285}>Tia khúc xạ</text>
          </g>}
          {step >= 4 && <g className="virtual-construction">
            <line x1="420" y1="190" x2="280" y2={imageY} />
            <line x1="280" y1="190" x2="280" y2={imageY} />
            <circle cx="280" cy={imageY} r="7" />
            <text x="298" y={below ? imageY - 8 : imageY + 3}>Ảnh ảo</text>
          </g>}
        </svg>

        <div className="ray-step-panel" aria-live="polite">
          <p className="eyebrow">BƯỚC {step + 1}/{scenario.steps.length}</p>
          <h3>{scenario.steps[step]}</h3>
          {step === scenario.steps.length - 1 && <div className="ray-question">
            <p>{scenario.question}</p>
            <div>
              {scenario.choices.map((choice) => (
                <button key={choice} type="button" className={answer === choice ? "selected" : ""} onClick={() => setAnswer(choice)}>{choice}</button>
              ))}
            </div>
            {answer && <p className={answer === scenario.correctChoice ? "correct" : "incorrect"}>{answer === scenario.correctChoice ? "✓ Chính xác." : "Chưa đúng. Hãy so sánh ảnh ảo với vật thật trên hình."}</p>}
          </div>}
          <div className="ray-step-actions">
            <button type="button" className="secondary-button" onClick={() => changeStep(step - 1)} disabled={step === 0}>← Trước</button>
            <button type="button" className="primary-button" onClick={() => changeStep(step + 1)} disabled={step === scenario.steps.length - 1}>Tiếp →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
