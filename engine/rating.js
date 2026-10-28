// She rates her own work before she sees the result: at the end of a session, "How many do you think you got
// right first time?", in four plain bands, then her real score in the same bands. Over time her guess and the
// result should come closer, and the copy of her progress saved from Settings counts how close (engine/measures.js;
// research 7.3).

export const BANDS = [
  { id: 'all', text: 'All or nearly all', min: 0.9 },
  { id: 'most', text: 'Most', min: 0.6 },
  { id: 'half', text: 'About half', min: 0.4 },
  { id: 'few', text: 'Fewer than half', min: 0 },
];
export const RATE_FROM = 3; // no rating after only a couple of problems

export function bandOf(right, done) {
  const share = done ? right / done : 0;
  return BANDS.find((b) => share >= b.min).id;
}

const rank = (id) => BANDS.findIndex((b) => b.id === id);

// Her latest n ratings: spot on, under (she did better than she thought) and over.
export function ratingSummary(events, n = 10) {
  const ratings = events.filter((e) => e.type === 'rating').slice(-n);
  return {
    rated: ratings.length,
    spotOn: ratings.filter((e) => e.guess === e.band).length,
    under: ratings.filter((e) => rank(e.guess) > rank(e.band)).length,
    over: ratings.filter((e) => rank(e.guess) < rank(e.band)).length,
  };
}
