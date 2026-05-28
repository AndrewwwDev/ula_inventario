import { Component } from '@angular/core';

@Component({
  selector: 'manual-usuario',
  standalone: true,
  imports: [],
  templateUrl: './manual-usuario.component.html',
  styleUrl: './manual-usuario.component.css'
})
export class ManualUsuarioComponent {

  scrollTo(elementId: string, event: Event): void {
    event.preventDefault(); // Evitar la navegación predeterminada que recarga/redirige
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

}
