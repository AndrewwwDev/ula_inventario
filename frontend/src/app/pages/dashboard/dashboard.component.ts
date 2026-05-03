import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  
  showAddModal = false;
  user: any = null;
  inventory: any[] = [];
  categorias: any[] = [];
  dependencias: any[] = [];
  encargados: any[] = [];

  // Form Model
  newBien = {
    nombre: '',
    codigo: '',
    categoria_id: null,
    encargado_id: null,
    ubicacion_id: null,
    descripcion: '',
    estado_operativo: 'En uso'
  };

  isSubmitting = false;
  isEditMode = false;
  editingBienId: number | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private inventarioService: InventarioService
  ) {}

  stats = [
    { label: 'Total de bienes', value: '1,248', icon: 'inventory_2', color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'En buen estado', value: '11,11', icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Estado regular', value: '5', icon: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'En mal estado', value: '300', icon: 'cancel', color: 'text-red-500', bg: 'bg-red-100' }
  ];

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
      }
    });
    this.loadInventory();
  }

  loadInventory() {
    this.inventarioService.getBienes().subscribe(data => {
      this.inventory = data;
      this.stats[0].value = this.inventory.length.toString();
      this.stats[1].value = this.inventory.filter(i => i.estado_operativo === 'En uso').length.toString();
      this.stats[2].value = this.inventory.filter(i => i.estado_operativo === 'Regular').length.toString();
      this.stats[3].value = this.inventory.filter(i => i.estado_operativo === 'Dañado').length.toString();
    });
  }

  loadDropdowns() {
    this.inventarioService.getCategorias().subscribe(data => this.categorias = data);
    this.inventarioService.getDependencias().subscribe(data => this.dependencias = data);
    this.inventarioService.getEncargados().subscribe(data => this.encargados = data);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleAddModal() {
    this.isEditMode = false;
    this.editingBienId = null;
    this.newBien = { nombre: '', codigo: '', categoria_id: null, encargado_id: null, ubicacion_id: null, descripcion: '', estado_operativo: 'En uso' };
    this.showAddModal = !this.showAddModal;
    if (this.showAddModal && this.categorias.length === 0) {
      this.loadDropdowns();
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
      estado_operativo: item.estado_operativo
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
          this.loadInventory();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Error al actualizar: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.inventarioService.createBien(this.newBien).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showAddModal = false;
          this.loadInventory();
        },
        error: (err) => {
          this.isSubmitting = false;
          alert('Error al guardar: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
