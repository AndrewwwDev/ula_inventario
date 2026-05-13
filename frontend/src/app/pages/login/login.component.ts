import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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

  constructor(private router: Router, private authService: AuthService) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }


  login() {
    if (this.id && this.password) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.login(this.id, this.password).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Credenciales incorrectas o error de conexión';
        }
      });
    }
  }
}

