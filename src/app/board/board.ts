import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { matchesFilter } from '../board.logic';
import { BoardStore } from '../board.store';
import { Column, Task } from '../models';
import { Autofocus } from '../autofocus';
import { TaskCard } from '../task-card/task-card';
import { TaskDialog, TaskDialogResult } from '../task-dialog/task-dialog';

type DialogState =
  { mode: 'create'; columnId: string } | { mode: 'edit'; columnId: string; task: Task } | null;

@Component({
  selector: 'app-board',
  imports: [
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    FormsModule,
    Autofocus,
    TaskCard,
    TaskDialog,
  ],
  template: `
    <div class="board" cdkDropListGroup>
      @for (col of visibleColumns(); track col.id) {
        <section class="column" [attr.aria-labelledby]="'col-' + col.id">
          <header class="column__header">
            @if (editingColumn() === col.id) {
              <input
                class="column__rename"
                [value]="col.title"
                (keydown.enter)="renameColumn(col.id, $any($event.target).value)"
                (keydown.escape)="editingColumn.set(null)"
                (blur)="renameColumn(col.id, $any($event.target).value)"
                aria-label="Nombre de la columna"
                appAutofocus
              />
            } @else {
              <h2
                [id]="'col-' + col.id"
                (dblclick)="editingColumn.set(col.id)"
                title="Doble clic para renombrar"
              >
                {{ col.title }}
              </h2>
            }
            <span class="column__count">{{ col.tasks.length }}</span>
            <div class="column__menu">
              @if (confirmDelete() === col.id) {
                <button type="button" class="link link--danger" (click)="deleteColumn(col.id)">
                  ¿Borrar{{ col.taskIds.length ? ' y sus ' + col.taskIds.length + ' tareas' : '' }}?
                </button>
                <button type="button" class="link" (click)="confirmDelete.set(null)">No</button>
              } @else {
                <button
                  type="button"
                  class="icon-btn"
                  (click)="editingColumn.set(col.id)"
                  [attr.aria-label]="'Renombrar ' + col.title"
                >
                  ✎
                </button>
                <button
                  type="button"
                  class="icon-btn"
                  (click)="confirmDelete.set(col.id)"
                  [attr.aria-label]="'Borrar ' + col.title"
                >
                  ✕
                </button>
              }
            </div>
          </header>

          <div
            class="column__list"
            cdkDropList
            [cdkDropListData]="col.id"
            [cdkDropListDisabled]="store.isFiltering()"
            (cdkDropListDropped)="drop($event)"
          >
            @for (task of col.tasks; track task.id) {
              <div cdkDrag [cdkDragData]="task.id" class="drag-item">
                <div *cdkDragPlaceholder class="task-placeholder"></div>
                <app-task-card
                  [task]="task"
                  (open)="dialog.set({ mode: 'edit', columnId: col.id, task })"
                />
              </div>
            } @empty {
              <p class="column__empty">
                {{ store.isFiltering() ? 'Sin resultados' : 'Arrastra tareas aquí' }}
              </p>
            }
          </div>

          <button
            type="button"
            class="column__add"
            (click)="dialog.set({ mode: 'create', columnId: col.id })"
          >
            + Añadir tarea
          </button>
        </section>
      }

      <form class="column column--new" (ngSubmit)="addColumn()">
        <label for="new-column">Nueva columna</label>
        <input
          id="new-column"
          name="newColumn"
          [(ngModel)]="newColumn"
          placeholder="Ej.: En revisión"
          maxlength="40"
        />
        <button type="submit" class="btn btn--ghost" [disabled]="!newColumn.trim()">
          Añadir columna
        </button>
      </form>
    </div>

    @if (dialog(); as d) {
      <app-task-dialog
        [task]="d.mode === 'edit' ? d.task : null"
        [columns]="store.activeBoard().columns"
        [columnId]="d.columnId"
        (save)="save(d, $event)"
        (remove)="remove(d)"
        (closed)="dialog.set(null)"
      />
    }
  `,
})
export class BoardView {
  protected readonly store = inject(BoardStore);
  protected readonly dialog = signal<DialogState>(null);
  protected readonly editingColumn = signal<string | null>(null);
  protected readonly confirmDelete = signal<string | null>(null);
  protected newColumn = '';

  /** Columnas con sus tareas ya resueltas y filtradas, listas para pintar. */
  protected readonly visibleColumns = computed(() => {
    const board = this.store.activeBoard();
    const filter = this.store.filter();
    return board.columns.map((c: Column) => ({
      ...c,
      tasks: c.taskIds
        .map((id) => board.tasks[id])
        .filter((t): t is Task => !!t && matchesFilter(t, filter)),
    }));
  });

  protected drop(event: CdkDragDrop<string, string, string>): void {
    this.store.moveTask(event.item.data, event.container.data, event.currentIndex);
  }

  protected save(state: NonNullable<DialogState>, result: TaskDialogResult): void {
    if (state.mode === 'create') {
      this.store.addTask(result.columnId, result.draft);
      return;
    }
    this.store.updateTask(state.task.id, result.draft);
    if (result.columnId !== state.columnId) {
      this.store.moveTask(state.task.id, result.columnId, Number.MAX_SAFE_INTEGER);
    }
  }

  protected remove(state: NonNullable<DialogState>): void {
    if (state.mode === 'edit') this.store.deleteTask(state.task.id);
    this.dialog.set(null);
  }

  protected renameColumn(id: string, title: string): void {
    if (this.editingColumn() !== id) return;
    this.store.renameColumn(id, title);
    this.editingColumn.set(null);
  }

  protected deleteColumn(id: string): void {
    this.store.deleteColumn(id);
    this.confirmDelete.set(null);
  }

  protected addColumn(): void {
    if (!this.newColumn.trim()) return;
    this.store.addColumn(this.newColumn);
    this.newColumn = '';
  }
}
