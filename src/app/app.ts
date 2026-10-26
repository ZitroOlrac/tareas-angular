import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Autofocus } from './autofocus';
import { BoardStore } from './board.store';
import { BoardView } from './board/board';
import { Board, PRIORITY_LABELS, Priority } from './models';

@Component({
  selector: 'app-root',
  imports: [FormsModule, BoardView, Autofocus],
  templateUrl: './app.html',
})
export class App {
  protected readonly store = inject(BoardStore);
  protected readonly priorities = Object.entries(PRIORITY_LABELS) as [Priority, string][];

  protected readonly menuOpen = signal(false);
  protected readonly renaming = signal(false);
  protected readonly confirmDeleteBoard = signal(false);
  protected newBoard = '';

  protected readonly percent = computed(() => {
    const { done, total } = this.store.progress();
    return total ? Math.round((done / total) * 100) : 0;
  });

  protected taskCount(board: Board): number {
    return Object.keys(board.tasks).length;
  }

  protected setQuery(query: string): void {
    this.store.filter.update((f) => ({ ...f, query }));
  }

  protected setPriority(priority: Priority | 'todas'): void {
    this.store.filter.update((f) => ({ ...f, priority }));
  }

  protected selectBoard(id: string): void {
    this.store.selectBoard(id);
    this.confirmDeleteBoard.set(false);
    this.menuOpen.set(false);
  }

  protected createBoard(): void {
    if (!this.newBoard.trim()) return;
    this.store.createBoard(this.newBoard);
    this.newBoard = '';
    this.menuOpen.set(false);
  }

  protected rename(name: string): void {
    if (!this.renaming()) return;
    this.store.renameBoard(this.store.activeBoard().id, name);
    this.renaming.set(false);
  }

  protected deleteBoard(): void {
    this.store.deleteBoard(this.store.activeBoard().id);
    this.confirmDeleteBoard.set(false);
  }
}
