import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-public-bien',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-bien.component.html'
})
export class PublicBienComponent implements OnInit {
  bien: any = null;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalles(id);
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  async cargarDetalles(id: string) {
    try {
      // CRÍTICO: Consulta Relacional Completa
      const { data, error } = await this.supabaseService.supabase
        .from('bienes')
        .select('*, categorias(nombre), cat_estados(nombre), cat_ubicaciones(nombre), cat_areas(nombre), usuarios!bienes_responsable_cedula_fkey(nombres, apellidos, cedula)')
        .eq('codigo_id', id)
        .single();

      // Fallback if the explicit foreign key name fails due to being different
      if (error && error.message && error.message.includes('foreign key')) {
         console.warn('Fallback to standard relational select for usuarios');
         const fallbackRes = await this.supabaseService.supabase
           .from('bienes')
           .select('*, categorias(nombre), cat_estados(nombre), cat_ubicaciones(nombre), cat_areas(nombre), usuarios(nombres, apellidos, cedula)')
           .eq('codigo_id', id)
           .single();
           
         if (fallbackRes.error || !fallbackRes.data) {
           this.error = true;
         } else {
           this.bien = fallbackRes.data;
         }
      } else if (error || !data) {
        this.error = true;
      } else {
        this.bien = data;
      }
    } catch (err) {
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  async intentarEditar() {
    // Lógica de Auth-Wall
    const { data: { session } } = await this.supabaseService.supabase.auth.getSession();
    
    if (session) {
      // Si hay sesión activa (usuario logueado en su teléfono), redirige a /dashboard/bienes/editar/:id o la ruta equivalente
      this.router.navigate(['/dashboard/inventario'], { queryParams: { search: this.bien.codigo_id, editId: this.bien.codigo_id } });
    } else {
      // Si NO hay sesión activa (visitante), redirige a /login.
      this.router.navigate(['/login']);
    }
  }
}
