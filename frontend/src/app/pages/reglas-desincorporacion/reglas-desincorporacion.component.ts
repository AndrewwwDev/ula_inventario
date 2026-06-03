import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reglas-desincorporacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reglas-desincorporacion.component.html',
  styles: []
})
export class ReglasDesincorporacionComponent {
  constructor(private router: Router) {}

  volverAtras() {
    this.router.navigate(['/dashboard/desincorporacion']);
  }
}
