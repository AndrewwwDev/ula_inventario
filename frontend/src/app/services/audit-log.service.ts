import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from } from 'rxjs';

export interface AuditLogPayload {
  usuario_id: string; // auth_id o cedula
  tipo_accion: 'LOGIN' | 'LOGOUT' | 'ALTA' | 'MODIFICACION' | 'ELIMINACION' | 'MANTENIMIENTO_INICIO' | 'MANTENIMIENTO_FIN' | 'TRASLADO_INTERNO' | 'TRASLADO_EXTERNO' | 'DESINCORPORACION';
  modulo: string; // 'auth', 'bienes', 'mantenimientos', etc.
  codigo_bien?: string;
  detalles_json: {
    mensaje: string;
    usuario_nombre?: string;
    estado_anterior?: string;
    estado_nuevo?: string;
    diff_visual?: any;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {

  constructor(private supabase: SupabaseService) {}

  /**
   * Registra una acción en la Bitácora de Auditoría
   */
  logAction(payload: AuditLogPayload) {
    return from((async () => {
      try {
        const userRes = await this.supabase.auth.getUser();
        const user = userRes.data?.user;
        
        let cedula_usuario = payload.usuario_id;
        let nombre_usuario = payload.detalles_json.usuario_nombre;

        // Si no se proveyó explícitamente, intentar inferir del usuario autenticado
        if ((!cedula_usuario || cedula_usuario === '00000000') && user) {
           const { data: userData } = await this.supabase.supabase
             .from('usuarios')
             .select('cedula, nombres')
             .eq('auth_id', user.id)
             .single();
             
           if (userData) {
             cedula_usuario = userData.cedula;
             if (!nombre_usuario) {
               nombre_usuario = userData.nombres;
             }
           }
        }

        const detalles = {
          ...payload.detalles_json,
          modulo_afectado: payload.modulo,
          usuario_nombre: nombre_usuario || 'Sistema'
        };

        const { error } = await this.supabase.supabase.from('bitacora').insert([{
          accion: payload.tipo_accion,
          codigo_bien: payload.codigo_bien || null,
          cedula_usuario: cedula_usuario || '00000000',
          detalles: detalles
        }]);

        if (error) {
          console.error('[AuditLogService] Error al guardar bitácora:', error);
          throw error;
        }

        return true;
      } catch (err) {
        console.error('[AuditLogService] Excepción en logAction:', err);
        return false;
      }
    })());
  }
}
