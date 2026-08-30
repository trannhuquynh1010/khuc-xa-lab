"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrentSchoolYear } from "@/lib/school-years";

type StoredDraft = {
  version: 1;
  savedAt: string;
  data: unknown;
};

export function isDraftRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deviceDraftKey(activity: string) {
  return `physics-lab-draft:${getCurrentSchoolYear()}:${activity}:v1`;
}

export default function useDeviceDraft<T>(storageKey: string, data: T, restore: (value: unknown) => void) {
  const restoreRef = useRef(restore);
  const serializedData = JSON.stringify(data);
  const [ready, setReady] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    restoreRef.current = restore;
  }, [restore]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const rawDraft = window.localStorage.getItem(storageKey);
        if (rawDraft) {
          const stored = JSON.parse(rawDraft) as StoredDraft;
          if (stored.version === 1 && "data" in stored) {
            restoreRef.current(stored.data);
            if (typeof stored.savedAt === "string") setLastSavedAt(stored.savedAt);
          }
        }
      } catch {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          // Ignore browsers that disable device storage entirely.
        }
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    const saveTimer = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        const stored: StoredDraft = { version: 1, savedAt, data: JSON.parse(serializedData) };
        window.localStorage.setItem(storageKey, JSON.stringify(stored));
        setLastSavedAt(savedAt);
      } catch {
        // The form remains usable if private browsing or storage limits block local storage.
      }
    }, 300);

    return () => window.clearTimeout(saveTimer);
  }, [ready, serializedData, storageKey]);

  return {
    draftStatus: !ready ? "Đang khôi phục nháp…" : lastSavedAt ? "✓ Nháp đã tự lưu" : "Đang tự lưu nháp…",
  };
}
