import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$: Observable<number> = this.pendingCountSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.cargarNotificaciones();
  }

  async cargarNotificaciones() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: estadosExcluir, error: errEstado } = await this.supabase.supabase
        .from('cat_estados')
        .select('id, nombre')
        .in('nombre', ['Mantenimiento', 'Desincorporado']);
        
      if (errEstado || !estadosExcluir) return;
      
      const excludedIds = estadosExcluir.map(e => e.id);

      const { count, error } = await this.supabase.supabase
        .from('bienes')
        .select('*', { count: 'exact', head: true })
        .lte('fecha_proximo_mantenimiento', today)
        .not('estado_id', 'in', `(${excludedIds.join(',')})`);

      if (!error && count !== null) {
        this.pendingCountSubject.next(count);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }

  actualizarNotificaciones() {
    this.cargarNotificaciones();
  }

  get countPending(): number {
    return this.pendingCountSubject.value;
  }
}
