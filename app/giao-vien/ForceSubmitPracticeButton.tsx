"use client";

import { useFormStatus } from "react-dom";

export default function ForceSubmitPracticeButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="secondary-button force-submit-button"
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        if (!window.confirm("Thu bài ngay của cả lớp? Bài đang làm dở cũng sẽ được lưu và khóa.")) event.preventDefault();
      }}
    >
      {pending ? "Đang thu bài…" : disabled ? "Đã thu đủ 33" : "Thu bài ngay"}
    </button>
  );
}
