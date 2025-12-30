import TasksClient from "./TasksClient";

export default async function TasksPage() {
  return (
    <div>
      <h1>Tasks</h1>
      <TasksClient />
    </div>
  );
}
