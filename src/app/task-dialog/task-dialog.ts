import {
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Column, PRIORITY_LABELS, Priority, Task, TaskDraft } from '../models';

export interface TaskDialogResult {
  draft: TaskDraft;
  columnId: string;
}

/**
 * Formulario para crear o editar una tarea, dentro de un <dialog> nativo
 * (gestiona el foco, la tecla Escape y el fondo oscuro sin librerías).
 * El selector de columna es la alternativa accesible al drag & drop.
 */
@Component({
  selector: 'app-task-dialog',
  imports: [ReactiveFormsModule],
  template: `
    <dialog #dialog class="dialog" (close)="closed.emit()" aria-labelledby="dialog-title">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <h2 id="dialog-title">{{ task() ? 'Editar tarea' : 'Nueva tarea' }}</h2>

        <!-- El error va fuera del <label> y se enlaza con aria-describedby,
             así el lector de pantalla lee "Título" como nombre y el error como descripción. -->
        <div class="field">
          <label for="task-title"><span>Título</span></label>
          <input
            id="task-title"
            formControlName="title"
            maxlength="80"
            autocomplete="off"
            [attr.aria-invalid]="titleError()"
            [attr.aria-describedby]="titleError() ? 'task-title-error' : null"
          />
          @if (titleError()) {
            <small id="task-title-error" class="field__error">El título es obligatorio.</small>
          }
        </div>

        <label class="field">
          <span>Descripción</span>
          <textarea formControlName="description" rows="3" maxlength="400"></textarea>
        </label>

        <div class="field-row">
          <label class="field">
            <span>Prioridad</span>
            <select formControlName="priority">
              @for (p of priorities; track p) {
                <option [value]="p">{{ labels[p] }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Fecha límite</span>
            <input type="date" formControlName="dueDate" />
          </label>
        </div>

        <label class="field">
          <span>Columna</span>
          <select formControlName="columnId">
            @for (c of columns(); track c.id) {
              <option [value]="c.id">{{ c.title }}</option>
            }
          </select>
        </label>

        <div class="dialog__actions">
          @if (task()) {
            <button type="button" class="btn btn--danger" (click)="remove.emit()">Eliminar</button>
          }
          <span class="spacer"></span>
          <button type="button" class="btn btn--ghost" (click)="dialog.close()">Cancelar</button>
          <button type="submit" class="btn btn--primary">
            {{ task() ? 'Guardar' : 'Crear tarea' }}
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class TaskDialog {
  readonly task = input<Task | null>(null);
  readonly columns = input.required<Column[]>();
  readonly columnId = input.required<string>();

  readonly save = output<TaskDialogResult>();
  readonly remove = output<void>();
  readonly closed = output<void>();

  protected readonly priorities: Priority[] = ['alta', 'media', 'baja'];
  protected readonly labels = PRIORITY_LABELS;

  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    description: [''],
    priority: ['media' as Priority],
    dueDate: [''],
    columnId: [''],
  });

  constructor() {
    afterNextRender(() => {
      const t = this.task();
      this.form.setValue({
        title: t?.title ?? '',
        description: t?.description ?? '',
        priority: t?.priority ?? 'media',
        dueDate: t?.dueDate ?? '',
        columnId: this.columnId(),
      });
      this.dialogRef().nativeElement.showModal();
    });
  }

  protected titleError(): boolean {
    const c = this.form.controls.title;
    return c.touched && c.invalid;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { columnId, ...draft } = this.form.getRawValue();
    this.save.emit({ draft, columnId });
    this.dialogRef().nativeElement.close();
  }
}
