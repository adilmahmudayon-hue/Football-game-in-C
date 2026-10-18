const MAX_LEVEL = 15;

const LEVELS = [
  { shots: 3, target:  5, speed: 2, sweetMin: 35, sweetMax: 70 },
  { shots: 3, target:  7, speed: 3, sweetMin: 40, sweetMax: 70 },
  { shots: 3, target:  9, speed: 3, sweetMin: 45, sweetMax: 70 },
  { shots: 3, target: 11, speed: 4, sweetMin: 50, sweetMax: 70 },
  { shots: 3, target: 12, speed: 5, sweetMin: 55, sweetMax: 70 },
  { shots: 3, target:  9, speed: 5, sweetMin: 58, sweetMax: 70 },
  { shots: 3, target: 10, speed: 5, sweetMin: 60, sweetMax: 70 },
  { shots: 3, target: 11, speed: 6, sweetMin: 62, sweetMax: 72 },
  { shots: 3, target: 12, speed: 6, sweetMin: 64, sweetMax: 72 },
  { shots: 3, target: 13, speed: 7, sweetMin: 64, sweetMax: 72 },
  { shots: 3, target:  9, speed: 6, sweetMin: 64, sweetMax: 74 },
  { shots: 3, target: 10, speed: 6, sweetMin: 64, sweetMax: 74 },
  { shots: 3, target: 11, speed: 7, sweetMin: 66, sweetMax: 74 },
  { shots: 3, target: 12, speed: 7, sweetMin: 66, sweetMax: 74 },
  { shots: 3, target: 13, speed: 7, sweetMin: 68, sweetMax: 76 },
];

function tierName(n) {
  if (n <= 3) return "Beginner";
  if (n <= 6) return "Easy";
  if (n <= 9) return "Medium";
  if (n <= 12) return "Hard";
  return "Pro";
}