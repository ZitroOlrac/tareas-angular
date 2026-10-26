import {
  addColumn,
  addTask,
  createBoard,
  deleteColumn,
  deleteTask,
  isOverdue,
  isValidState,
  matchesFilter,
  moveTask,
  progress,
  renameColumn,
  updateTask,
} from './board.logic';
import { Board, Task, TaskDraft } from './models';

const draft = (title: string, extra: Partial<TaskDraft> = {}): TaskDraft => ({
  title,
  description: '',
  priority: 'media',
  dueDate: '',
  ...extra,
});

function boardWithTasks(): { board: Board; ids: string[]; cols: string[] } {
  let board = createBoard('Test');
  const cols = board.columns.map((c) => c.id);
  board = addTask(board, cols[0], draft('A'));
  board = addTask(board, cols[0], draft('B'));
  board = addTask(board, cols[0], draft('C'));
  return { board, ids: board.columns[0].taskIds, cols };
}

describe('board.logic', () => {
  it('crea un tablero con 3 columnas por defecto', () => {
    const board = createBoard('  Mi tablero  ');
    expect(board.name).toBe('Mi tablero');
    expect(board.columns.map((c) => c.title)).toEqual(['Por hacer', 'En curso', 'Hecho']);
  });

  it('añade tareas al final de la columna y limpia el título', () => {
    const { board, ids } = boardWithTasks();
    expect(ids).toHaveLength(3);
    const withSpaces = addTask(board, board.columns[1].id, draft('   Nueva   '));
    const id = withSpaces.columns[1].taskIds[0];
    expect(withSpaces.tasks[id].title).toBe('Nueva');
  });

  it('no muta el tablero original', () => {
    const { board, ids, cols } = boardWithTasks();
    const snapshot = JSON.stringify(board);
    moveTask(board, ids[0], cols[1], 0);
    deleteTask(board, ids[1]);
    expect(JSON.stringify(board)).toBe(snapshot);
  });

  it('mueve una tarea a otra columna en la posición indicada', () => {
    let { board, ids, cols } = boardWithTasks();
    board = moveTask(board, ids[0], cols[2], 0);
    expect(board.columns[0].taskIds).toEqual([ids[1], ids[2]]);
    expect(board.columns[2].taskIds).toEqual([ids[0]]);
  });

  it('reordena dentro de la misma columna', () => {
    let { board, ids, cols } = boardWithTasks();
    board = moveTask(board, ids[2], cols[0], 0);
    expect(board.columns[0].taskIds).toEqual([ids[2], ids[0], ids[1]]);
  });

  it('acota el índice si es mayor que la longitud', () => {
    let { board, ids, cols } = boardWithTasks();
    board = moveTask(board, ids[0], cols[0], 99);
    expect(board.columns[0].taskIds).toEqual([ids[1], ids[2], ids[0]]);
  });

  it('actualiza los datos de una tarea', () => {
    let { board, ids } = boardWithTasks();
    board = updateTask(board, ids[0], draft('A editada', { priority: 'alta' }));
    expect(board.tasks[ids[0]]).toMatchObject({ title: 'A editada', priority: 'alta' });
  });

  it('borra una tarea del mapa y de su columna', () => {
    let { board, ids } = boardWithTasks();
    board = deleteTask(board, ids[1]);
    expect(board.tasks[ids[1]]).toBeUndefined();
    expect(board.columns[0].taskIds).toEqual([ids[0], ids[2]]);
  });

  it('gestiona columnas: añadir, renombrar (ignora vacío) y borrar con sus tareas', () => {
    let { board, cols } = boardWithTasks();
    board = addColumn(board, 'Revisión');
    expect(board.columns.at(-1)?.title).toBe('Revisión');

    board = renameColumn(board, cols[1], 'Haciendo');
    board = renameColumn(board, cols[1], '   ');
    expect(board.columns[1].title).toBe('Haciendo');

    board = deleteColumn(board, cols[0]);
    expect(board.columns).toHaveLength(3);
    expect(Object.keys(board.tasks)).toHaveLength(0);
  });

  it('filtra por texto sin importar tildes ni mayúsculas, y por prioridad', () => {
    const task: Task = {
      id: '1',
      title: 'Revisar Camión',
      description: 'Ruta norte',
      priority: 'alta',
      dueDate: '',
      createdAt: '',
    };
    expect(matchesFilter(task, { query: 'camion', priority: 'todas' })).toBe(true);
    expect(matchesFilter(task, { query: 'NORTE', priority: 'alta' })).toBe(true);
    expect(matchesFilter(task, { query: '', priority: 'baja' })).toBe(false);
    expect(matchesFilter(task, { query: 'avión', priority: 'todas' })).toBe(false);
  });

  it('detecta tareas vencidas', () => {
    const base: Task = {
      id: '1',
      title: 'x',
      description: '',
      priority: 'baja',
      dueDate: '',
      createdAt: '',
    };
    const today = new Date(2026, 9, 26);
    expect(isOverdue(base, today)).toBe(false);
    expect(isOverdue({ ...base, dueDate: '2026-10-25' }, today)).toBe(true);
    expect(isOverdue({ ...base, dueDate: '2026-10-26' }, today)).toBe(false);
  });

  it('calcula el progreso con la última columna como "hecho"', () => {
    let { board, ids, cols } = boardWithTasks();
    board = moveTask(board, ids[0], cols[2], 0);
    expect(progress(board)).toEqual({ done: 1, total: 3 });
  });

  it('rechaza un estado guardado corrupto', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState({ boards: [], activeBoardId: 'x' })).toBe(false);
    expect(isValidState({ boards: 'nope', activeBoardId: 'x' })).toBe(false);
    expect(isValidState({ boards: [createBoard('ok')], activeBoardId: 'x' })).toBe(true);
  });
});
