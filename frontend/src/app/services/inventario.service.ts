import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  constructor(private supabase: SupabaseService) {}

  getBienes(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('bienes')
          .select('*, categorias(nombre), cat_estados!inner(nombre), cat_ubicaciones(nombre), cat_areas(nombre), personal(cedula, nombres, apellidos, cargo)')
          .neq('cat_estados.nombre', 'Desincorporado');

        if (fechaInicio) query = query.gte('fecha_registro', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_registro', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_registro', { ascending: false });
          
        const { data, error } = await query;
        console.log('🔴 DEEP DEBUGGING - Raw Supabase Data (Primeros 3 registros):', data?.slice(0, 3));
        
        if (error) {
          console.error('[InventarioService] Error consultando bienes. Revisa políticas RLS o conexión:', error.message || error);
          return [];
        }
        
        return data || [];
      } catch (err) {
        console.error('[InventarioService] Excepción asíncrona en getBienes:', err);
        return [];
      }
    })());
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
        ubicacion_id: payload.ubicacion_id,
        area_id: payload.area_id,
        personal_cedula: payload.personal_cedula,
        estado_id: payload.estado_id,
        marca: payload.marca,
        modelo: payload.modelo,
        serial_fabricante: payload.serial_fabricante,
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
        estado_id: data.estado_id,
        marca: data.marca,
        modelo: data.modelo,
        serial_fabricante: data.serial_fabricante
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
        estado_id: payload.estado_id,
        marca: payload.marca,
        modelo: payload.modelo,
        serial_fabricante: payload.serial_fabricante,
        ...(payload.url_foto_principal ? { url_foto_principal: payload.url_foto_principal } : {})
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('codigo_id', id).select().single();
      if (error) throw error;
      
      await this.logBitacora('MODIFICACION', 'bienes', result.codigo_id, 'Bien actualizado con imagen');
      return result;
    })());
  }

  registrarTraslado(id: string, payload: any, accion: string, mensajeAuditoria: string) {
    return from((async () => {
      // 1. UPDATE estricto en la tabla bienes para los campos logísticos
      const { data: result, error } = await this.supabase.from('bienes').update({
        ubicacion_id: payload.ubicacion_id,
        area_id: payload.area_id,
        personal_cedula: payload.personal_cedula
      }).eq('codigo_id', id).select().single();
      
      if (error) throw error;

      // 2. INSERT obligatorio en la tabla bitacora
      await this.logBitacora(accion, 'bienes', id, {
        mensaje: mensajeAuditoria,
        nueva_ubicacion: payload.ubicacion_id,
        nueva_area: payload.area_id,
        nuevo_responsable: payload.personal_cedula
      });

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
  getBienesDesincorporados(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('desincorporaciones').select('*');
        if (fechaInicio) query = query.gte('fecha', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha', { ascending: false });

        const { data: desincData, error: desincError } = await query;
        if (desincError) { console.warn('Error en getBienesDesincorporados:', desincError); return []; }
        
        if (!desincData || desincData.length === 0) return [];

        const codigos = desincData.map((d: any) => d.codigo_bien);
        const { data: bienesData, error: bienesError } = await this.supabase.from('bienes').select('codigo_id, nombre').in('codigo_id', codigos);
        
        const bienesMap = new Map();
        if (bienesData) {
          bienesData.forEach((b: any) => bienesMap.set(b.codigo_id, b.nombre));
        }

        return desincData.map((d: any) => ({
          codigo_id: d.codigo_bien,
          nombre: bienesMap.get(d.codigo_bien) || 'Bien Desconocido',
          fecha_desincorporacion: d.fecha,
          motivo_desincorporacion: d.motivo_desincorporacion,
          url_foto_evidencia: d.url_foto_evidencia
        }));
      } catch (err) { console.warn('Excepción en getBienesDesincorporados:', err); return []; }
    })());
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

      await this.logBitacora('DESINCORPORACION', 'bienes', id, {
        mensaje: `Bien desincorporado por ${userData?.nombres || 'Sistema'}. Motivo: ${motivo}`,
        url_foto_evidencia: foto_url
      });
      return result;
    })());
  }

  getCategorias() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('categorias').select('*');
        if (error) { console.warn('Error en getCategorias:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getCategorias:', err); return []; }
    })());
  }

  getCatEstados() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('cat_estados').select('*').order('id');
        if (error) { console.warn('Error en getCatEstados:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getCatEstados:', err); return []; }
    })());
  }

  getUbicaciones() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('cat_ubicaciones').select('*').order('nombre');
        if (error) { 
          console.error('[InventarioService] Error cargando ubicaciones (Posible 403 Forbidden):', error.message || error); 
          return []; 
        }
        return data || [];
      } catch (err) { 
        console.error('[InventarioService] Excepción crítica en getUbicaciones:', err); 
        return []; 
      }
    })());
  }

  getAreas() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('cat_areas').select('*').order('nombre');
        if (error) { 
          console.error('[InventarioService] Error cargando áreas (Posible 403 Forbidden):', error.message || error); 
          return []; 
        }
        return data || [];
      } catch (err) { 
        console.error('[InventarioService] Excepción crítica en getAreas:', err); 
        return []; 
      }
    })());
  }

  getPersonalActivo() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('personal')
          .select('*')
          .eq('estado', 'Activo')
          .order('nombres');
        if (error) { console.warn('Error en getPersonalActivo:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getPersonalActivo:', err); return []; }
    })());
  }

  buscarCustodiosPredictivo(termino: string) {
    return from((async () => {
      try {
        const pPersonal = this.supabase.from('personal')
          .select('cedula, nombres, apellidos, cargo')
          .or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%`)
          .limit(10);

        const pUsuarios = this.supabase.from('usuarios')
          .select('cedula, nombres, apellidos, rol')
          .or(`nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%`)
          .limit(10);

        const [resPersonal, resUsuarios] = await Promise.all([pPersonal, pUsuarios]);

        const custodios: any[] = [];

        if (resPersonal.data) {
          resPersonal.data.forEach(p => custodios.push({ ...p, tipoOrigen: 'Personal' }));
        }

        if (resUsuarios.data) {
          resUsuarios.data.forEach(u => custodios.push({ ...u, tipoOrigen: u.rol }));
        }

        return custodios;
      } catch (err) { 
        console.warn('Excepción en buscarCustodiosPredictivo:', err); 
        return []; 
      }
    })());
  }

  verificarCedulaExistente(cedula: string) {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('usuarios')
          .select('cedula')
          .eq('cedula', cedula)
          .maybeSingle();
        if (error || !data) return false;
        return true;
      } catch (err) { return false; }
    })());
  }

  // --- NOTIFICACIONES ---
  getNotificacionesCampana() {
    return from((async () => {
      try {
        const { data, error } = await this.supabase.from('mantenimientos')
          .select('id')
          .eq('estado_reparacion', 'En Proceso');
        if (error) { console.warn('Error en getNotificacionesCampana:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getNotificacionesCampana:', err); return []; }
    })());
  }

  // --- MANTENIMIENTO ---
  getAlertasMantenimiento(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        let query = this.supabase.from('bienes')
          .select('*, categorias!inner(nombre), cat_estados!inner(nombre), personal(cedula, nombres, apellidos, cargo)')
          .eq('categorias.nombre', 'Computadoras')
          .lte('fecha_proximo_mantenimiento', today)
          .neq('cat_estados.nombre', 'Desincorporado')
          .neq('cat_estados.nombre', 'Mantenimiento');

        if (fechaInicio) query = query.gte('fecha_registro', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_registro', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_registro', { ascending: false });

        const { data, error } = await query;
        if (error) { console.warn('Error en getAlertasMantenimiento:', error); return []; }
        return (data || []).map((b: any) => ({ bien: b, proxima_fecha: b.fecha_proximo_mantenimiento }));
      } catch (err) { console.warn('Excepción en getAlertasMantenimiento:', err); return []; }
    })());
  }

  getEnReparacion(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('mantenimientos')
          .select('*, personal(cedula, nombres, apellidos, cargo), bienes(nombre, cat_ubicaciones(nombre), cat_areas(nombre))')
          .eq('estado_reparacion', 'En Proceso');

        if (fechaInicio) query = query.gte('fecha_ingreso', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_ingreso', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_ingreso', { ascending: false });

        const { data, error } = await query;
        if (error) { console.warn('Error en getEnReparacion:', error); return []; }
        
        return (data || []).map((m: any) => ({
          ...m,
          codigo_id: m.codigo_bien,
          nombre: m.bienes?.nombre,
          ubicacion: m.bienes?.cat_ubicaciones?.nombre,
          area: m.bienes?.cat_areas?.nombre,
          motivo_falla: m.motivo_falla
        }));
      } catch (err) { console.warn('Excepción en getEnReparacion:', err); return []; }
    })());
  }

  getHistorialMantenimiento(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('mantenimientos')
          .select('*, personal(cedula, nombres, apellidos, cargo), bienes(nombre, marca, modelo, personal_cedula, cat_ubicaciones(nombre), cat_areas(nombre))');

        if (fechaInicio) query = query.gte('fecha_ingreso', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_ingreso', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_ingreso', { ascending: false });

        const { data, error } = await query;
        if (error) { console.warn('Error en getHistorialMantenimiento:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getHistorialMantenimiento:', err); return []; }
    })());
  }

  enviarAMantenimiento(payload: any) {
    return from((async () => {
      try {
        if (!payload.codigo_id) throw new Error('Validación: codigo_bien no puede ser nulo.');

        const { data: estado } = await this.supabase.from('cat_estados').select('id').eq('nombre', 'Mantenimiento').single();

        const mantPayload = {
          codigo_bien: payload.codigo_id,
          cedula_tecnico: payload.cedula_solicitante || '00000000',
          estado_reparacion: 'En Proceso', // Exact match
          motivo_falla: payload.motivo_falla
        };

        const { data: mantResult, error: mantError } = await this.supabase.from('mantenimientos').insert([mantPayload]).select().single();
        if (mantError) {
          console.error('Detalle Supabase (mantenimientos):', mantError.message, mantError.hint, mantError.details);
          throw mantError;
        }

        const { error: bienError } = await this.supabase.from('bienes').update({ estado_id: estado!.id }).eq('codigo_id', payload.codigo_id);
        if (bienError) throw bienError;

        // Auditoría directa requerida por Bitácora
        await this.supabase.from('bitacora').insert([{
          accion: 'Envío a Mantenimiento',
          codigo_bien: payload.codigo_id,
          cedula_usuario: payload.cedula_solicitante || '00000000',
          detalles: {
            motivo_falla: payload.motivo_falla,
            usuario_nombre: payload.nombre_solicitante || 'Usuario Autorizado'
          }
        }]);

        return mantResult;
      } catch (err: any) {
        console.error('Error general en enviarAMantenimiento:', err);
        throw err;
      }
    })());
  }

  finalizarMantenimiento(id: string, trabajo: string, cedulaTecnico: string, nombreTecnico: string) {
    return from((async () => {
      try {
        const fechaHoy = new Date();
        const fechaProximo = new Date();
        fechaProximo.setMonth(fechaHoy.getMonth() + 6);

        const fechaSalidaIso = fechaHoy.toISOString();
        const fechaUltimoMantenimiento = fechaSalidaIso.split('T')[0];
        const fechaProximoMantenimiento = fechaProximo.toISOString().split('T')[0];

        const { data: mantData, error: findError } = await this.supabase.from('mantenimientos')
          .select('*').eq('codigo_bien', id).eq('estado_reparacion', 'En Proceso').single();
        if (findError && findError.code !== 'PGRST116') throw findError;
        
        if (mantData) {
          const { error: updateMantError } = await this.supabase.from('mantenimientos')
            .update({ 
              estado_reparacion: 'Finalizado', 
              trabajo_realizado: trabajo, 
              fecha_salida: fechaSalidaIso,
              cedula_tecnico: cedulaTecnico 
            })
            .eq('id', mantData.id);
          if (updateMantError) throw updateMantError;
        }

        const { data: estadoActivo, error: estadoError } = await this.supabase.from('cat_estados')
          .select('id').eq('nombre', 'Activo').single();
        if (estadoError) throw estadoError;

        const { error: updateError } = await this.supabase.from('bienes')
          .update({ 
            estado_id: estadoActivo.id, 
            fecha_ultimo_mantenimiento: fechaUltimoMantenimiento,
            fecha_proximo_mantenimiento: fechaProximoMantenimiento 
          })
          .eq('codigo_id', id);
        if (updateError) throw updateError;
        
        await this.logBitacora('MANTENIMIENTO_FIN', 'bienes', id, `Mantenimiento finalizado por ${nombreTecnico}. Trabajo: ${trabajo}`);
        return { success: true };
      } catch (error) {
        console.error('[ERROR CRÍTICO]', error);
        throw error;
      }
    })());
  }

  // --- BITACORA ---
  getBitacora(fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('bitacora').select('*, usuarios(nombres, apellidos, rol, cargo)');
        if (fechaInicio) query = query.gte('fecha_hora', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_hora', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_hora', { ascending: false });

        const { data, error } = await query;
        if (error) { console.warn('Error en getBitacora:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getBitacora:', err); return []; }
    })());
  }

  private async logBitacora(accion: string, entidad: string, entidad_id: any, detalles: any) {
    const user = (await this.supabase.auth.getUser()).data.user;
    const userName = user?.user_metadata?.['nombres'] || user?.email?.split('@')[0] || 'Sistema';
    
    let cedula_usuario = '00000000';
    if (user?.id) {
       const { data } = await this.supabase.from('usuarios').select('cedula').eq('auth_id', user.id).single();
       if (data) cedula_usuario = data.cedula;
    }

    let jsonDetalles = typeof detalles === 'string' 
      ? { mensaje: detalles, usuario_nombre: userName, modulo_afectado: entidad } 
      : { ...detalles, usuario_nombre: userName, modulo_afectado: entidad };

    await this.supabase.from('bitacora').insert([{
      accion,
      codigo_bien: entidad === 'bienes' ? entidad_id : null,
      cedula_usuario,
      detalles: jsonDetalles
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



  // --- PUBLIC ---
  getBienesByEncargado(cedula: string, fechaInicio?: string, fechaFin?: string) {
    return from((async () => {
      try {
        let query = this.supabase.from('bienes')
          .select('*, categorias(nombre), cat_estados!inner(nombre)')
          .eq('personal_cedula', cedula)
          .neq('cat_estados.nombre', 'Desincorporado');

        if (fechaInicio) query = query.gte('fecha_registro', `${fechaInicio}T00:00:00.000Z`);
        if (fechaFin) query = query.lte('fecha_registro', `${fechaFin}T23:59:59.999Z`);
        query = query.order('fecha_registro', { ascending: false });

        const { data, error } = await query;
        if (error) { console.warn('Error en getBienesByEncargado:', error); return []; }
        return data || [];
      } catch (err) { console.warn('Excepción en getBienesByEncargado:', err); return []; }
    })());
  }

  getDashboardMetrics() {
    return from((async () => {
      try {
        const { data: estados, error: estadosError } = await this.supabase.from('cat_estados').select('*');
        if (estadosError) {
          console.warn('Error de acceso a tabla cat_estados:', estadosError);
          return { metrics: {}, estados: [] };
        }
        const estadoDes = estados?.find(e => e.nombre === 'Desincorporado');
        const desincID = estadoDes ? estadoDes.id : null;
        
        const metrics: any = {};
        
        let queryTotal = this.supabase.from('bienes').select('*', { count: 'exact', head: true });
        if (desincID) queryTotal = queryTotal.neq('estado_id', desincID);
        
        const { count: totalCount, error: countError } = await queryTotal;
        if (countError) {
          console.warn('Error de acceso a tabla bienes (count):', countError);
        }
        metrics['Total'] = totalCount || 0;

        if (estados && estados.length > 0) {
          const countPromises = estados.map((est: any) => 
            this.supabase.from('bienes').select('*', { count: 'exact', head: true }).eq('estado_id', est.id)
          );
          const results = await Promise.all(countPromises);
          
          estados.forEach((est: any, index: any) => {
            const res = results[index];
            if (res.error) console.warn(`Error contando estado ${est.nombre}:`, res.error);
            metrics[est.nombre] = res.count || 0;
          });
        }

        const conditions = ['Buen estado', 'Regular', 'Mal estado'];
        const condPromises = conditions.map(cond => {
          let q = this.supabase.from('bienes').select('*', { count: 'exact', head: true }).eq('condicion_fisica', cond);
          if (desincID) q = q.neq('estado_id', desincID);
          return q;
        });
        const condResults = await Promise.all(condPromises);
        
        conditions.forEach((cond, index) => {
          const res = condResults[index];
          if (res.error) console.warn(`Error contando condicion ${cond}:`, res.error);
          metrics[cond] = res.count || 0;
        });

        return { metrics, estados };
      } catch (error) {
        console.warn('Error de acceso a tabla en getDashboardMetrics:', error);
        return { metrics: {}, estados: [] };
      }
    })());
  }
}
