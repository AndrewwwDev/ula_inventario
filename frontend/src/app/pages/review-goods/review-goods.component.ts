import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-review-goods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-goods.component.html',
  styleUrls: ['./review-goods.component.css']
})
export class ReviewGoodsComponent {
  cedula: string = '';
  bienes: any[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;

  constructor(
    private inventarioService: InventarioService,
    private toastService: ToastService,
    private router: Router
  ) {}

  buscarBienes() {
    if (!this.cedula.trim()) {
      this.toastService.show('Por favor ingresa una cédula', 'error');
      return;
    }

    this.hasSearched = true;
    this.isLoading = true;
    this.inventarioService.getBienesByEncargado(this.cedula).subscribe({
      next: (data) => {
        this.bienes = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.show('Error al buscar bienes', 'error');
        this.isLoading = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/login']);
  }
}