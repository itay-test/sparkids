const G = ({ id, c1 = "#7c3aed", c2 = "#ec4899" }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor={c1}/><stop offset="100%" stopColor={c2}/>
    </linearGradient>
  </defs>
);

export function MicIcon({ size = 48, listening = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G id="mg" c1={listening ? "#ef4444" : "#7c3aed"} c2={listening ? "#f97316" : "#ec4899"}/>
      {/* Mic body */}
      <rect x="17" y="8" width="14" height="22" rx="7" fill={`url(#mg)`}/>
      {/* Shine */}
      <rect x="19" y="10" width="4" height="8" rx="2" fill="white" opacity="0.35"/>
      {/* Stand */}
      <path d="M12 26c0 6.627 5.373 12 12 12s12-5.373 12-12" stroke={`url(#mg)`} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* Pole */}
      <line x1="24" y1="38" x2="24" y2="44" stroke={`url(#mg)`} strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="18" y1="44" x2="30" y2="44" stroke={`url(#mg)`} strokeWidth="2.5" strokeLinecap="round"/>
      {listening && (
        <>
          <circle cx="24" cy="24" r="22" stroke="#ef4444" strokeWidth="1.5" opacity="0.3">
            <animate attributeName="r" values="22;28;22" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1.2s" repeatCount="indefinite"/>
          </circle>
          <circle cx="24" cy="24" r="16" stroke="#ef4444" strokeWidth="1.5" opacity="0.4">
            <animate attributeName="r" values="16;22;16" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
    </svg>
  );
}

export function CameraIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G id="cg"/>
      <rect x="4" y="14" width="40" height="28" rx="6" fill="url(#cg)"/>
      <path d="M16 14l3-6h10l3 6" fill="url(#cg)"/>
      <circle cx="24" cy="28" r="9" fill="white" opacity="0.25"/>
      <circle cx="24" cy="28" r="6" fill="white" opacity="0.9"/>
      <circle cx="24" cy="28" r="3.5" fill="url(#cg)"/>
      <circle cx="24" cy="28" r="1.5" fill="white" opacity="0.6"/>
      <circle cx="36" cy="20" r="2" fill="white" opacity="0.7"/>
    </svg>
  );
}

export function GalleryIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G id="gg"/>
      <rect x="4" y="8" width="32" height="26" rx="5" fill="url(#gg)" opacity="0.4"/>
      <rect x="10" y="14" width="32" height="26" rx="5" fill="url(#gg)"/>
      <circle cx="19" cy="24" r="4" fill="white" opacity="0.7"/>
      <path d="M10 34l8-8 6 6 4-4 8 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9"/>
    </svg>
  );
}

export function SaveIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G id="sg" c1="#10b981" c2="#059669"/>
      <rect width="32" height="32" rx="10" fill="url(#sg)"/>
      <path d="M16 8v13M10 15l6 7 6-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 25h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function ShareIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G id="shg" c1="#f97316" c2="#ef4444"/>
      <rect width="32" height="32" rx="10" fill="url(#shg)"/>
      <circle cx="22" cy="10" r="3" fill="white"/>
      <circle cx="22" cy="22" r="3" fill="white"/>
      <circle cx="10" cy="16" r="3" fill="white"/>
      <line x1="13" y1="14.5" x2="19" y2="11.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="17.5" x2="19" y2="20.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function NewIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <G id="ng"/>
      <rect width="32" height="32" rx="10" fill="url(#ng)"/>
      {/* Palette */}
      <ellipse cx="16" cy="17" rx="9" ry="7" fill="white" opacity="0.9"/>
      <circle cx="12" cy="14" r="2" fill="#ec4899"/>
      <circle cx="16" cy="13" r="2" fill="#f59e0b"/>
      <circle cx="20" cy="14" r="2" fill="#10b981"/>
      <circle cx="21" cy="18" r="2" fill="#3b82f6"/>
      {/* Brush */}
      <line x1="22" y1="8" x2="28" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="8" r="2.5" fill="#fde68a"/>
      <path d="M28 4l2 4-3-1z" fill="white" opacity="0.8"/>
    </svg>
  );
}

export function ImproveIcon({ size = 28, listening = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <G id="ig" c1={listening ? "#ef4444" : "#7c3aed"} c2={listening ? "#f97316" : "#a855f7"}/>
      {/* Speech bubble */}
      <path d="M4 6h20a2 2 0 012 2v10a2 2 0 01-2 2H16l-4 4v-4H6a2 2 0 01-2-2V8a2 2 0 012-2z"
        fill={`url(#ig)`}/>
      {/* Sparkle inside */}
      <path d="M14 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="white" opacity="0.9"/>
    </svg>
  );
}

export function VoiceModeIcon({ size = 36, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <G id="vmg" c1={active ? "#7c3aed" : "#d1d5db"} c2={active ? "#ec4899" : "#d1d5db"}/>
      <rect x="12" y="6" width="12" height="18" rx="6" fill={`url(#vmg)`}/>
      <path d="M8 20c0 5.523 4.477 10 10 10s10-4.477 10-10" stroke={`url(#vmg)`} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <line x1="18" y1="30" x2="18" y2="34" stroke={`url(#vmg)`} strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="13" y1="34" x2="23" y2="34" stroke={`url(#vmg)`} strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export function PhotoModeIcon({ size = 36, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <G id="pmg" c1={active ? "#7c3aed" : "#d1d5db"} c2={active ? "#ec4899" : "#d1d5db"}/>
      <rect x="3" y="10" width="30" height="22" rx="5" fill={`url(#pmg)`}/>
      <path d="M12 10l2.5-4.5h7L24 10" fill={`url(#pmg)`}/>
      <circle cx="18" cy="21" r="6" fill="white" opacity="0.25"/>
      <circle cx="18" cy="21" r="4" fill="white" opacity="0.85"/>
      <circle cx="18" cy="21" r="2" fill={active ? "#7c3aed" : "#9ca3af"}/>
      <circle cx="27" cy="15" r="1.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

export function BackIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M13 4l-6 6 6 6" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function CloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
}

export function CopyIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="7" y="7" width="10" height="10" rx="2" stroke="white" strokeWidth="1.8"/>
      <path d="M5 13H4a2 2 0 01-2-2V4a2 2 0 012-2h7a2 2 0 012 2v1" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
