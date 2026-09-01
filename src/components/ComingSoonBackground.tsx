// Union — decorative watercolor floral background, coming-soon page only.
// Blurred SVG blobs in a muted sage/blush/cream palette, clustered in the
// corners so the center stays clear for the monogram and copy.
export default function ComingSoonBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="watercolor-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="36" />
        </filter>
      </defs>
      <g filter="url(#watercolor-blur)" opacity="0.5">
        {/* Top-left cluster */}
        <ellipse cx="8%" cy="6%" rx="220" ry="170" fill="#E7C9C9" />
        <ellipse cx="18%" cy="16%" rx="170" ry="140" fill="#B7C9AE" />
        <ellipse cx="4%" cy="22%" rx="150" ry="120" fill="#F1E4CE" />

        {/* Bottom-right cluster */}
        <ellipse cx="93%" cy="94%" rx="230" ry="180" fill="#B7C9AE" />
        <ellipse cx="84%" cy="86%" rx="180" ry="150" fill="#E7C9C9" />
        <ellipse cx="97%" cy="80%" rx="150" ry="120" fill="#F1E4CE" />
      </g>
    </svg>
  )
}
