import { format, startOfDay } from "date-fns";
import { WEEKLY_ROUTINES } from "./constants/routines";

/**
 * Checks if routine tasks for a specific date have already been injected for the user.
 * If not, it injects them.
 */
export async function injectRoutineTasks(supabase, user, existingTasks, targetDate = new Date()) {
  if (!user || !supabase) return;

  const dayName = format(targetDate, 'EEEE');
  const routineTasksForDay = WEEKLY_ROUTINES[dayName];

  if (!routineTasksForDay || routineTasksForDay.length === 0) return;

  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Check if any routine task for this date already exists for this user
  // We look for tasks where Due Date matches target date and titles match routine titles
  const routineTitles = routineTasksForDay.map(r => r.title);

  const alreadyInjected = existingTasks.some(task => {
    const dueDate = task["Due Date"] || task.due_date;
    if (!dueDate) return false;
    try {
      const taskDate = format(new Date(dueDate), 'yyyy-MM-dd');
      return taskDate === dateStr &&
             routineTitles.includes(task.Title) &&
             task["Assigned To User ID"] === user["Full Name"];
    } catch (e) {
      return false;
    }
  });

  if (alreadyInjected) {
    // console.log(`[ROUTINE] Routine tasks for ${dayName} (${dateStr}) already exist for user ${user["Full Name"]}`);
    return;
  }

  console.log(`[ROUTINE] Injecting ${routineTasksForDay.length} routine tasks for ${dayName} (${dateStr})`);

  const tasksToInsert = routineTasksForDay.map(routine => ({
    ID: crypto.randomUUID(),
    Title: routine.title,
    Description: `Routine task for ${dayName}`,
    "Due Date": targetDate.toISOString(),
    Status: "To Do",
    Priority: routine.priority,
    "Assigned To User ID": user["Full Name"],
    "Target Duration": routine.targetDuration,
    "Created Date": new Date().toISOString(),
    "Updated Date": new Date().toISOString(),
    "Created By": "System Routine",
    "Related Entity": "None"
  }));

  const { error } = await supabase.from('tasks').insert(tasksToInsert);

  if (error) {
    console.error("[ROUTINE] Error injecting routine tasks:", error);
  } else {
    console.log(`[ROUTINE] Successfully injected routine tasks for ${dayName}`);
    return true; // Indicate that new tasks were added
  }

  return false;
}
