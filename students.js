// Edit this file: committees and members. Photos go in the /photos folder (or use any image URL).
// committee must be one of the keys below. One committee per student.
const COMMITTEES = {
  ai:       { name: 'AI',                      color: '#ffae12' },
  cyber:    { name: 'Cybersecurity',           color: '#ff1f4a' },
  software: { name: 'Software Development',    color: '#3f8cea' },
  cp:       { name: 'Competitive Programming', color: '#0a4aa0' }
};

const STUDENTS = [
  { id: '12-3456', name: 'Sample Student',  committee: 'software', photo: 'photos/12-3456.jpg' },
  { id: '12-3457', name: 'Another Member',  committee: 'ai',       photo: '' },
  { id: '12-3458', name: 'Third Member',    committee: 'cyber',    photo: '' },
  { id: '12-3459', name: 'Fourth Member',   committee: 'cp',       photo: '' }
];
