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
