import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastsComponent } from './components/toasts/toasts.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastsComponent],
  template: `
    <!-- Bloque simple y directo -->
    <app-toasts></app-toasts>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor() {
    console.log('2. AppComponent (Raíz) Inicializado Exitosamente');
  }
}
