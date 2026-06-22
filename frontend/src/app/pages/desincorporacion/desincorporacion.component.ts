import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { PdfExportService } from '../../services/pdf-export.service';

@Component({
  selector: 'app-desincorporacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './desincorporacion.component.html'
})
export class DesincorporacionComponent implements OnInit {

  desincorporados: any[] = [];
  
  // Variables para la desincorporación (Control anti-fraude)
  showDesincorporarModal = false;
  editingBienId: string | null = null;

  confirmarDesincorporacion = false;
  motivoDesincorporacion = '';
  fechaDesincorporacion = '';
  selectedFile: File | null = null;
  isSubmitting = false;

  // --- Export & Modal ---
  isExportModalOpen = false;
  fechaInicio = '';
  fechaFin = '';
  ordenarPor = 'Mas recientes';

  // --- Detalles Modal ---
  isDetalleModalOpen = false;
  registroSeleccionado: any = null;
  minDate: string = '';
  maxDate: string = '';

  // --- Reglas y Consentimiento Legal ---
  isRulesModalOpen: boolean = false;
  aceptaResponsabilidad: boolean = false;

  constructor(
    private inventarioService: InventarioService,
    private toastService: ToastService,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit() {
    this.loadDesincorporados();

    // Configuración de límites de fechas de auditoría (Requerimiento 1)
    const hoy = new Date();
    this.maxDate = hoy.toISOString().split('T')[0];

    const mesAnterior = new Date(hoy);
    mesAnterior.setMonth(hoy.getMonth() - 1);
    this.minDate = mesAnterior.toISOString().split('T')[0];
  }

  loadDesincorporados() {
    this.inventarioService.getBienesDesincorporados(this.fechaInicio, this.fechaFin).subscribe((data: any) => {
      this.desincorporados = data;
    });
  }

  aplicarFiltroFecha() {
    this.loadDesincorporados();
  }

  limpiarFiltroFecha() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.loadDesincorporados();
  }

  openDetailsModal(item: any) {
    console.log('Detalles de desincorporación para', item);
  }

  // Lógica de carga de archivos para la fotografía obligatoria (Supabase Storage)
  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  abrirModalReglas() {
    this.isRulesModalOpen = true;
  }

  cerrarModalReglas() {
    this.isRulesModalOpen = false;
  }

  openDesincorporarModal(id: string) {
    this.editingBienId = id;
    this.confirmarDesincorporacion = false;
    this.motivoDesincorporacion = '';
    this.fechaDesincorporacion = '';
    this.selectedFile = null;
    this.aceptaResponsabilidad = false;
    this.showDesincorporarModal = true;
  }

  desincorporar() {
    if (!this.editingBienId) return;
    if (!this.motivoDesincorporacion || this.motivoDesincorporacion.trim() === '') {
      alert('Debe especificar un motivo para la desincorporación.');
      return;
    }
    if (!this.fechaDesincorporacion) {
      alert('Debe especificar la fecha de desincorporación.');
      return;
    }
    if (!this.selectedFile) {
      alert('Debe adjuntar una fotografía del bien como evidencia.');
      return;
    }

    this.isSubmitting = true;
    this.inventarioService.desincorporarBien(this.editingBienId, this.motivoDesincorporacion, this.fechaDesincorporacion, this.selectedFile).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showDesincorporarModal = false;
        this.loadDesincorporados();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Error al desincorporar: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  obtenerDatosFiltrados() {
    let result = [...this.desincorporados];

    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio).getTime();
      result = result.filter(item => new Date(item.fecha_desincorporacion).getTime() >= inicio);
    }
    
    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59, 999);
      result = result.filter(item => new Date(item.fecha_desincorporacion).getTime() <= fin.getTime());
    }

    result.sort((a, b) => {
      const dateA = new Date(a.fecha_desincorporacion).getTime();
      const dateB = new Date(b.fecha_desincorporacion).getTime();
      
      if (this.ordenarPor === 'Mas antiguos') {
        return dateA - dateB;
      } else if (this.ordenarPor === 'Por Nombre/Codigo') {
        const nameA = (a.nombre || a.codigo_id || '').toLowerCase();
        const nameB = (b.nombre || b.codigo_id || '').toLowerCase();
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

    const columnas = ['Código ID', 'Nombre Bien', 'Fecha Baja', 'Motivo', 'Responsable Original'];
    const dataFilas = datos.map(item => [
      item.codigo_id || 'N/A',
      item.nombre || 'N/A',
      item.fecha_desincorporacion ? new Date(item.fecha_desincorporacion).toLocaleDateString() : 'N/A',
      item.motivo_desincorporacion || 'N/A',
      item.responsable_cedula || 'N/A'
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

    this.pdfExportService.generarReporte('Historial de Bienes Desincorporados', columnas, dataFilas, periodo);
    
    // Cerrar modal y limpiar
    this.isExportModalOpen = false;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.ordenarPor = 'Mas recientes';
  }

  abrirDetalle(registro: any) {
    this.registroSeleccionado = registro;
    this.isDetalleModalOpen = true;
  }

  cerrarDetalle() {
    this.isDetalleModalOpen = false;
    this.registroSeleccionado = null;
  }
}
