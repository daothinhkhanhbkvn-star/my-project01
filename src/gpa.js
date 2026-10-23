import { convertScore } from './grade.js';

export const PASS_SCORE = 4.0;

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function classify(gpa4) {
  if (gpa4 >= 3.6) return 'Xuất sắc';
  if (gpa4 >= 3.2) return 'Giỏi';
  if (gpa4 >= 2.5) return 'Khá';
  if (gpa4 >= 2.0) return 'Trung bình';
  return 'Yếu';
}

// Trả về null khi chưa có môn nào
export function computeSummary(courses) {
  if (courses.length === 0) return null;

  let totalCredits = 0;
  let passedCredits = 0;
  let weighted4 = 0;
  let weighted10 = 0;
  for (const { credits, score } of courses) {
    totalCredits += credits;
    if (score >= PASS_SCORE) passedCredits += credits;
    weighted4 += convertScore(score).point * credits;
    weighted10 += score * credits;
  }

  const gpa4 = round2(weighted4 / totalCredits);
  return {
    count: courses.length,
    totalCredits,
    passedCredits,
    gpa4,
    gpa10: round2(weighted10 / totalCredits),
    classification: classify(gpa4),
  };
}
