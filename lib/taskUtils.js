import { format, isSameDay, setHours, setMinutes } from "date-fns";
import { WEEKLY_ROUTINES } from "./constants/routines";
import { generateUUID } from "./utils";

/**
 * Parses a time string like "12pm" or "1pm" or "10.00" and returns a Date object on targetDate
 */
export function parseTimeHeader(timeStr, targetDate) {
  if (!timeStr) return null;

  // Normalize string: "11.00-12pm" -> get the "12pm" part
  const parts = timeStr.split('-');
  const endTimeStr = parts.length > 1 ? parts[1].trim().toLowerCase() : parts[0].trim().toLowerCase();

  let hours = 0;
  let minutes = 0;

  // Handle "12pm", "1pm", etc.
  const ampmMatch = endTimeStr.match(/(\d+)(?:\.(\d+))?\s*(am|pm)/);
  if (ampmMatch) {
    hours = parseInt(ampmMatch[1]);
    minutes = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const period = ampmMatch[3];
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
  } else {
    // Handle "10.00", "15:00"
    const numericMatch = endTimeStr.match(/(\d+)(?:\.|:)(\d+)/);
    if (numericMatch) {
      hours = parseInt(numericMatch[1]);
      minutes = parseInt(numericMatch[2]);
    } else {
      return null;
    }
  }

  return setMinutes(setHours(new Date(targetDate), hours), minutes);
}

/**
 * Checks if routine tasks for a specific date have already been injected for the user.
 * If not, it injects the missing ones.
 */
export async function injectRoutineTasks(supabase, user, existingTasks, targetDate = new Date()) {
  if (!user || !supabase) return;

  const dayName = format(targetDate, 'EEEE');
  const allRoutineTasksForDay = WEEKLY_ROUTINES[dayName];

  if (!allRoutineTasksForDay || allRoutineTasksForDay.length === 0) return;

  const userNameNormalized = (user["Full Name"] || user.full_name || "").trim().toLowerCase();

  // Filter tasks that are either unassigned or assigned specifically to this user
  const routineTasksToConsider = allRoutineTasksForDay.filter(r => {
    const assignedTo = (r.assignedTo || "").trim().toLowerCase();
    const excludedFrom = (r.excludedFrom || "").trim().toLowerCase();

    if (excludedFrom === userNameNormalized) return false;
    if (!assignedTo) return true;
    return assignedTo === userNameNormalized;
  });

  if (routineTasksToConsider.length === 0) return;

  // Filter existing tasks for this user on this date
  const userTasksOnDate = (existingTasks || []).filter(task => {
    const dueDate = task["Due Date"] || task.due_date;
    if (!dueDate) return false;
    try {
      const taskAssignee = (task["Assigned To User ID"] || "").trim().toLowerCase();
      return isSameDay(new Date(dueDate), targetDate) && taskAssignee === userNameNormalized;
    } catch (e) {
      return false;
    }
  });

  // Identify which routines are missing
  const tasksToInsert = [];
  let currentDeadline = null;

  for (const routine of allRoutineTasksForDay) {
    // If it's a header, try to extract a deadline for subsequent tasks
    if (routine.isHeader) {
      const parsed = parseTimeHeader(routine.title, targetDate);
      if (parsed) currentDeadline = parsed.toISOString();
    }

    // Only process tasks that should be assigned to this user
    const assignedTo = (routine.assignedTo || "").trim().toLowerCase();
    const excludedFrom = (routine.excludedFrom || "").trim().toLowerCase();
    if (excludedFrom === userNameNormalized) continue;
    if (assignedTo && assignedTo !== userNameNormalized) continue;
    if (routine.isHeader) continue; // Don't insert headers into DB if they have logic elsewhere

    const routineTitleNormalized = (routine.title || "").trim().toLowerCase();

    // Check if it already exists in the database tasks
    const alreadyInDB = userTasksOnDate.some(t => (t.Title || t.title || "").trim().toLowerCase() === routineTitleNormalized);
    const alreadyInList = tasksToInsert.some(t => (t.Title || t.title || "").trim().toLowerCase() === routineTitleNormalized);

    if (!alreadyInDB && !alreadyInList) {
      const metadata = {
        targetDuration: routine.targetDuration || 0,
        actualStartTime: null,
        durationTaken: null,
        deadline: currentDeadline,
        notes: routine.description || ""
      };

      tasksToInsert.push({
        ID: generateUUID(),
        Title: routine.title,
        Description: `---METADATA---\n${JSON.stringify(metadata)}\n---END METADATA---\n${routine.description || `Routine task for ${dayName}`}`,
        "Due Date": targetDate.toISOString(),
        Status: "To Do",
        Priority: routine.priority || "Medium",
        "Assigned To User ID": user["Full Name"] || user.full_name,
        "Created Date": new Date().toISOString(),
        "Updated Date": new Date().toISOString(),
        "Created By": "System Routine",
        "Logged By": "System Routine",
        "Related Entity": "None",
        "Related Entity ID": ""
      });
    }
  }

  if (tasksToInsert.length === 0) {
    return false;
  }

  const dateStr = format(targetDate, 'yyyy-MM-dd');
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
