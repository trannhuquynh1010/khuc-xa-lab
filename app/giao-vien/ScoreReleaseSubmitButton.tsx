"use client";

import { useFormStatus } from "react-dom";

export default function ScoreReleaseSubmitButton({ disabled, released, pendingCount }: { disabled: boolean; released: boolean; pendingCount: number }) {
  const { pending } = useFormStatus();
  const label = disabled
    ? "Chưa có bài"
    : released
      ? "Thu hồi công bố"
      : `Công bố ${pendingCount} bài`;

  return (
    <button className={released ? "secondary-button close-activity" : "primary-button"} type="submit" disabled={disabled || pending}>
      {pending ? "Đang cập nhật…" : label}
    </button>
  );
}
