import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { BoardStore, STORAGE_KEY } from './board.store';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('muestra el tablero de ejemplo con sus columnas', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h1')?.textContent).toContain('Lanzamiento web');
    const columns = [...el.querySelectorAll('.column__header h2')].map((h) =>
      h.textContent?.trim(),
    );
    expect(columns).toEqual(['Por hacer', 'En curso', 'Hecho']);
    expect(el.querySelectorAll('app-task-card')).toHaveLength(7);
  });

  it('filtra las tarjetas por prioridad', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const alta = [...el.querySelectorAll<HTMLButtonElement>('.chip')].find(
      (b) => b.textContent?.trim() === 'Alta',
    );
    alta?.click();
    await fixture.whenStable();

    const cards = el.querySelectorAll('.task__priority');
    expect(cards.length).toBe(2);
    cards.forEach((c) => expect(c.textContent?.trim()).toBe('Alta'));
  });

  it('guarda los cambios en localStorage', async () => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(BoardStore);
    store.createBoard('Estudios');
    await fixture.whenStable();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.boards.map((b: { name: string }) => b.name)).toContain('Estudios');
  });
});
