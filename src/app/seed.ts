import { addTask, createBoard, toIsoDate } from './board.logic';
import { AppState, Board, TaskDraft } from './models';

const inDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

/** Tablero de ejemplo para que la app no se vea vacía la primera vez. */
export function seedState(): AppState {
  let board: Board = createBoard('Lanzamiento web');
  const [todo, doing, done] = board.columns.map((c) => c.id);

  const add = (column: string, draft: TaskDraft) => (board = addTask(board, column, draft));

  add(todo, {
    title: 'Diseñar la página de precios',
    description: 'Tres planes con comparativa.',
    priority: 'media',
    dueDate: inDays(5),
  });
  add(todo, {
    title: 'Escribir textos de la home',
    description: '',
    priority: 'baja',
    dueDate: '',
  });
  add(todo, {
    title: 'Configurar analítica',
    description: 'Eventos de registro y compra.',
    priority: 'alta',
    dueDate: inDays(2),
  });
  add(doing, {
    title: 'Formulario de contacto',
    description: 'Validación y mensaje de éxito.',
    priority: 'alta',
    dueDate: inDays(-1),
  });
  add(doing, { title: 'Modo oscuro', description: '', priority: 'media', dueDate: inDays(7) });
  add(done, {
    title: 'Maquetar cabecera y menú',
    description: 'Responsive con menú móvil.',
    priority: 'media',
    dueDate: '',
  });
  add(done, {
    title: 'Elegir paleta y tipografía',
    description: '',
    priority: 'baja',
    dueDate: '',
  });

  const personal = createBoard('Personal');
  return { boards: [board, personal], activeBoardId: board.id };
}
