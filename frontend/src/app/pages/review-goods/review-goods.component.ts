import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-review-goods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-goods.component.html',
  styleUrls: ['./review-goods.component.css']
})
export class ReviewGoodsComponent {
  cedula: string = '';
  bienes: any[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;

  sugerenciasBusqueda: any[] = [];
  mostrarDropdown: boolean = false;

  constructor(
    private inventarioService: InventarioService,
    private toastService: ToastService,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  get supabase() {
    return this.supabaseService.supabase;
  }

  cargarTodosLosBienes() {
    this.bienes = [];
    this.hasSearched = false;
  }

  async generarSugerencias(evento: any) {
    const termino = evento.target.value.trim();
    if (termino.length < 2) {
      this.sugerenciasBusqueda = [];
      this.mostrarDropdown = false;
      this.cargarTodosLosBienes(); // Resetea la tabla si borra el texto
      return;
    }

    try {
      // 1. Buscamos en Bienes y en Usuarios al mismo tiempo
      const [resBienes, resUsuarios] = await Promise.all([
        this.supabase.from('bienes').select('codigo_id, nombre').or(`nombre.ilike.%${termino}%,codigo_id.ilike.%${termino}%`).limit(5),
        this.supabase.from('usuarios').select('cedula, nombres, apellidos').or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%`).limit(5)
      ]);

      const sugerencias = [];

      // 2. Mapeamos Bienes
      if (resBienes.data) {
        sugerencias.push(...resBienes.data.map(b => ({
          textoVisible: `💻 ${b.nombre} - Código: ${b.codigo_id}`,
          valorFiltro: b.codigo_id
        })));
      }

      // 3. Mapeamos Usuarios (Formato exacto requerido)
      if (resUsuarios.data) {
        sugerencias.push(...resUsuarios.data.map(u => ({
          textoVisible: `👤 ${u.nombres} ${u.apellidos} - C.I: ${u.cedula}`,
          valorFiltro: u.cedula
        })));
      }

      this.sugerenciasBusqueda = sugerencias;
      this.mostrarDropdown = this.sugerenciasBusqueda.length > 0;
    } catch (error) {
      console.error('Error en Omnibox:', error);
      this.mostrarDropdown = false;
    }
  }

  async seleccionarSugerencia(sugerencia: any) {
    this.cedula = sugerencia.textoVisible;
    this.mostrarDropdown = false;
    await this.ejecutarConsultaOmnibox(sugerencia.valorFiltro);
  }

  async buscarBienes() {
    if (!this.cedula.trim()) {
      this.toastService.show('Por favor ingresa un término de búsqueda', 'error');
      return;
    }
    this.mostrarDropdown = false;
    await this.ejecutarConsultaOmnibox(this.cedula.trim());
  }

  async ejecutarConsultaOmnibox(filtro: string) {
    this.hasSearched = true;
    this.isLoading = true;

    try {
      const { data, error } = await this.supabase
        .from('bienes')
        .select(`
          *,
          categorias (nombre),
          cat_estados (nombre),
          cat_ubicaciones (nombre),
          cat_areas (nombre)
        `)
        .or(`codigo_id.eq.${filtro},responsable_cedula.eq.${filtro}`);
        
      if (error) {
        throw error;
      }
      
      this.bienes = data || [];
    } catch (err) {
      console.error('Error al cargar bienes:', err);
      this.toastService.show('Error al buscar bienes', 'error');
      this.bienes = [];
    } finally {
      this.isLoading = false;
    }
  }

  volver() {
    this.router.navigate(['/login']);
  }
}