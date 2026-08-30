"use client";

import type { CSSProperties } from "react";

export type ColorChallengeProgress = {
  task: number;
  answers: string[];
};

type ColorTask = {
  objectName: string;
  objectColor: string;
  lightName: string;
  lightColor: string;
  beamColor: string;
  choices: string[];
  answer: string;
  observedColor: string;
  incidentComponents: ColorComponentKey[];
  objectReflects: ColorComponentKey[];
  reflectedComponents: ColorComponentKey[];
  explanation: string;
};

type ColorComponentKey = "red" | "green" | "blue";

const colorComponents: Record<ColorComponentKey, { label: string; color: string }> = {
  red: { label: "Đỏ", color: "#ef3d32" },
  green: { label: "Lục", color: "#3bb85d" },
  blue: { label: "Lam", color: "#3d76ff" },
};

const tasks: ColorTask[] = [
  {
    objectName: "Vật màu đỏ",
    objectColor: "#ef3d32",
    lightName: "Ánh sáng trắng",
    lightColor: "#fffdf2",
    beamColor: "rgba(255, 249, 206, .72)",
    choices: ["Đỏ", "Trắng", "Đen / rất tối"],
    answer: "Đỏ",
    observedColor: "#ef3d32",
    incidentComponents: ["red", "green", "blue"],
    objectReflects: ["red"],
    reflectedComponents: ["red"],
    explanation: "Vật đỏ phản xạ thành phần ánh sáng đỏ và hấp thụ phần lớn các màu còn lại.",
  },
  {
    objectName: "Vật màu lục",
    objectColor: "#3bb85d",
    lightName: "Ánh sáng đỏ",
    lightColor: "#ff4b43",
    beamColor: "rgba(255, 75, 67, .38)",
    choices: ["Lục", "Đỏ", "Đen / rất tối"],
    answer: "Đen / rất tối",
    observedColor: "#242424",
    incidentComponents: ["red"],
    objectReflects: ["green"],
    reflectedComponents: [],
    explanation: "Vật lục không có ánh sáng lục để phản xạ; ánh sáng đỏ bị hấp thụ nên vật trông rất tối.",
  },
  {
    objectName: "Vật màu trắng",
    objectColor: "#fffdf8",
    lightName: "Ánh sáng lam",
    lightColor: "#3d76ff",
    beamColor: "rgba(61, 118, 255, .32)",
    choices: ["Trắng", "Lam", "Đen / rất tối"],
    answer: "Lam",
    observedColor: "#3d76ff",
    incidentComponents: ["blue"],
    objectReflects: ["red", "green", "blue"],
    reflectedComponents: ["blue"],
    explanation: "Vật trắng có thể phản xạ ánh sáng chiếu tới nên dưới ánh sáng lam nó được nhìn thấy màu lam.",
  },
  {
    objectName: "Vật màu vàng",
    objectColor: "#f1c928",
    lightName: "Ánh sáng lam",
    lightColor: "#3d76ff",
    beamColor: "rgba(61, 118, 255, .32)",
    choices: ["Vàng", "Lam", "Đen / rất tối"],
    answer: "Đen / rất tối",
    observedColor: "#242424",
    incidentComponents: ["blue"],
    objectReflects: ["red", "green"],
    reflectedComponents: [],
    explanation: "Vật vàng phản xạ tốt đỏ và lục nhưng hấp thụ lam, nên dưới ánh sáng lam nó trông rất tối.",
  },
];

export function emptyColorChallengeProgress(): ColorChallengeProgress {
  return { task: 0, answers: [] };
}

export function isColorChallengeProgress(value: unknown): value is ColorChallengeProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Record<string, unknown>;
  return Number.isInteger(progress.task) && Number(progress.task) >= 0 && Number(progress.task) < tasks.length &&
    Array.isArray(progress.answers) && progress.answers.every((answer) => typeof answer === "string");
}

export function isColorChallengeComplete(progress: ColorChallengeProgress) {
  return tasks.every((task, index) => progress.answers[index] === task.answer);
}

export const colorChallengeTaskCount = tasks.length;

function ComponentList({ components, emptyLabel }: { components: ColorComponentKey[]; emptyLabel?: string }) {
  if (!components.length) return <span className="no-color-component">{emptyLabel ?? "Không có"}</span>;
  return <>{components.map((component) => <span key={component} className={`color-component ${component}`}><i />{colorComponents[component].label}</span>)}</>;
}

export default function ColorVisionChallenge({ value, onChange }: { value: ColorChallengeProgress; onChange: (progress: ColorChallengeProgress) => void }) {
  const taskIndex = Math.max(0, Math.min(tasks.length - 1, value.task));
  const task = tasks[taskIndex];
  const selectedAnswer = value.answers[taskIndex] ?? "";
  const currentCorrect = selectedAnswer === task.answer;
  const completed = tasks.map((item, index) => value.answers[index] === item.answer);
  const reflectedColor = task.reflectedComponents[0] ? colorComponents[task.reflectedComponents[0]].color : "#5b5961";

  function chooseAnswer(choice: string) {
    const answers = [...value.answers];
    answers[taskIndex] = choice;
    onChange({ task: taskIndex, answers });
  }

  function changeTask(nextTask: number) {
    if (nextTask > taskIndex && !currentCorrect) return;
    onChange({ ...value, task: Math.max(0, Math.min(tasks.length - 1, nextTask)) });
  }

  return (
    <div className="color-challenge">
      <div className="color-task-indicator" aria-label={`Tình huống ${taskIndex + 1} trên ${tasks.length}`}>
        {tasks.map((item, index) => <span key={`${item.objectName}-${item.lightName}`} className={`${completed[index] ? "done" : ""} ${index === taskIndex ? "current" : ""}`.trim()}>{index + 1}</span>)}
      </div>

      <div className="color-challenge-layout">
        <div className="color-simulation" aria-live="polite">
          <div className="color-stage" role="img" aria-label={`${task.lightName} chiếu vào ${task.objectName.toLocaleLowerCase("vi")}. ${currentCorrect ? task.reflectedComponents.length ? `Ánh sáng phản xạ đi vào mắt làm mắt nhìn thấy màu ${task.answer}.` : "Hầu như không có thành phần ánh sáng phù hợp được phản xạ tới mắt nên vật được nhìn thấy rất tối." : "Hãy dự đoán màu trước khi hiện tia phản xạ đi vào mắt."}`}>
            <div className="light-source" style={{ "--light-color": task.lightColor } as CSSProperties}><span>✦</span><strong>{task.lightName}</strong></div>
            <div className="light-beam" style={{ "--beam-color": task.beamColor } as CSSProperties}>
              {task.incidentComponents.map((component, index) => <i key={component} className={`light-particle ${component} particle-${index + 1}`} />)}
            </div>
            <div className="object-sample source-color" style={{ "--object-color": task.objectColor } as CSSProperties}><span>Vật</span><strong>{task.objectName}</strong></div>
            <div className={`reflected-beam ${currentCorrect ? "revealed" : ""} ${task.reflectedComponents.length ? "" : "no-light"}`} style={{ "--reflected-color": reflectedColor } as CSSProperties} />
            <div className={`eye-observer ${currentCorrect ? "revealed" : ""}`} style={{ "--eye-color": task.observedColor } as CSSProperties}>
              <svg viewBox="0 0 100 54" aria-hidden="true"><path d="M4 27 Q50 -7 96 27 Q50 61 4 27Z" /><circle cx="50" cy="27" r="12" /></svg>
              <span>Mắt nhìn thấy</span><strong>{currentCorrect ? task.answer : "?"}</strong>
            </div>
          </div>
          <div className="color-process" aria-label="Cách xác định màu mắt nhìn thấy">
            <div><span>Ánh sáng tới</span><p><ComponentList components={task.incidentComponents} /></p></div>
            <b aria-hidden="true">∩</b>
            <div><span>Vật phản xạ được</span><p><ComponentList components={task.objectReflects} /></p></div>
            <b aria-hidden="true">=</b>
            <div className={currentCorrect ? "revealed" : ""}><span>Ánh sáng tới mắt</span><p>{currentCorrect ? <ComponentList components={task.reflectedComponents} emptyLabel="Hầu như không có" /> : <strong>?</strong>}</p></div>
          </div>
        </div>

        <div className="color-question">
          <p className="eyebrow">TÌNH HUỐNG {taskIndex + 1}/{tasks.length}</p>
          <h3>{task.objectName} dưới {task.lightName.toLocaleLowerCase("vi")} được nhìn thấy màu gì?</h3>
          <div>{task.choices.map((choice) => {
            const selected = selectedAnswer === choice;
            const answerClass = selected ? currentCorrect ? "selected correct-choice" : "selected incorrect-choice" : "";
            return <button key={choice} type="button" className={answerClass} aria-pressed={selected} onClick={() => chooseAnswer(choice)}>{choice}</button>;
          })}</div>
          {selectedAnswer && <p className={currentCorrect ? "correct" : "incorrect"}>{currentCorrect ? `✓ ${task.explanation}` : "Chưa đúng. Hãy xét màu ánh sáng chiếu tới và màu mà vật có thể phản xạ."}</p>}
          <div className="ray-step-actions">
            <button type="button" className="secondary-button" onClick={() => changeTask(taskIndex - 1)} disabled={taskIndex === 0}>← Trước</button>
            {taskIndex < tasks.length - 1 ? <button type="button" className="primary-button" onClick={() => changeTask(taskIndex + 1)} disabled={!currentCorrect}>Tiếp →</button> : <span className={`ray-complete-badge ${currentCorrect ? "complete" : ""}`}>{currentCorrect ? "✓ Hoàn thành" : "Chọn đáp án"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
