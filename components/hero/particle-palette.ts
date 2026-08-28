export type ParticleColor = {
  cssVar: string;
  weight: number;
};

export const PARTICLE_PALETTE: ParticleColor[] = [
  { cssVar: '--color-fg',             weight: 35 },
  { cssVar: '--color-signal-glow',    weight: 35 },
  { cssVar: '--color-fg-muted',       weight: 7.5 },
  { cssVar: '--color-fg-subtle',      weight: 7.5 },
  { cssVar: '--color-signal',         weight: 7.5 },
  { cssVar: '--color-signal-surface', weight: 7.5 },
];

const TOTAL_WEIGHT = PARTICLE_PALETTE.reduce((s, c) => s + c.weight, 0);
const FALLBACK = 'rgba(255, 255, 255, 0.4)';

let resolvedCache: string[] | null = null;

function resolvePalette(): string[] {
  if (resolvedCache) return resolvedCache;
  const styles = getComputedStyle(document.documentElement);
  resolvedCache = PARTICLE_PALETTE.map((p) => {
    const value = styles.getPropertyValue(p.cssVar).trim();
    return value || FALLBACK;
  });
  return resolvedCache;
}

export function invalidateParticlePaletteCache(): void {
  resolvedCache = null;
}

export function pickParticleColor(rand: number): string {
  const palette = resolvePalette();
  const r = rand * TOTAL_WEIGHT;
  let acc = 0;
  for (let i = 0; i < PARTICLE_PALETTE.length; i++) {
    acc += PARTICLE_PALETTE[i].weight;
    if (r < acc) return palette[i];
  }
  return palette[palette.length - 1];
}
