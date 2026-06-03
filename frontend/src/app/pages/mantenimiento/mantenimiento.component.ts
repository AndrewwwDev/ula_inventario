import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

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
  usuarios: any[] = [];

  showFinalizarModal = false;
  trabajoRealizado = '';
  proximaFechaMantenimiento = '';
  finalizandoBienId: string | null = null;
  isSubmitting = false;

  // --- Export & Modal ---
  isExportModalOpen = false;
  fechaInicio = '';
  fechaFin = '';
  ordenarPor = 'Mas recientes';

  // --- Detalles Modal ---
  isDetalleModalOpen = false;
  registroSeleccionado: any = null;
  
  // --- Detalles Alerta Modal ---
  isDetalleAlertaOpen: boolean = false;
  alertaSeleccionada: any = null;

  // --- Detalles En Reparación Modal ---
  isDetalleReparacionOpen: boolean = false;
  reparacionSeleccionada: any = null;

  abrirModalEnReparacion(item: any) {
    this.reparacionSeleccionada = item;
    this.isDetalleReparacionOpen = true;
  }

  cerrarModalEnReparacion() {
    this.isDetalleReparacionOpen = false;
    this.reparacionSeleccionada = null;
  }

  constructor(
    private inventarioService: InventarioService,
    public toastService: ToastService,
    private pdfExportService: PdfExportService,
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadMantenimientoData();
    this.supabaseService.supabase.from('usuarios').select('cedula, nombres, apellidos').then(({ data }) => {
      if (data) {
        this.usuarios = data;
      }
    });
  }

  procesarMantenimiento(alerta: any) {
    if (alerta && alerta.bien) {
      this.cerrarDetalleAlerta();
      this.router.navigate(['/dashboard/inventario'], { 
        queryParams: { action: 'mantenimiento', id: alerta.bien.codigo_id } 
      });
    }
  }

  loadMantenimientoData() {
    this.inventarioService.getAlertasMantenimiento().subscribe((data: any) => this.alertasMantenimiento = data);
    this.inventarioService.getEnReparacion().subscribe((data: any) => this.enReparacion = data);
    this.inventarioService.getHistorialMantenimiento().subscribe((data: any) => this.historialMantenimiento = data);
  }

  obtenerNombrePorCedula(cedula: string): string {
    if (!cedula) return 'Sin Asignación';
    if (!this.usuarios || this.usuarios.length === 0) return 'Sin Asignación';
    const usuario = this.usuarios.find(u => u.cedula === cedula);
    return usuario ? `${usuario.nombres} ${usuario.apellidos}` : 'Usuario no registrado';
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

  obtenerDatosFiltrados() {
    let result = [...this.historialMantenimiento];

    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio).getTime();
      result = result.filter(item => new Date(item.fecha_salida || item.fecha_ingreso).getTime() >= inicio);
    }
    
    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59, 999);
      result = result.filter(item => new Date(item.fecha_salida || item.fecha_ingreso).getTime() <= fin.getTime());
    }

    result.sort((a, b) => {
      const dateA = new Date(a.fecha_salida || a.fecha_ingreso).getTime();
      const dateB = new Date(b.fecha_salida || b.fecha_ingreso).getTime();
      
      if (this.ordenarPor === 'Mas antiguos') {
        return dateA - dateB;
      } else if (this.ordenarPor === 'Por Nombre/Codigo') {
        const nameA = (a.bienes?.nombre || a.codigo_bien || '').toLowerCase();
        const nameB = (b.bienes?.nombre || b.codigo_bien || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        return dateB - dateA;
      }
    });

    return result;
  }

  exportarPDF() {
    const datos = this.obtenerDatosFiltrados();

    if (datos.length === 0) {
      this.toastService.show('No hay datos para exportar con los filtros actuales.', 'warning');
      return;
    }

    const columnas = ['Código Bien', 'Nombre Bien', 'Motivo Falla', 'Trabajo Realizado', 'Fecha Salida'];
    const dataFilas = datos.map(item => [
      item.codigo_bien || 'N/A',
      item.bienes?.nombre || 'N/A',
      item.motivo_falla || 'N/A',
      item.trabajo_realizado || 'N/A',
      item.fecha_salida ? new Date(item.fecha_salida).toLocaleDateString() : 'En Proceso'
    ]);

    let periodo = '';
    if (this.fechaInicio && this.fechaFin) {
      periodo = `Desde: ${this.fechaInicio} - Hasta: ${this.fechaFin}`;
    } else if (this.fechaInicio) {
      periodo = `Desde: ${this.fechaInicio}`;
    } else if (this.fechaFin) {
      periodo = `Hasta: ${this.fechaFin}`;
    } else {
      periodo = 'Histórico completo';
    }

    this.pdfExportService.generarReporte('Historial de Mantenimiento', columnas, dataFilas, periodo);
    
    // Cerrar modal y limpiar
    this.isExportModalOpen = false;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.ordenarPor = 'Mas recientes';
  }

  abrirModalDetalle(item: any) {
    this.registroSeleccionado = item;
    this.isDetalleModalOpen = true;
  }

  cerrarModalDetalle() {
    this.isDetalleModalOpen = false;
    this.registroSeleccionado = null;
  }

  abrirDetalleAlerta(alerta: any) {
    this.alertaSeleccionada = alerta;
    this.isDetalleAlertaOpen = true;
  }

  cerrarDetalleAlerta() {
    this.isDetalleAlertaOpen = false;
    this.alertaSeleccionada = null;
  }
}
