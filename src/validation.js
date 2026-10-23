export const NAME_MAX_LENGTH = 100;

export function validateCourse({ name = '', credits = '', score = '' }) {
  const errors = {};

  const trimmedName = String(name).trim();
  if (trimmedName === '') {
    errors.name = 'Vui lòng nhập tên môn.';
  } else if (trimmedName.length > NAME_MAX_LENGTH) {
    errors.name = `Tên môn tối đa ${NAME_MAX_LENGTH} ký tự.`;
  }

  const creditsText = String(credits).trim();
  const creditsValue = Number(creditsText);
  if (creditsText === '') {
    errors.credits = 'Vui lòng nhập số tín chỉ.';
  } else if (!/^\d+$/.test(creditsText) || creditsValue < 1 || creditsValue > 10) {
    errors.credits = 'Số tín chỉ phải là số nguyên từ 1 đến 10.';
  }

  const scoreText = String(score).trim().replace(',', '.');
  const scoreValue = Number(scoreText);
  if (scoreText === '') {
    errors.score = 'Vui lòng nhập điểm.';
  } else if (!/^\d+(\.\d+)?$/.test(scoreText) || scoreValue > 10) {
    errors.score = 'Điểm phải là số từ 0 đến 10.';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors,
    value: {
      name: trimmedName,
      credits: creditsValue,
      score: Math.round(scoreValue * 10) / 10,
    },
  };
}
