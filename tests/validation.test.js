import { describe, it, expect } from 'vitest';
import { validateCourse } from '../src/validation.js';

const valid = { name: 'Toán cao cấp', credits: '3', score: '8.5' };

describe('validateCourse', () => {
  it('chấp nhận dữ liệu hợp lệ', () => {
    expect(validateCourse(valid)).toEqual({
      valid: true,
      errors: {},
      value: { name: 'Toán cao cấp', credits: 3, score: 8.5 },
    });
  });

  describe('Tên môn', () => {
    it('bỏ khoảng trắng 2 đầu', () => {
      expect(validateCourse({ ...valid, name: '  Vật lý  ' }).value.name).toBe('Vật lý');
    });

    it.each(['', '   '])('báo lỗi khi để trống (%j)', (name) => {
      const result = validateCourse({ ...valid, name });
      expect(result.valid).toBe(false);
      expect(result.errors.name).toBe('Vui lòng nhập tên môn.');
    });

    it('chấp nhận đúng 100 ký tự', () => {
      expect(validateCourse({ ...valid, name: 'a'.repeat(100) }).valid).toBe(true);
    });

    it('báo lỗi khi quá 100 ký tự', () => {
      expect(validateCourse({ ...valid, name: 'a'.repeat(101) }).errors.name).toBe(
        'Tên môn tối đa 100 ký tự.',
      );
    });

    it('tính độ dài sau khi bỏ khoảng trắng', () => {
      expect(validateCourse({ ...valid, name: `  ${'a'.repeat(100)}  ` }).valid).toBe(true);
    });
  });

  describe('Số tín chỉ', () => {
    it.each(['1', '10', ' 4 '])('chấp nhận %j', (credits) => {
      expect(validateCourse({ ...valid, credits }).valid).toBe(true);
    });

    it('báo lỗi khi để trống', () => {
      expect(validateCourse({ ...valid, credits: '' }).errors.credits).toBe(
        'Vui lòng nhập số tín chỉ.',
      );
    });

    it.each(['0', '11', '2.5', '-1', 'abc', '3a', '1e1'])('báo lỗi với %j', (credits) => {
      expect(validateCourse({ ...valid, credits }).errors.credits).toBe(
        'Số tín chỉ phải là số nguyên từ 1 đến 10.',
      );
    });
  });

  describe('Điểm hệ 10', () => {
    it.each([
      ['0', 0],
      ['10', 10],
      ['8,5', 8.5],
      ['8.5', 8.5],
      ['7.25', 7.3],
      ['7.24', 7.2],
      ['9,96', 10],
      [' 6 ', 6],
    ])('chấp nhận %j và làm tròn thành %d', (score, expected) => {
      expect(validateCourse({ ...valid, score }).value.score).toBe(expected);
    });

    it('báo lỗi khi để trống', () => {
      expect(validateCourse({ ...valid, score: '' }).errors.score).toBe('Vui lòng nhập điểm.');
    });

    it.each(['-1', '10.1', '11', 'abc', '8,5,1', '8.', '.5', '1e1'])('báo lỗi với %j', (score) => {
      expect(validateCourse({ ...valid, score }).errors.score).toBe(
        'Điểm phải là số từ 0 đến 10.',
      );
    });
  });

  it('trả về lỗi của tất cả các ô cùng lúc', () => {
    const result = validateCourse({ name: '', credits: '0', score: 'x' });
    expect(Object.keys(result.errors).sort()).toEqual(['credits', 'name', 'score']);
    expect(result.value).toBeUndefined();
  });
});
