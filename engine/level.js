// Her level within a skill's practice: easy items (small friendly numbers) or the usual ones. It moves only
// after a run of three right or three wrong, eases off after a win, and starts easier on a skill she has been
// finding hard (research 6.8, 6.14: "change it only after a run of three right or three wrong, ease off after
// each win"). The game alone decides it (decided 17 October 2026: no parent's corner).

export const RUN = 3;
const HARD_SHARE = 0.6; // under 60% right first time lately

// start: 'easy' | 'normal'.
export class Level {
  constructor({ start = 'normal' } = {}) {
    this.adaptive = start === 'easy';
    this.right = 0;
    this.wrong = 0;
  }

  get easy() {
    return this.adaptive;
  }

  record(firstTry) {
    if (firstTry) { this.right++; this.wrong = 0; } else { this.wrong++; this.right = 0; }
    if (this.wrong >= RUN) { this.adaptive = true; this.wrong = 0; }
    if (this.right >= RUN && this.adaptive) { this.adaptive = false; this.right = 0; }
  }
}

// Where a skill's practice starts today: easier straight after a win (her last practice round ended with a
// skill learned), or on a skill she has been getting under 60% right first time lately.
export function startLevel(events, st, skillId) {
  const lastPractice = [...events].reverse().find((e) => e.type === 'round' && e.part === 'practice');
  if (lastPractice?.reward === 'learned') return 'easy';
  const recent = st[skillId]?.recent || [];
  if (recent.length >= RUN && recent.filter(Boolean).length / recent.length < HARD_SHARE) return 'easy';
  return 'normal';
}
