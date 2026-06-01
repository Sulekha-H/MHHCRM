import { format } from "date-fns";
import { WEEKLY_ROUTINES } from "./constants/routines";

/**
 * Checks if routine tasks for a specific date have already been injected for the user.
 * If not, it injects the missing ones.
 */
export async function injectRoutineTasks(supabase, user, existingTasks, targetDate = new Date()) {
  if (!user || !supabase) return;

  const dayName = format(targetDate, 'EEEE');
  const allRoutineTasksForDay = WEEKLY_ROUTINES[dayName];

  if (!allRoutineTasksForDay || allRoutineTasksForDay.length === 0) return;

  const userNameNormalized = (user["Full Name"] || "").trim().toLowerCase();

  // Filter tasks that are either unassigned or assigned specifically to this user
  const routineTasksToConsider = allRoutineTasksForDay.filter(r =>
    !r.assignedTo || (r.assignedTo || "").trim().toLowerCase() === userNameNormalized
  );

  if (routineTasksToConsider.length === 0) return;

  const dateStr = format(targetDate, 'yyyy-MM-dd');

  // Filter existing tasks for this user on this date
  const userTasksOnDate = (existingTasks || []).filter(task => {
    const dueDate = task["Due Date"] || task.due_date;
    if (!dueDate) return false;
    try {
      const taskDate = format(new Date(dueDate), 'yyyy-MM-dd');
      const taskAssignee = (task["Assigned To User ID"] || "").trim().toLowerCase();
      return taskDate === dateStr && taskAssignee === userNameNormalized;
    } catch (e) {
      return false;
    }
  });

  // Identify which routines are missing
  const tasksToInsert = [];
  for (const routine of routineTasksToConsider) {
    const routineTitleNormalized = (routine.title || "").trim().toLowerCase();
    const alreadyExists = userTasksOnDate.some(t => (t.Title || "").trim().toLowerCase() === routineTitleNormalized);

    if (!alreadyExists) {
      tasksToInsert.push({
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
      });
    }
  }

  if (tasksToInsert.length === 0) {
    return false;
  }

  console.log(`[ROUTINE] Injecting ${tasksToInsert.length} missing routine tasks for ${dayName} (${dateStr}) for ${user["Full Name"]}`);

  const { error } = await supabase.from('tasks').insert(tasksToInsert);

  if (error) {
    console.error("[ROUTINE] Error injecting routine tasks:", error);
    return false;
  } else {
    console.log(`[ROUTINE] Successfully injected routine tasks for ${dayName}`);
    return true; // Indicate that new tasks were added
  }
}
