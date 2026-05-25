import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InventarioService } from '../../services/inventario.service';

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

  constructor(private inventarioService: InventarioService) {}

  ngOnInit() {
    this.loadDesincorporados();
  }

  loadDesincorporados() {
    this.inventarioService.getBienesDesincorporados().subscribe((data: any) => {
      this.desincorporados = data;
    });
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

  openDesincorporarModal(id: string) {
    this.editingBienId = id;
    this.confirmarDesincorporacion = false;
    this.motivoDesincorporacion = '';
    this.fechaDesincorporacion = '';
    this.selectedFile = null;
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
        alert('Error al desincorporar: ' + (err.error?.message || err.message));
      }
    });
  }
}
