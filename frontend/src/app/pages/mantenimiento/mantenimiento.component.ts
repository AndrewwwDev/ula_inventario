import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mantenimiento.component.html'
})
export class MantenimientoComponent implements OnInit {

  mantenimientoTab: 'alertas' | 'reparacion' | 'historial' = 'alertas';
  alertasMantenimiento: any[] = [];
  enReparacion: any[] = [];
  historialMantenimiento: any[] = [];

  showFinalizarModal = false;
  trabajoRealizado = '';
  proximaFechaMantenimiento = '';
  finalizandoBienId: string | null = null;
  isSubmitting = false;

  constructor(
    private inventarioService: InventarioService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadMantenimientoData();
  }

  loadMantenimientoData() {
    this.inventarioService.getAlertasMantenimiento().subscribe((data: any) => this.alertasMantenimiento = data);
    this.inventarioService.getEnReparacion().subscribe((data: any) => this.enReparacion = data);
    this.inventarioService.getHistorialMantenimiento().subscribe((data: any) => this.historialMantenimiento = data);
  }

  switchMantenimientoTab(tab: 'alertas' | 'reparacion' | 'historial') {
    this.mantenimientoTab = tab;
  }

  openFinalizarMantenimiento(item: any) {
    this.finalizandoBienId = item.codigo_id;
    this.trabajoRealizado = '';
    this.proximaFechaMantenimiento = '';
    this.showFinalizarModal = true;
  }

  finalizarMantenimiento() {
    if (!this.finalizandoBienId || !this.trabajoRealizado || !this.proximaFechaMantenimiento) {
      this.toastService.show('Por favor llene todos los campos', 'warning');
      return;
    }

    this.isSubmitting = true;
    this.inventarioService.finalizarMantenimiento(this.finalizandoBienId, this.trabajoRealizado, this.proximaFechaMantenimiento).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showFinalizarModal = false;
        this.toastService.show('Reincorporado con éxito', 'success');
        this.loadMantenimientoData();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Fallo en la operación: ' + (err.error?.message || err.message), 'error');
      }
    });
  }
}
