// Reference grading scale.
// This reflects standard Commonwealth-style grading conventions.
// Exact decimal values can vary by institution and module —
// always verify against your official academic handbook.
// Use the Feedback page to report a different scale if yours differs.

const GRADE_SCALE = [
  { grade: 'A+', points: 4.0, band: '95 - 100%' },
  { grade: 'A',  points: 4.0, band: '85 - 89%' },
  { grade: 'A-', points: 3.7, band: '75 - 79%' },
  { grade: 'B+', points: 3.5, band: '70 - 74%' },
  { grade: 'B',  points: 3.0, band: '65 - 69%' },
  { grade: 'B-', points: 2.75, band: '60 - 64%' },
  { grade: 'C+', points: 2.3, band: '55 - 59%' },
  { grade: 'C',  points: 2.0, band: '50 - 54%' },
  { grade: 'D',  points: 1.0, band: '40 - 49%' },
  { grade: 'F',  points: 0.0, band: 'Below 40%' }
];

function getPointsForGrade(grade) {
  const entry = GRADE_SCALE.find(function (g) { return g.grade === grade; });
  return entry ? entry.points : 0;
}

function getStanding(gpa) {
  if (gpa >= 3.5) {
    return { label: 'Good Standing', tier: 'status-good' };
  }
  if (gpa >= 2.0) {
    return { label: 'Satisfactory Standing', tier: 'status-warning' };
  }
  return { label: 'Probation Warning', tier: 'status-probation' };
}
