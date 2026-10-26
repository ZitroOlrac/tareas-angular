import { AppState, Board, Column, Task, TaskDraft, TaskFilter } from './models';

/**
 * Funciones puras que transforman el estado. No mutan nada: siempre devuelven
 * un objeto nuevo, así los signals detectan el cambio y son fáciles de testear.
 */

export const newId = (): string => crypto.randomUUID();

export function createBoard(name: string, id = newId()): Board {
  return {
    id,
    name: name.trim() || 'Nuevo tablero',
    columns: [
      { id: newId(), title: 'Por hacer', taskIds: [] },
      { id: newId(), title: 'En curso', taskIds: [] },
      { id: newId(), title: 'Hecho', taskIds: [] },
    ],
    tasks: {},
  };
}

function updateColumn(board: Board, columnId: string, fn: (c: Column) => Column): Board {
  return { ...board, columns: board.columns.map((c) => (c.id === columnId ? fn(c) : c)) };
}

export function addTask(board: Board, columnId: string, draft: TaskDraft, now = new Date()): Board {
  const task: Task = {
    ...draft,
    title: draft.title.trim(),
    id: newId(),
    createdAt: now.toISOString(),
  };
  const withTask = { ...board, tasks: { ...board.tasks, [task.id]: task } };
  return updateColumn(withTask, columnId, (c) => ({ ...c, taskIds: [...c.taskIds, task.id] }));
}

export function updateTask(board: Board, taskId: string, draft: TaskDraft): Board {
  const current = board.tasks[taskId];
  if (!current) return board;
  return {
    ...board,
    tasks: { ...board.tasks, [taskId]: { ...current, ...draft, title: draft.title.trim() } },
  };
}

export function deleteTask(board: Board, taskId: string): Board {
  const tasks = { ...board.tasks };
  delete tasks[taskId];
  return {
    ...board,
    tasks,
    columns: board.columns.map((c) => ({ ...c, taskIds: c.taskIds.filter((id) => id !== taskId) })),
  };
}

/**
 * Mueve una tarea a otra columna (o dentro de la misma) en la posición indicada.
 * Es la operación que dispara el drag & drop.
 */
export function moveTask(board: Board, taskId: string, toColumnId: string, toIndex: number): Board {
  const from = board.columns.find((c) => c.taskIds.includes(taskId));
  const to = board.columns.find((c) => c.id === toColumnId);
  if (!from || !to) return board;

  const columns = board.columns.map((c) => ({
    ...c,
    taskIds: c.taskIds.filter((id) => id !== taskId),
  }));
  return {
    ...board,
    columns: columns.map((c) => {
      if (c.id !== toColumnId) return c;
      const ids = [...c.taskIds];
      const index = Math.max(0, Math.min(toIndex, ids.length));
      ids.splice(index, 0, taskId);
      return { ...c, taskIds: ids };
    }),
  };
}

export function addColumn(board: Board, title: string): Board {
  return {
    ...board,
    columns: [
      ...board.columns,
      { id: newId(), title: title.trim() || 'Nueva columna', taskIds: [] },
    ],
  };
}

export function renameColumn(board: Board, columnId: string, title: string): Board {
  const clean = title.trim();
  return clean ? updateColumn(board, columnId, (c) => ({ ...c, title: clean })) : board;
}

/** Borra la columna y también sus tareas, para no dejar tareas huérfanas. */
export function deleteColumn(board: Board, columnId: string): Board {
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) return board;
  const tasks = { ...board.tasks };
  column.taskIds.forEach((id) => delete tasks[id]);
  return { ...board, tasks, columns: board.columns.filter((c) => c.id !== columnId) };
}

export function matchesFilter(task: Task, filter: TaskFilter): boolean {
  const q = normalize(filter.query);
  const textOk = !q || normalize(task.title).includes(q) || normalize(task.description).includes(q);
  const priorityOk = filter.priority === 'todas' || task.priority === filter.priority;
  return textOk && priorityOk;
}

/** Quita tildes y mayúsculas para que "camion" encuentre "Camión". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function isOverdue(task: Task, today = new Date()): boolean {
  if (!task.dueDate) return false;
  return task.dueDate < toIsoDate(today);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function progress(board: Board): { done: number; total: number } {
  const total = Object.keys(board.tasks).length;
  const last = board.columns.at(-1);
  return { done: last ? last.taskIds.length : 0, total };
}

/** Valida lo que llega de localStorage: si está corrupto, se ignora. */
export function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const s = value as AppState;
  return (
    Array.isArray(s.boards) &&
    s.boards.length > 0 &&
    typeof s.activeBoardId === 'string' &&
    s.boards.every(
      (b) => typeof b.id === 'string' && Array.isArray(b.columns) && typeof b.tasks === 'object',
    )
  );
}
