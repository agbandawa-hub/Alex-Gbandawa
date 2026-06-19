// GradeTrack SL — Calculator logic
// Handles dynamic course rows, GPA calculation, status determination,
// and saving completed semesters to localStorage history.

(function () {
  let rowCount = 0;
  const tableBody = document.getElementById('courseRows');
  const form = document.getElementById('calculatorForm');
  const resultCard = document.getElementById('resultCard');
  const addRowBtn = document.getElementById('addRowBtn');
  const semesterNameInput = document.getElementById('semesterName');
  const saveBtn = document.getElementById('saveSemesterBtn');

  function buildGradeOptions(selectedGrade) {
    return GRADE_SCALE.map(function (g) {
      const selected = g.grade === selectedGrade ? 'selected' : '';
      return '<option value="' + g.grade + '" ' + selected + '>' + g.grade + '</option>';
    }).join('');
  }

  function addRow(prefill) {
    rowCount += 1;
    const rowId = 'row-' + rowCount;
    const tr = document.createElement('tr');
    tr.id = rowId;

    const name = prefill && prefill.name ? prefill.name : '';
    const credit = prefill && prefill.credit ? prefill.credit : '';
    const grade = prefill && prefill.grade ? prefill.grade : 'A';

    tr.innerHTML =
      '<td class="col-name">' +
      '<label class="sr-only" for="' + rowId + '-name">Course name</label>' +
      '<input type="text" id="' + rowId + '-name" placeholder="e.g. Web Design 1" value="' + name + '" required>' +
      '</td>' +
      '<td class="col-credit">' +
      '<label class="sr-only" for="' + rowId + '-credit">Credit hours</label>' +
      '<input type="number" id="' + rowId + '-credit" min="1" max="6" step="1" placeholder="3" value="' + credit + '" required>' +
      '</td>' +
      '<td class="col-grade">' +
      '<label class="sr-only" for="' + rowId + '-grade">Grade</label>' +
      '<select id="' + rowId + '-grade">' + buildGradeOptions(grade) + '</select>' +
      '</td>' +
      '<td class="col-points" id="' + rowId + '-points">—</td>' +
      '<td class="col-remove">' +
      '<button type="button" class="remove-row-btn" aria-label="Remove course" data-row="' + rowId + '">&times;</button>' +
      '</td>';

    tableBody.appendChild(tr);

    const removeBtn = tr.querySelector('.remove-row-btn');
    removeBtn.addEventListener('click', function () {
      tr.remove();
      updateRowPointsPreview();
      if (tableBody.children.length === 0) {
        addRow();
      }
    });

    const creditInput = tr.querySelector('#' + rowId + '-credit');
    const gradeSelect = tr.querySelector('#' + rowId + '-grade');
    creditInput.addEventListener('input', function () { updateRowPointsPreview(rowId); });
    gradeSelect.addEventListener('change', function () { updateRowPointsPreview(rowId); });

    updateRowPointsPreview(rowId);
  }

  function updateRowPointsPreview(specificRowId) {
    const rows = specificRowId
      ? [document.getElementById(specificRowId)]
      : Array.from(tableBody.querySelectorAll('tr'));

    rows.forEach(function (tr) {
      if (!tr) return;
      const id = tr.id;
      const creditEl = document.getElementById(id + '-credit');
      const gradeEl = document.getElementById(id + '-grade');
      const pointsEl = document.getElementById(id + '-points');
      const credit = parseFloat(creditEl.value);
      const grade = gradeEl.value;
      if (!isNaN(credit) && credit > 0) {
        const points = (getPointsForGrade(grade) * credit).toFixed(2);
        pointsEl.textContent = points;
      } else {
        pointsEl.textContent = '—';
      }
    });
  }

  function collectCourses() {
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    const courses = [];
    for (const tr of rows) {
      const id = tr.id;
      const name = document.getElementById(id + '-name').value.trim();
      const credit = parseFloat(document.getElementById(id + '-credit').value);
      const grade = document.getElementById(id + '-grade').value;
      if (!name || isNaN(credit) || credit <= 0) {
        continue;
      }
      courses.push({ name: name, credit: credit, grade: grade });
    }
    return courses;
  }

  function calculateGPA(courses) {
    const totalCredits = courses.reduce(function (sum, c) { return sum + c.credit; }, 0);
    const totalPoints = courses.reduce(function (sum, c) {
      return sum + (getPointsForGrade(c.grade) * c.credit);
    }, 0);
    if (totalCredits === 0) return { gpa: 0, totalCredits: 0 };
    return { gpa: totalPoints / totalCredits, totalCredits: totalCredits };
  }

  function renderResult(gpa, totalCredits, courses) {
    const standing = getStanding(gpa);
    document.getElementById('gpaValue').textContent = gpa.toFixed(2);
    document.getElementById('resultCreditsTotal').textContent = totalCredits;
    document.getElementById('resultCourseCount').textContent = courses.length;

    const stampEl = document.getElementById('standingStamp');
    stampEl.textContent = standing.label;
    stampEl.className = 'status-stamp ' + standing.tier;

    // Render dynamic advice message based on standing tier
    const adviceEl = document.getElementById('adviceMessage');
    let adviceHtml = '';
    let adviceClass = 'advice-box';

    if (gpa >= 3.5) {
      adviceClass += ' good';
      adviceHtml = 'To maintain your Good Standing, aim to keep your individual course grades at B- (2.75 points) or above in future semesters.';
    } else if (gpa >= 2.0) {
      adviceClass += ' warning';
      // Find courses with grades below B- (2.75 points)
      const belowBMinus = courses.filter(function (c) {
        return getPointsForGrade(c.grade) < 2.75;
      });

      if (belowBMinus.length > 0) {
        const courseNames = belowBMinus.map(function (c) {
          return '<strong>' + c.name + '</strong>';
        });
        let courseText = '';
        if (courseNames.length === 1) {
          courseText = 'in ' + courseNames[0] + ', the grade fell';
        } else if (courseNames.length === 2) {
          courseText = 'in ' + courseNames.join(' and ') + ', grades fell';
        } else {
          const last = courseNames.pop();
          courseText = 'in ' + courseNames.join(', ') + ', and ' + last + ', grades fell';
        }
        adviceHtml = 'We noticed that ' + courseText + ' below a B-. Aiming to bring this to at least a B- next semester will help build your cumulative GPA and push toward Good Standing.';
      } else {
        adviceHtml = 'Great effort! Keep building on this momentum and aim to push your GPA toward Good Standing (3.50+) in the coming semesters.';
      }
    } else {
      adviceClass += ' probation';
      adviceHtml = 'We are here to support you. To help improve your standing, focus on avoiding D or F grades in your upcoming courses. We highly recommend reaching out to an academic advisor or lecturer—a low GPA can often be influenced by course load, personal circumstances, or simply needing tutoring support.';
    }

    adviceEl.className = adviceClass;
    adviceEl.innerHTML = adviceHtml;
    adviceEl.style.display = 'block';

    resultCard.classList.add('visible');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function getHistory() {
    try {
      const raw = localStorage.getItem('gradetrack_history');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToHistory(record) {
    const history = getHistory();
    history.unshift(record);
    try {
      localStorage.setItem('gradetrack_history', JSON.stringify(history));
      return true;
    } catch (e) {
      return false;
    }
  }

  let lastResult = null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const courses = collectCourses();
    if (courses.length === 0) {
      alert('Add at least one course with a credit value before calculating.');
      return;
    }
    const { gpa, totalCredits } = calculateGPA(courses);
    renderResult(gpa, totalCredits, courses);
    lastResult = {
      semesterName: semesterNameInput.value.trim() || 'Untitled Semester',
      gpa: gpa,
      totalCredits: totalCredits,
      courses: courses,
      savedAt: new Date().toISOString()
    };
    saveBtn.disabled = false;
  });

  saveBtn.addEventListener('click', function () {
    if (!lastResult) return;
    const ok = saveToHistory(lastResult);
    if (ok) {
      saveBtn.textContent = 'Saved to History';
      saveBtn.disabled = true;
      setTimeout(function () {
        saveBtn.textContent = 'Save This Semester';
        saveBtn.disabled = false;
      }, 2500);
    } else {
      alert('Could not save — your browser storage may be full or disabled.');
    }
  });

  addRowBtn.addEventListener('click', function () {
    addRow();
  });

  // Start with three blank rows
  addRow();
  addRow();
  addRow();
})();
