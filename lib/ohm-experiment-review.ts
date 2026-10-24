/**
 * Đọc số liệu I–U và câu kết luận của nhóm rồi sinh nhận xét tự động.
 *
 * Nguyên tắc do giáo viên đặt ra:
 * 1. Chỉ DẪN DẮT, không nói thẳng: nhận xét không nêu sẵn kết luận vật lí
 *    ("I tỉ lệ thuận với U") mà đặt câu hỏi để nhóm tự rút ra.
 * 2. Đây là số liệu THỰC NGHIỆM: không đòi các cặp số liệu phải cho tỉ số
 *    giống nhau. Khi thấy một cặp bất thường thì mời nhóm đo lại lần đó, chứ
 *    không kết luận là nhóm làm sai.
 * 3. Phần nhận định về số liệu do quy tắc ở file này quyết định, không phải do
 *    AI, để không bao giờ chấm oan số liệu của nhóm.
 *
 * File này là hàm thuần (không gọi mạng, không đọc DB) nên chạy được ở cả máy
 * chủ và trình duyệt, và cho cùng kết quả với cùng một bộ số liệu.
 */

/** Dữ liệu một lần đo cần cho việc phân tích. */
export type OhmMeasurementInput = { sequence: number; voltage: number; current: number };

/** Một cặp số liệu bị coi là bất thường khi lệch quá mức này so với phần còn lại. */
export const OHM_RATIO_TOLERANCE_PERCENT = 15;
/** Dưới mức này thì chưa đủ căn cứ để thấy một quy luật. */
export const OHM_MIN_USEFUL_POINTS = 3;

export type OhmRowStat = {
  sequence: number;
  voltage: number;
  current: number;
  /** U/I của lần đo; null khi không lập được tỉ số. */
  resistance: number | null;
  /** Lệch bao nhiêu phần trăm so với trung vị của cả bảng. */
  deviationPercent: number | null;
};

export type OhmDataAnalysis = {
  rows: OhmRowStat[];
  /** Số lần đo lập được tỉ số U/I (U > 0 và I > 0). */
  usableCount: number;
  /**
   * Lần đo có cả U = 0 và I = 0. Đây là số liệu hợp lệ và còn là bằng chứng tốt
   * cho việc đồ thị đi qua gốc tọa độ, chỉ là không lập được tỉ số, nên KHÔNG
   * bị coi là thiếu số liệu.
   */
  originSequences: number[];
  /** Lần đo chỉ một trong hai đại lượng bằng 0 — bất thường, nên đo lại. */
  halfZeroSequences: number[];
  enoughPoints: boolean;
  /** Độ phân tán (max − min)/trung bình của U/I, theo phần trăm. */
  spreadPercent: number | null;
  ratioConstant: boolean;
  averageResistance: number | null;
  medianResistance: number | null;
  /** Các lần đo lệch quá ngưỡng so với trung vị. */
  outliers: Array<{ sequence: number; deviationPercent: number }>;
  /** I có tăng theo U khi sắp xếp theo U tăng dần. */
  currentRisesWithVoltage: boolean;
  /** Khoảng U khảo sát có đủ rộng để thấy quy luật. */
  voltageRangeWide: boolean;
};

export type OhmConclusionSignals = {
  present: boolean;
  wordCount: number;
  /** Có nêu được quan hệ tỉ lệ thuận. */
  mentionsProportional: boolean;
  /**
   * Viết ngược thứ tự: "U tỉ lệ thuận với I". Trong thí nghiệm này U là đại
   * lượng nhóm chủ động đặt, I là đại lượng thay đổi theo, nên cách viết đúng
   * là "I tỉ lệ thuận với U".
   */
  reversedProportional: boolean;
  /** Chỉ nói chiều biến đổi (tăng/giảm) mà chưa nêu tỉ lệ. */
  mentionsDirectionOnly: boolean;
  /** Nói I giảm khi U tăng — trái với số liệu. */
  contradictsData: boolean;
  /** Có dẫn ra con số hoặc tỉ số từ bảng. */
  citesNumbers: boolean;
};

export type OhmReviewNote = {
  id: string;
  topic: "data" | "conclusion";
  text: string;
};

export type OhmReview = {
  source: "rules" | "ai";
  /** Dòng tóm tắt số liệu, chỉ nêu sự kiện, không nêu kết luận vật lí. */
  summary: string;
  notes: OhmReviewNote[];
  /** Nhóm nên xem lại và nộp lại. */
  needsRevision: boolean;
  generatedAt: string;
};

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function formatNumber(value: number, digits = 1) {
  return value.toFixed(digits).replace(".", ",").replace(/,0$/, "");
}

function listSequences(values: number[]) {
  return values.join(", ");
}

export function analyseOhmMeasurements(measurements: OhmMeasurementInput[]): OhmDataAnalysis {
  const ordered = [...measurements].sort((left, right) => left.sequence - right.sequence);
  const ratioRows = ordered.filter((item) => item.voltage > 0 && item.current > 0);
  const resistances = ratioRows.map((item) => item.voltage / item.current);
  const medianResistance = resistances.length ? median(resistances) : null;
  const averageResistance = resistances.length
    ? resistances.reduce((sum, value) => sum + value, 0) / resistances.length
    : null;

  const rows: OhmRowStat[] = ordered.map((item) => {
    const resistance = item.voltage > 0 && item.current > 0 ? item.voltage / item.current : null;
    const deviationPercent = resistance !== null && medianResistance !== null && medianResistance > 0
      ? Math.abs(resistance - medianResistance) / medianResistance * 100
      : null;
    return { sequence: item.sequence, voltage: item.voltage, current: item.current, resistance, deviationPercent };
  });

  const spreadPercent = resistances.length >= 2 && averageResistance !== null && averageResistance > 0
    ? (Math.max(...resistances) - Math.min(...resistances)) / averageResistance * 100
    : null;

  const outliers = rows
    .filter((row) => row.deviationPercent !== null && row.deviationPercent > OHM_RATIO_TOLERANCE_PERCENT)
    .map((row) => ({ sequence: row.sequence, deviationPercent: row.deviationPercent! }))
    .sort((left, right) => right.deviationPercent - left.deviationPercent);

  // Sắp theo U tăng dần rồi xem I có tăng theo; cho phép đi ngang vì sai số đo.
  const byVoltage = [...ratioRows].sort((left, right) => left.voltage - right.voltage);
  const currentRisesWithVoltage = byVoltage.length < 2
    ? true
    : byVoltage.every((item, index) => index === 0 || item.current >= byVoltage[index - 1].current * 0.95);

  const voltages = ratioRows.map((item) => item.voltage);
  const voltageRangeWide = voltages.length >= 2 && Math.max(...voltages) > 0
    ? (Math.max(...voltages) - Math.min(...voltages)) / Math.max(...voltages) >= 0.4
    : false;

  return {
    rows,
    usableCount: ratioRows.length,
    originSequences: ordered.filter((item) => item.voltage === 0 && item.current === 0).map((item) => item.sequence),
    halfZeroSequences: ordered
      .filter((item) => (item.voltage === 0) !== (item.current === 0))
      .map((item) => item.sequence),
    enoughPoints: ratioRows.length >= OHM_MIN_USEFUL_POINTS,
    spreadPercent,
    ratioConstant: spreadPercent !== null && spreadPercent <= OHM_RATIO_TOLERANCE_PERCENT,
    averageResistance,
    medianResistance,
    outliers,
    currentRisesWithVoltage,
    voltageRangeWide,
  };
}

export function readOhmConclusion(conclusion: string): OhmConclusionSignals {
  const text = conclusion.trim().toLowerCase();
  const wordCount = text ? text.split(/\s+/).length : 0;

  const voltageWord = "(?:\\bu\\b|hiệu\\s*điện\\s*thế)";
  const currentWord = "(?:\\bi\\b|cường\\s*độ(?:\\s*dòng\\s*điện)?|dòng\\s*điện)";
  const proportional = "(?:tỉ|tỷ|ti)\\s*lệ\\s*thuận(?:\\s*với)?";
  // "U tỉ lệ thuận với I" — ngược thứ tự phụ thuộc của thí nghiệm này.
  const reversedProportional = new RegExp(`${voltageWord}[^.;!?]{0,25}${proportional}[^.;!?]{0,25}${currentWord}`).test(text);
  // "I tỉ lệ thuận với U" — thứ tự đúng.
  const forwardProportional = new RegExp(`${currentWord}[^.;!?]{0,25}${proportional}[^.;!?]{0,25}${voltageWord}`).test(text);

  // Nhiều nhóm diễn đạt đúng ý mà không dùng chữ "tỉ lệ thuận": "U gấp đôi thì
  // I cũng gấp đôi", hoặc "tỉ số U/I không đổi". Nhận cả hai cách.
  const saysSameScaling = (text.match(/gấp\s*(đôi|ba|bốn|năm|\d+(?:[.,]\d+)?)/g) ?? []).length >= 2;
  const saysRatioConstant = /(u\s*\/\s*i|i\s*\/\s*u|tỉ số|tỷ số|ti so).{0,30}(không đổi|không thay đổi|như nhau|bằng nhau|luôn bằng|đều bằng)/.test(text);

  const risesTogether = /(u|hiệu điện thế).{0,30}(tăng|lớn).{0,40}(i|cường độ|dòng điện).{0,20}(tăng|lớn)/.test(text)
    || /càng.{0,20}(tăng|lớn).{0,40}càng.{0,20}(tăng|lớn)/.test(text);
  const contradictsData = /(u|hiệu điện thế).{0,30}tăng.{0,40}(i|cường độ|dòng điện).{0,20}giảm/.test(text);
  const citesNumbers = /\d/.test(text) || /u\/i|i\/u|tỉ số|ti so|tỷ số/.test(text);

  // Viết ngược thì chưa tính là đã nêu đúng quan hệ.
  const mentionsProportional = (forwardProportional || saysSameScaling || saysRatioConstant) && !(reversedProportional && !forwardProportional);

  return {
    present: wordCount > 0,
    wordCount,
    mentionsProportional,
    reversedProportional: reversedProportional && !forwardProportional,
    mentionsDirectionOnly: !mentionsProportional && risesTogether,
    contradictsData,
    citesNumbers,
  };
}

/**
 * Sinh nhận xét bằng quy tắc. Mọi câu đều ở dạng gợi mở để nhóm tự rút ra kết
 * luận; với số liệu lệch thì mời nhóm đo lại chứ không nói nhóm làm sai.
 */
export function buildOhmRulesReview(analysis: OhmDataAnalysis, signals: OhmConclusionSignals): OhmReview {
  const notes: OhmReviewNote[] = [];

  // --- Phần số liệu ---
  if (analysis.usableCount === 0) {
    notes.push({ id: "data-empty", topic: "data", text: "Bảng số liệu chưa có lần đo nào có cả U và I khác 0. Nhóm kiểm tra lại xem đã ghi số đo vào bảng chưa nhé." });
  } else {
    if (analysis.halfZeroSequences.length) {
      notes.push({ id: "data-half-zero", topic: "data", text: `Ở lần đo số ${listSequences(analysis.halfZeroSequences)}, một trong hai đại lượng đang bằng 0 còn đại lượng kia thì không. Nhóm thử kiểm tra lại mạch rồi đo lại lần đó thêm một lần nhé.` });
    }
    if (!analysis.enoughPoints) {
      notes.push({ id: "data-few-points", topic: "data", text: `Nhóm hiện có ${analysis.usableCount} lần đo lập được cặp U – I. Theo nhóm, bấy nhiêu lần đo đã đủ để thấy một quy luật chưa, hay nên đo thêm vài lần nữa?` });
    }
    if (analysis.outliers.length === 1) {
      const [outlier] = analysis.outliers;
      notes.push({ id: "data-one-outlier", topic: "data", text: `Nhóm nhìn lại cặp số liệu ở lần đo số ${outlier.sequence}: so với các lần còn lại thì cặp này đang có chút bất thường. Nhóm thử đo lại lần đó thêm một lần nữa xem kết quả có khác không nhé.` });
    } else if (analysis.outliers.length > 1) {
      notes.push({ id: "data-outliers", topic: "data", text: `Các cặp số liệu ở lần đo số ${listSequences(analysis.outliers.map((item) => item.sequence))} đang hơi lệch so với phần còn lại. Nhóm thử đo lại mấy lần đó, chú ý đọc đồng hồ ở đúng tầm mắt nhé.` });
    } else if (!analysis.ratioConstant) {
      notes.push({ id: "data-scattered", topic: "data", text: "Các cặp số liệu của nhóm đang chênh nhau khá nhiều nên chưa thấy rõ quy luật. Nhóm thử đo lại một vài lần xem có ổn định hơn không nhé." });
    }
    if (!analysis.currentRisesWithVoltage && analysis.outliers.length === 0 && analysis.halfZeroSequences.length === 0) {
      notes.push({ id: "data-not-rising", topic: "data", text: "Nhóm thử sắp số liệu theo U tăng dần rồi đọc cột I xem có tăng theo không. Nếu chưa, có thể chỗ nào lúc ghi số liệu bị lẫn." });
    }
    if (analysis.ratioConstant && analysis.enoughPoints && analysis.halfZeroSequences.length === 0) {
      notes.push({ id: "data-constant", topic: "data", text: "Số liệu của nhóm khá đều tay. Nhóm thử so các cặp số liệu với nhau xem khi U tăng lên mấy lần thì I tăng lên mấy lần nhé." });
    }
    if (analysis.originSequences.length) {
      notes.push({ id: "data-origin-point", topic: "data", text: `Lần đo số ${listSequences(analysis.originSequences)} có U = 0 và I = 0. Theo nhóm, điểm này giúp ích gì khi vẽ đồ thị I theo U?` });
    }
    if (analysis.enoughPoints && analysis.ratioConstant && !analysis.voltageRangeWide) {
      notes.push({ id: "data-narrow-range", topic: "data", text: "Các mức U nhóm chọn khá gần nhau. Nếu đo thêm ở một mức U cách xa hơn, quy luật nhóm tìm được sẽ rõ hơn hay mờ đi?" });
    }
  }

  // --- Phần câu kết luận ---
  if (!signals.present) {
    notes.push({ id: "conclusion-missing", topic: "conclusion", text: "Nhóm chưa viết kết luận. Dựa vào bảng số liệu và đồ thị, nhóm thử diễn đạt xem khi U thay đổi thì I thay đổi theo cách nào?" });
  } else if (signals.contradictsData) {
    notes.push({ id: "conclusion-contradicts", topic: "conclusion", text: "Nhóm đọc lại bảng số liệu của chính mình: khi U tăng thì các giá trị I trong bảng đi lên hay đi xuống? Rồi đối chiếu với câu kết luận nhóm vừa viết." });
  } else if (signals.reversedProportional) {
    notes.push({ id: "conclusion-reversed", topic: "conclusion", text: "Câu kết luận của nhóm đã nói tới quan hệ tỉ lệ thuận, nhưng nhóm thử xem lại thứ tự hai đại lượng: trong thí nghiệm này nhóm chủ động thay đổi đại lượng nào, và đại lượng nào thay đổi theo? Đại lượng phụ thuộc nên được nêu trước khi viết câu tỉ lệ thuận." });
  } else if (signals.mentionsDirectionOnly) {
    notes.push({ id: "conclusion-direction-only", topic: "conclusion", text: "Kết luận của nhóm đã cho biết I thay đổi theo chiều nào. Nhóm thử đi xa thêm một bước: khi U gấp đôi thì I gấp mấy lần? Từ đó diễn đạt lại cho chặt hơn." });
  } else if (!signals.mentionsProportional && signals.wordCount < 12) {
    notes.push({ id: "conclusion-short", topic: "conclusion", text: "Kết luận còn khá ngắn. Nhóm thử bổ sung: khi U tăng thì I thay đổi thế nào, và các cặp số liệu của nhóm cho thấy điều gì?" });
  } else if (signals.mentionsProportional && !signals.citesNumbers) {
    notes.push({ id: "conclusion-needs-evidence", topic: "conclusion", text: "Kết luận của nhóm đã nêu được mối quan hệ. Nhóm thử chỉ ra cụ thể cặp số liệu nào trong bảng làm bằng chứng cho nhận định đó?" });
  } else if (signals.mentionsProportional && signals.citesNumbers) {
    notes.push({ id: "conclusion-solid", topic: "conclusion", text: "Kết luận của nhóm đã có nhận định kèm số liệu. Nhóm thử nghĩ thêm: nếu thay bằng một dây dẫn khác thì điều gì trong kết quả sẽ đổi, điều gì vẫn giữ nguyên?" });
  } else {
    notes.push({ id: "conclusion-general", topic: "conclusion", text: "Nhóm đọc lại kết luận của mình một lượt nữa: đã nêu rõ khi U thay đổi thì I thay đổi theo cách nào, và đã dẫn số liệu của nhóm làm bằng chứng chưa?" });
  }

  // Dòng tóm tắt chỉ nêu sự kiện, không đánh giá số liệu thực nghiệm.
  const summary = analysis.usableCount === 0
    ? "Chưa có lần đo nào lập được cặp U – I."
    : `${analysis.usableCount} lần đo lập được cặp U – I${analysis.averageResistance !== null ? ` · U/I trung bình ≈ ${formatNumber(analysis.averageResistance, 1)}` : ""}${analysis.outliers.length ? ` · ${analysis.outliers.length} lần đo nên đo lại` : ""}`;

  const needsRevision = analysis.usableCount === 0
    || analysis.halfZeroSequences.length > 0
    || analysis.outliers.length > 0
    || !analysis.enoughPoints
    || !analysis.ratioConstant
    || !analysis.currentRisesWithVoltage
    || !signals.present
    || signals.contradictsData
    || signals.reversedProportional
    || signals.mentionsDirectionOnly
    || (!signals.mentionsProportional && signals.wordCount < 12);

  return { source: "rules", summary, notes, needsRevision, generatedAt: new Date().toISOString() };
}

/** Tiện dụng: chạy cả hai bước phân tích rồi sinh nhận xét theo quy tắc. */
export function reviewOhmExperiment(measurements: OhmMeasurementInput[], conclusion: string): OhmReview {
  return buildOhmRulesReview(analyseOhmMeasurements(measurements), readOhmConclusion(conclusion));
}
