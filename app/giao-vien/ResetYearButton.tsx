"use client";

import { resetYearData } from "./actions";

export default function ResetYearButton({ schoolYear }: { schoolYear: string }) {
  return (
    <form
      action={resetYearData}
      onSubmit={(event) => {
        if (!window.confirm(`Xóa toàn bộ bài nộp của năm học ${schoolYear}? Thao tác này không thể hoàn tác.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="schoolYear" value={schoolYear} />
      <button type="submit" className="reset-data-button">Reset dữ liệu năm {schoolYear}</button>
    </form>
  );
}
