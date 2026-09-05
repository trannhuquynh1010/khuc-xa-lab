"use client";

import { useCallback, useEffect, useState } from "react";
import { isClassName, isRefractionQuizClassName, isStudentNumber } from "@/lib/classes";
import { getPracticeDefinition, type PracticeAttemptStatus, type PracticeKey } from "@/lib/practice-attempt-types";
import useDeviceDraft, { deviceDraftKey, isDraftRecord } from "./useDeviceDraft";

type AttemptPhase = "idle" | "available" | "submitting" | "submitted";
type MessageType = "idle" | "success" | "error";

function classAllowed(practiceKey: PracticeKey, className: string) {
  return practiceKey === "refraction-application" ? isRefractionQuizClassName(className) : isClassName(className);
}

export default function usePracticeAttempt(practiceKey: PracticeKey, answers: unknown, completedCount: number) {
  const definition = getPracticeDefinition(practiceKey);
  const [className, setClassName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [phase, setPhase] = useState<AttemptPhase>("idle");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("idle");
  const [releasedResult, setReleasedResult] = useState<{ bonusPoint: number; correctCount: number; totalItems: number } | null>(null);
  const serializedAnswers = JSON.stringify(answers);
  useDeviceDraft(deviceDraftKey(`practice-identity:${practiceKey}`), { className, studentNumber }, (value) => {
    if (!isDraftRecord(value)) return;
    if (typeof value.className === "string" && classAllowed(practiceKey, value.className)) setClassName(value.className);
    const restoredNumber = Number(value.studentNumber);
    if (isStudentNumber(restoredNumber)) setStudentNumber(String(restoredNumber));
  });

  const identityReady = classAllowed(practiceKey, className) && isStudentNumber(Number(studentNumber));
  const locked = phase === "submitted";

  const applyStatus = useCallback((status: PracticeAttemptStatus) => {
    if (!status.submitted) {
      setPhase("available");
      setReleasedResult(null);
      setMessage("");
      setMessageType("idle");
      return;
    }
    setPhase("submitted");
    setMessageType("success");
    setMessage(status.forced ? "Giáo viên đã thu bài. Bài làm đã được khóa." : "Bài đã được ghi nhận.");
    setReleasedResult(status.released ? {
      bonusPoint: status.bonusPoint ?? 0,
      correctCount: status.correctCount ?? 0,
      totalItems: status.totalItems || definition.totalItems,
    } : null);
  }, [definition.totalItems]);

  const refreshStatus = useCallback(async (signal?: AbortSignal) => {
    if (!identityReady) return;
    const params = new URLSearchParams({ practiceKey, className, studentNumber });
    const response = await fetch(`/api/practice-attempts?${params}`, { cache: "no-store", signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Chưa thể kiểm tra bài làm.");
    applyStatus(data as PracticeAttemptStatus);
  }, [applyStatus, className, identityReady, practiceKey, studentNumber]);

  useEffect(() => {
    if (!identityReady) return;
    const controller = new AbortController();
    const initialTimer = window.setTimeout(() => {
      void refreshStatus(controller.signal).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPhase("available");
        setMessageType("error");
        setMessage(error instanceof Error ? error.message : "Chưa thể kiểm tra bài làm.");
      });
    }, 0);
    const interval = window.setInterval(() => {
      void refreshStatus().catch(() => undefined);
    }, 5000);
    return () => {
      window.clearTimeout(initialTimer);
      controller.abort();
      window.clearInterval(interval);
    };
  }, [identityReady, refreshStatus]);

  useEffect(() => {
    if (!identityReady || phase !== "available") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSaving(true);
      void fetch("/api/practice-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceKey, className, studentNumber: Number(studentNumber), answers: JSON.parse(serializedAnswers), mode: "draft", website: "" }),
        signal: controller.signal,
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Chưa thể lưu nháp lên lớp học.");
        applyStatus(data as PracticeAttemptStatus);
      }).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }).finally(() => {
        if (!controller.signal.aborted) setSaving(false);
      });
    }, 900);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [applyStatus, className, identityReady, phase, practiceKey, serializedAnswers, studentNumber]);

  function updateIdentity(field: "className" | "studentNumber", value: string) {
    if (field === "className") setClassName(value);
    else setStudentNumber(value);
    setPhase("idle");
    setMessage("");
    setMessageType("idle");
    setReleasedResult(null);
  }

  async function submit() {
    if (!identityReady) {
      setMessageType("error");
      setMessage("Hãy chọn lớp và STT của em.");
      return;
    }
    if (completedCount < definition.totalItems) {
      setMessageType("error");
      setMessage(`Còn ${definition.totalItems - completedCount} ý chưa hoàn thành.`);
      return;
    }
    if (locked) return;
    setPhase("submitting");
    setMessageType("idle");
    setMessage("Đang gửi bài…");
    try {
      const response = await fetch("/api/practice-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceKey, className, studentNumber: Number(studentNumber), answers, mode: "submit", website: "" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chưa thể nộp bài.");
      applyStatus(data as PracticeAttemptStatus);
      setMessageType("success");
      setMessage("Đã nộp bài.");
    } catch (error) {
      setPhase("available");
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Chưa thể nộp bài.");
    }
  }

  return {
    className,
    studentNumber,
    identityReady,
    locked,
    checking: identityReady && phase === "idle",
    saving,
    submitting: phase === "submitting",
    message,
    messageType,
    releasedResult,
    setClassName: (value: string) => updateIdentity("className", value),
    setStudentNumber: (value: string) => updateIdentity("studentNumber", value),
    submit,
  };
}
