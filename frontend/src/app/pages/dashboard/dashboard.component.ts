import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { InventarioService } from '../../services/inventario.service';
import { SupabaseService } from '../../services/supabase.service';
import { IdleService } from '../../services/idle.service';
import { NotificacionesService } from '../../services/notificaciones.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

  user: any = null;
  isSidebarOpen = false;
  alertasMantenimiento: any[] = []; // Se mantiene por la campanita del nav
  isSuperAdmin$!: Observable<boolean>;

  showIdleWarning = false;
  idleCountdown = 30;
  private subscriptions = new Subscription();
  
  showProfileMenu = false;
  notificacionesCount: number = 0;

  constructor(
    private authService: AuthService,
    private router: Router,
    private inventarioService: InventarioService,
    private supabaseService: SupabaseService,
    private idleService: IdleService,
    public notificacionesService: NotificacionesService
  ) { }

  ngOnInit() {
    this.isSuperAdmin$ = this.authService.isSuperAdmin$;
    
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.user = user;
      }
    });

    // Conectar la campana al servicio reactivo de notificaciones
    this.subscriptions.add(
      this.notificacionesService.pendingCount$.subscribe(count => {
        this.notificacionesCount = count;
      })
    );

    // Iniciar monitoreo de inactividad
    this.idleService.startMonitoring();
    
    this.subscriptions.add(
      this.idleService.showWarning$.subscribe(show => {
        this.showIdleWarning = show;
      })
    );

    this.subscriptions.add(
      this.idleService.countdown$.subscribe(count => {
        this.idleCountdown = count;
      })
    );
  }

  ngOnDestroy() {
    this.idleService.stopMonitoring();
    this.subscriptions.unsubscribe();
  }

  extendSession() {
    this.idleService.resetTimer();
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  get userShortName(): string {
    if (!this.user) return 'Usuario';
    const nombre = this.user.nombres ? this.user.nombres.split(' ')[0] : '';
    const apellido = this.user.apellidos ? this.user.apellidos.split(' ')[0] : '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  }

  get usuarioCedula(): string {
    if (!this.user || !this.user.cedula) return '';
    return this.user.cedula;
  }

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.showProfileMenu = !this.showProfileMenu;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showProfileMenu = false;
  }

  async logout() {
    console.log('[Dashboard] Iniciando proceso de salida (Delegado a AuthService)...');
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('[Dashboard] Fallo al cerrar sesión:', error);
    }
  }
}
