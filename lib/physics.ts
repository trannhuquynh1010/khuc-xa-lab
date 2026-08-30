export function formatSineRatio(sinIncidence: number | null, sinRefraction: number | null) {
  if (
    sinIncidence === null ||
    sinRefraction === null ||
    !Number.isFinite(sinIncidence) ||
    !Number.isFinite(sinRefraction) ||
    sinIncidence < 0 ||
    sinIncidence > 1 ||
    sinRefraction <= 0 ||
    sinRefraction > 1
  ) {
    return "—";
  }

  return (sinIncidence / sinRefraction).toFixed(3);
}

export function calculateResistance(voltage: number | null, current: number | null) {
  if (voltage === null || current === null || !Number.isFinite(voltage) || !Number.isFinite(current) || current <= 0) {
    return null;
  }
  return voltage / current;
}

export function formatResistance(voltage: number | null, current: number | null) {
  const resistance = calculateResistance(voltage, current);
  return resistance === null ? "—" : resistance.toFixed(2);
}
