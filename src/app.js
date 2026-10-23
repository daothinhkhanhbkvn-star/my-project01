import { validateCourse } from './validation.js';
import { convertScore } from './grade.js';
import { computeSummary } from './gpa.js';
import { getDefaultStorage, loadCourses, saveCourses } from './storage.js';

const FIELDS = ['name', 'credits', 'score'];

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function initApp(root, { storage = getDefaultStorage() } = {}) {
  const state = { courses: loadCourses(storage), editingId: null };

  root.innerHTML = `
    <main class="container">
      <h1>GPA Tracker</h1>
      <p class="subtitle">Tính điểm trung bình tích lũy hệ 4 và hệ 10</p>

      <section class="card">
        <h2 id="form-title">Thêm môn học</h2>
        <form id="course-form" novalidate>
          <div class="field">
            <label for="name">Tên môn</label>
            <input id="name" name="name" type="text" autocomplete="off" />
            <p class="error" id="name-error" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="credits">Số tín chỉ</label>
            <input id="credits" name="credits" type="text" inputmode="numeric" autocomplete="off" />
            <p class="error" id="credits-error" aria-live="polite"></p>
          </div>
          <div class="field">
            <label for="score">Điểm hệ 10</label>
            <input id="score" name="score" type="text" inputmode="decimal" autocomplete="off" />
            <p class="error" id="score-error" aria-live="polite"></p>
          </div>
          <div class="form-actions">
            <button type="submit" id="submit-btn">Thêm môn</button>
            <button type="button" id="cancel-btn" class="secondary" hidden>Huỷ</button>
          </div>
        </form>
      </section>

      <section class="card">
        <h2>Kết quả</h2>
        <dl class="summary" id="summary">
          <div class="stat"><dt>Tổng số môn</dt><dd data-stat="count">—</dd></div>
          <div class="stat"><dt>Tổng tín chỉ</dt><dd data-stat="totalCredits">—</dd></div>
          <div class="stat"><dt>Tín chỉ đạt</dt><dd data-stat="passedCredits">—</dd></div>
          <div class="stat highlight"><dt>GPA hệ 4</dt><dd data-stat="gpa4">—</dd></div>
          <div class="stat highlight"><dt>GPA hệ 10</dt><dd data-stat="gpa10">—</dd></div>
          <div class="stat highlight"><dt>Xếp loại</dt><dd data-stat="classification">—</dd></div>
        </dl>
        <p class="hint" id="summary-hint">Hãy thêm môn học đầu tiên</p>
      </section>

      <section class="card">
        <div class="card-header">
          <h2>Danh sách môn học</h2>
          <button type="button" id="clear-all-btn" class="small danger">Xoá tất cả</button>
        </div>
        <div class="table-wrap">
          <table id="course-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên môn</th>
                <th>Tín chỉ</th>
                <th>Điểm hệ 10</th>
                <th>Điểm chữ</th>
                <th>Hệ 4</th>
                <th><span class="visually-hidden">Thao tác</span></th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
        <p class="empty" id="empty-message">Chưa có môn học nào.</p>
      </section>
    </main>
  `;

  const form = root.querySelector('#course-form');
  const tbody = root.querySelector('#course-table tbody');
  const emptyMessage = root.querySelector('#empty-message');
  const summaryHint = root.querySelector('#summary-hint');
  const formTitle = root.querySelector('#form-title');
  const submitBtn = root.querySelector('#submit-btn');
  const cancelBtn = root.querySelector('#cancel-btn');
  const clearAllBtn = root.querySelector('#clear-all-btn');

  function showErrors(errors) {
    for (const field of FIELDS) {
      const input = form.elements[field];
      const message = errors[field] ?? '';
      root.querySelector(`#${field}-error`).textContent = message;
      input.classList.toggle('invalid', message !== '');
      input.setAttribute('aria-invalid', String(message !== ''));
    }
  }

  function renderTable() {
    tbody.replaceChildren(
      ...state.courses.map((course, index) => {
        const { letter, point } = convertScore(course.score);
        const row = document.createElement('tr');
        row.classList.toggle('editing', course.id === state.editingId);
        const cells = [
          index + 1,
          course.name,
          course.credits,
          course.score.toFixed(1),
          letter,
          point.toFixed(1),
        ];
        for (const text of cells) {
          const cell = document.createElement('td');
          cell.textContent = text;
          row.append(cell);
        }
        const actions = document.createElement('td');
        actions.className = 'actions';
        for (const [action, label] of [
          ['edit', 'Sửa'],
          ['delete', 'Xoá'],
        ]) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = action === 'delete' ? 'small danger' : 'small secondary';
          button.dataset.action = action;
          button.dataset.id = course.id;
          button.textContent = label;
          actions.append(button);
        }
        row.append(actions);
        return row;
      }),
    );
    emptyMessage.hidden = state.courses.length > 0;
    clearAllBtn.disabled = state.courses.length === 0;
  }

  function renderSummary() {
    const summary = computeSummary(state.courses);
    const display = summary && {
      ...summary,
      gpa4: summary.gpa4.toFixed(2),
      gpa10: summary.gpa10.toFixed(2),
    };
    for (const element of root.querySelectorAll('[data-stat]')) {
      element.textContent = display ? display[element.dataset.stat] : '—';
    }
    summaryHint.hidden = summary !== null;
  }

  function render() {
    renderTable();
    renderSummary();
  }

  function commit() {
    saveCourses(storage, state.courses);
    render();
  }

  function startEditing(course) {
    state.editingId = course.id;
    form.elements.name.value = course.name;
    form.elements.credits.value = String(course.credits);
    form.elements.score.value = String(course.score);
    showErrors({});
    formTitle.textContent = 'Sửa môn học';
    submitBtn.textContent = 'Lưu';
    cancelBtn.hidden = false;
    renderTable();
    form.elements.name.focus();
  }

  function stopEditing() {
    state.editingId = null;
    form.reset();
    showErrors({});
    formTitle.textContent = 'Thêm môn học';
    submitBtn.textContent = 'Thêm môn';
    cancelBtn.hidden = true;
  }

  function deleteCourse(course) {
    if (!window.confirm(`Xoá môn "${course.name}"?`)) return;
    state.courses = state.courses.filter((item) => item.id !== course.id);
    if (state.editingId === course.id) stopEditing();
    commit();
  }

  tbody.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const course = state.courses.find((item) => item.id === button.dataset.id);
    if (!course) return;
    if (button.dataset.action === 'edit') startEditing(course);
    else deleteCourse(course);
  });

  clearAllBtn.addEventListener('click', () => {
    if (state.courses.length === 0) return;
    if (!window.confirm('Xoá toàn bộ môn học?')) return;
    state.courses = [];
    if (state.editingId) stopEditing();
    commit();
  });

  cancelBtn.addEventListener('click', () => {
    stopEditing();
    renderTable();
    form.elements.name.focus();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = validateCourse({
      name: form.elements.name.value,
      credits: form.elements.credits.value,
      score: form.elements.score.value,
    });
    showErrors(result.errors);
    if (!result.valid) {
      form.elements[FIELDS.find((field) => result.errors[field])].focus();
      return;
    }

    if (state.editingId) {
      state.courses = state.courses.map((course) =>
        course.id === state.editingId ? { ...course, ...result.value } : course,
      );
      stopEditing();
    } else {
      state.courses.push({ id: createId(), ...result.value });
      form.reset();
    }
    commit();
    form.elements.name.focus();
  });

  render();
  return state;
}
