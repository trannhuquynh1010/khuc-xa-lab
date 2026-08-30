"use client";

import { useState } from "react";

const materials = [
  { key: "copper", name: "Đồng", rho: 1.75e-8, rhoLabel: "1,75 × 10⁻⁸" },
  { key: "aluminum", name: "Nhôm", rho: 2.82e-8, rhoLabel: "2,82 × 10⁻⁸" },
  { key: "iron", name: "Sắt", rho: 9.7e-8, rhoLabel: "9,7 × 10⁻⁸" },
  { key: "constantan", name: "Constantan", rho: 4.9e-7, rhoLabel: "4,9 × 10⁻⁷" },
  { key: "nichrome", name: "Nicrom", rho: 1.1e-6, rhoLabel: "1,1 × 10⁻⁶" },
] as const;

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(value);
}

function formatArea(value: number) {
  return `${formatNumber(value * 1_000_000)} × 10⁻⁶`;
}

export default function ResistivitySimulator() {
  const [materialKey, setMaterialKey] = useState<(typeof materials)[number]["key"]>("copper");
  const [length, setLength] = useState(1);
  const [area, setArea] = useState(1e-6);
  const [answer, setAnswer] = useState("");
  const material = materials.find((item) => item.key === materialKey) ?? materials[0];
  const resistance = material.rho * length / area;
  const wireWidth = 42 + (length - 0.5) / 4.5 * 50;
  const wireHeight = 8 + area * 1_000_000 / 2 * 24;

  return (
    <div className="resistivity-simulator">
      <div className="resistivity-materials" role="group" aria-label="Chọn vật liệu dây dẫn">
        {materials.map((item) => (
          <button
            key={item.key}
            type="button"
            className={item.key === material.key ? "active" : ""}
            aria-pressed={item.key === material.key}
            onClick={() => setMaterialKey(item.key)}
          >
            <strong>{item.name}</strong>
            <span>ρ ≈ {item.rhoLabel} Ω·m</span>
          </button>
        ))}
      </div>

      <div className="resistivity-workspace">
        <div className="resistivity-controls">
          <label>
            <span>Chiều dài l <output>{formatNumber(length)} m</output></span>
            <input type="range" min="0.5" max="5" step="0.5" value={length} onChange={(event) => setLength(Number(event.target.value))} />
          </label>
          <label>
            <span>Tiết diện S <output>{formatArea(area)} m²</output></span>
            <input type="range" min="0.00000025" max="0.000002" step="0.00000025" value={area} onChange={(event) => setArea(Number(event.target.value))} />
          </label>
        </div>

        <div className="resistivity-observation" aria-live="polite">
          <div className="wire-visual" role="img" aria-label={`Dây ${material.name}, dài ${formatNumber(length)} mét, tiết diện ${formatArea(area)} mét vuông`}>
            <b>A</b>
            <div className="wire-space"><span className={`wire-sample ${material.key}`} style={{ width: `${wireWidth}%`, height: `${wireHeight}px` }} /></div>
            <b>B</b>
          </div>
          <div className="resistivity-values">
            <div><span>Điện trở R</span><strong>{formatNumber(resistance)} Ω</strong></div>
            <div><span>Điện trở suất ρ</span><strong>{material.rhoLabel} Ω·m</strong></div>
          </div>
          <p className="resistivity-formula">R = ρ × l / S = ({material.rhoLabel} × {formatNumber(length)}) / ({formatArea(area)}) = <strong>{formatNumber(resistance)} Ω</strong></p>
          <p className="resistivity-note">Đơn vị SI. Giá trị điện trở suất gần đúng ở 20 °C.</p>
        </div>
      </div>

      <div className="resistivity-challenge">
        <p>Giữ nguyên vật liệu rồi thay đổi l và S. Đại lượng nào đặc trưng cho vật liệu và vẫn không đổi?</p>
        <div>
          {["Điện trở R", "Chiều dài l", "Tiết diện S", "Điện trở suất ρ"].map((choice) => (
            <button key={choice} type="button" className={answer === choice ? "selected" : ""} aria-pressed={answer === choice} onClick={() => setAnswer(choice)}>{choice}</button>
          ))}
        </div>
        {answer && <p className={answer === "Điện trở suất ρ" ? "correct" : "incorrect"}>{answer === "Điện trở suất ρ" ? "✓ Chính xác. ρ phụ thuộc vật liệu và nhiệt độ, không phụ thuộc kích thước dây." : "Chưa đúng. Hãy thay đổi hai thanh trượt rồi quan sát R và ρ."}</p>}
      </div>
    </div>
  );
}
