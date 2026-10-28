// How long a new fact stays on screen before it hides and she types it from memory (js/runner.js flash). Gersten et
// al. 2009: "a mathematics fact was presented briefly", the time "tailored to the student's performance (with less
// time as the student gained proficiency)"; one study used 1.3 seconds, the floor here. The start, the steps and the
// ceiling are chosen here, not from the research.

export const FLASH_START = 3000;
export const FLASH_FLOOR = 1300;
export const FLASH_CEIL = 4000;
const QUICKER = 200; // after a flash typed right first time
const SLOWER = 400;  // after a flash missed or shown again

// Her flash events replayed in order from FLASH_START.
export function flashMs(events) {
  let ms = FLASH_START;
  for (const e of events) {
    if (e.type !== 'flash') continue;
    ms = Math.min(FLASH_CEIL, Math.max(FLASH_FLOOR, ms + (e.firstTry ? -QUICKER : SLOWER)));
  }
  return ms;
}
