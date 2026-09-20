// Handgeschnittene Feldjournal-Stempel statt duenner Lucide-Liniensymbole:
// volle Tinten-Silhouette (fill="currentColor", faerbt sich also mit dem
// umgebenden Text/Zustand mit) plus 1-2 gravierte Aussparungen in Papierton.
// Bewusst nur fuer die Zustands-/Ressourcen-Symbole, die auch als grosse
// Stempel im Vorschau-Mockup gezeigt wurden — Werkzeugleisten (Karte, GM-
// Kampf-Tracker) bleiben vorerst bei Lucide, das ist eine spaetere Runde.

function IconBase({ size = 16, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export function IconShield({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M20 3 L31 7 L33 9 L32 20 C31 28 26 33 20 37 C14 33 9 28 8 20 L7 9 L9 7 Z" fill="currentColor" />
      <path d="M14 14 L18 24" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 15 L22 26" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconCoins({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M9 20 C9 14 13 10 18 10 C23 10 27 14 27 19 C27 25 23 29 17 29 C12 29 9 25 9 20 Z" fill="currentColor" />
      <path d="M20 24 C20 19 24 15 29 15 C33 15 35 19 34 23 C33 27 29 31 24 30 C21 29 20 27 20 24 Z" fill="currentColor" />
      <path d="M20 20 L26 26 M26 20 L20 26" stroke="var(--paper)" strokeWidth="1.4" strokeLinecap="round" />
    </IconBase>
  );
}

export function IconTriangleAlert({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M20 5 L36 31 L33 34 H7 L4 31 Z" fill="currentColor" />
      <path d="M21 12 L15 21 L19 21 L17 28 L25 18 L20 18 Z" fill="var(--paper)" />
    </IconBase>
  );
}

export function IconHeartCrack({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M20 34 C7 25 3 17 3 11 C3 6 7 3 12 3 C16 3 19 6 20 9 C21 6 24 3 28 3 C33 3 37 6 37 11 C37 17 33 25 20 34 Z" fill="currentColor" />
      <path d="M20 8 L16 16 L21 19 L15 29" fill="none" stroke="var(--paper)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function IconGhost({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M9 35 V16 C9 8 14 3 20 3 C26 3 31 8 31 16 V35 L26 30 L22 35 L18 30 L14 35 Z" fill="currentColor" />
      <circle cx="15.5" cy="17" r="2" fill="var(--paper)" />
      <circle cx="24.5" cy="17" r="2" fill="var(--paper)" />
    </IconBase>
  );
}

export function IconSwords({ size, ...rest }) {
  return (
    <IconBase size={size} {...rest}>
      <path d="M20 3 L23 6 L22 22 L27 27 L25 29 L20 26 L15 29 L13 27 L18 22 Z" fill="currentColor" />
      <line x1="20" y1="6" x2="20" y2="22" stroke="var(--paper)" strokeWidth="1.3" />
    </IconBase>
  );
}
