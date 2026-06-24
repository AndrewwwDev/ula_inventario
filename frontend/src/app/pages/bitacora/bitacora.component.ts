import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { PdfExportService } from '../../services/pdf-export.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bitacora.component.html'
})
export class BitacoraComponent implements OnInit {

  // --- Bitacora ---
  allBitacoraLogs: any[] = [];
  bitacoraLogs: any[] = [];
  displayedBitacoraLogs: any[] = [];
  bitacoraPageSize = 10;
  bitacoraCurrentPage = 1;
  isLoadingMoreBitacora = false;
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroAccion: string = '';



  constructor(
    private inventarioService: InventarioService,
    private pdfExportService: PdfExportService,
    public toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadBitacora();
  }

  loadBitacora() {
    this.aplicarFiltros();
  }

  parseDiff(diff: any): { key: string, old: string, new: string }[] {
    if (!diff) return [];
    return Object.keys(diff).map(key => ({
      key,
      old: diff[key].old,
      new: diff[key].new
    }));
  }

  aplicarFiltros() {
    this.inventarioService.getBitacora(this.fechaInicio, this.fechaFin).subscribe((data: any) => {
      this.allBitacoraLogs = data;

      if (this.filtroAccion) {
        this.bitacoraLogs = this.allBitacoraLogs.filter(log => log.accion === this.filtroAccion);
      } else {
        this.bitacoraLogs = this.allBitacoraLogs;
      }
      
      this.bitacoraCurrentPage = 1;
      this.displayedBitacoraLogs = this.bitacoraLogs.slice(0, this.bitacoraPageSize);
    });
  }

  limpiarTodosLosFiltros() {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroAccion = '';
    this.aplicarFiltros();
  }

  exportarPDF() {
    const datos = this.bitacoraLogs;

    if (!datos || datos.length === 0) {
      if (this.toastService) {
        this.toastService.show('No hay datos para exportar con los filtros actuales.', 'warning');
      }
      return;
    }

    const columnas = ['Usuario', 'Acción Realizada', 'Bien/Entidad', 'Detalles', 'Fecha/Hora'];
    const dataFilas = datos.map(item => {
      const accionStr = item.accion ? item.accion.replace(/_/g, ' ') : 'Desconocida';
      const usuarioStr = item.usuarios?.nombres ? `${item.usuarios.nombres} ${item.usuarios.apellidos} (C.I. ${item.cedula_usuario})` : item.cedula_usuario || 'Sistema';
      const bienStr = item.codigo_bien || 'N/A';
      const detallesStr = item.detalles?.mensaje || (this.isString(item.detalles) ? item.detalles : 'Sin detalles adicionales');
      const fechaStr = item.fecha_hora ? new Date(item.fecha_hora).toLocaleString() : 'N/A';
      
      return [usuarioStr, accionStr, bienStr, detallesStr, fechaStr];
    });

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

    this.pdfExportService.generarReporte('Reporte de Bitácora y Auditoría', columnas, dataFilas, periodo);
  }



  onBitacoraScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
      this.loadMoreBitacoraLogs();
    }
  }

  loadMoreBitacoraLogs() {
    if (this.isLoadingMoreBitacora || this.displayedBitacoraLogs.length >= this.bitacoraLogs.length) return;

    this.isLoadingMoreBitacora = true;
    setTimeout(() => {
      this.bitacoraCurrentPage++;
      const nextItems = this.bitacoraLogs.slice(
        (this.bitacoraCurrentPage - 1) * this.bitacoraPageSize,
        this.bitacoraCurrentPage * this.bitacoraPageSize
      );
      this.displayedBitacoraLogs = [...this.displayedBitacoraLogs, ...nextItems];
      this.isLoadingMoreBitacora = false;
    }, 500);
  }

  selectedLog: any = null;
  selectedBien: any = null;
  showModal = false;

  isString(val: any): boolean {
    return typeof val === 'string';
  }

  abrirDetalle(log: any) {
    this.selectedLog = log;
    this.showModal = true;
    if (log.codigo_bien) {
       this.inventarioService.getBienes().subscribe((data: any) => {
         this.selectedBien = data.find((b: any) => b.codigo_id === log.codigo_bien);
       });
    } else {
       this.selectedBien = null;
    }
  }

  cerrarDetalle() {
    this.showModal = false;
    this.selectedLog = null;
    this.selectedBien = null;
  }

  getChangedFields(log: any): {key: string, old: any, new: any}[] {
    const oldData = log.detalles?.datos_anteriores;
    const newData = log.detalles?.datos_nuevos;
    if (!oldData || !newData) return [];
    
    const changes: {key: string, old: any, new: any}[] = [];
    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes.push({
          key,
          old: oldData[key],
          new: newData[key]
        });
      }
    }
    return changes;
  }

  getInsertedOrDeletedFields(data: any): {key: string, value: any}[] {
    if (!data) return [];
    return Object.keys(data).map(key => ({
      key,
      value: data[key]
    })).filter(item => item.value !== null && typeof item.value !== 'object');
  }
}
