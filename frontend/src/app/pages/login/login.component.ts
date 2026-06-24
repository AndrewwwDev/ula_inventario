import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  id = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  isLoading = false;
  isRecoveryMode = false;
  recoveryEmail = '';

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastService: ToastService
  ) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (this.id && this.password) {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        console.log('[Login] Intentando Iniciar Sesión con Supabase...');
        const client = await this.supabaseService.getClient();
        const { error } = await client.auth.signInWithPassword({
          email: this.id,
          password: this.password
        });

        if (error) throw error;

        console.log('[Login] ¡Éxito! Redirigiendo a dashboard...');
        this.router.navigate(['/dashboard/inicio'], { replaceUrl: true });
      } catch (err: any) {
        console.error('[Login] Error:', err);
        this.isLoading = false;
        
        // Manejo de AuthApiError sin romper la experiencia
        if (err.message === 'Invalid login credentials' || err.name === 'AuthApiError' || err.status === 400) {
          this.errorMessage = 'Correo o contraseña incorrectos';
          this.toastService.show('Correo o contraseña incorrectos', 'error');
        } else {
          this.errorMessage = err.message || 'Error de conexión o credenciales inválidas';
          this.toastService.show(this.errorMessage, 'error');
        }
      }
    }
  }

  async recoverPassword() {
    if (!this.recoveryEmail) {
      this.errorMessage = 'Por favor, ingrese un correo válido.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const client = await this.supabaseService.getClient();
      const { error } = await client.auth.resetPasswordForEmail(this.recoveryEmail, {
        redirectTo: `${window.location.origin}/restablecer-password`
      });

      if (error) throw error;

      this.toastService.show('Si el correo existe, recibirás un enlace de recuperación', 'success');
      this.isRecoveryMode = false;
      this.recoveryEmail = '';
    } catch (err: any) {
      console.error('[Recovery] Error:', err);
      this.errorMessage = err.message || 'Error al intentar enviar el correo de recuperación.';
    } finally {
      this.isLoading = false;
    }
  }
}
