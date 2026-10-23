const GRADE_SCALE = [
  { min: 8.5, letter: 'A', point: 4.0 },
  { min: 8.0, letter: 'B+', point: 3.5 },
  { min: 7.0, letter: 'B', point: 3.0 },
  { min: 6.5, letter: 'C+', point: 2.5 },
  { min: 5.5, letter: 'C', point: 2.0 },
  { min: 5.0, letter: 'D+', point: 1.5 },
  { min: 4.0, letter: 'D', point: 1.0 },
  { min: 0, letter: 'F', point: 0.0 },
];

// score: điểm hệ 10 đã làm tròn 1 chữ số thập phân
export function convertScore(score) {
  const { letter, point } = GRADE_SCALE.find((grade) => score >= grade.min);
  return { letter, point };
}
