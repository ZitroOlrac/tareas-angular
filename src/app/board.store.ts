import { Injectable, computed, effect, signal } from '@angular/core';
import * as logic from './board.logic';
import { AppState, Board, TaskDraft, TaskFilter } from './models';
import { seedState } from './seed';

export const STORAGE_KEY = 'tareas-angular:v1';

/**
 * Estado global de la app con signals.
 * - `state` es la única fuente de verdad.
 * - Los componentes leen `computed`s y llaman a métodos; nunca modifican el estado directamente.
 * - Un `effect` guarda en localStorage cada vez que el estado cambia.
 */
@Injectable({ providedIn: 'root' })
export class BoardStore {
  private readonly state = signal<AppState>(loadState());

  readonly boards = computed(() => this.state().boards);
  readonly activeBoard = computed<Board>(() => {
    const { boards, activeBoardId } = this.state();
    return boards.find((b) => b.id === activeBoardId) ?? boards[0];
  });
  readonly progress = computed(() => logic.progress(this.activeBoard()));

  readonly filter = signal<TaskFilter>({ query: '', priority: 'todas' });
  readonly isFiltering = computed(
    () => this.filter().query.trim() !== '' || this.filter().priority !== 'todas',
  );

  constructor() {
    effect(() => saveState(this.state()));
  }

  // ---- Tableros ----
  selectBoard(id: string): void {
    this.state.update((s) => ({ ...s, activeBoardId: id }));
  }

  createBoard(name: string): void {
    const board = logic.createBoard(name);
    this.state.update((s) => ({ boards: [...s.boards, board], activeBoardId: board.id }));
  }

  renameBoard(id: string, name: string): void {
    const clean = name.trim();
    if (!clean) return;
    this.state.update((s) => ({
      ...s,
      boards: s.boards.map((b) => (b.id === id ? { ...b, name: clean } : b)),
    }));
  }

  /** No deja borrar el último tablero: siempre tiene que quedar uno. */
  deleteBoard(id: string): void {
    this.state.update((s) => {
      if (s.boards.length <= 1) return s;
      const boards = s.boards.filter((b) => b.id !== id);
      return { boards, activeBoardId: s.activeBoardId === id ? boards[0].id : s.activeBoardId };
    });
  }

  // ---- Columnas y tareas (siempre sobre el tablero activo) ----
  addColumn(title: string): void {
    this.updateActive((b) => logic.addColumn(b, title));
  }
  renameColumn(columnId: string, title: string): void {
    this.updateActive((b) => logic.renameColumn(b, columnId, title));
  }
  deleteColumn(columnId: string): void {
    this.updateActive((b) => logic.deleteColumn(b, columnId));
  }
  addTask(columnId: string, draft: TaskDraft): void {
    this.updateActive((b) => logic.addTask(b, columnId, draft));
  }
  updateTask(taskId: string, draft: TaskDraft): void {
    this.updateActive((b) => logic.updateTask(b, taskId, draft));
  }
  deleteTask(taskId: string): void {
    this.updateActive((b) => logic.deleteTask(b, taskId));
  }
  moveTask(taskId: string, toColumnId: string, toIndex: number): void {
    this.updateActive((b) => logic.moveTask(b, taskId, toColumnId, toIndex));
  }

  resetDemo(): void {
    this.state.set(seedState());
    this.filter.set({ query: '', priority: 'todas' });
  }

  private updateActive(fn: (board: Board) => Board): void {
    const id = this.activeBoard().id;
    this.state.update((s) => ({ ...s, boards: s.boards.map((b) => (b.id === id ? fn(b) : b)) }));
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (logic.isValidState(parsed)) return parsed;
  } catch {
    // localStorage bloqueado o JSON corrupto: empezamos con el tablero de ejemplo.
  }
  return seedState();
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento (modo privado): la app sigue funcionando en memoria.
  }
}
