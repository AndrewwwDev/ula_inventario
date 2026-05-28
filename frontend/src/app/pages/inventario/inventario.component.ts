import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ResponsableAutocompleteComponent } from '../../components/responsable-autocomplete/responsable-autocomplete.component';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ResponsableAutocompleteComponent],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {
  
  // --- Inventory Data & Infinite Scroll ---
  allInventory: any[] = [];
  filteredInventory: any[] = [];
  displayedInventory: any[] = [];
  pageSize = 12;
  currentPage = 1;
  isLoadingMore = false;

  // --- Select Options Data ---
  categorias: any[] = [];
  cat_estados: any[] = [];
  cat_ubicaciones: any[] = [];
  cat_areas: any[] = [];

  // --- Search & Filters ---
  searchQuery = '';
  filtroUbicacion = '';
  filtroCategoria = '';
  filtroEstado = '';
  filtroCondicion = '';
  scannerActive = false;

  constructor(
    private inventarioService: InventarioService,
    public toastService: ToastService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadOptions();
    this.route.queryParams.subscribe(params => {
      if (params['estado']) {
        this.filtroEstado = params['estado'];
      }
      this.loadInventory();
    });
  }

  loadInventory() {
    this.inventarioService.getBienes().subscribe({
      next: (data: any) => {
        if (!data || data.length === 0) {
          this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
        }
        this.allInventory = (data || []).filter((item: any) => item.cat_estados?.nombre !== 'Desincorporado');
        this.applyFilters();
      },
      error: (err) => {
        this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
        this.allInventory = [];
        this.applyFilters();
      }
    });
  }

  loadOptions() {
    this.inventarioService.getCategorias().subscribe((res: any) => {
      this.categorias = res || [];
    });
    this.inventarioService.getCatEstados().subscribe((res: any) => {
      this.cat_estados = (res || []).filter((estado: any) => estado.nombre !== 'Desincorporado');
    });
    this.inventarioService.getUbicaciones().subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
        }
        this.cat_ubicaciones = res || [];
      },
      error: () => {
        this.cat_ubicaciones = [];
        this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
      }
    });
    this.inventarioService.getAreas().subscribe({
      next: (res: any) => {
        if (!res || res.length === 0) {
          this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
        }
        this.cat_areas = res || [];
      },
      error: () => {
        this.cat_areas = [];
        this.toastService.show('Error: No se pudieron cargar los datos del servidor. Verifica tus permisos', 'error');
      }
    });
  }

  // --- Filtering & Infinite Scroll ---
  applyFilters() {
    let result = this.allInventory;

    if (this.filtroUbicacion) {
      result = result.filter(item => item.ubicacion === this.filtroUbicacion);
    }
    
    if (this.filtroCategoria) {
      result = result.filter(item => item.categoria_id === this.filtroCategoria);
    }
    
    if (this.filtroEstado) {
      result = result.filter(item => item.estado_id === this.filtroEstado);
    }
    
    if (this.filtroCondicion) {
      result = result.filter(item => item.condicion_fisica === this.filtroCondicion);
    }

    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item =>
        (item.nombre && item.nombre.toLowerCase().includes(q)) ||
        (item.codigo_id && item.codigo_id.toLowerCase().includes(q)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(q))
      );
    }

    this.filteredInventory = result;
    this.currentPage = 1;
    this.displayedInventory = this.filteredInventory.slice(0, this.pageSize);
  }

  onSearchInput() {
    this.applyFilters();
  }

  onScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
      this.loadMoreItems();
    }
  }

  loadMoreItems() {
    if (this.isLoadingMore || this.displayedInventory.length >= this.filteredInventory.length) return;
    this.isLoadingMore = true;
    setTimeout(() => {
      this.currentPage++;
      const nextItems = this.filteredInventory.slice(
        (this.currentPage - 1) * this.pageSize,
        this.currentPage * this.pageSize
      );
      this.displayedInventory = [...this.displayedInventory, ...nextItems];
      this.isLoadingMore = false;
    }, 500); 
  }

  simulateScanner() {
    this.scannerActive = true;
    setTimeout(() => {
      this.scannerActive = false;
      if (this.allInventory.length > 0) {
        const randomItem = this.allInventory[Math.floor(Math.random() * this.allInventory.length)];
        this.searchQuery = randomItem.codigo_id;
        this.onSearchInput();
        this.toastService.show(`Código ${randomItem.codigo_id} escaneado con éxito`, 'success');
      } else {
        this.toastService.show('No hay bienes para escanear', 'warning');
      }
    }, 1500);
  }

  // --- Modals State & Logic ---
  showAddModal = false;
  showEditModal = false;
  showTrasladoModal = false;
  showDesincorporarModal = false;
  showMantenimientoModal = false;
  showVistaPreviaModal = false;
  isSubmitting = false;

  nuevoBien: any = { condicion_fisica: 'Buen estado' };
  editingBien: any = {};
  bienATrasladar: any = null;
  datosTraslado: any = {
    tipoTraslado: '',
    ubicacion_id: '',
    area_id: '',
    responsable_cedula: ''
  };
  bienADesincorporar: any = null;
  bienSeleccionado: any = null;
  bienAMantenimiento: any = null;

  selectedFile: File | null = null;
  motivoDesincorporacion = '';
  fechaDesincorporacion = new Date().toISOString().split('T')[0];
  motivoFalla = '';

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  toggleAddModal() {
    this.showAddModal = true;
    this.nuevoBien = { condicion_fisica: 'Buen estado' };
    this.selectedFile = null;
  }

  guardarBien() {
    this.isSubmitting = true;
    
    let payload: any = this.nuevoBien;
    if (this.selectedFile) {
      payload = new FormData();
      Object.keys(this.nuevoBien).forEach(k => {
        if (this.nuevoBien[k] !== undefined && this.nuevoBien[k] !== null) {
          payload.append(k, this.nuevoBien[k]);
        }
      });
      payload.append('imagen', this.selectedFile);
    }

    this.inventarioService.createBien(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAddModal = false;
        this.toastService.show('Bien registrado con éxito', 'success');
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Error al registrar: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  openEditModal(item: any) {
    this.editingBien = { ...item };
    this.selectedFile = null;
    this.showEditModal = true;
  }

  guardarEdicion() {
    this.isSubmitting = true;

    if (this.selectedFile) {
      const payload = new FormData();
      Object.keys(this.editingBien).forEach(k => {
        if (this.editingBien[k] !== undefined && this.editingBien[k] !== null && typeof this.editingBien[k] !== 'object') {
          payload.append(k, this.editingBien[k]);
        }
      });
      payload.append('imagen', this.selectedFile);

      this.inventarioService.updateBienWithFile(this.editingBien.codigo_id, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showEditModal = false;
          this.toastService.show('Bien actualizado con éxito', 'success');
          this.loadInventory();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.toastService.show('Error al actualizar: ' + (err.error?.message || err.message), 'error');
        }
      });
    } else {
      this.inventarioService.updateBien(this.editingBien.codigo_id, this.editingBien).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showEditModal = false;
          this.toastService.show('Bien actualizado con éxito', 'success');
          this.loadInventory();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.toastService.show('Error al actualizar: ' + (err.error?.message || err.message), 'error');
        }
      });
    }
  }

  openTrasladoModal(item: any) {
    this.bienATrasladar = item;
    this.datosTraslado = {
      tipoTraslado: 'Interno',
      ubicacion_id: '',
      area_id: '',
      responsable_cedula: ''
    };
    this.showTrasladoModal = true;
    this.showVistaPreviaModal = false;
  }

  confirmarTraslado() {
    if (!this.bienATrasladar || !this.datosTraslado.ubicacion_id || !this.datosTraslado.responsable_cedula) return;

    this.isSubmitting = true;
    
    const accion = this.datosTraslado.tipoTraslado === 'Interno' ? 'TRASLADO_INTERNO' : 'TRASLADO_EXTERNO';
    const mensajeAuditoria = `Equipo trasladado a nueva ubicación [ID: ${this.datosTraslado.ubicacion_id}] y entregado a [${this.datosTraslado.responsable_cedula}]`;

    const payloadUpdate = {
      ...this.bienATrasladar,
      ubicacion_id: this.datosTraslado.ubicacion_id,
      area_id: this.datosTraslado.area_id,
      responsable_cedula: this.datosTraslado.responsable_cedula
    };

    this.inventarioService.registrarTraslado(this.bienATrasladar.codigo_id, payloadUpdate, accion, mensajeAuditoria).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showTrasladoModal = false;
        this.toastService.show(`Comprobante de ${accion} generado con éxito`, 'success');
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Error al registrar traslado: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  openDesincorporarModal(item: any) {
    this.bienADesincorporar = item;
    this.motivoDesincorporacion = '';
    this.fechaDesincorporacion = new Date().toISOString().split('T')[0];
    this.selectedFile = null;
    this.showDesincorporarModal = true;
    this.showVistaPreviaModal = false;
  }

  openMantenimientoModal(item: any) {
    this.bienAMantenimiento = item;
    this.motivoFalla = '';
    this.selectedFile = null;
    this.showMantenimientoModal = true;
    this.showVistaPreviaModal = false;
  }

  abrirVistaPrevia(item: any) {
    this.bienSeleccionado = item;
    this.showVistaPreviaModal = true;
  }

  cerrarVistaPrevia() {
    this.showVistaPreviaModal = false;
    this.bienSeleccionado = null;
  }

  desincorporar() {
    if (!this.bienADesincorporar || !this.motivoDesincorporacion || !this.selectedFile) return;

    this.isSubmitting = true;
    this.inventarioService.desincorporarBien(
      this.bienADesincorporar.codigo_id, 
      this.motivoDesincorporacion, 
      this.fechaDesincorporacion, 
      this.selectedFile
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showDesincorporarModal = false;
        this.toastService.show('Bien desincorporado y registrado en auditoría', 'success');
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Error al desincorporar: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  enviarAMantenimiento() {
    if (!this.bienAMantenimiento || !this.motivoFalla) return;

    this.isSubmitting = true;
    const payload = {
      codigo_id: this.bienAMantenimiento.codigo_id,
      motivo_falla: this.motivoFalla
    };

    this.inventarioService.enviarAMantenimiento(payload, this.selectedFile).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showMantenimientoModal = false;
        this.toastService.show('Bien enviado a mantenimiento exitosamente', 'success');
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Error al enviar a mantenimiento: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  cerrarModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showTrasladoModal = false;
    this.showDesincorporarModal = false;
    this.showMantenimientoModal = false;
    this.showVistaPreviaModal = false;
    this.isSubmitting = false;
    this.selectedFile = null;
  }
}
