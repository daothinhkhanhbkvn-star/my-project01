import { describe, it, expect } from 'vitest';
import { classify, computeSummary } from '../src/gpa.js';

describe('computeSummary', () => {
  it('trả về null khi chưa có môn nào', () => {
    expect(computeSummary([])).toBeNull();
  });

  it('tính GPA có trọng số theo tín chỉ', () => {
    const courses = [
      { credits: 3, score: 8.5 }, // A, 4.0
      { credits: 2, score: 6.0 }, // C, 2.0
    ];
    expect(computeSummary(courses)).toEqual({
      count: 2,
      totalCredits: 5,
      passedCredits: 5,
      gpa4: 3.2, // (12 + 4) / 5
      gpa10: 7.5, // (25.5 + 12) / 5
      classification: 'Giỏi',
    });
  });

  it('làm tròn GPA 2 chữ số thập phân', () => {
    const summary = computeSummary([
      { credits: 1, score: 8.5 },
      { credits: 1, score: 8.0 },
      { credits: 1, score: 7.0 },
    ]);
    expect(summary.gpa4).toBe(3.5); // 10.5 / 3
    expect(summary.gpa10).toBe(7.83); // 23.5 / 3 = 7.8333
  });

  it('làm tròn lên ở nửa đơn vị', () => {
    // gpa10 = (8.1 * 1 + 8.0 * 1) / 2 = 8.05
    expect(computeSummary([{ credits: 1, score: 8.1 }, { credits: 1, score: 8.0 }]).gpa10).toBe(8.05);
    // gpa10 = (1.0 * 7 + 0.1 * 1) / 8 = 0.8875 → 0.89
    expect(computeSummary([{ credits: 7, score: 1.0 }, { credits: 1, score: 0.1 }]).gpa10).toBe(0.89);
  });

  it('tín chỉ đạt chỉ tính môn có điểm ≥ 4.0', () => {
    const summary = computeSummary([
      { credits: 3, score: 4.0 },
      { credits: 2, score: 3.9 },
      { credits: 4, score: 9.0 },
    ]);
    expect(summary.totalCredits).toBe(9);
    expect(summary.passedCredits).toBe(7);
  });

  it('xếp loại theo GPA hệ 4 đã làm tròn', () => {
    // gpa4 = (4.0 * 2 + 3.5 * 1) / 3 = 3.8333 → 3.83
    expect(computeSummary([{ credits: 2, score: 9 }, { credits: 1, score: 8 }]).classification).toBe(
      'Xuất sắc',
    );
    // gpa4 = (4.0 * 9 + 0 * 1) / 10 = 3.6
    expect(computeSummary([{ credits: 9, score: 9 }, { credits: 1, score: 2 }]).classification).toBe(
      'Xuất sắc',
    );
  });
});

describe('classify', () => {
  it.each([
    [4.0, 'Xuất sắc'],
    [3.6, 'Xuất sắc'],
    [3.59, 'Giỏi'],
    [3.2, 'Giỏi'],
    [3.19, 'Khá'],
    [2.5, 'Khá'],
    [2.49, 'Trung bình'],
    [2.0, 'Trung bình'],
    [1.99, 'Yếu'],
    [0, 'Yếu'],
  ])('GPA %d → %s', (gpa4, expected) => {
    expect(classify(gpa4)).toBe(expected);
  });
});
