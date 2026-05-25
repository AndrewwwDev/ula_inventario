import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule],
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
  bitacoraFilter: string | null = null;

  // Bitacora KPIs
  kpiTotalLogs = 0;
  kpiMantenimientoLogs = 0;
  kpiAltasLogs = 0;
  kpiBajasLogs = 0;

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.loadBitacora();
  }

  loadBitacora() {
    this.inventarioService.getBitacora().subscribe((data: any) => {
      this.allBitacoraLogs = data;
      this.kpiTotalLogs = data.length;
      this.kpiMantenimientoLogs = data.filter((log: any) => log.accion.includes('MANTENIMIENTO')).length;
      this.kpiAltasLogs = data.filter((log: any) => log.accion === 'ALTA').length;
      this.kpiBajasLogs = data.filter((log: any) => log.accion === 'DESINCORPORACION').length;
      this.applyBitacoraFilter();
    });
  }

  parseDiff(diff: any): { key: string, old: string, new: string }[] {
    if (!diff) return [];
    return Object.keys(diff).map(key => ({
      key,
      old: diff[key].old,
      new: diff[key].new
    }));
  }

  applyBitacoraFilter(filter?: string | null) {
    if (filter !== undefined) {
      if (this.bitacoraFilter === filter) {
        this.bitacoraFilter = null;
      } else {
        this.bitacoraFilter = filter;
      }
    }

    let result = this.allBitacoraLogs;
    if (this.bitacoraFilter === 'MANTENIMIENTO') {
      result = result.filter(log => log.accion.includes('MANTENIMIENTO'));
    } else if (this.bitacoraFilter === 'ALTA') {
      result = result.filter(log => log.accion === 'ALTA');
    } else if (this.bitacoraFilter === 'DESINCORPORACION') {
      result = result.filter(log => log.accion === 'DESINCORPORACION');
    } else if (this.bitacoraFilter === 'MODIFICACION') {
      result = result.filter(log => log.accion === 'MODIFICACION');
    }

    this.bitacoraLogs = result;
    this.bitacoraCurrentPage = 1;
    this.displayedBitacoraLogs = this.bitacoraLogs.slice(0, this.bitacoraPageSize);
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
    if (log.entidad === 'bienes' && log.entidad_id) {
       this.inventarioService.getBienes().subscribe((data: any) => {
         this.selectedBien = data.find((b: any) => b.codigo_id === log.entidad_id);
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
}
