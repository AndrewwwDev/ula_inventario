import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  constructor(private supabase: SupabaseService) {}

  getBienes() {
    return from(this.supabase.from('bienes').select('*, categorias(nombre), cat_estados(nombre)')).pipe(map(res => res.data || []));
  }

  private async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `bienes/${fileName}`;

    const { error: uploadError } = await this.supabase.storage
      .from('bienes-fotos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = this.supabase.storage.from('bienes-fotos').getPublicUrl(filePath);
    return data.publicUrl;
  }

  createBien(data: FormData | any) {
    return from((async () => {
      let payload: any = {};
      let file: File | null = null;

      if (data instanceof FormData) {
        data.forEach((value, key) => {
          if (key === 'imagen' && value instanceof File) {
            file = value;
          } else {
            payload[key] = value;
          }
        });
      } else {
        payload = { ...data };
      }

      if (file) {
        payload.url_foto_principal = await this.uploadImage(file);
      }

      const dbPayload = {
        codigo_id: payload.codigo_id,
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        categoria_id: payload.categoria_id,
        condicion_fisica: payload.condicion_fisica,
        ubicacion: payload.ubicacion,
        area: payload.area,
        responsable_cedula: payload.responsable_cedula,
        estado_id: payload.estado_id,
        url_foto_principal: payload.url_foto_principal
      };

      const { data: result, error } = await this.supabase.from('bienes').insert([dbPayload]).select().single();
      if (error) throw error;
      
      await this.logBitacora('ALTA', 'bienes', result.codigo_id, 'Bien registrado en el sistema');
      return result;
    })());
  }

  updateBien(id: string, data: any) {
    return from((async () => {
      const dbPayload = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        categoria_id: data.categoria_id,
        condicion_fisica: data.condicion_fisica,
        ubicacion: data.ubicacion,
        area: data.area,
        responsable_cedula: data.responsable_cedula,
        estado_id: data.estado_id
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('codigo_id', id).select().single();
      if (error) throw error;

      await this.logBitacora('MODIFICACION', 'bienes', result.codigo_id, 'Bien actualizado');
      return result;
    })());
  }

  updateBienWithFile(id: string, data: FormData) {
    return from((async () => {
      let payload: any = {};
      let file: File | null = null;

      data.forEach((value, key) => {
        if (key === 'imagen' && value instanceof File) {
          file = value;
        } else {
          payload[key] = value;
        }
      });

      if (file) {
        payload.url_foto_principal = await this.uploadImage(file);
      }

      const dbPayload = {
        nombre: payload.nombre,
        descripcion: payload.descripcion,
        categoria_id: payload.categoria_id,
        condicion_fisica: payload.condicion_fisica,
        ubicacion: payload.ubicacion,
        area: payload.area,
        responsable_cedula: payload.responsable_cedula,
        estado_id: payload.estado_id,
        ...(payload.url_foto_principal ? { url_foto_principal: payload.url_foto_principal } : {})
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('codigo_id', id).select().single();
      if (error) throw error;
      
      await this.logBitacora('MODIFICACION', 'bienes', result.codigo_id, 'Bien actualizado con imagen');
      return result;
    })());
  }

  eliminarBien(id: string) {
    return from((async () => {
      const { data: result, error } = await this.supabase.from('bienes').delete().eq('codigo_id', id).select().single();
      if (error) throw error;
      await this.logBitacora('ELIMINACION', 'bienes', id, 'Bien eliminado físicamente');
      return result;
    })());
  }

  // Métodos que deben adaptarse si existen estados de mantenimiento/desincorporado en la nueva DB. 
  // Por ahora lo simplificamos para que no fallen las peticiones.
  getBienesDesincorporados() {
    return from(this.supabase.from('bienes').select('*').eq('condicion_fisica', 'Desincorporado')).pipe(map(res => res.data || []));
  }

  desincorporarBien(id: string, motivo: string, fecha: string, foto: File | null) {
    return from((async () => {
      let foto_url = '';
      if (foto) {
        foto_url = await this.uploadImage(foto);
      }
      
      const userRes = await this.supabase.auth.getUser();
      const user = userRes.data.user;
      const { data: userData } = await this.supabase.from('usuarios').select('cedula, nombres').eq('auth_id', user?.id).single();

      const desincPayload = {
        codigo_bien: id,
        cedula_autoriza: userData?.cedula || '00000000',
        motivo_desincorporacion: motivo,
        url_foto_evidencia: foto_url,
        fecha: fecha || new Date().toISOString()
      };

      const { data: desincResult, error: desincError } = await this.supabase.from('desincorporaciones').insert([desincPayload]).select().single();
      if (desincError) throw desincError;

      const { data: estadoDes } = await this.supabase.from('cat_estados').select('id').eq('nombre', 'Desincorporado').single();

      const { data: result, error } = await this.supabase.from('bienes').update({ estado_id: estadoDes!.id }).eq('codigo_id', id).select().single();
      if (error) throw error;

      await this.logBitacora('DESINCORPORACION', 'bienes', id, `Bien desincorporado por ${userData?.nombres || 'Sistema'}. Motivo: ${motivo}`);
      return result;
    })());
  }

  getCategorias() {
    return from(this.supabase.from('categorias').select('*')).pipe(map(res => res.data || []));
  }

  getCatEstados() {
    return from(this.supabase.from('cat_estados').select('*').order('id')).pipe(map(res => res.data || []));
  }

  // --- MANTENIMIENTO ---
  getAlertasMantenimiento() {
    const today = new Date().toISOString().split('T')[0];
    return from(this.supabase.from('bienes').select('*, categorias!inner(nombre)')
      .eq('categorias.nombre', 'Computadoras')
      .lte('fecha_proximo_mantenimiento', today)).pipe(
        map(res => (res.data || []).map((b: any) => ({ bien: b, proxima_fecha: b.fecha_proximo_mantenimiento })))
      );
  }

  getEnReparacion() {
    return from(this.supabase.from('bienes').select('*, categorias(nombre), cat_estados!inner(nombre)').eq('cat_estados.nombre', 'Mantenimiento')).pipe(map(res => res.data || []));
  }

  getHistorialMantenimiento() {
    return from(this.supabase.from('mantenimientos').select('*, bienes(nombre)')).pipe(map(res => res.data || []));
  }

  enviarAMantenimiento(payload: any, file: File | null) {
    return from((async () => {
      const userRes = await this.supabase.auth.getUser();
      const user = userRes.data.user;

      let foto_url = null;
      if (file) foto_url = await this.uploadImage(file);
      
      const { data: estado } = await this.supabase.from('cat_estados').select('id').eq('nombre', 'Mantenimiento').single();
      const { data: userData } = await this.supabase.from('usuarios').select('cedula, nombres').eq('auth_id', user?.id).single();

      const mantPayload = {
        codigo_bien: payload.codigo_id,
        cedula_tecnico: userData?.cedula || '00000000',
        estado_reparacion: 'En Proceso',
        motivo_falla: payload.motivo_falla,
        url_foto_ingreso: foto_url
      };

      const { data: mantResult, error: mantError } = await this.supabase.from('mantenimientos').insert([mantPayload]).select().single();
      if (mantError) throw mantError;

      const { error: bienError } = await this.supabase.from('bienes').update({ estado_id: estado!.id }).eq('codigo_id', payload.codigo_id);
      if (bienError) throw bienError;

      await this.logBitacora('ENVIO_MANTENIMIENTO', 'mantenimientos', mantResult.id, `Bien enviado a mantenimiento. Técnico: ${userData?.nombres}`);
      return mantResult;
    })());
  }

  finalizarMantenimiento(id: string, trabajo: string, proximaFecha: string) {
    return from((async () => {
      const userRes = await this.supabase.auth.getUser();
      const user = userRes.data.user;
      const { data: userData } = await this.supabase.from('usuarios').select('cedula, nombres').eq('auth_id', user?.id).single();

      const { data: mantData } = await this.supabase.from('mantenimientos').select('*').eq('codigo_bien', id).eq('estado_reparacion', 'En Proceso').single();
      
      if (mantData) {
        const { error: updateMantError } = await this.supabase.from('mantenimientos')
          .update({ estado_reparacion: 'Finalizado', trabajo_realizado: trabajo, fecha_salida: new Date().toISOString() })
          .eq('id', mantData.id);
        if (updateMantError) throw updateMantError;
      }

      const { data: estadoActivo } = await this.supabase.from('cat_estados').select('id').eq('nombre', 'Activo').single();

      const { error: updateError } = await this.supabase.from('bienes')
        .update({ estado_id: estadoActivo!.id, fecha_proximo_mantenimiento: proximaFecha })
        .eq('codigo_id', id);
      if (updateError) throw updateError;
      
      await this.logBitacora('MANTENIMIENTO_FIN', 'bienes', id, `Mantenimiento finalizado por ${userData?.nombres || 'Sistema'}. Trabajo: ${trabajo}`);
      return { success: true };
    })());
  }

  // --- BITACORA ---
  getBitacora() {
    return from(this.supabase.from('bitacora').select('*').order('fecha', { ascending: false })).pipe(map(res => res.data || []));
  }

  private async logBitacora(accion: string, entidad: string, entidad_id: any, detalles: any) {
    const user = (await this.supabase.auth.getUser()).data.user;
    const userName = user?.user_metadata?.['nombres'] || user?.email?.split('@')[0] || 'Sistema';
    
    let jsonDetalles = typeof detalles === 'string' ? { mensaje: detalles, usuario_nombre: userName } : { ...detalles, usuario_nombre: userName };

    await this.supabase.from('bitacora').insert([{
      accion,
      entidad,
      entidad_id,
      detalles: jsonDetalles,
      usuario_id: user?.id
    }]);
  }

  cambiarEstado(bienId: string, estadoAnterior: string, nuevoEstado: string, justificacion: string) {
    return from((async () => {
      const { data: result, error } = await this.supabase.from('bienes')
        .update({ condicion_fisica: nuevoEstado }) // Asumiendo nuevoEstado como condicion_fisica por simplicidad de UI
        .eq('codigo_id', bienId)
        .select().single();
      if (error) throw error;
      await this.logBitacora('CAMBIO_ESTADO', 'bienes', bienId, {
        estado_anterior: estadoAnterior,
        estado_nuevo: nuevoEstado,
        justificacion: justificacion,
        mensaje: `Cambio de estado a ${nuevoEstado}`
      });
      return result;
    })());
  }

  registrarTraslado(bienId: string, payloadUpdate: any, accion: string, mensajeAuditoria: string) {
    return from((async () => {
      const dbPayload: any = {
        ubicacion: payloadUpdate.ubicacion,
        area: payloadUpdate.area,
        responsable_cedula: payloadUpdate.responsable_cedula
      };
      
      const { data: result, error } = await this.supabase.from('bienes')
        .update(dbPayload)
        .eq('codigo_id', bienId)
        .select().single();
        
      if (error) throw error;

      await this.logBitacora(accion, 'bienes', bienId, {
        mensaje: mensajeAuditoria,
      });

      return result;
    })());
  }

  // --- PUBLIC ---
  getBienesByEncargado(cedula: string) {
    return from((async () => {
      const { data } = await this.supabase.from('bienes').select('*').eq('responsable_cedula', cedula);
      return data || [];
    })());
  }

  getDashboardMetrics() {
    return from((async () => {
      const { data: estados } = await this.supabase.from('cat_estados').select('*');
      
      const metrics: any = {};
      const { count: totalCount } = await this.supabase.from('bienes').select('*', { count: 'exact', head: true });
      metrics['Total'] = totalCount || 0;

      if (estados) {
        const countPromises = estados.map(est => 
          this.supabase.from('bienes').select('*', { count: 'exact', head: true }).eq('estado_id', est.id)
        );
        const results = await Promise.all(countPromises);
        
        estados.forEach((est, index) => {
          metrics[est.nombre] = results[index].count || 0;
        });
      }

      const conditions = ['Buen estado', 'Regular', 'Mal estado'];
      const condPromises = conditions.map(cond => 
        this.supabase.from('bienes').select('*', { count: 'exact', head: true }).eq('condicion_fisica', cond)
      );
      const condResults = await Promise.all(condPromises);
      
      conditions.forEach((cond, index) => {
        metrics[cond] = condResults[index].count || 0;
      });

      return { metrics, estados };
    })());
  }
}
