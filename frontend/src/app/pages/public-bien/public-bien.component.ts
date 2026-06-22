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
        .rpc('consultar_bien_qr', { p_codigo: id })
        .single();

      if (error) {
        console.error('Error RPC:', error.message);
        this.error = true;
        this.loading = false;
        return;
      }

      if (!data) {
        this.error = true;
      } else {
        this.bien = data;
        this.error = false;
      }
      this.loading = false;
    } catch (err) {
      console.error('Catch Error:', err);
      this.error = true;
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
