"use client";

import { useFormStatus } from "react-dom";

export default function TeacherToggleSubmitButton({ isOpen, openLabel, closeLabel }: {
  isOpen: boolean;
  openLabel: string;
  closeLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={isOpen ? "secondary-button close-activity" : "primary-button"} type="submit" disabled={pending} aria-busy={pending}>
      {pending ? "Đang cập nhật…" : isOpen ? closeLabel : openLabel}
    </button>
  );
}
