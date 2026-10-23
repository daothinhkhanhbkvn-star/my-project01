// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initApp } from '../src/app.js';
import { STORAGE_KEY } from '../src/storage.js';

let root;

function fillAndSubmit({ name = '', credits = '', score = '' }) {
  root.querySelector('#name').value = name;
  root.querySelector('#credits').value = credits;
  root.querySelector('#score').value = score;
  root.querySelector('#course-form').requestSubmit();
}

function rows() {
  return [...root.querySelectorAll('#course-table tbody tr')].map((row) =>
    [...row.cells].filter((cell) => !cell.classList.contains('actions')).map((cell) => cell.textContent),
  );
}

function mount(options) {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app');
  initApp(root, options);
}

beforeEach(() => {
  localStorage.clear();
  mount();
});

describe('F1 - Thêm môn học', () => {
  it('ban đầu bảng rỗng và hiển thị thông báo', () => {
    expect(rows()).toEqual([]);
    expect(root.querySelector('#empty-message').hidden).toBe(false);
  });

  it('thêm môn hợp lệ vào bảng', () => {
    fillAndSubmit({ name: ' Toán ', credits: '3', score: '8,5' });
    expect(rows()).toEqual([['1', 'Toán', '3', '8.5', 'A', '4.0']]);
    expect(root.querySelector('#empty-message').hidden).toBe(true);
  });

  it('xoá trắng form và đặt con trỏ vào ô Tên môn sau khi thêm', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    for (const id of ['name', 'credits', 'score']) {
      expect(root.querySelector(`#${id}`).value).toBe('');
    }
    expect(document.activeElement).toBe(root.querySelector('#name'));
  });

  it('đánh số thứ tự theo thứ tự thêm', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    fillAndSubmit({ name: 'Lý', credits: '2', score: '6.75' });
    expect(rows()).toEqual([
      ['1', 'Toán', '3', '8.0', 'B+', '3.5'],
      ['2', 'Lý', '2', '6.8', 'C+', '2.5'],
    ]);
  });

  it('hiển thị lỗi dưới từng ô và không thêm khi dữ liệu sai', () => {
    fillAndSubmit({ name: '', credits: '11', score: 'abc' });
    expect(rows()).toEqual([]);
    expect(root.querySelector('#name-error').textContent).toBe('Vui lòng nhập tên môn.');
    expect(root.querySelector('#credits-error').textContent).toBe(
      'Số tín chỉ phải là số nguyên từ 1 đến 10.',
    );
    expect(root.querySelector('#score-error').textContent).toBe('Điểm phải là số từ 0 đến 10.');
    expect(root.querySelector('#name').classList.contains('invalid')).toBe(true);
  });

  it('giữ nguyên dữ liệu đã nhập và focus vào ô lỗi đầu tiên', () => {
    fillAndSubmit({ name: 'Toán', credits: '0', score: '8' });
    expect(root.querySelector('#name').value).toBe('Toán');
    expect(root.querySelector('#score').value).toBe('8');
    expect(document.activeElement).toBe(root.querySelector('#credits'));
  });

  it('xoá thông báo lỗi sau khi nhập lại hợp lệ', () => {
    fillAndSubmit({ name: '', credits: '3', score: '8' });
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    expect(root.querySelector('#name-error').textContent).toBe('');
    expect(root.querySelector('#name').classList.contains('invalid')).toBe(false);
  });

  it('hiển thị tên môn dạng văn bản, không chèn HTML', () => {
    fillAndSubmit({ name: '<b>x</b>', credits: '3', score: '8' });
    expect(rows()[0][1]).toBe('<b>x</b>');
    expect(root.querySelector('#course-table tbody b')).toBeNull();
  });
});

describe('F2 - Quy đổi điểm', () => {
  it.each([
    ['9', 'A', '4.0'],
    ['8,45', 'A', '4.0'],
    ['8.44', 'B+', '3.5'],
    ['3.95', 'D', '1.0'],
    ['3.94', 'F', '0.0'],
  ])('điểm %s hiển thị %s / %s trên bảng', (score, letter, point) => {
    fillAndSubmit({ name: 'Toán', credits: '3', score });
    expect(rows()[0].slice(4)).toEqual([letter, point]);
  });
});

function stats() {
  return Object.fromEntries(
    [...root.querySelectorAll('[data-stat]')].map((el) => [el.dataset.stat, el.textContent]),
  );
}

describe('F3 - Tính GPA và xếp loại', () => {
  it('chưa có môn: hiển thị "—" và dòng hướng dẫn', () => {
    expect(Object.values(stats())).toEqual(Array(6).fill('—'));
    const hint = root.querySelector('#summary-hint');
    expect(hint.textContent).toBe('Hãy thêm môn học đầu tiên');
    expect(hint.hidden).toBe(false);
  });

  it('cập nhật kết quả sau mỗi lần thêm môn', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8.5' });
    expect(stats()).toEqual({
      count: '1',
      totalCredits: '3',
      passedCredits: '3',
      gpa4: '4.00',
      gpa10: '8.50',
      classification: 'Xuất sắc',
    });
    expect(root.querySelector('#summary-hint').hidden).toBe(true);

    fillAndSubmit({ name: 'Lý', credits: '2', score: '3' });
    expect(stats()).toEqual({
      count: '2',
      totalCredits: '5',
      passedCredits: '3',
      gpa4: '2.40', // 12 / 5
      gpa10: '6.30', // (25.5 + 6) / 5
      classification: 'Trung bình',
    });
  });
});

function clickRowButton(rowIndex, action) {
  root
    .querySelectorAll('#course-table tbody tr')
    [rowIndex].querySelector(`button[data-action="${action}"]`)
    .click();
}

describe('F4 - Sửa môn học', () => {
  beforeEach(() => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8.5' });
    fillAndSubmit({ name: 'Lý', credits: '2', score: '6' });
  });

  it('mỗi dòng có nút Sửa và Xoá', () => {
    const buttons = root.querySelectorAll('#course-table tbody tr')[0].querySelectorAll('button');
    expect([...buttons].map((b) => b.textContent)).toEqual(['Sửa', 'Xoá']);
  });

  it('nhấn Sửa đưa dữ liệu lên form và đổi nút thành "Lưu"', () => {
    clickRowButton(1, 'edit');
    expect(root.querySelector('#name').value).toBe('Lý');
    expect(root.querySelector('#credits').value).toBe('2');
    expect(root.querySelector('#score').value).toBe('6');
    expect(root.querySelector('#submit-btn').textContent).toBe('Lưu');
    expect(root.querySelector('#form-title').textContent).toBe('Sửa môn học');
    expect(root.querySelector('#cancel-btn').hidden).toBe(false);
    expect(document.activeElement).toBe(root.querySelector('#name'));
  });

  it('lưu cập nhật đúng dòng, giữ thứ tự và quay về chế độ thêm', () => {
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán cao cấp', credits: '4', score: '7' });
    expect(rows()).toEqual([
      ['1', 'Toán cao cấp', '4', '7.0', 'B', '3.0'],
      ['2', 'Lý', '2', '6.0', 'C', '2.0'],
    ]);
    expect(root.querySelector('#submit-btn').textContent).toBe('Thêm môn');
    expect(root.querySelector('#cancel-btn').hidden).toBe(true);
    expect(root.querySelector('#name').value).toBe('');
  });

  it('tính lại GPA sau khi sửa', () => {
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán', credits: '3', score: '3' });
    expect(stats().passedCredits).toBe('2');
    expect(stats().gpa4).toBe('0.80'); // (0 * 3 + 2 * 2) / 5
  });

  it('dùng cùng validation với F1 và vẫn ở chế độ sửa khi lỗi', () => {
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán', credits: '12', score: '8' });
    expect(root.querySelector('#credits-error').textContent).toBe(
      'Số tín chỉ phải là số nguyên từ 1 đến 10.',
    );
    expect(root.querySelector('#submit-btn').textContent).toBe('Lưu');
    expect(rows()[0][2]).toBe('3');
  });

  it('nút Huỷ thoát chế độ sửa mà không thay đổi dữ liệu', () => {
    clickRowButton(0, 'edit');
    root.querySelector('#name').value = 'Đổi tên';
    root.querySelector('#cancel-btn').click();
    expect(rows()[0][1]).toBe('Toán');
    expect(root.querySelector('#name').value).toBe('');
    expect(root.querySelector('#submit-btn').textContent).toBe('Thêm môn');
  });

  it('sau khi sửa xong, thêm môn mới vẫn thêm dòng mới', () => {
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán', credits: '3', score: '9' });
    fillAndSubmit({ name: 'Hoá', credits: '2', score: '7' });
    expect(rows().map((row) => row[1])).toEqual(['Toán', 'Lý', 'Hoá']);
  });
});

describe('F4 - Xoá môn học', () => {
  let confirmSpy;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm');
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8.5' });
    fillAndSubmit({ name: 'Lý', credits: '2', score: '6' });
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it('hỏi xác nhận kèm tên môn và xoá khi đồng ý', () => {
    confirmSpy.mockReturnValue(true);
    clickRowButton(0, 'delete');
    expect(confirmSpy).toHaveBeenCalledWith('Xoá môn "Toán"?');
    expect(rows()).toEqual([['1', 'Lý', '2', '6.0', 'C', '2.0']]);
    expect(stats().count).toBe('1');
  });

  it('không xoá khi huỷ xác nhận', () => {
    confirmSpy.mockReturnValue(false);
    clickRowButton(0, 'delete');
    expect(rows()).toHaveLength(2);
  });

  it('xoá hết môn thì quay về trạng thái rỗng', () => {
    confirmSpy.mockReturnValue(true);
    clickRowButton(0, 'delete');
    clickRowButton(0, 'delete');
    expect(rows()).toEqual([]);
    expect(stats().gpa4).toBe('—');
    expect(root.querySelector('#summary-hint').hidden).toBe(false);
  });

  it('xoá môn đang sửa thì thoát chế độ sửa', () => {
    confirmSpy.mockReturnValue(true);
    clickRowButton(1, 'edit');
    clickRowButton(1, 'delete');
    expect(root.querySelector('#submit-btn').textContent).toBe('Thêm môn');
    expect(root.querySelector('#name').value).toBe('');
  });

  it('xoá môn khác khi đang sửa thì vẫn giữ chế độ sửa', () => {
    confirmSpy.mockReturnValue(true);
    clickRowButton(1, 'edit');
    clickRowButton(0, 'delete');
    expect(root.querySelector('#submit-btn').textContent).toBe('Lưu');
    fillAndSubmit({ name: 'Lý', credits: '2', score: '9' });
    expect(rows()).toEqual([['1', 'Lý', '2', '9.0', 'A', '4.0']]);
  });
});

describe('F5 - Lưu dữ liệu', () => {
  let confirmSpy;

  beforeEach(() => {
    confirmSpy = vi.spyOn(window, 'confirm');
  });

  afterEach(() => {
    confirmSpy.mockRestore();
  });

  function saved() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }

  it('lưu vào localStorage sau khi thêm môn', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8,5' });
    expect(saved()).toEqual([expect.objectContaining({ name: 'Toán', credits: 3, score: 8.5 })]);
  });

  it('lưu sau khi sửa và xoá', () => {
    confirmSpy.mockReturnValue(true);
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    fillAndSubmit({ name: 'Lý', credits: '2', score: '6' });
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán A', credits: '3', score: '9' });
    expect(saved().map((c) => c.name)).toEqual(['Toán A', 'Lý']);
    clickRowButton(1, 'delete');
    expect(saved().map((c) => c.name)).toEqual(['Toán A']);
  });

  it('tải lại trang không mất dữ liệu', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8.5' });
    fillAndSubmit({ name: 'Lý', credits: '2', score: '6' });
    mount();
    expect(rows()).toEqual([
      ['1', 'Toán', '3', '8.5', 'A', '4.0'],
      ['2', 'Lý', '2', '6.0', 'C', '2.0'],
    ]);
    expect(stats().gpa4).toBe('3.20');
  });

  it('sửa được môn đã tải lại từ localStorage', () => {
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8.5' });
    mount();
    clickRowButton(0, 'edit');
    fillAndSubmit({ name: 'Toán', credits: '3', score: '5' });
    expect(rows()).toHaveLength(1);
    expect(rows()[0][3]).toBe('5.0');
  });

  it('dữ liệu hỏng: khởi tạo danh sách rỗng, trang vẫn hiển thị', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    mount();
    expect(rows()).toEqual([]);
    expect(root.querySelector('#course-form')).not.toBeNull();
    expect(root.querySelector('#summary-hint').hidden).toBe(false);
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    expect(saved()).toHaveLength(1);
  });

  it('storage lỗi khi đọc/ghi: ứng dụng vẫn chạy', () => {
    const storage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    mount({ storage });
    fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
    expect(rows()).toHaveLength(1);
  });

  describe('Xoá tất cả', () => {
    it('bị vô hiệu hoá khi danh sách rỗng', () => {
      expect(root.querySelector('#clear-all-btn').disabled).toBe(true);
      fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
      expect(root.querySelector('#clear-all-btn').disabled).toBe(false);
    });

    it('xoá toàn bộ khi xác nhận và lưu danh sách rỗng', () => {
      confirmSpy.mockReturnValue(true);
      fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
      fillAndSubmit({ name: 'Lý', credits: '2', score: '6' });
      root.querySelector('#clear-all-btn').click();
      expect(confirmSpy).toHaveBeenCalledWith('Xoá toàn bộ môn học?');
      expect(rows()).toEqual([]);
      expect(saved()).toEqual([]);
      expect(stats().count).toBe('—');
      mount();
      expect(rows()).toEqual([]);
    });

    it('không xoá khi huỷ xác nhận', () => {
      confirmSpy.mockReturnValue(false);
      fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
      root.querySelector('#clear-all-btn').click();
      expect(rows()).toHaveLength(1);
      expect(saved()).toHaveLength(1);
    });

    it('thoát chế độ sửa khi xoá tất cả', () => {
      confirmSpy.mockReturnValue(true);
      fillAndSubmit({ name: 'Toán', credits: '3', score: '8' });
      clickRowButton(0, 'edit');
      root.querySelector('#clear-all-btn').click();
      expect(root.querySelector('#submit-btn').textContent).toBe('Thêm môn');
      expect(root.querySelector('#name').value).toBe('');
    });
  });
});
