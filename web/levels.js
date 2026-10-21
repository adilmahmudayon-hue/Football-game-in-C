const MAX_LEVEL = 15;

// keeperStep = seconds per column (lower = faster), keeperRows = rows he covers
// vanish = 1: scored targets disappear, sway = goal speed in px/second (0 = still)
const LEVELS = [
  { shots: 3, target:  5, speed: 2, sweetMin: 35, sweetMax: 70, keeperStep: 0,    keeperRows: 0, vanish: 0, sway: 0 },
  { shots: 3, target:  7, speed: 3, sweetMin: 40, sweetMax: 70, keeperStep: 0,    keeperRows: 0, vanish: 0, sway: 0 },
  { shots: 3, target:  9, speed: 3, sweetMin: 45, sweetMax: 70, keeperStep: 0,    keeperRows: 0, vanish: 0, sway: 0 },
  { shots: 3, target: 11, speed: 4, sweetMin: 50, sweetMax: 70, keeperStep: 0.50, keeperRows: 2, vanish: 0, sway: 0 },
  { shots: 3, target: 12, speed: 5, sweetMin: 55, sweetMax: 70, keeperStep: 0.44, keeperRows: 2, vanish: 0, sway: 0 },
  { shots: 3, target:  9, speed: 5, sweetMin: 58, sweetMax: 70, keeperStep: 0.40, keeperRows: 2, vanish: 1, sway: 0 },
  { shots: 3, target: 10, speed: 5, sweetMin: 60, sweetMax: 70, keeperStep: 0.36, keeperRows: 2, vanish: 1, sway: 0 },
  { shots: 3, target: 11, speed: 6, sweetMin: 62, sweetMax: 72, keeperStep: 0.32, keeperRows: 2, vanish: 1, sway: 0 },
  { shots: 3, target: 12, speed: 6, sweetMin: 64, sweetMax: 72, keeperStep: 0.28, keeperRows: 2, vanish: 1, sway: 0 },
  { shots: 3, target: 13, speed: 7, sweetMin: 64, sweetMax: 72, keeperStep: 0.24, keeperRows: 3, vanish: 1, sway: 0 },
  { shots: 3, target:  9, speed: 6, sweetMin: 64, sweetMax: 74, keeperStep: 0.22, keeperRows: 3, vanish: 1, sway: 20 },
  { shots: 3, target: 10, speed: 6, sweetMin: 64, sweetMax: 74, keeperStep: 0.20, keeperRows: 3, vanish: 1, sway: 28 },
  { shots: 3, target: 11, speed: 7, sweetMin: 66, sweetMax: 74, keeperStep: 0.18, keeperRows: 3, vanish: 1, sway: 36 },
  { shots: 3, target: 12, speed: 7, sweetMin: 66, sweetMax: 74, keeperStep: 0.16, keeperRows: 3, vanish: 1, sway: 45 },
  { shots: 3, target: 13, speed: 7, sweetMin: 68, sweetMax: 76, keeperStep: 0.14, keeperRows: 3, vanish: 1, sway: 55 },
];

function tierName(n) {
  if (n <= 3) return "Beginner";
  if (n <= 6) return "Easy";
  if (n <= 9) return "Medium";
  if (n <= 12) return "Hard";
  return "Pro";
}