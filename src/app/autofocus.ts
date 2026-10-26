import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/** Da el foco al elemento en cuanto aparece (el atributo HTML `autofocus` solo funciona al cargar la página). */
@Directive({ selector: '[appAutofocus]' })
export class Autofocus {
  constructor() {
    const el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      el.focus();
      el.select?.();
    });
  }
}
