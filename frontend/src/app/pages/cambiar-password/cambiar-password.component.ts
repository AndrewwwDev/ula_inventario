import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { BitacoraService } from '../../services/bitacora.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cambiar-password.component.html',
})
export class CambiarPasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;

  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private bitacoraService: BitacoraService,
    private toastService: ToastService
  ) {}

  toggleCurrentPassword() {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toastService.show('Por favor completa todos los campos.', 'warning');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.show('Las contraseñas no coinciden.', 'warning');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.show('La contraseña debe tener al menos 6 caracteres.', 'warning');
      return;
    }

    this.isLoading = true;

    try {
      const client = await this.supabase.getClient();
      
      // Obtener usuario actual
      const { data: { user } } = await client.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No se pudo identificar al usuario actual.');
      }

      // Re-autenticación silenciosa
      const { error: signInError } = await client.auth.signInWithPassword({
        email: user.email,
        password: this.currentPassword
      });

      if (signInError) {
        this.currentPassword = '';
        this.toastService.show('La contraseña actual es incorrecta', 'error');
        this.isLoading = false;
        return; // Detener flujo
      }

      // Actualizar a la nueva contraseña
      const { error: updateError } = await client.auth.updateUser({
        password: this.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Auditoría (Bitácora) en Cambio de Contraseña
      await this.bitacoraService.logAction('CAMBIO_CREDENCIALES', {
        descripcion: 'El usuario actualizó su contraseña con validación estricta.'
      });

      this.toastService.show('Contraseña actualizada con éxito.', 'success');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
      
      this.router.navigate(['/dashboard/inicio']);
    } catch (err: any) {
      console.error(err);
      this.toastService.show('Error al cambiar la contraseña: ' + err.message, 'error');
    } finally {
      this.isLoading = false;
    }
  }
}
