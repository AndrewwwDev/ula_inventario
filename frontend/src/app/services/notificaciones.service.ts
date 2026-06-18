import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { InventarioService } from './inventario.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$: Observable<number> = this.pendingCountSubject.asObservable();

  constructor(private inventarioService: InventarioService) {
    this.cargarNotificaciones();
  }

  async cargarNotificaciones() {
    this.inventarioService.getAlertasMantenimiento().subscribe({
      next: (data) => {
        this.pendingCountSubject.next(data ? data.length : 0);
      },
      error: (err) => {
        console.error('Error cargando notificaciones:', err);
        this.pendingCountSubject.next(0);
      }
    });
  }

  actualizarNotificaciones() {
    this.cargarNotificaciones();
  }

  get countPending(): number {
    return this.pendingCountSubject.value;
  }
}
