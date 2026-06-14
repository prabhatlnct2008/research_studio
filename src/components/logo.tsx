export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5S19.33 7 18.5 7h-13C4.67 7 4 6.33 4 5.5Z"
        fill="currentColor"
      />
      <path
        d="M4 12c0-.83.67-1.5 1.5-1.5h9c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-9C4.67 13.5 4 12.83 4 12Z"
        fill="currentColor"
        opacity="0.6"
      />
      <path
        d="M4 18.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5S11.33 20 10.5 20h-5C4.67 20 4 19.33 4 18.5Z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}
