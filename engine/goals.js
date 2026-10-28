// What good looks like, shown before she starts, with her own best beside it (research 7.2: goals work only when she
// can see "when and how" she would know she had succeeded, and "her own past best is always on screen").
//   a new skill   opens with a worked example (js/runner.js worked)
//   the warm-up   good is right first time; her best warm-up beside it. No finished example: the warm-up is
//                 recall, and showing the answers first would undo it (research 5.1)
//   the sprint    good is her best or more; her best stays on screen while she sprints

// Her best warm-up so far, { right, done }: the most right first time out of one warm-up, a warm-up being a run of
// review answers with no other work or new session between them. Most right wins, so a warm-up left after two
// does not count as "2 of 2" (a full one is six, engine/session.js REVIEW_ITEMS); ties go to the shorter. Null before
// her first.
export function bestWarmUp(events) {
  let best = null;
  let run = null;
  const close = () => {
    if (run && (!best || run.right > best.right || (run.right === best.right && run.done < best.done))) best = run;
    run = null;
  };
  for (const e of events) {
    if (e.type === 'session') close();
    if (e.type !== 'answer') continue;
    if (e.phase !== 'review') { close(); continue; }
    run ??= { right: 0, done: 0 };
    run.done++;
    if (e.firstTry) run.right++;
  }
  close();
  return best;
}
