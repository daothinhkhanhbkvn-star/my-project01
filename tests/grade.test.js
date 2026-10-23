import { describe, it, expect } from 'vitest';
import { convertScore } from '../src/grade.js';

describe('convertScore', () => {
  it.each([
    [10, 'A', 4.0],
    [8.5, 'A', 4.0],
    [8.4, 'B+', 3.5],
    [8.0, 'B+', 3.5],
    [7.9, 'B', 3.0],
    [7.0, 'B', 3.0],
    [6.9, 'C+', 2.5],
    [6.5, 'C+', 2.5],
    [6.4, 'C', 2.0],
    [5.5, 'C', 2.0],
    [5.4, 'D+', 1.5],
    [5.0, 'D+', 1.5],
    [4.9, 'D', 1.0],
    [4.0, 'D', 1.0],
    [3.9, 'F', 0.0],
    [0, 'F', 0.0],
  ])('điểm %d → %s / %d', (score, letter, point) => {
    expect(convertScore(score)).toEqual({ letter, point });
  });
});
