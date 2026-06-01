export const WEEKLY_ROUTINES = {
  Monday: [
    { title: "- ADD to crm", targetDuration: 30, priority: "Medium" },
    { title: "Fiixit / CRM", targetDuration: 60, priority: "High" },
    { title: "Monday.com / CRM", targetDuration: 60, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Tuesday: [
    { title: "Follow up with all jobs currently in progress", targetDuration: 120, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Wednesday: [
    { title: "Call all lead clients (not currently in progress jobs)", targetDuration: 180, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Thursday: [
    { title: "Fiixit / CRM", targetDuration: 60, priority: "High" },
    { title: "Monday.com / CRM", targetDuration: 60, priority: "High" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ],
  Friday: [
    { title: "Fiixit / CRM", targetDuration: 60, priority: "High" },
    { title: "Monday.com / CRM", targetDuration: 60, priority: "High" },
    { title: "Postage", targetDuration: 30, priority: "Medium" },
    { title: "check emails every minute", targetDuration: 480, priority: "Medium" },
    { title: "Lunch", targetDuration: 60, priority: "Low" }
  ]
};

export const ROUTINE_TITLES = Array.from(new Set(
  Object.values(WEEKLY_ROUTINES).flatMap(day => day.map(r => r.title))
));
