"use client";

export default function FullscreenButton() {
  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* trình duyệt chặn toàn màn hình — bỏ qua */
    }
  }
  return <button type="button" className="cp-mini-button" onClick={toggle}>⛶ Toàn màn hình</button>;
}
