import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BitacoraService {

  constructor(private supabase: SupabaseService, private authService: AuthService) { }

  async logAction(accion: string, detalles: any, codigoBien?: string) {
    const user = this.authService.currentUserValue;
    if (!user || !user.cedula) {
      console.warn('Bitácora: No hay usuario autenticado para registrar la acción.');
      return;
    }

    const payload = {
      cedula_usuario: user.cedula,
      accion: accion,
      detalles: detalles,
      codigo_bien: codigoBien || null
    };

    const { error } = await this.supabase
      .from('bitacora')
      .insert([payload]);

    if (error) {
      console.error('Error al registrar en bitácora:', error);
    }
  }
}
