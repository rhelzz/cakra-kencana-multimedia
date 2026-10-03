/**
 * Corner sweep in the deck's language: a solid brand wedge cut on the
 * diagonal, a lighter echo band, a white dot matrix, and a white pixel
 * cluster. All solid fills — no gradients. Shared by the WhyUs and Customers
 * sections so the motif stays identical everywhere.
 * Hidden on phones, where a corner wedge would sit behind the pitch text
 * and wreck readability.
 */
export default function CornerSweep({
  className = '',
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      fill="none"
      viewBox="0 0 440 300"
      className={`pointer-events-none absolute hidden w-72 text-primary sm:block lg:w-[440px] ${className}`}
    >
      <polygon points="200,0 440,0 440,240" fill="currentColor" />
      <polygon
        points="130,0 175,0 415,240 370,240"
        fill="currentColor"
        opacity="0.25"
      />
      {Array.from({ length: 12 }, (_, k) => (
        <circle
          key={k}
          cx={330 + (k % 4) * 20}
          cy={60 + Math.floor(k / 4) * 20}
          r="3.2"
          fill="#fff"
          opacity="0.7"
        />
      ))}
      <rect x="392" y="120" width="10" height="10" fill="#fff" opacity="0.85" />
      <rect x="406" y="120" width="10" height="10" fill="#fff" opacity="0.85" />
      <rect x="392" y="134" width="10" height="10" fill="#fff" opacity="0.85" />
    </svg>
  );
}
