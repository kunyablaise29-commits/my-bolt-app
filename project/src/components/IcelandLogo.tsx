interface Props {
  size?: number;
  showTagline?: boolean;
}

export default function IcelandLogo({ size = 60, showTagline = false }: Props) {
  return (
    <div style={{ textAlign: 'center', userSelect: 'none' }}>
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a9eff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a73e8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a9eff" />
            <stop offset="100%" stopColor="#1558b0" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="40" fill="url(#glow)" />
        <circle cx="40" cy="40" r="32" fill="#0a1628" stroke="#1a73e8" strokeWidth="1.5" strokeOpacity="0.4" />
        <path
          d="M22 28 Q40 18 58 28 L56 50 Q40 62 24 50 Z"
          fill="url(#logoGrad)"
          opacity="0.9"
        />
        <path
          d="M40 22 L40 58 M28 30 L52 30 M26 40 L54 40 M28 50 L52 50"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.3"
        />
        <text
          x="40"
          y="46"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
          letterSpacing="1"
        >IC</text>
      </svg>
      <div style={{
        color: '#1a73e8',
        fontSize: size * 0.22,
        fontWeight: 700,
        letterSpacing: size * 0.06,
        marginTop: size * 0.06,
        fontFamily: 'Inter, sans-serif',
        textTransform: 'uppercase'
      }}>
        ICELAND
      </div>
      {showTagline && (
        <div style={{
          color: '#4a5568',
          fontSize: size * 0.14,
          marginTop: size * 0.04,
          letterSpacing: 1
        }}>
          Connect. Share. Explore.
        </div>
      )}
    </div>
  );
}
