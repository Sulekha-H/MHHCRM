import { format } from "date-fns";
import { WEEKLY_ROUTINES } from "./constants/routines";

/**
 * Checks if routine tasks for today have already been injected for the user.
 * If not, it injects them.
 */
export async function injectRoutineTasks(supabase, user, existingTasks) {
  if (!user || !supabase) return;

  const todayName = format(new Date(), 'EEEE');
  const routineTasksForToday = WEEKLY_ROUTINES[todayName];

  if (!routineTasksForToday || routineTasksForToday.length === 0) return;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Check if any routine task for today already exists for this user
  // We look for tasks created today that match routine titles
  const routineTitles = routineTasksForToday.map(r => r.title);

  const alreadyInjected = existingTasks.some(task => {
    const createdDate = task["Created Date"] || task.created_date;
    if (!createdDate) return false;
    try {
      const taskDate = format(new Date(createdDate), 'yyyy-MM-dd');
      return taskDate === todayStr &&
             routineTitles.includes(task.Title) &&
             task["Assigned To User ID"] === user["Full Name"];
    } catch (e) {
      return false;
    }
  });

  if (alreadyInjected) {
    console.log(`[ROUTINE] Routine tasks for ${todayName} already exist for user ${user["Full Name"]}`);
    return;
  }

  console.log(`[ROUTINE] Injecting ${routineTasksForToday.length} routine tasks for ${todayName}`);

  const tasksToInsert = routineTasksForToday.map(routine => ({
    ID: crypto.randomUUID(),
    Title: routine.title,
    Description: `Routine task for ${todayName}`,
    "Due Date": new Date().toISOString(), // Due today
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
    console.log(`[ROUTINE] Successfully injected routine tasks for ${todayName}`);
    return true; // Indicate that new tasks were added
  }

  return false;
}
