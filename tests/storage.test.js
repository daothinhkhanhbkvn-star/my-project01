import { describe, it, expect } from 'vitest';
import { STORAGE_KEY, loadCourses, saveCourses } from '../src/storage.js';

function createStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
  };
}

const throwingStorage = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

const course = { id: 'a1', name: 'Toán', credits: 3, score: 8.5 };

describe('STORAGE_KEY', () => {
  it('đúng key theo PRD', () => {
    expect(STORAGE_KEY).toBe('gpa-tracker:v1');
  });
});

describe('saveCourses / loadCourses', () => {
  it('lưu rồi đọc lại được đúng dữ liệu', () => {
    const storage = createStorage();
    expect(saveCourses(storage, [course])).toBe(true);
    expect(JSON.parse(storage.data[STORAGE_KEY])).toEqual([course]);
    expect(loadCourses(storage)).toEqual([course]);
  });

  it('saveCourses trả về false và không ném lỗi khi ghi thất bại', () => {
    expect(saveCourses(throwingStorage, [course])).toBe(false);
  });

  it('saveCourses không lỗi khi không có storage', () => {
    expect(() => saveCourses(null, [course])).not.toThrow();
  });
});

describe('loadCourses với dữ liệu hỏng', () => {
  it.each([
    ['chưa có dữ liệu', createStorage()],
    ['JSON hỏng', createStorage({ [STORAGE_KEY]: '{not json' })],
    ['không phải mảng', createStorage({ [STORAGE_KEY]: '{"a":1}' })],
    ['null', createStorage({ [STORAGE_KEY]: 'null' })],
    ['đọc storage ném lỗi', throwingStorage],
    ['không có storage', null],
  ])('trả về mảng rỗng khi %s', (_, storage) => {
    expect(loadCourses(storage)).toEqual([]);
  });

  it('bỏ qua các phần tử không hợp lệ, giữ lại phần tử hợp lệ', () => {
    const items = [
      course,
      null,
      42,
      { ...course, id: 'b1', name: '' },
      { ...course, id: 'b2', name: 'a'.repeat(101) },
      { ...course, id: 'b3', credits: 0 },
      { ...course, id: 'b4', credits: 2.5 },
      { ...course, id: 'b5', credits: '3' },
      { ...course, id: 'b6', score: 11 },
      { ...course, id: 'b7', score: -1 },
      { ...course, id: 'b8', score: '8' },
      { ...course, id: '' },
      { name: 'Không id', credits: 3, score: 8 },
      { ...course, id: 'ok2', name: 'Lý', score: 0 },
    ];
    const storage = createStorage({ [STORAGE_KEY]: JSON.stringify(items) });
    expect(loadCourses(storage)).toEqual([course, { ...course, id: 'ok2', name: 'Lý', score: 0 }]);
  });

  it('bỏ qua phần tử trùng id', () => {
    const storage = createStorage({
      [STORAGE_KEY]: JSON.stringify([course, { ...course, name: 'Trùng' }]),
    });
    expect(loadCourses(storage)).toEqual([course]);
  });

  it('chuẩn hoá tên và làm tròn điểm khi đọc', () => {
    const storage = createStorage({
      [STORAGE_KEY]: JSON.stringify([{ ...course, name: '  Toán  ', score: 8.46 }]),
    });
    expect(loadCourses(storage)).toEqual([{ ...course, score: 8.5 }]);
  });

  it('bỏ qua thuộc tính thừa', () => {
    const storage = createStorage({
      [STORAGE_KEY]: JSON.stringify([{ ...course, extra: 'x' }]),
    });
    expect(loadCourses(storage)).toEqual([course]);
  });
});
