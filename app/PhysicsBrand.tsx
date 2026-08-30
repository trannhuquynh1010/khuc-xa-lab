export default function PhysicsBrand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`physics-brand ${inverse ? "inverse" : ""}`} aria-label="Physics Lab">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="presentation">
          <ellipse cx="22" cy="22" rx="17" ry="7" />
          <ellipse cx="22" cy="22" rx="17" ry="7" transform="rotate(60 22 22)" />
          <ellipse cx="22" cy="22" rx="17" ry="7" transform="rotate(120 22 22)" />
          <circle cx="22" cy="22" r="3.5" />
        </svg>
      </span>
      <strong>Physics Lab</strong>
    </div>
  );
}
