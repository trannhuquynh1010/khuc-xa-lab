"use client";

import { useState } from "react";

type ScenarioKey = "pebble" | "fish" | "pool" | "branch";

type GuideStep = {
  instruction: string;
  prompt: string;
  choices: string[];
  correctChoice: string;
  correctFeedback: string;
  wrongFeedback: string;
};

type Scenario = {
  key: ScenarioKey;
  label: string;
  objectLabel: string;
  objectBelowWater: boolean;
  finalPrompt: string;
  finalChoices: string[];
  finalAnswer: string;
  finalFeedback: string;
};

function createSteps(scenario: Scenario): GuideStep[] {
  const objectName = scenario.objectLabel.toLocaleLowerCase("vi");
  const below = scenario.objectBelowWater;
  const correctPosition = below
    ? `${scenario.objectLabel} ở trong nước; mắt ở trong không khí`
    : `${scenario.objectLabel} ở trong không khí; mắt ở trong nước`;
  const incorrectPosition = below
    ? `${scenario.objectLabel} ở trong không khí; mắt ở trong nước`
    : `${scenario.objectLabel} ở trong nước; mắt ở trong không khí`;
  const correctBending = below
    ? "Lệch xa pháp tuyến khi đi từ nước ra không khí"
    : "Lệch gần pháp tuyến khi đi từ không khí vào nước";
  const incorrectBending = below
    ? "Lệch gần pháp tuyến khi đi từ nước ra không khí"
    : "Lệch xa pháp tuyến khi đi từ không khí vào nước";

  return [
    {
      instruction: `Xác định vị trí ${objectName} và người quan sát.`,
      prompt: "Vật và mắt nằm ở đâu?",
      choices: [correctPosition, "Cả vật và mắt đều ở trong nước", incorrectPosition],
      correctChoice: correctPosition,
      correctFeedback: "Đúng. Vật và mắt nằm ở hai môi trường khác nhau.",
      wrongFeedback: "Chưa đúng. Hãy quan sát mặt nước và vị trí của mắt trên hình.",
    },
    {
      instruction: "Chọn cách vẽ các tia tới.",
      prompt: "Tia tới phải được vẽ theo hướng nào?",
      choices: ["Từ mắt đến mặt nước", `Từ ${objectName} đến mặt nước`, "Song song với mặt nước"],
      correctChoice: `Từ ${objectName} đến mặt nước`,
      correctFeedback: "Đúng. Hai tia tới đã được thêm vào hình.",
      wrongFeedback: "Chưa đúng. Tia sáng truyền từ vật đến mặt phân cách trước khi tới mắt.",
    },
    {
      instruction: "Dựng pháp tuyến tại điểm tới của tia xiên.",
      prompt: "Pháp tuyến được vẽ như thế nào?",
      choices: ["Song song với mặt nước", "Nối thẳng vật với mắt", "Vuông góc với mặt nước tại điểm tới"],
      correctChoice: "Vuông góc với mặt nước tại điểm tới",
      correctFeedback: "Đúng. Pháp tuyến và ký hiệu góc vuông đã xuất hiện.",
      wrongFeedback: "Chưa đúng. Pháp tuyến luôn vuông góc với mặt phân cách tại điểm tới.",
    },
    {
      instruction: "Xác định hướng của tia khúc xạ.",
      prompt: "Tia khúc xạ lệch theo hướng nào?",
      choices: ["Không đổi phương truyền", incorrectBending, correctBending],
      correctChoice: correctBending,
      correctFeedback: below
        ? "Đúng. Tia đi từ nước ra không khí nên lệch xa pháp tuyến."
        : "Đúng. Tia đi từ không khí vào nước nên lệch gần pháp tuyến.",
      wrongFeedback: "Chưa đúng. Hãy so sánh môi trường của tia trước và sau mặt nước.",
    },
    {
      instruction: "Xác định vị trí ảnh mà mắt nhìn thấy.",
      prompt: "Cần làm gì với các tia khúc xạ?",
      choices: ["Kéo dài tia tới về phía mắt", "Nối trực tiếp mắt với vật", "Kéo dài tia khúc xạ ngược về phía vật"],
      correctChoice: "Kéo dài tia khúc xạ ngược về phía vật",
      correctFeedback: "Đúng. Giao điểm các đường kéo dài là vị trí ảnh ảo.",
      wrongFeedback: "Chưa đúng. Mắt luôn xác định vật theo đường kéo dài ngược của tia đi vào mắt.",
    },
    {
      instruction: "So sánh ảnh ảo với vật thật và rút ra kết luận.",
      prompt: scenario.finalPrompt,
      choices: scenario.finalChoices,
      correctChoice: scenario.finalAnswer,
      correctFeedback: scenario.finalFeedback,
      wrongFeedback: "Chưa đúng. Hãy so sánh chấm ảnh ảo màu xanh với vị trí vật thật.",
    },
  ];
}

const scenarioDefinitions: Scenario[] = [
  {
    key: "pebble",
    label: "Nhìn hòn sỏi dưới nước",
    objectLabel: "Hòn sỏi",
    objectBelowWater: true,
    finalPrompt: "Khi nhìn từ trên xuống, hòn sỏi trông như thế nào?",
    finalChoices: ["Nông hơn", "Sâu hơn", "Không đổi"],
    finalAnswer: "Nông hơn",
    finalFeedback: "Chính xác. Ảnh ảo nằm gần mặt nước hơn hòn sỏi thật.",
  },
  {
    key: "fish",
    label: "Nhìn con cá dưới nước",
    objectLabel: "Con cá",
    objectBelowWater: true,
    finalPrompt: "Con cá thật nằm ở đâu so với vị trí ta nhìn thấy?",
    finalChoices: ["Trùng vị trí", "Nông hơn", "Sâu hơn"],
    finalAnswer: "Sâu hơn",
    finalFeedback: "Chính xác. Muốn bắt cá phải nhắm sâu hơn vị trí nhìn thấy.",
  },
  {
    key: "pool",
    label: "Nhìn đáy hồ",
    objectLabel: "Đáy hồ",
    objectBelowWater: true,
    finalPrompt: "Hồ nước nhìn từ trên xuống có vẻ như thế nào?",
    finalChoices: ["Sâu hơn thực tế", "Không thay đổi", "Nông hơn thực tế"],
    finalAnswer: "Nông hơn thực tế",
    finalFeedback: "Chính xác. Độ sâu biểu kiến nhỏ hơn độ sâu thật.",
  },
  {
    key: "branch",
    label: "Dưới nước nhìn cành cây",
    objectLabel: "Cành cây",
    objectBelowWater: false,
    finalPrompt: "Người ở dưới nước thấy cành cây ở vị trí nào?",
    finalChoices: ["Thấp hơn thực tế", "Cao hơn thực tế", "Không thay đổi"],
    finalAnswer: "Cao hơn thực tế",
    finalFeedback: "Chính xác. Ảnh ảo của cành cây nằm cao hơn cành cây thật.",
  },
];

const scenarios = scenarioDefinitions.map((scenario) => ({ ...scenario, steps: createSteps(scenario) }));

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
  const [answers, setAnswers] = useState<string[]>([]);
  const scenario = scenarios.find((item) => item.key === scenarioKey) ?? scenarios[0];
  const currentStep = scenario.steps[step];
  const selectedAnswer = answers[step] ?? "";
  const currentCorrect = selectedAnswer === currentStep.correctChoice;
  const below = scenario.objectBelowWater;
  const objectY = below ? 320 : 80;
  const imageY = below ? 289 : 34;
  const verticalEndY = below ? 50 : 342;
  const obliqueEndX = below ? 610 : 550;
  const obliqueEndY = below ? 55 : 335;
  const eyeX = below ? 640 : 580;
  const eyeY = below ? 58 : 334;
  const incidentVisible = step > 1 || (step === 1 && currentCorrect);
  const normalVisible = step > 2 || (step === 2 && currentCorrect);
  const refractedVisible = step > 3 || (step === 3 && currentCorrect);
  const virtualImageVisible = step > 4 || (step === 4 && currentCorrect);

  function changeScenario(value: string) {
    setScenarioKey(value as ScenarioKey);
    setStep(0);
    setAnswers([]);
  }

  function chooseAnswer(choice: string) {
    setAnswers((current) => {
      const next = [...current];
      next[step] = choice;
      return next;
    });
  }

  function changeStep(nextStep: number) {
    if (nextStep > step && !currentCorrect) return;
    setStep(Math.max(0, Math.min(scenario.steps.length - 1, nextStep)));
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
          {scenario.steps.map((guideStep, index) => {
            const completed = answers[index] === guideStep.correctChoice;
            return <span key={index} className={`${completed ? "done" : ""} ${index === step ? "current" : ""}`.trim()}>{index + 1}</span>;
          })}
        </div>
      </div>

      <div className="ray-guide-layout">
        <svg className="ray-diagram" viewBox="0 0 720 380" role="img" aria-labelledby="ray-diagram-title ray-diagram-description">
          <title id="ray-diagram-title">Dựng tia sáng: {scenario.label}</title>
          <desc id="ray-diagram-description">Sơ đồ mặt nước, vật, tia tới, pháp tuyến, tia khúc xạ và ảnh ảo được học sinh dựng lần lượt bằng cách chọn đáp án đúng.</desc>
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

          {incidentVisible && <g className="incident-rays">
            <line x1="280" y1={objectY} x2="280" y2="190" markerEnd="url(#ray-arrow)" />
            <line x1="280" y1={objectY} x2="420" y2="190" markerEnd="url(#ray-arrow)" />
            <text x={below ? 344 : 355} y={below ? 244 : 145}>Tia tới</text>
          </g>}
          {normalVisible && <g className="normal-line">
            <line x1="420" y1="104" x2="420" y2="276" />
            <text x="432" y="118">Pháp tuyến</text>
            <path d="M420 174 h16 v16" />
          </g>}
          {refractedVisible && <g className="refracted-rays">
            <line x1="280" y1="190" x2="280" y2={verticalEndY} markerEnd="url(#ray-arrow)" />
            <line x1="420" y1="190" x2={obliqueEndX} y2={obliqueEndY} markerEnd="url(#ray-arrow)" />
            <text x={below ? 550 : 490} y={below ? 96 : 285}>Tia khúc xạ</text>
          </g>}
          {virtualImageVisible && <g className="virtual-construction">
            <line x1="420" y1="190" x2="280" y2={imageY} />
            <line x1="280" y1="190" x2="280" y2={imageY} />
            <circle cx="280" cy={imageY} r="7" />
            <text x="298" y={below ? imageY - 8 : imageY + 3}>Ảnh ảo</text>
          </g>}
        </svg>

        <div className="ray-step-panel" aria-live="polite">
          <p className="eyebrow">BƯỚC {step + 1}/{scenario.steps.length}</p>
          <h3>{currentStep.instruction}</h3>
          <div className="ray-question">
            <p>{currentStep.prompt}</p>
            <div>
              {currentStep.choices.map((choice) => {
                const selected = selectedAnswer === choice;
                const answerClass = selected ? currentCorrect ? "selected correct-choice" : "selected incorrect-choice" : "";
                return <button key={choice} type="button" className={answerClass} aria-pressed={selected} onClick={() => chooseAnswer(choice)}>{choice}</button>;
              })}
            </div>
            {selectedAnswer && <p className={currentCorrect ? "correct" : "incorrect"}>{currentCorrect ? `✓ ${currentStep.correctFeedback}` : currentStep.wrongFeedback}</p>}
          </div>
          <div className="ray-step-actions">
            <button type="button" className="secondary-button" onClick={() => changeStep(step - 1)} disabled={step === 0}>← Trước</button>
            {step < scenario.steps.length - 1 ? (
              <button type="button" className="primary-button" onClick={() => changeStep(step + 1)} disabled={!currentCorrect}>Tiếp →</button>
            ) : (
              <span className={`ray-complete-badge ${currentCorrect ? "complete" : ""}`}>{currentCorrect ? "✓ Hoàn thành" : "Chọn kết luận"}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
