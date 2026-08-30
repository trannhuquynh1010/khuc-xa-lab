"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PresentationToolbar() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => router.refresh(), 8000);
    return () => window.clearInterval(interval);
  }, [router]);

  async function enterFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  return (
    <div className="presentation-toolbar">
      <span><i /> 8s</span>
      <button type="button" className="presentation-button" onClick={enterFullscreen}>⛶ Toàn màn hình</button>
    </div>
  );
}
