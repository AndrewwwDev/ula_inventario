import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { QRCodeModule } from 'angularx-qrcode';
import { ResponsableAutocompleteComponent } from '../../components/responsable-autocomplete/responsable-autocomplete.component';
import { PdfExportService } from '../../services/pdf-export.service';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';
import { NotificacionesService } from '../../services/notificaciones.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ResponsableAutocompleteComponent, QRCodeModule, RouterLink],
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
  personal: any[] = [];

  // --- Search & Filters ---
  searchQuery = '';
  searchSubject = new Subject<string>();
  sugerenciasBusqueda: any[] = [];
  mostrarDropdown = false;
  filtroUbicacion = '';
  filtroCategoria = '';
  filtroEstado = '';
  filtroCondicion = '';
  scannerActive = false;

  // --- Export & Additional Filters ---
  isExportModalOpen = false;
  fechaInicio = '';
  fechaFin = '';
  ordenarPor = 'Mas recientes'; // 'Mas recientes', 'Mas antiguos', 'Por Nombre/Codigo'

  constructor(
    private inventarioService: InventarioService,
    public toastService: ToastService,
    private route: ActivatedRoute,
    private pdfExportService: PdfExportService,
    private supabaseService: SupabaseService,
    private authService: AuthService,
    public notificacionesService: NotificacionesService
  ) { }

  currentUser: any = null;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.loadOptions();
    this.loadInventory();
    
    // Autocompletado Búsqueda Dual con RxJS
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchQuery = term;
      if (term.length >= 2) {
        this.generarSugerencias(term);
      } else {
        this.sugerenciasBusqueda = [];
        this.mostrarDropdown = false;
      }
      this.applyFilters();
    });
    
    // Check if we need to open a specific modal from another view
    this.route.queryParams.subscribe(params => {
      if (params['condicion']) {
        this.filtroCondicion = params['condicion'];
      }
      if (params['estado']) {
        this.filtroEstado = params['estado'];
      }
      
      if (this.allInventory && this.allInventory.length > 0) {
        this.applyFilters();
      }
      if (params['action'] === 'mantenimiento' && params['id']) {
        // Wait for inventory to load to find the item
        setTimeout(() => {
          const itemToMaintain = this.allInventory.find(i => i.codigo_id === params['id']);
          if (itemToMaintain) {
            this.openMantenimientoModal(itemToMaintain);
          }
        }, 800);
      }
      if (params['action'] === 'editar' && params['id']) {
        setTimeout(() => {
          const itemToEdit = this.allInventory.find(i => i.codigo_id === params['id']);
          if (itemToEdit) {
            this.openEditModal(itemToEdit);
          }
        }, 800);
      }
    });
  }

  loadInventory() {
    let inicioValido = this.fechaInicio && this.fechaInicio.trim() !== '' ? this.fechaInicio : undefined;
    let finValido = this.fechaFin && this.fechaFin.trim() !== '' ? this.fechaFin : undefined;

    if (inicioValido && isNaN(new Date(inicioValido).getTime())) inicioValido = undefined;
    if (finValido && isNaN(new Date(finValido).getTime())) finValido = undefined;

    this.inventarioService.getBienes(inicioValido, finValido).subscribe({
      next: (data: any) => {
        if (!data || data.length === 0) {
          this.toastService.show('Error: No se pudieron cargar los datos del servidor o no hay bienes.', 'error');
        }
        this.allInventory = (data || []).filter((item: any) => item.cat_estados?.nombre !== 'Desincorporado');
        
        // NUEVO: Verificación de filtros en espera tras la carga
        if (this.filtroCondicion || this.filtroEstado) {
          this.applyFilters();
        } else {
          this.applyFilters(); // Aplicamos filtro inicial por si hay búsqueda por defecto
        }
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
    this.inventarioService.getAreas().subscribe((res: any) => {
      this.cat_areas = res || [];
    });

    // Cargar personal para el mapeo de nombres en modales (Requerimiento 1)
    this.inventarioService.getPersonalActivo().subscribe({
      next: (data) => {
        this.personal = data;
      }
    });
  }

  // Phase 1: Mapeo Relacional de Encargado en Traslados
  obtenerNombreEncargadoActual(): string {
    if (!this.bienATrasladar || !this.bienATrasladar.personal_cedula || !this.personal || this.personal.length === 0) {
      return 'Sin Asignación';
    }
    const persona = this.personal.find((p: any) => p.cedula === this.bienATrasladar.personal_cedula);
    return persona ? `${persona.nombres} ${persona.apellidos}` : 'Sin Asignación';
  }

  obtenerNombrePorCedula(cedula: string): string {
    if (!cedula) return 'Sin Asignación';
    if (!this.personal || this.personal.length === 0) return 'Sin Asignación';
    const persona = this.personal.find(p => p.cedula === cedula);
    return persona ? `${persona.nombres} ${persona.apellidos}` : 'Personal no registrado';
  }

  // --- Search Autocomplete ---
  async generarSugerencias(evento: any) {
    // 1. Extracción ultra-segura del valor (Soporta evento nativo, ngModel, o FormControl)
    const valor = evento?.target?.value ?? evento?.value ?? evento;

    if (typeof valor !== 'string') {
        return; // Si no es un string válido, aborta silenciosamente
    }

    const termino = valor.trim().toLowerCase();
    
    // 2. Limpieza básica y reseteo
    if (termino.length < 2) {
      this.sugerenciasBusqueda = [];
      this.mostrarDropdown = false;
      this.loadInventory(); // Recarga la tabla inicial si se borra el texto
      return;
    }

    try {
      // BÚSQUEDA PARALELA (Omnibox)
      const [resBienes, resPersonal] = await Promise.all([
        // 1. Busca en equipos
        this.supabaseService.supabase.from('bienes')
          .select('codigo_id, nombre')
          .or(`nombre.ilike.%${termino}%,codigo_id.ilike.%${termino}%`)
          .limit(5),
        // 2. Busca en personas
        this.supabaseService.supabase.from('personal')
          .select('cedula, nombres, apellidos')
          .or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%`)
          .limit(5)
      ]);

      const sugerencias: any[] = [];

      // Mapear equipos encontrados
      if (resBienes.data) {
        resBienes.data.forEach(b => {
          sugerencias.push({
            textoVisible: `💻 ${b.nombre} (ID: ${b.codigo_id})`,
            valorBusqueda: b.codigo_id,
            tipo: 'bien'
          });
        });
      }

      // Mapear personas encontradas
      if (resPersonal.data) {
        resPersonal.data.forEach(u => {
          sugerencias.push({
            textoVisible: `👤 ${u.nombres} ${u.apellidos} (C.I: ${u.cedula})`,
            valorBusqueda: u.cedula,
            tipo: 'personal'
          });
        });
      }

      this.sugerenciasBusqueda = sugerencias;
      this.mostrarDropdown = this.sugerenciasBusqueda.length > 0;

    } catch (error) {
      console.error('[Error Omnibox] Fallo en la búsqueda:', error);
      this.mostrarDropdown = false;
    }
  }

  seleccionarSugerencia(sug: any) {
    this.searchQuery = sug.valorBusqueda;
    this.mostrarDropdown = false;
    this.applyFilters();
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
    if (!this.searchQuery) {
      this.applyFilters();
    }
  }

  @HostListener('document:click', ['$event'])
  cerrarDropdownBusqueda(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.search-container')) {
      this.mostrarDropdown = false;
    }
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
        (item.nombre && item.nombre?.toLowerCase().includes(q)) ||
        (item.codigo_id && item.codigo_id?.toLowerCase().includes(q)) ||
        (item.descripcion && item.descripcion?.toLowerCase().includes(q)) ||
        (item.serial && item.serial?.toLowerCase().includes(q)) ||
        (item.marca && item.marca?.toLowerCase().includes(q)) ||
        (item.modelo && item.modelo?.toLowerCase().includes(q)) ||
        (item.personal_cedula && item.personal_cedula?.toLowerCase().includes(q))
      );
    }

    // Filtro por fecha
    if (this.fechaInicio && this.fechaInicio.trim() !== '') {
      const inicio = new Date(this.fechaInicio).getTime();
      if (!isNaN(inicio)) {
        result = result.filter(item => new Date(item.fecha_registro).getTime() >= inicio);
      }
    }
    
    if (this.fechaFin && this.fechaFin.trim() !== '') {
      const fin = new Date(this.fechaFin);
      if (!isNaN(fin.getTime())) {
        fin.setHours(23, 59, 59, 999);
        result = result.filter(item => new Date(item.fecha_registro).getTime() <= fin.getTime());
      }
    }

    // Ordenamiento
    result.sort((a, b) => {
      if (this.ordenarPor === 'Mas antiguos') {
        return new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime();
      } else if (this.ordenarPor === 'Por Nombre/Codigo') {
        const nameA = (a.nombre || a.codigo_id || '').toLowerCase();
        const nameB = (b.nombre || b.codigo_id || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        // Por defecto 'Mas recientes'
        return new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime();
      }
    });

    this.filteredInventory = result;
    this.currentPage = 1;
    this.displayedInventory = this.filteredInventory.slice(0, this.pageSize);
  }

  obtenerDatosFiltrados() {
    return this.filteredInventory;
  }

  exportarPDF() {
    const datos = this.obtenerDatosFiltrados();

    if (datos.length === 0) {
      this.toastService.show('No hay datos para exportar con los filtros actuales.', 'warning');
      return;
    }

    const columnas = ['Código', 'Nombre', 'Categoría', 'Ubicación', 'Condición', 'Fecha'];
    const dataFilas = datos.map(item => [
      item.codigo_id || 'N/A',
      item.nombre || 'N/A',
      item.categorias?.nombre || item.categoria_id || 'N/A',
      item.cat_ubicaciones?.nombre || item.ubicacion_id || 'N/A',
      item.condicion_fisica || 'N/A',
      item.fecha_registro ? new Date(item.fecha_registro).toLocaleDateString() : 'N/A'
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

    this.pdfExportService.generarReporte('Reporte de Inventario de Bienes', columnas, dataFilas, periodo);

    // Cerrar modal y limpiar
    this.isExportModalOpen = false;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.ordenarPor = 'Mas recientes';
    this.applyFilters();
  }

  aplicarFiltroFecha() {
    this.loadInventory();
  }



  limpiarTodosLosFiltros() {
    this.searchQuery = '';
    this.filtroUbicacion = '';
    this.filtroCategoria = '';
    this.filtroEstado = '';
    this.filtroCondicion = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.loadInventory();
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
        this.applyFilters();
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

  aceptaResponsabilidad = false;
  isSubmitting = false;

  nuevoBien: any = { condicion_fisica: 'Buen estado' };
  editingBien: any = {};
  bienATrasladar: any = null;
  datosTraslado: any = {
    tipoTraslado: '',
    ubicacion_id: '',
    area_id: '',
    personal_cedula: ''
  };
  bienADesincorporar: any = null;
  bienSeleccionado: any = null;
  bienAMantenimiento: any = null;
  tipoMantenimiento: string = '';
  reportarFalla: boolean = false;
  motivoMantenimiento: string = '';
  selectedFile: File | null = null;
  motivoDesincorporacion = '';
  fechaDesincorporacion = new Date().toISOString().split('T')[0];

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

    // 1. Lógica de Extracción de Identificador y Validación Estricta
    let cedulaValidada: string | null = null;
    const responsableInput = this.nuevoBien.personal_cedula || this.nuevoBien.responsable_cedula;

    if (responsableInput) {
      if (typeof responsableInput === 'object' && 'cedula' in responsableInput) {
        // Si el autocompletado pasó el objeto completo, extraemos la cédula
        cedulaValidada = responsableInput.cedula;
      } else if (typeof responsableInput === 'string' && responsableInput.trim() !== '') {
        // Si pasó un string, verificamos si es una cédula válida (Ej: V-12345678 o 12345678)
        // Ajustamos la regex para permitir prefijos V-, E-, J- y números
        const esCedulaValida = /^([VvEeJjPpGg]-?)?\d+$/.test(responsableInput.trim());
        
        // Si es válida, la usamos; si no, forzamos null para no enviar texto basura
        cedulaValidada = esCedulaValida ? responsableInput.trim().toUpperCase() : null;
      }
    }

    // 2. Empaquetado del Payload unificado
    this.nuevoBien.personal_cedula = cedulaValidada;
    delete this.nuevoBien.responsable_cedula; // Limpieza obligatoria por seguridad

    let payload: any = { ...this.nuevoBien };

    console.log('🔴 DEEP DEBUGGING - Payload Local antes de Supabase:', payload);

    if (this.selectedFile) {
      payload = new FormData();
      Object.keys(this.nuevoBien).forEach(k => {
        // Ignoramos nulos, undefined y la llave antigua
        if (this.nuevoBien[k] !== undefined && this.nuevoBien[k] !== null && k !== 'responsable_cedula') {
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
        this.toastService.show('Error al registrar bien: ' + (err.error?.message || err.message), 'error');
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
      ubicacion_id: item.ubicacion_id || '',
      area_id: item.area_id || '',
      personal_cedula: item.personal_cedula || ''
    };
    this.showTrasladoModal = true;
  }

  get esTrasladoValido(): boolean {
    if (!this.bienATrasladar) return false;
    const ubicacionSinCambio = this.datosTraslado.ubicacion_id === this.bienATrasladar.ubicacion_id;
    const areaSinCambio = this.datosTraslado.area_id === this.bienATrasladar.area_id;
    const responsableSinCambio = String(this.datosTraslado.personal_cedula || '').trim() === String(this.bienATrasladar.personal_cedula || '').trim();

    // Es inválido si NADA cambió o si hay campos vacíos obligatorios
    if (!this.datosTraslado.ubicacion_id || !this.datosTraslado.area_id) return false;

    return !(ubicacionSinCambio && areaSinCambio && responsableSinCambio);
  }

  confirmarTraslado() {
    if (!this.bienATrasladar || !this.datosTraslado.ubicacion_id || !this.datosTraslado.personal_cedula) return;

    this.isSubmitting = true;
    
    const accion = this.datosTraslado.tipoTraslado === 'Interno' ? 'TRASLADO_INTERNO' : 'TRASLADO_EXTERNO';
    const mensajeAuditoria = `Equipo trasladado a nueva ubicación [ID: ${this.datosTraslado.ubicacion_id}] y entregado a [${this.datosTraslado.personal_cedula}]`;

    const payloadUpdate = {
      ...this.bienATrasladar,
      ubicacion_id: this.datosTraslado.ubicacion_id,
      area_id: this.datosTraslado.area_id,
      personal_cedula: this.datosTraslado.personal_cedula
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
    if (item.cat_estados?.nombre === 'Mantenimiento') { return; }
    this.bienAMantenimiento = item;
    this.tipoMantenimiento = '';
    this.motivoMantenimiento = '';
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
    this.mostrarHojaVida = false;
    this.historialActivo = [];
  }

  // --- Estado del Acordeón y Bitácora ---
  mostrarHojaVida = false;
  historialActivo: any[] = [];
  cargandoHistorial = false;

  toggleHojaVida() {
    this.mostrarHojaVida = !this.mostrarHojaVida;
    if (this.mostrarHojaVida && this.historialActivo.length === 0) {
      this.cargarHistorialActivo();
    }
  }

  async cargarHistorialActivo() {
    if (!this.bienSeleccionado?.codigo_id) return;
    this.cargandoHistorial = true;
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('bitacora')
        .select(`
          *,
          usuarios ( nombres, apellidos )
        `)
        .eq('codigo_bien', this.bienSeleccionado.codigo_id)
        .order('fecha_hora', { ascending: false });
      
      if (error) throw error;
      this.historialActivo = data || [];
    } catch (err) {
      console.error('Error al cargar la bitácora del bien', err);
      this.toastService.show('Error al cargar la hoja de vida', 'error');
    } finally {
      this.cargandoHistorial = false;
    }
  }

  exportarHojaVidaPDF() {
    if (!this.bienSeleccionado) return;
    import('jspdf').then(jsPDF => {
      import('jspdf-autotable').then(autoTable => {
        const doc = new jsPDF.default();
        doc.text(`Hoja de Vida del Activo - ${this.bienSeleccionado.codigo_id}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Nombre: ${this.bienSeleccionado.nombre}`, 14, 25);
        doc.text(`Serial: ${this.bienSeleccionado.serial || 'N/A'}`, 14, 30);
        
        const tableData = this.historialActivo.map(h => [
          new Date(h.fecha_hora).toLocaleDateString() + ' ' + new Date(h.fecha_hora).toLocaleTimeString(),
          h.tipo_accion,
          h.detalles_json?.mensaje || 'N/A',
          h.detalles_json?.usuario_nombre || 'N/A'
        ]);

        autoTable.default(doc, {
          head: [['Fecha', 'Acción', 'Detalle', 'Responsable']],
          body: tableData,
          startY: 40,
          styles: { fontSize: 8 }
        });

        doc.save(`Hoja_Vida_${this.bienSeleccionado.codigo_id}.pdf`);
      });
    });
  }

  registroSeleccionado: any = null;

  abrirDetalles(item: any) {
    console.log('Objeto completo de la bitácora:', item);
    this.registroSeleccionado = item;
  }

  cerrarDetalles() {
    this.registroSeleccionado = null;
  }

  obtenerDetallesLista(item: any): { clave: string, valor: any }[] {
    if (!item) return [];

    // 1. Diagnóstico: Recopilamos todos los campos relevantes de la bitácora
    const camposRelevantes = {
      'Acción': item.accion || item.action || item.tipo_accion,
      'Comentarios': item.comentarios || item.observaciones || item.descripcion || item.mensaje,
      'Detalles Técnicos': item.detalles || item.detalles_json, 
      'Ubicación Origen': item.origen || item.ubicacion_anterior,
      'Ubicación Destino': item.destino || item.nueva_ubicacion,
      'Motivo': item.motivo || item.razon
    };

    // 2. Transformación: Filtramos solo lo que tiene valor real
    return Object.entries(camposRelevantes)
      .filter(([_, valor]) => valor !== null && valor !== undefined && valor !== '')
      .map(([clave, valor]) => ({
        clave: clave.toUpperCase(),
        valor: (typeof valor === 'object') ? JSON.stringify(valor) : valor
      }));
  }

  cerrarModalMantenimiento() {
    this.showMantenimientoModal = false;
    this.tipoMantenimiento = '';
    this.motivoMantenimiento = '';
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
    if (!this.bienAMantenimiento || !this.tipoMantenimiento || !this.motivoMantenimiento || this.motivoMantenimiento.trim().length < 5) return;

    this.isSubmitting = true;
    const fallaFinal = `${this.tipoMantenimiento} - Motivo: ${this.motivoMantenimiento}`;
    
    const cedulaSolicitante = this.currentUser?.cedula || '00000000';
    const nombreSolicitante = this.currentUser ? `${this.currentUser.nombres} ${this.currentUser.apellidos}` : 'Desconocido';

    const payload = {
      codigo_id: this.bienAMantenimiento.codigo_id,
      motivo_falla: fallaFinal,
      cedula_solicitante: cedulaSolicitante,
      nombre_solicitante: nombreSolicitante
    };

    this.inventarioService.enviarAMantenimiento(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showMantenimientoModal = false;
        this.toastService.show('Bien enviado a mantenimiento exitosamente', 'success');
        this.loadInventory();
        if (this.notificacionesService) {
          this.notificacionesService.actualizarNotificaciones();
        }
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
    this.aceptaResponsabilidad = false;
  }

  generarUrlQR(codigoId: string): string {
    return 'https://ula-inventario.vercel.app/bien/' + codigoId;
  }

  imprimirQR(): void {
    window.print();
  }

  getEstadosPermitidos(responsableCedula: string | null | undefined, currentStateId?: string): any[] {
    const isSinAsignar = !responsableCedula || responsableCedula.trim() === '';
    
    // Identificar el ID del estado 'Mantenimiento' si existe en cat_estados
    const estadoMantenimiento = this.cat_estados.find(est => est.nombre === 'Mantenimiento');
    const isCurrentlyMantenimiento = estadoMantenimiento && currentStateId === estadoMantenimiento.id;

    if (isSinAsignar) {
      return this.cat_estados.filter(est => est.nombre === 'Sin Asignación');
    } else {
      return this.cat_estados.filter(est => {
        // Excluir permanentemente Desincorporado y Sin Asignación
        if (est.nombre === 'Sin Asignación' || est.nombre === 'Desincorporado') return false;
        
        // Excluir Mantenimiento, A MENOS que sea el estado actual (para que el HTML pueda renderizarlo bloqueado)
        if (est.nombre === 'Mantenimiento') {
          return isCurrentlyMantenimiento;
        }
        
        return true;
      });
    }
  }

  isMantenimiento(estadoId: string | undefined): boolean {
    if (!estadoId) return false;
    const estado = this.cat_estados.find(e => e.id === estadoId);
    return estado ? estado.nombre === 'Mantenimiento' : false;
  }

  onResponsableChange(cedula: string | undefined, isEdit: boolean) {
    const isSinAsignar = !cedula || cedula.trim() === '';
    const targetObj = isEdit ? this.editingBien : this.nuevoBien;
    
    const estadoSinAsignacion = this.cat_estados.find(e => e.nombre === 'Sin Asignación');
    const estadoActivo = this.cat_estados.find(e => e.nombre === 'Activo');

    if (isSinAsignar && estadoSinAsignacion) {
      targetObj.estado_id = estadoSinAsignacion.id;
    } else if (!isSinAsignar && targetObj.estado_id === estadoSinAsignacion?.id && estadoActivo) {
      targetObj.estado_id = estadoActivo.id;
    }
  }
}


