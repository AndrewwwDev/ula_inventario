import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private timeoutId: any;
  private warningId: any;
  private readonly WARNING_TIME = 15 * 60 * 1000; // 15 mins
  private readonly LOGOUT_TIME = 16 * 60 * 1000; // 16 mins

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private ngZone: NgZone
  ) {
    this.initListener();
    this.resetTimer();
  }

  private initListener() {
    window.addEventListener('mousemove', () => this.resetTimer());
    window.addEventListener('keydown', () => this.resetTimer());
    window.addEventListener('click', () => this.resetTimer());
    window.addEventListener('scroll', () => this.resetTimer());
  }

  public resetTimer() {
    if (!this.authService.token) return;

    clearTimeout(this.timeoutId);
    clearTimeout(this.warningId);

    this.ngZone.runOutsideAngular(() => {
      this.warningId = setTimeout(() => {
        this.ngZone.run(() => {
          this.toastService.show('Atención: Su sesión expirará por inactividad en 1 minuto.', 'warning');
        });
      }, this.WARNING_TIME);

      this.timeoutId = setTimeout(() => {
        this.ngZone.run(() => {
          this.authService.logout();
          this.toastService.show('Sesión cerrada por inactividad.', 'error');
          this.router.navigate(['/login']);
        });
      }, this.LOGOUT_TIME);
    });
  }
}
