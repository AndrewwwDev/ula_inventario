import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventarioService } from '../../services/inventario.service';
import { ToastService } from '../../services/toast.service';
import { SupabaseService } from '../../services/supabase.service';
import { PdfExportService } from '../../services/pdf-export.service';

// IMPORTACIONES DE PDFMAKE DESHABILITADAS TEMPORALMENTE PARA EVITAR CAÍDA DEL SISTEMA
// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: 'app-review-goods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-goods.component.html',
  styleUrls: ['./review-goods.component.css']
})
export class ReviewGoodsComponent implements OnInit {
  cedula: string = '';
  bienesFiltrados: any[] = [];
  isLoading: boolean = false;
  hasSearched: boolean = false;

  sugerenciasBusqueda: any[] = [];
  mostrarDropdown: boolean = false;
  isExporting: boolean = false;

  constructor(
    private toastService: ToastService,
    private router: Router,
    private supabaseService: SupabaseService,
    private pdfExportService: PdfExportService
  ) { }

  get supabase() {
    return this.supabaseService.supabase;
  }

  ngOnInit() {
    // ESTADO INICIAL VACÍO (No se cargan todos los bienes al inicio)
    this.bienesFiltrados = [];
    this.hasSearched = false;
  }

  // BUSCADOR OMNIBOX PÚBLICO
  async generarSugerencias(evento: any) {
    const termino = evento.target.value.trim();

    if (termino.length < 2) {
      this.sugerenciasBusqueda = [];
      this.mostrarDropdown = false;
      this.bienesFiltrados = []; // Restaura a vacío si borran el input
      this.hasSearched = false;
      return;
    }

    try {
      // BÚSQUEDA PARALELA PÚBLICA (Sin requerir sesión)
      const [resBienes, resUsuarios] = await Promise.all([
        this.supabaseService.supabase.from('bienes')
          .select('codigo_id, nombre')
          .or(`nombre.ilike.%${termino}%,codigo_id.ilike.%${termino}%`)
          .limit(5),
        // ADAPTACIÓN: 'usuarios' fue reemplazado por 'personal' en el modelo de BD
        this.supabaseService.supabase.from('personal')
          .select('cedula, nombres, apellidos')
          .or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%`)
          .limit(5)
      ]);

      const sugerencias: any[] = [];

      // Mapeo de Equipos
      if (resBienes.data) {
        sugerencias.push(...resBienes.data.map((b: any) => ({
          textoVisible: `💻 ${b.nombre} - Código: ${b.codigo_id}`,
          valorFiltro: b.codigo_id,
          tipo: 'bien'
        })));
      }

      // Mapeo de Personas (Responsables)
      if (resUsuarios.data) {
        sugerencias.push(...resUsuarios.data.map((u: any) => ({
          textoVisible: `${u.nombres} ${u.apellidos} - C.I: ${u.cedula}`,
          valorFiltro: u.cedula,
          tipo: 'usuario'
        })));
      }

      this.sugerenciasBusqueda = sugerencias;
      this.mostrarDropdown = this.sugerenciasBusqueda.length > 0;

    } catch (error) {
      console.error('Error en Buscador Público:', error);
      this.mostrarDropdown = false;
    }
  }

  // MÉTODO DINÁMICO CONTRA SUPABASE
  async ejecutarConsultaOmnibox(tipo: string, filtro: string) {
    this.hasSearched = true;
    this.isLoading = true;

    try {
      let query = this.supabase
        .from('bienes')
        .select(`
          *,
          categorias (nombre),
          cat_estados (nombre),
          cat_ubicaciones (nombre),
          cat_areas (nombre),
          personal (cedula, nombres, apellidos)
        `);

      if (tipo === 'global') {
        // Búsqueda en caso de presionar ENTER directamente (intenta cruzar por varios campos)
        query = query.or(`codigo_id.eq.${filtro},personal_cedula.eq.${filtro}`);
      } else if (tipo === 'usuario') {
        // Filtra por la cédula del responsable en la FK
        query = query.eq('personal_cedula', filtro);
      } else if (tipo === 'bien') {
        // Filtra por el código del equipo
        query = query.eq('codigo_id', filtro);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      this.bienesFiltrados = data || [];
    } catch (err) {
      console.error('Error al cargar bienes:', err);
      this.toastService.show('Error al buscar bienes', 'error');
      this.bienesFiltrados = [];
    } finally {
      this.isLoading = false;
    }
  }

  async seleccionarSugerencia(sug: any) {
    this.mostrarDropdown = false;
    this.cedula = sug.textoVisible; // Actualiza el input visualmente

    // Hace la petición a Supabase en lugar de filtrar localmente
    await this.ejecutarConsultaOmnibox(sug.tipo, sug.valorFiltro);
  }

  async buscarBienes() {
    if (!this.cedula.trim()) {
      this.toastService.show('Por favor ingresa un término de búsqueda', 'error');
      this.bienesFiltrados = [];
      this.hasSearched = false;
      return;
    }
    this.mostrarDropdown = false;
    // Si no selecciona del Omnibox, lanza una búsqueda global por si introdujo cédula manual
    await this.ejecutarConsultaOmnibox('global', this.cedula.trim());
  }

  volver() {
    this.router.navigate(['/login']);
  }

  exportarAPDF() {
    if (!this.bienesFiltrados || this.bienesFiltrados.length === 0) {
      this.toastService.show('No hay bienes para exportar', 'warning');
      return;
    }

    this.isExporting = true;
    try {
      const columnas = ['Código ID', 'Nombre del Bien', 'Categoría', 'Ubicación', 'Estado'];
      const dataFilas = this.bienesFiltrados.map(b => [
        b.codigo_id || 'N/A',
        b.nombre || 'N/A',
        b.categorias?.nombre || 'N/A',
        b.cat_ubicaciones?.nombre || 'N/A',
        b.cat_estados?.nombre || 'N/A'
      ]);

      const subtitulo = `Consulta: ${this.cedula || 'Global'}`;
      this.pdfExportService.generarReporte('Reporte de Bienes Asignados', columnas, dataFilas, subtitulo);
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.toastService.show('Ocurrió un error al exportar', 'error');
    } finally {
      this.isExporting = false;
    }
  }
}