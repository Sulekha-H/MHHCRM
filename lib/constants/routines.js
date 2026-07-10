export const WEEKLY_ROUTINES = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: []
};

export const ROUTINE_TITLES = Array.from(new Set(
  Object.values(WEEKLY_ROUTINES).flatMap(day => day.map(r => (r.title || "").trim()))
));

export const QUICK_TASKS = [
  'open the blinds', 'open the window', 'flip sign to open',
  'flip sign to closed', 'lock front door and close window', 'close blinds',
  'put all paperwork and laptops away', 'set alarm', 'lock front door',
  'set alarm and lock front door', 'flip sign to closed and close blinds',
  'set alarm and lock office door'
];
