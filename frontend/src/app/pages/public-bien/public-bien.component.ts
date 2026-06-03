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
      const { data, error } = await this.supabaseService.supabase
        .from('bienes')
        .select('*, categorias(nombre), cat_estados(nombre), cat_ubicaciones(nombre), cat_areas(nombre)')
        .eq('codigo_id', id)
        .single();

      if (error || !data) {
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
      // Si está logueado, redirigimos al inventario con un query param para abrir el modal si así lo diseñas después
      this.router.navigate(['/dashboard/inventario'], { queryParams: { search: this.bien.codigo_id } });
    } else {
      // Si no hay sesión activa, bloqueamos y lo enviamos al login
      this.router.navigate(['/login']);
    }
  }
}
