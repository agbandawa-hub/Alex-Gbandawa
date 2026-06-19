// GradeTrack SL — History page logic
// Reads saved semesters from localStorage and renders them,
// with an option to clear individual entries or all history.

(function () {
  const listEl = document.getElementById('historyList');
  const emptyEl = document.getElementById('emptyState');
  const clearAllBtn = document.getElementById('clearAllBtn');

  function getHistory() {
    try {
      const raw = localStorage.getItem('gradetrack_history');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setHistory(history) {
    localStorage.setItem('gradetrack_history', JSON.stringify(history));
  }

  function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function render() {
    const history = getHistory();
    listEl.innerHTML = '';

    if (history.length === 0) {
      emptyEl.style.display = 'block';
      listEl.style.display = 'none';
      clearAllBtn.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.style.display = 'block';
    clearAllBtn.style.display = 'inline-flex';

    history.forEach(function (record, index) {
      const standing = getStanding(record.gpa);
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML =
        '<div>' +
        '<strong>' + record.semesterName + '</strong>' +
        '<div class="history-meta">' +
        record.courses.length + ' course(s) &middot; ' +
        record.totalCredits + ' credits &middot; ' +
        'saved ' + formatDate(record.savedAt) +
        '</div>' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:1rem;">' +
        '<span class="status-stamp ' + standing.tier + '" style="transform:none; font-size:0.75rem;">' + standing.label + '</span>' +
        '<span class="history-gpa">' + record.gpa.toFixed(2) + '</span>' +
        '<button type="button" class="btn-ghost" data-index="' + index + '" aria-label="Remove this entry">Remove</button>' +
        '</div>';
      listEl.appendChild(item);
    });

    listEl.querySelectorAll('button[data-index]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        const history = getHistory();
        history.splice(idx, 1);
        setHistory(history);
        render();
      });
    });
  }

  clearAllBtn.addEventListener('click', function () {
    if (confirm('Remove all saved semesters? This cannot be undone.')) {
      setHistory([]);
      render();
    }
  });

  render();
})();
