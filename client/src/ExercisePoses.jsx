const ink = "#145c50";
const mint = "#3ddc97";

function Figure({ children, label }) {
  return (
    <div className="pose">
      <svg viewBox="0 0 160 160">{children}</svg>
      <span>{label}</span>
    </div>
  );
}

const POSES = {
  press: {
    start: (
      <>
        <rect x="40" y="118" width="80" height="10" rx="3" fill={mint} />
        <circle cx="80" cy="58" r="10" fill={ink} />
        <path d="M80 68v28M68 78H92M62 50h36" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 50h12M98 50h12" stroke={mint} strokeWidth="6" />
      </>
    ),
    end: (
      <>
        <rect x="40" y="118" width="80" height="10" rx="3" fill={mint} />
        <circle cx="80" cy="42" r="10" fill={ink} />
        <path d="M80 52v40M68 92H92M50 28h60" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M44 28h12M104 28h12" stroke={mint} strokeWidth="6" />
      </>
    ),
  },
  fly: {
    start: (
      <>
        <circle cx="80" cy="50" r="9" fill={ink} />
        <path d="M80 60v30M52 70 80 82l28-12" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="46" cy="68" r="6" fill={mint} />
        <circle cx="114" cy="68" r="6" fill={mint} />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="50" r="9" fill={ink} />
        <path d="M80 60v30M64 58h32M68 90h24" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="62" cy="52" r="6" fill={mint} />
        <circle cx="98" cy="52" r="6" fill={mint} />
      </>
    ),
  },
  pushup: {
    start: (
      <>
        <path d="M30 108h100" stroke={mint} strokeWidth="6" />
        <circle cx="42" cy="70" r="8" fill={ink} />
        <path d="M48 76 92 92 128 86M48 76 40 108M92 92 86 108" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <path d="M30 108h100" stroke={mint} strokeWidth="6" />
        <circle cx="48" cy="50" r="8" fill={ink} />
        <path d="M54 56 98 70 132 66M54 56 48 108M98 70 92 108" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  pulldown: {
    start: (
      <>
        <path d="M40 28h80" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="78" r="9" fill={ink} />
        <path d="M48 28v18M112 28v18M80 88v28M68 118h24" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <path d="M40 28h80" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="58" r="9" fill={ink} />
        <path d="M52 28 68 62M108 28 92 62M80 68v36M66 110h28" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  pullup: {
    start: (
      <>
        <path d="M36 24h88" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="92" r="9" fill={ink} />
        <path d="M48 24v28M112 24v28M80 102v22" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <path d="M36 24h88" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="52" r="9" fill={ink} />
        <path d="M50 24 68 48M110 24 92 48M80 62v40" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  row: {
    start: (
      <>
        <circle cx="52" cy="46" r="8" fill={ink} />
        <path d="M58 52 100 78 128 70M100 78 96 118" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="132" cy="68" r="6" fill={mint} />
      </>
    ),
    end: (
      <>
        <circle cx="52" cy="46" r="8" fill={ink} />
        <path d="M58 52 96 70 92 52M96 70 96 118" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="90" cy="48" r="6" fill={mint} />
      </>
    ),
  },
  hinge: {
    start: (
      <>
        <circle cx="86" cy="36" r="8" fill={ink} />
        <path d="M86 44v28l-18 40M86 72 118 108M70 72h28" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="32" r="8" fill={ink} />
        <path d="M80 40v50M64 128l16-38 16 38" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  ohp: {
    start: (
      <>
        <circle cx="80" cy="58" r="9" fill={ink} />
        <path d="M80 68v36M64 116h32M56 58h48" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M48 58h10M102 58h10" stroke={mint} strokeWidth="6" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="50" r="9" fill={ink} />
        <path d="M80 60v44M64 116h32M50 22h60" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M42 22h10M108 22h10" stroke={mint} strokeWidth="6" />
      </>
    ),
  },
  raise: {
    start: (
      <>
        <circle cx="80" cy="40" r="8" fill={ink} />
        <path d="M80 48v40M64 120l16-32 16 32M62 78h36" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="40" r="8" fill={ink} />
        <path d="M80 48v40M64 120l16-32 16 32M40 52h80" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="36" cy="52" r="5" fill={mint} /><circle cx="124" cy="52" r="5" fill={mint} />
      </>
    ),
  },
  shrug: {
    start: (
      <>
        <circle cx="80" cy="48" r="8" fill={ink} />
        <path d="M80 56v40M64 124l16-28 16 28M54 78h52" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="36" r="8" fill={ink} />
        <path d="M80 44v50M64 124l16-30 16 30M54 58h52" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  curl: {
    start: (
      <>
        <circle cx="80" cy="36" r="8" fill={ink} />
        <path d="M80 44v48M64 124l16-32 16 32M68 92 52 116M92 92l16 24" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="48" cy="120" r="5" fill={mint} /><circle cx="112" cy="120" r="5" fill={mint} />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="36" r="8" fill={ink} />
        <path d="M80 44v48M64 124l16-32 16 32M70 72h-8M90 72h8" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="58" cy="68" r="5" fill={mint} /><circle cx="102" cy="68" r="5" fill={mint} />
      </>
    ),
  },
  pushdown: {
    start: (
      <>
        <path d="M70 20h20" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="58" r="8" fill={ink} />
        <path d="M80 28v22M80 66v30M64 124l16-28 16 28M62 58h36" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <path d="M70 20h20" stroke={mint} strokeWidth="6" />
        <circle cx="80" cy="50" r="8" fill={ink} />
        <path d="M80 28v14M80 58v40M64 124l16-28 16 28M62 98h36" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  extension: {
    start: (
      <>
        <circle cx="80" cy="70" r="8" fill={ink} />
        <path d="M80 48v14M80 78v28M66 128h28M72 40h16" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="28" r="6" fill={mint} />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="70" r="8" fill={ink} />
        <path d="M80 40v22M80 78v28M66 128h28" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="28" r="6" fill={mint} />
      </>
    ),
  },
  squat: {
    start: (
      <>
        <circle cx="80" cy="28" r="8" fill={ink} />
        <path d="M80 36v34M58 118l22-48 22 48M52 36h56" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="48" r="8" fill={ink} />
        <path d="M80 56v22M56 118l24-40 24 40M50 56h60" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  lunge: {
    start: (
      <>
        <circle cx="80" cy="30" r="8" fill={ink} />
        <path d="M80 38v40M80 78 58 122M80 78l28 20 8 24" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="74" cy="36" r="8" fill={ink} />
        <path d="M74 44v28M52 122 74 72l40 18M114 90v32" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  calf: {
    start: (
      <>
        <circle cx="80" cy="28" r="8" fill={ink} />
        <path d="M80 36v70M64 128h32" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 132h60" stroke={mint} strokeWidth="5" />
      </>
    ),
    end: (
      <>
        <circle cx="80" cy="22" r="8" fill={ink} />
        <path d="M80 30v64M70 118l10-16 10 16" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 132h60" stroke={mint} strokeWidth="5" />
      </>
    ),
  },
  thrust: {
    start: (
      <>
        <rect x="36" y="78" width="36" height="12" rx="3" fill={mint} />
        <circle cx="92" cy="86" r="8" fill={ink} />
        <path d="M84 88 48 92M92 94 70 128M92 94l28 10" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <rect x="36" y="70" width="36" height="12" rx="3" fill={mint} />
        <circle cx="104" cy="58" r="8" fill={ink} />
        <path d="M96 62 48 76M104 66 84 118M104 66l30 4" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  cardio: {
    start: (
      <>
        <circle cx="70" cy="36" r="8" fill={ink} />
        <path d="M70 44 86 78 58 122M86 78l34 8M86 78l18 36" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
    end: (
      <>
        <circle cx="90" cy="34" r="8" fill={ink} />
        <path d="M90 42 74 80 108 118M74 80 48 70M74 80 52 118" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
};

export function ExercisePoses({ pose = "press" }) {
  const frames = POSES[pose] || POSES.press;
  return (
    <div className="pose-pair">
      <Figure label="Starting position">{frames.start}</Figure>
      <div style={{ textAlign: "center", color: "var(--teal)", fontWeight: 800 }}>→</div>
      <Figure label="Ending position">{frames.end}</Figure>
    </div>
  );
}
