import { Component, OnInit, NgZone } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { BitacoraService } from '../../services/bitacora.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './restablecer-password.component.html',
})
export class RestablecerPasswordComponent implements OnInit {
  userEmail = '';
  newPassword = '';
  confirmPassword = '';
  
  showNewPassword = false;
  showConfirmPassword = false;
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router, 
    private supabaseService: SupabaseService,
    private bitacoraService: BitacoraService,
    private toastService: ToastService,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    
    try {
      const client = await this.supabaseService.getClient();
      
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        // 1. Forzar Sesión
        const { error: sessionError } = await client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          throw sessionError;
        }

        const { data: { user }, error: userError } = await client.auth.getUser();
        
        if (userError || !user) {
          throw new Error('No se pudo verificar la sesión de recuperación.');
        }

        this.ngZone.run(() => {
          this.userEmail = user.email || '';
          this.errorMessage = '';
          this.isLoading = false;
          // Limpiar el hash de la URL
          window.history.replaceState(null, '', window.location.pathname);
        });

      } else {
        // 2. Fallback Seguro
        const { data: { session }, error } = await client.auth.getSession();
        
        this.ngZone.run(() => {
          if (session && session.user) {
            this.userEmail = session.user.email || '';
            this.errorMessage = '';
            this.isLoading = false;
          } else {
            this.errorMessage = 'El enlace de recuperación puede haber expirado o es inválido.';
            this.isLoading = false;
          }
        });
      }

    } catch (err: any) {
      console.error('[Restablecer] Error al inicializar:', err);
      this.ngZone.run(() => {
        this.errorMessage = 'El enlace de recuperación puede haber expirado o es inválido.';
        this.isLoading = false;
      });
    }
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async updatePassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const client = await this.supabaseService.getClient();
      const { error } = await client.auth.updateUser({
        password: this.newPassword
      });

      if (error) throw error;

      await this.bitacoraService.logAction('RECUPERACION_EXITOSA', {
        descripcion: 'El usuario restableció su contraseña exitosamente a través del enlace de recuperación.'
      });

      this.toastService.show('Contraseña actualizada correctamente', 'success');
      
      // Cerrar sesión para obligarlo a hacer login normal con su nueva clave
      await client.auth.signOut();
      this.router.navigate(['/login']);
      
    } catch (err: any) {
      console.error('[Restablecer] Error al actualizar:', err);
      this.errorMessage = err.message || 'Error al intentar actualizar la contraseña.';
    } finally {
      this.isLoading = false;
    }
  }
}
