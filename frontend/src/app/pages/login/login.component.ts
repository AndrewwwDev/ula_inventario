import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

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

  constructor(private router: Router, private supabaseService: SupabaseService) { }

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
        this.errorMessage = err.message || 'Credenciales incorrectas o error de conexión';
      }
    }
  }
}
