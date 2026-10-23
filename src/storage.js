import { NAME_MAX_LENGTH } from './validation.js';

export const STORAGE_KEY = 'gpa-tracker:v1';

// Truy cập localStorage có thể ném lỗi (chế độ riêng tư, bị chặn cookie...)
export function getDefaultStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidCourse(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    item.id !== '' &&
    typeof item.name === 'string' &&
    item.name.trim() !== '' &&
    item.name.trim().length <= NAME_MAX_LENGTH &&
    Number.isInteger(item.credits) &&
    item.credits >= 1 &&
    item.credits <= 10 &&
    typeof item.score === 'number' &&
    Number.isFinite(item.score) &&
    item.score >= 0 &&
    item.score <= 10
  );
}

export function loadCourses(storage) {
  let parsed;
  try {
    parsed = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null');
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seenIds = new Set();
  const courses = [];
  for (const item of parsed) {
    if (!isValidCourse(item) || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    courses.push({
      id: item.id,
      name: item.name.trim(),
      credits: item.credits,
      score: Math.round(item.score * 10) / 10,
    });
  }
  return courses;
}

export function saveCourses(storage, courses) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(courses));
    return true;
  } catch {
    return false;
  }
}
