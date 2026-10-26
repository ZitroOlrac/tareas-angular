export type Priority = 'alta' | 'media' | 'baja';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  /** Fecha límite en formato ISO (YYYY-MM-DD) o cadena vacía si no tiene. */
  dueDate: string;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  tasks: Record<string, Task>;
}

export interface AppState {
  boards: Board[];
  activeBoardId: string;
}

/** Datos que el usuario rellena en el formulario de una tarea. */
export type TaskDraft = Pick<Task, 'title' | 'description' | 'priority' | 'dueDate'>;

export interface TaskFilter {
  query: string;
  priority: Priority | 'todas';
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
