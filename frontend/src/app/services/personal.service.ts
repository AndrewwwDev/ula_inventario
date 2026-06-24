import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PersonalService {

  constructor(private supabaseService: SupabaseService) { }

  async obtenerPersonalConBienes(): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService.supabase
        .from('personal')
        .select('*, bienes(*)');
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      console.error('[PersonalService] Error al obtener personal con bienes:', error);
      return [];
    }
  }

  async verificarDuplicadosGlobal(cedula: string, correo: string): Promise<boolean> {
    try {
      const pPersonal = this.supabaseService.supabase
        .from('personal')
        .select('cedula')
        .or(`cedula.eq.${cedula},correo.eq.${correo}`)
        .limit(1);

      const pUsuarios = this.supabaseService.supabase
        .from('usuarios')
        .select('cedula')
        .or(`cedula.eq.${cedula},email.eq.${correo}`)
        .limit(1);

      const [resPersonal, resUsuarios] = await Promise.all([pPersonal, pUsuarios]);

      if (resPersonal.error) throw resPersonal.error;
      if (resUsuarios.error) throw resUsuarios.error;

      const hasPersonal = resPersonal.data && resPersonal.data.length > 0;
      const hasUsuarios = resUsuarios.data && resUsuarios.data.length > 0;

      return hasPersonal || hasUsuarios;
    } catch (error: any) {
      console.error('[PersonalService] Error al verificar duplicados:', error);
      throw error;
    }
  }

  async agregarPersonal(personalData: any): Promise<boolean> {
    try {
      const payload = { ...personalData, estado: 'Activo' };
      const { error } = await this.supabaseService.supabase
        .from('personal')
        .insert(payload);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('[PersonalService] Error al agregar personal:', error);
      throw error;
    }
  }

  async cambiarEstadoPersonal(cedula: string, estadoActual: string): Promise<boolean> {
    try {
      const nuevoEstado = estadoActual === 'Activo' ? 'Inhabilitado' : 'Activo';
      const payload: any = { estado: nuevoEstado };
      
      // Si se activa de nuevo, se borra el motivo de inhabilitación
      if (nuevoEstado === 'Activo') {
        payload.motivo_inhabilitacion = null;
      }

      const { error } = await this.supabaseService.supabase
        .from('personal')
        .update(payload)
        .eq('cedula', cedula);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('[PersonalService] Error al cambiar estado:', error);
      throw error;
    }
  }

  async inhabilitarPersonalConCascada(cedula: string, motivo: string): Promise<boolean> {
    try {
      // 1. Actualizar el Personal: Cambiar estado y guardar motivo
      const pPersonal = this.supabaseService.supabase
        .from('personal')
        .update({ estado: 'Inhabilitado', motivo_inhabilitacion: motivo })
        .eq('cedula', cedula);

      // 2. Liberar los Bienes (Cascada): Quitar cédula del personal
      const pBienes = this.supabaseService.supabase
        .from('bienes')
        .update({ personal_cedula: null })
        .eq('personal_cedula', cedula);

      const [resPersonal, resBienes] = await Promise.all([pPersonal, pBienes]);

      if (resPersonal.error) throw resPersonal.error;
      if (resBienes.error) throw resBienes.error;

      return true;
    } catch (error: any) {
      console.error('[PersonalService] Error al inhabilitar personal con cascada:', error);
      throw error;
    }
  }

  async reactivarPersonal(cedula: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.supabase
        .from('personal')
        .update({ estado: 'Activo', motivo_inhabilitacion: null })
        .eq('cedula', cedula);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('[PersonalService] Error al reactivar personal:', error);
      throw error;
    }
  }
}
