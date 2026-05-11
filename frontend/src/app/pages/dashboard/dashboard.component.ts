import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  
  showAddModal = false;
  user: any = null;
  // --- Inventory Data & Infinite Scroll ---
  allInventory: any[] = [];
  filteredInventory: any[] = [];
  displayedInventory: any[] = [];
  pageSize = 12;
  currentPage = 1;
  isLoadingMore = false;

  // --- Search & Filters ---
  searchQuery = '';
  searchResults: any[] = [];
  showAutocomplete = false;
  activeFilter: string | null = null;

  // --- Sidebar ---
  isSidebarOpen = false;

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
  categorias: any[] = [];
  dependencias: any[] = [];
  encargados: any[] = [];

  // Form Model
  newBien: any = {
    nombre: '',
    codigo: '',
    categoria_id: null,
    encargado_id: null,
    ubicacion_id: null,
    descripcion: '',
    estado_operativo: 'Activo',
    condicion_fisica: 'Buen estado',
    especificaciones_condicion: ''
  };

  isSubmitting = false;
  isEditMode = false;
  editingBienId: number | null = null;

  showDesincorporarModal = false;
  confirmarDesincorporacion = false;
  motivoDesincorporacion = '';
  fechaDesincorporacion = '';
  selectedFile: File | null = null;

  showDetailsModal = false;
  selectedItemDetails: any = null;

  currentView: 'inicio' | 'inventario' | 'desincorporacion' | 'mantenimiento' | 'reportes' = 'inicio';
  desincorporados: any[] = [];

  // --- Mantenimiento ---
  mantenimientoTab: 'alertas' | 'reparacion' | 'historial' = 'alertas';
  alertasMantenimiento: any[] = [];
  enReparacion: any[] = [];
  historialMantenimiento: any[] = [];
  
  showFinalizarModal = false;
  trabajoRealizado = '';
  proximaFechaMantenimiento = '';
  finalizandoBienId: number | null = null;
  
  // --- Bitacora ---
  bitacoraLogs: any[] = [];

  constructor(
    private authService: AuthService, 
    private router: Router,
    private inventarioService: InventarioService,
    public toastService: ToastService
  ) {}

  stats = [
    { label: 'Total de bienes', value: '0', icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Activos', value: '0', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Inactivos', value: '0', icon: 'cancel', color: 'text-gray-500', bg: 'bg-gray-100' },
    { label: 'En Mantenimiento', value: '0', icon: 'build', color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Buen estado', value: '0', icon: 'thumb_up', color: 'text-teal-500', bg: 'bg-teal-100' },
    { label: 'Regular', value: '0', icon: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'Mal estado', value: '0', icon: 'thumb_down', color: 'text-red-500', bg: 'bg-red-100' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.user = user;
      }
    });
    this.loadInventory();
  }

  loadInventory() {
    this.inventarioService.getBienes().subscribe((data: any) => {
      this.allInventory = data;
      this.applyFilters();
      this.stats[0].value = this.allInventory.length.toString();
      this.stats[1].value = this.allInventory.filter((i: any) => i.estado_operativo === 'Activo').length.toString();
      this.stats[2].value = this.allInventory.filter((i: any) => i.estado_operativo === 'Inactivo').length.toString();
      this.stats[3].value = this.allInventory.filter((i: any) => i.estado_operativo === 'Mantenimiento').length.toString();
      this.stats[4].value = this.allInventory.filter((i: any) => i.condicion_fisica === 'Buen estado').length.toString();
      this.stats[5].value = this.allInventory.filter((i: any) => i.condicion_fisica === 'Regular').length.toString();
      this.stats[6].value = this.allInventory.filter((i: any) => i.condicion_fisica === 'Mal estado').length.toString();
    });
    if (this.currentView === 'desincorporacion') {
      this.inventarioService.getBienesDesincorporados().subscribe((data: any) => {
        this.desincorporados = data;
      });
    }
    if (this.currentView === 'mantenimiento') {
      this.loadMantenimientoData();
    }
    if (this.currentView === 'reportes') {
      this.loadBitacora();
    }
  }

  loadMantenimientoData() {
    this.inventarioService.getAlertasMantenimiento().subscribe((data: any) => this.alertasMantenimiento = data);
    this.inventarioService.getEnReparacion().subscribe((data: any) => this.enReparacion = data);
    this.inventarioService.getHistorialMantenimiento().subscribe((data: any) => this.historialMantenimiento = data);
  }

  loadBitacora() {
    this.inventarioService.getBitacora().subscribe((data: any) => this.bitacoraLogs = data);
  }

  switchView(view: 'inicio' | 'inventario' | 'desincorporacion' | 'mantenimiento' | 'reportes') {
    this.currentView = view;
    this.loadInventory();
  }

  switchMantenimientoTab(tab: 'alertas' | 'reparacion' | 'historial') {
    this.mantenimientoTab = tab;
  }

  loadDropdowns() {
    this.inventarioService.getCategorias().subscribe((data: any) => this.categorias = data);
    this.inventarioService.getDependencias().subscribe((data: any) => this.dependencias = data);
    this.inventarioService.getEncargados().subscribe((data: any) => this.encargados = data);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleAddModal() {
    this.isEditMode = false;
    this.editingBienId = null;
    this.confirmarDesincorporacion = false;
    this.motivoDesincorporacion = '';
    this.fechaDesincorporacion = '';
    this.newBien = { 
      nombre: '', 
      codigo: '', 
      categoria_id: null, 
      encargado_id: null, 
      ubicacion_id: null, 
      descripcion: '', 
      estado_operativo: 'Activo',
      condicion_fisica: 'Buen estado',
      especificaciones_condicion: ''
    };
    this.showAddModal = !this.showAddModal;
    if (this.showAddModal && this.categorias.length === 0) {
      this.loadDropdowns();
    }
  }

  openDesincorporarModal(item: any) {
    this.editingBienId = item.id;
    this.confirmarDesincorporacion = false;
    this.motivoDesincorporacion = '';
    this.fechaDesincorporacion = '';
    this.selectedFile = null;
    this.showDesincorporarModal = true;
  }

  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  openEditModal(item: any) {
    this.isEditMode = true;
    this.editingBienId = item.id;
    this.newBien = {
      nombre: item.nombre,
      codigo: item.codigo,
      categoria_id: item.categoria ? item.categoria.id : null,
      encargado_id: item.encargado ? item.encargado.id : null,
      ubicacion_id: item.ubicacion ? item.ubicacion.id : null,
      descripcion: item.descripcion || '',
      estado_operativo: item.estado_operativo,
      condicion_fisica: item.condicion_fisica || 'Buen estado',
      especificaciones_condicion: item.especificaciones_condicion || ''
    };
    this.showAddModal = true;
    if (this.categorias.length === 0) {
      this.loadDropdowns();
    }
  }

  saveBien() {
    if (!this.newBien.nombre || !this.newBien.codigo) {
      alert('Por favor llene los campos requeridos (Nombre, Código)');
      return;
    }
    this.isSubmitting = true;

    if (this.isEditMode && this.editingBienId) {
      this.inventarioService.updateBien(this.editingBienId, this.newBien).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.toastService.show('Guardado exitosamente', 'success');
          this.loadInventory();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.toastService.show('Error al actualizar: ' + (err.error?.message || err.message), 'error');
        }
      });
    } else {
      this.inventarioService.createBien(this.newBien).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.toastService.show('Guardado exitosamente', 'success');
          this.loadInventory();
        },
        error: (err: any) => {
          this.isSubmitting = false;
          this.toastService.show('Error al guardar: ' + (err.error?.message || err.message), 'error');
        }
      });
    }
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
      alert('Debe adjuntar una fotografía del bien.');
      return;
    }

    this.isSubmitting = true;
    this.inventarioService.desincorporarBien(this.editingBienId, this.motivoDesincorporacion, this.fechaDesincorporacion, this.selectedFile).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showDesincorporarModal = false;
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Error al desincorporar: ' + (err.error?.message || err.message));
      }
    });
  }

  openDetailsModal(item: any) {
    this.selectedItemDetails = item;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedItemDetails = null;
  }

  // --- Mantenimiento Methods ---
  openFinalizarMantenimiento(item: any) {
    this.finalizandoBienId = item.id;
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
        this.loadInventory();
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.toastService.show('Fallo en la operación: ' + (err.error?.message || err.message), 'error');
      }
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

  // --- Filtering & Infinite Scroll ---
  applyFilters() {
    let result = this.allInventory;
    
    if (this.activeFilter) {
      result = result.filter(item => item.estado_operativo === this.activeFilter);
    }
    
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.nombre && item.nombre.toLowerCase().includes(q)) || 
        (item.codigo && item.codigo.toLowerCase().includes(q)) ||
        (item.encargado?.nombre && item.encargado.nombre.toLowerCase().includes(q))
      );
    }
    
    this.filteredInventory = result;
    this.currentPage = 1;
    this.displayedInventory = this.filteredInventory.slice(0, this.pageSize);
  }

  onSearchInput() {
    if (this.searchQuery && this.searchQuery.trim().length > 0) {
      const q = this.searchQuery.toLowerCase();
      this.searchResults = this.allInventory.filter(item => 
        (item.nombre && item.nombre.toLowerCase().includes(q)) || 
        (item.codigo && item.codigo.toLowerCase().includes(q)) ||
        (item.encargado?.nombre && item.encargado.nombre.toLowerCase().includes(q))
      ).slice(0, 5);
      this.showAutocomplete = this.searchResults.length > 0;
    } else {
      this.searchResults = [];
      this.showAutocomplete = false;
    }
    this.applyFilters();
  }

  selectSearchResult(item: any) {
    this.searchQuery = item.codigo;
    this.showAutocomplete = false;
    this.applyFilters();
  }

  applyQuickFilter(status: string | null) {
    if (this.activeFilter === status) {
      this.activeFilter = null;
    } else {
      this.activeFilter = status;
    }
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
    }, 500); // simulated loading time
  }
}
