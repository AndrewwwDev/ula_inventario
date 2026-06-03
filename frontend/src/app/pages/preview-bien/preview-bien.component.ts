import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-preview-bien',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-bien.component.html'
})
export class PreviewBienComponent implements OnInit {
  bienId: string = '';
  bien: any = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.bienId = params.get('id') || '';
      if (this.bienId) {
        this.cargarBien(this.bienId);
      } else {
        this.error = "No se proporcionó un ID válido.";
        this.loading = false;
      }
    });
  }

  async cargarBien(id: string) {
    this.loading = true;
    try {
      // Usamos el cliente supabase para hacer la consulta del bien
      // Como es público, nos aseguramos de que el bucket RLS (si hay fotos) permita lectura.
      const { data, error } = await this.supabase.from('bienes')
        .select(`
          *,
          categorias (nombre),
          cat_ubicaciones (nombre),
          cat_areas (nombre),
          cat_estados (nombre)
        `)
        .eq('codigo_id', id)
        .single();
        
      if (error) throw error;
      
      this.bien = data;
    } catch (err: any) {
      console.error('Error cargando bien:', err);
      this.error = 'No se pudo cargar la información del bien. Es posible que el código sea incorrecto o el bien haya sido eliminado.';
    } finally {
      this.loading = false;
    }
  }

  irALogin() {
    this.router.navigate(['/login']);
  }
}
