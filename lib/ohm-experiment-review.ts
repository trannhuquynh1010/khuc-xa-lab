/**
 * Đọc số liệu I–U và câu kết luận của nhóm rồi sinh nhận xét tự động.
 *
 * Hai nguyên tắc do giáo viên đặt ra:
 * 1. Chỉ DẪN DẮT, không nói thẳng. Nhận xét không được nêu sẵn kết luận vật lí
 *    ("I tỉ lệ thuận với U") mà phải đặt câu hỏi để nhóm tự rút ra.
 * 2. Phần kết luận đúng/sai về số liệu do quy tắc ở file này quyết định, không
 *    phải do AI, để không bao giờ chấm oan số liệu của nhóm.
 *
 * File này là hàm thuần (không gọi mạng, không đọc DB) nên chạy được ở cả máy
 * chủ và trình duyệt, và cho cùng một kết quả với cùng một bộ số liệu.
 */

/** Dữ liệu một lần đo cần cho việc phân tích. */
export type OhmMeasurementInput = { sequence: number; voltage: number; current: number };

/** Tỉ số U/I được coi là "không đổi" khi độ phân tán không vượt mức này. */
export const OHM_RATIO_TOLERANCE_PERCENT = 15;
/** Dưới mức này thì chưa đủ căn cứ để khẳng định một quy luật. */
export const OHM_MIN_USEFUL_POINTS = 3;

export type OhmRowStat = {
  sequence: number;
  voltage: number;
  current: number;
  /** U/I của lần đo; null khi I = 0 nên không tính được. */
  resistance: number | null;
  /** Lệch bao nhiêu phần trăm so với trung vị của cả bảng. */
  deviationPercent: number | null;
};

export type OhmDataAnalysis = {
  rows: OhmRowStat[];
  /** Số lần đo tính được U/I (U > 0 và I > 0). */
  usableCount: number;
  /** Các lần đo không tính được U/I vì thiếu số liệu (U = 0 hoặc I = 0). */
  unusableSequences: number[];
  enoughPoints: boolean;
  /** Độ phân tán (max − min)/trung bình, theo phần trăm. */
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

export function analyseOhmMeasurements(measurements: OhmMeasurementInput[]): OhmDataAnalysis {
  const ordered = [...measurements].sort((left, right) => left.sequence - right.sequence);
  const usable = ordered.filter((item) => item.current > 0 && item.voltage > 0);
  const resistances = usable.map((item) => item.voltage / item.current);
  const medianResistance = resistances.length ? median(resistances) : null;
  const averageResistance = resistances.length
    ? resistances.reduce((sum, value) => sum + value, 0) / resistances.length
    : null;

  const rows: OhmRowStat[] = ordered.map((item) => {
    const resistance = item.current > 0 && item.voltage > 0 ? item.voltage / item.current : null;
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
  const byVoltage = [...usable].sort((left, right) => left.voltage - right.voltage);
  const currentRisesWithVoltage = byVoltage.length < 2
    ? true
    : byVoltage.every((item, index) => index === 0 || item.current >= byVoltage[index - 1].current * 0.95);

  const voltages = usable.map((item) => item.voltage);
  const voltageRangeWide = voltages.length >= 2 && Math.max(...voltages) > 0
    ? (Math.max(...voltages) - Math.min(...voltages)) / Math.max(...voltages) >= 0.4
    : false;

  return {
    rows,
    usableCount: usable.length,
    unusableSequences: rows.filter((row) => row.resistance === null).map((row) => row.sequence),
    enoughPoints: usable.length >= OHM_MIN_USEFUL_POINTS,
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
  // Nhiều nhóm diễn đạt đúng ý tỉ lệ thuận mà không dùng đúng chữ "tỉ lệ thuận":
  // "U gấp đôi thì I cũng gấp đôi", hoặc "tỉ số U/I không đổi". Nhận cả hai cách.
  const saysProportionalWords = /tỉ lệ thuận|ti le thuan|tỷ lệ thuận|tỉ lệ với|gấp bao nhiêu lần|cùng số lần|bao nhiêu lần thì/.test(text);
  const saysSameScaling = (text.match(/gấp\s*(đôi|ba|bốn|năm|\d+(?:[.,]\d+)?)/g) ?? []).length >= 2;
  const saysRatioConstant = /(u\s*\/\s*i|i\s*\/\s*u|tỉ số|tỷ số|ti so).{0,30}(không đổi|không thay đổi|như nhau|bằng nhau|luôn bằng|đều bằng)/.test(text);
  const mentionsProportional = saysProportionalWords || saysSameScaling || saysRatioConstant;
  const risesTogether = /(u|hiệu điện thế).{0,30}(tăng|lớn).{0,40}(i|cường độ|dòng điện).{0,20}(tăng|lớn)/.test(text)
    || /càng.{0,20}(tăng|lớn).{0,40}càng.{0,20}(tăng|lớn)/.test(text);
  const contradictsData = /(u|hiệu điện thế).{0,30}tăng.{0,40}(i|cường độ|dòng điện).{0,20}giảm/.test(text);
  const citesNumbers = /\d/.test(text) || /u\/i|i\/u|tỉ số|ti so|tỷ số/.test(text);
  return {
    present: wordCount > 0,
    wordCount,
    mentionsProportional,
    mentionsDirectionOnly: !mentionsProportional && risesTogether,
    contradictsData,
    citesNumbers,
  };
}

/**
 * Sinh nhận xét bằng quy tắc. Mọi câu đều ở dạng câu hỏi dẫn dắt để nhóm tự rút
 * ra kết luận, không câu nào nêu sẵn quy luật I–U.
 */
export function buildOhmRulesReview(analysis: OhmDataAnalysis, signals: OhmConclusionSignals): OhmReview {
  const notes: OhmReviewNote[] = [];

  // --- Phần số liệu ---
  if (analysis.usableCount === 0) {
    notes.push({ id: "data-empty", topic: "data", text: "Bảng số liệu chưa có lần đo nào tính được tỉ số U/I. Nhóm kiểm tra lại xem đã ghi đủ cả U và I cho mỗi lần đo chưa?" });
  } else {
    // Báo trước những dòng bị bỏ ra khỏi phép tính, để nhóm không thấy hụt số
    // lần đo mà không hiểu vì sao.
    if (analysis.unusableSequences.length) {
      notes.push({ id: "data-unusable", topic: "data", text: `Lần đo số ${analysis.unusableSequences.join(", ")} chưa tính được tỉ số U/I vì còn thiếu số liệu U hoặc I. Nhóm xem lại xem có phải bỏ trống hoặc ghi 0 không?` });
    }
    if (!analysis.enoughPoints) {
      notes.push({ id: "data-few-points", topic: "data", text: `Nhóm hiện có ${analysis.usableCount} lần đo dùng được. Theo nhóm, bấy nhiêu lần đo đã đủ để khẳng định một quy luật chưa, hay nên đo thêm?` });
    }
    if (!analysis.ratioConstant && analysis.spreadPercent !== null) {
      const spread = formatNumber(analysis.spreadPercent, 0);
      if (analysis.outliers.length === 1) {
        const [outlier] = analysis.outliers;
        notes.push({ id: "data-one-outlier", topic: "data", text: `Nhóm thử tính tỉ số U/I cho từng lần đo rồi so với nhau: các giá trị đang chênh nhau tới khoảng ${spread}%, trong đó lần đo số ${outlier.sequence} lệch nhiều nhất (khoảng ${formatNumber(outlier.deviationPercent, 0)}% so với phần còn lại). Theo nhóm vì sao lần đo đó lệch, và nên xử lí thế nào?` });
      } else if (analysis.outliers.length > 1) {
        const list = analysis.outliers.map((item) => item.sequence).join(", ");
        notes.push({ id: "data-outliers", topic: "data", text: `Tỉ số U/I của nhóm chênh nhau khoảng ${spread}%, trong đó lệch nhiều là các lần đo số ${list}. Điều gì trong cách đọc đồng hồ hoặc cách mắc mạch có thể gây ra sự chênh lệch này?` });
      } else {
        notes.push({ id: "data-scattered", topic: "data", text: `Tỉ số U/I giữa các lần đo của nhóm chênh nhau khoảng ${spread}%, khá rải rác chứ không tập trung quanh một giá trị. Nhóm thử nghĩ xem điều gì trong cách đo có thể gây ra sự chênh lệch này?` });
      }
    } else if (analysis.ratioConstant && analysis.enoughPoints) {
      notes.push({ id: "data-constant", topic: "data", text: "Nhóm thử tính tỉ số U/I cho từng lần đo rồi đặt cạnh nhau. Các giá trị này gần như bằng nhau — theo nhóm, con số ổn định đó cho biết điều gì về dây dẫn đang khảo sát?" });
    }
    // Chỉ nhắc chuyện I không tăng theo U khi nguyên nhân không phải do một vài
    // lần đo lệch (những lần đó đã được nhắc riêng ở trên).
    if (!analysis.currentRisesWithVoltage && analysis.outliers.length === 0) {
      notes.push({ id: "data-not-rising", topic: "data", text: "Nhóm thử sắp số liệu theo U tăng dần rồi đọc cột I xem có tăng theo không. Nếu chưa, có thể chỗ nào trong lúc ghi số liệu bị lẫn?" });
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
  } else if (signals.mentionsDirectionOnly) {
    notes.push({ id: "conclusion-direction-only", topic: "conclusion", text: "Kết luận của nhóm đã cho biết I thay đổi theo chiều nào. Nhóm thử đi xa thêm một bước: khi U gấp đôi thì I gấp mấy lần? Từ đó diễn đạt lại cho chặt hơn." });
  } else if (!signals.mentionsProportional && signals.wordCount < 12) {
    notes.push({ id: "conclusion-short", topic: "conclusion", text: "Kết luận còn khá ngắn. Nhóm thử bổ sung: khi U tăng thì I thay đổi thế nào, và tỉ số U/I mà nhóm vừa tính nói lên điều gì?" });
  } else if (signals.mentionsProportional && !signals.citesNumbers) {
    notes.push({ id: "conclusion-needs-evidence", topic: "conclusion", text: "Kết luận của nhóm đã nêu được mối quan hệ. Nhóm thử chỉ ra cụ thể con số nào trong bảng số liệu làm bằng chứng cho nhận định đó?" });
  } else if (signals.mentionsProportional && signals.citesNumbers) {
    notes.push({ id: "conclusion-solid", topic: "conclusion", text: "Kết luận của nhóm đã có nhận định kèm số liệu. Nhóm thử nghĩ thêm: nếu thay bằng một dây dẫn khác thì điều gì trong kết quả sẽ đổi, điều gì vẫn giữ nguyên?" });
  } else {
    // Luôn có ít nhất một câu cho phần kết luận: không nhóm nào nộp bài mà
    // không nhận được gì để suy nghĩ thêm.
    notes.push({ id: "conclusion-general", topic: "conclusion", text: "Nhóm đọc lại kết luận của mình một lượt nữa: đã nêu rõ khi U thay đổi thì I thay đổi theo cách nào, và đã dẫn số liệu của nhóm làm bằng chứng chưa?" });
  }

  const summary = analysis.usableCount === 0
    ? "Chưa có lần đo nào tính được tỉ số U/I."
    : `${analysis.usableCount} lần đo dùng được · tỉ số U/I chênh nhau ${analysis.spreadPercent === null ? "—" : `${formatNumber(analysis.spreadPercent, 0)}%`}${analysis.averageResistance !== null ? ` · U/I trung bình ${formatNumber(analysis.averageResistance, 1)}` : ""}`;

  const needsRevision = analysis.usableCount === 0
    || analysis.unusableSequences.length > 0
    || !analysis.enoughPoints
    || !analysis.ratioConstant
    || !analysis.currentRisesWithVoltage
    || !signals.present
    || signals.contradictsData
    || signals.mentionsDirectionOnly
    || (!signals.mentionsProportional && signals.wordCount < 12);

  return { source: "rules", summary, notes, needsRevision, generatedAt: new Date().toISOString() };
}

/** Tiện dụng: chạy cả hai bước phân tích rồi sinh nhận xét theo quy tắc. */
export function reviewOhmExperiment(measurements: OhmMeasurementInput[], conclusion: string): OhmReview {
  return buildOhmRulesReview(analyseOhmMeasurements(measurements), readOhmConclusion(conclusion));
}
