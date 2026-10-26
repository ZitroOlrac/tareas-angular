import { Component, computed, input, output } from '@angular/core';
import { isOverdue } from '../board.logic';
import { PRIORITY_LABELS, Task } from '../models';

@Component({
  selector: 'app-task-card',
  template: `
    <button
      type="button"
      class="task"
      [class]="'task task--' + task().priority"
      (click)="open.emit()"
    >
      <span class="task__priority">{{ priorityLabel() }}</span>
      <span class="task__title">{{ task().title }}</span>
      @if (task().description) {
        <span class="task__desc">{{ task().description }}</span>
      }
      @if (task().dueDate) {
        <span class="task__due" [class.task__due--late]="overdue()">
          {{ overdue() ? 'Vencida · ' : '' }}{{ dueLabel() }}
        </span>
      }
    </button>
  `,
})
export class TaskCard {
  readonly task = input.required<Task>();
  readonly open = output<void>();

  protected readonly overdue = computed(() => isOverdue(this.task()));
  protected readonly priorityLabel = computed(() => PRIORITY_LABELS[this.task().priority]);
  protected readonly dueLabel = computed(() => {
    const [y, m, d] = this.task().dueDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  });
}
