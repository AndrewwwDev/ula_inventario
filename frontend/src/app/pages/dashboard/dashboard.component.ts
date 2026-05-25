import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InventarioService } from '../../services/inventario.service';
import { SupabaseService } from '../../services/supabase.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  user: any = null;
  isSidebarOpen = false;
  alertasMantenimiento: any[] = []; // Se mantiene por la campanita del nav
  isSuperAdmin$!: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private inventarioService: InventarioService,
    private supabaseService: SupabaseService
  ) { }

  ngOnInit() {
    this.isSuperAdmin$ = this.authService.isSuperAdmin$;
    
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.user = user;
      }
    });
    // Cargar alertas de mantenimiento para el badge
    this.inventarioService.getAlertasMantenimiento().subscribe((data: any) => {
      this.alertasMantenimiento = data;
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async logout() {
    try {
      console.log('[Dashboard] Iniciando proceso de salida blindado...');
      const client = await this.supabaseService.getClient();
      await client.auth.signOut();
      
      // Limpieza de tokens y memorias residuales
      localStorage.clear();
      sessionStorage.clear();
      console.log('[Dashboard] Almacenamiento local limpiado. Recargando app...');
      
      // Hard redirect profesional para matar ciclos de memoria de Angular
      window.location.href = '/login';
    } catch (error) {
      console.error('[Dashboard] Error en el logout:', error);
      
      // Contingencia
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  }
}
