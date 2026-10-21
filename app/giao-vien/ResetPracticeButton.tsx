"use client";

import { useFormStatus } from "react-dom";

export default function ResetPracticeButton({ className, practiceLabel, disabled = false }: {
  className: string;
  practiceLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className="secondary-button reset-practice-button"
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        if (!window.confirm(`Reset ${practiceLabel} của lớp ${className}? Học sinh sẽ được mở khóa và có thể nộp lại để cập nhật điểm.`)) event.preventDefault();
      }}
    >
      {pending ? "Đang reset…" : "Reset bài làm"}
    </button>
  );
}
