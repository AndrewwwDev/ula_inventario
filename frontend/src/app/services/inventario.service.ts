import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, map, throwError, switchMap, of, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  constructor(private supabase: SupabaseService) {}

  getBienes() {
    return from(this.supabase.from('bienes').select(`
      *,
      categoria:categorias(id, nombre),
      ubicacion:dependencias(id, nombre),
      encargado:encargados(id, nombre, cedula)
    `)).pipe(map(res => (res.data || []).map(item => ({
      ...item,
      estado_operativo: item.estado,
      condicion_fisica: item.condicion
    }))));
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

      // Upload image if present
      if (file) {
        payload.imagen_url = await this.uploadImage(file);
      }

      // Map to Supabase columns
      const dbPayload = {
        nombre: payload.nombre,
        codigo: payload.codigo,
        categoria_id: payload.categoria_id,
        encargado_id: payload.encargado_id,
        dependencia_id: payload.ubicacion_id,
        descripcion: payload.descripcion,
        estado: payload.estado_operativo,
        condicion: payload.condicion_fisica,
        imagen_url: payload.imagen_url
      };

      const { data: result, error } = await this.supabase.from('bienes').insert([dbPayload]).select().single();
      if (error) throw error;
      
      // Log bitacora
      await this.logBitacora('ALTA', 'bienes', result.id, 'Bien registrado en el sistema');
      
      return result;
    })());
  }

  updateBien(id: number | string, data: any) {
    return from((async () => {
      const dbPayload = {
        nombre: data.nombre,
        codigo: data.codigo,
        categoria_id: data.categoria_id,
        encargado_id: data.encargado_id,
        dependencia_id: data.ubicacion_id,
        descripcion: data.descripcion,
        estado: data.estado_operativo,
        condicion: data.condicion_fisica
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('id', id).select().single();
      if (error) throw error;

      await this.logBitacora('MODIFICACION', 'bienes', result.id, 'Bien actualizado');
      return result;
    })());
  }

  updateBienWithFile(id: number | string, data: FormData) {
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
        payload.imagen_url = await this.uploadImage(file);
      }

      const dbPayload = {
        nombre: payload.nombre,
        codigo: payload.codigo,
        categoria_id: payload.categoria_id,
        encargado_id: payload.encargado_id,
        dependencia_id: payload.ubicacion_id,
        descripcion: payload.descripcion,
        estado: payload.estado_operativo,
        condicion: payload.condicion_fisica,
        ...(payload.imagen_url ? { imagen_url: payload.imagen_url } : {})
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('id', id).select().single();
      if (error) throw error;
      
      await this.logBitacora('MODIFICACION', 'bienes', result.id, 'Bien actualizado con imagen');
      return result;
    })());
  }

  getBienesDesincorporados() {
    return from(this.supabase.from('bienes').select(`
      *,
      categoria:categorias(id, nombre),
      ubicacion:dependencias(id, nombre),
      encargado:encargados(id, nombre, cedula)
    `).eq('estado', 'Desincorporado')).pipe(map(res => (res.data || []).map(item => ({
      ...item,
      estado_operativo: item.estado,
      condicion_fisica: item.condicion
    }))));
  }

  desincorporarBien(id: number | string, motivo: string, fecha: string, foto: File | null) {
    return from((async () => {
      let foto_url = null;
      if (foto) {
        foto_url = await this.uploadImage(foto);
      }

      const dbPayload = {
        estado: 'Desincorporado',
        motivo_desincorporacion: motivo,
        fecha_desincorporacion: fecha,
        foto_desincorporacion: foto_url
      };

      const { data: result, error } = await this.supabase.from('bienes').update(dbPayload).eq('id', id).select().single();
      if (error) throw error;

      await this.logBitacora('DESINCORPORACION', 'bienes', result.id, `Bien desincorporado: ${motivo}`);
      return result;
    })());
  }

  getCategorias() {
    return from(this.supabase.from('categorias').select('*')).pipe(map(res => res.data || []));
  }

  getDependencias() {
    return from(this.supabase.from('dependencias').select('*')).pipe(map(res => res.data || []));
  }

  getEncargados() {
    return from(this.supabase.from('encargados').select('*')).pipe(map(res => res.data || []));
  }

  // --- MANTENIMIENTO ---
  getAlertasMantenimiento() {
    const today = new Date().toISOString().split('T')[0];
    return from(this.supabase.from('bienes').select('id, codigo, nombre, proxima_fecha_mantenimiento')
      .lte('proxima_fecha_mantenimiento', today)
      .neq('estado', 'Desincorporado')).pipe(
        map(res => (res.data || []).map(b => ({ bien: b, proxima_fecha: b.proxima_fecha_mantenimiento })))
      );
  }

  getEnReparacion() {
    return from(this.supabase.from('bienes').select(`
      *,
      ubicacion:dependencias(id, nombre)
    `).eq('estado', 'Mantenimiento')).pipe(map(res => (res.data || []).map(item => ({
      ...item,
      estado_operativo: item.estado,
      condicion_fisica: item.condicion
    }))));
  }

  getHistorialMantenimiento() {
    return from(this.supabase.from('mantenimiento_historial').select(`
      *,
      bien:bienes(id, codigo, nombre)
    `)).pipe(map(res => res.data || []));
  }

  finalizarMantenimiento(id: number | string, trabajo: string, proximaFecha: string) {
    return from((async () => {
      // 1. Update Bien state to Activo and set next maintenance date
      const { error: updateError } = await this.supabase.from('bienes')
        .update({ estado: 'Activo', proxima_fecha_mantenimiento: proximaFecha })
        .eq('id', id);
      if (updateError) throw updateError;

      // 2. Add history record
      const { error: insertError } = await this.supabase.from('mantenimiento_historial')
        .insert([{ bien_id: id, trabajo_realizado: trabajo, fecha: new Date().toISOString().split('T')[0], proxima_fecha: proximaFecha }]);
      if (insertError) throw insertError;

      await this.logBitacora('MANTENIMIENTO_FIN', 'bienes', id, `Mantenimiento finalizado: ${trabajo}`);
      return { success: true };
    })());
  }

  // --- BITACORA ---
  getBitacora() {
    return from(this.supabase.from('bitacora').select('*').order('fecha', { ascending: false }))
      .pipe(map(res => res.data || []));
  }

  private async logBitacora(accion: string, entidad: string, entidad_id: any, detalles: string) {
    const user = (await this.supabase.auth.getUser()).data.user;
    const userName = user?.user_metadata?.['nombre'] || user?.email?.split('@')[0] || 'Sistema';
    await this.supabase.from('bitacora').insert([{
      accion,
      entidad,
      entidad_id,
      detalles: { mensaje: detalles, usuario_nombre: userName },
      usuario_id: user?.id
    }]);
  }

  // --- PUBLIC ---
  getBienesByEncargado(cedula: string) {
    return from((async () => {
      const { data: encargado } = await this.supabase.from('encargados').select('id').eq('cedula', cedula).single();
      if (!encargado) return [];
      const { data } = await this.supabase.from('bienes').select('*').eq('encargado_id', encargado.id);
      return data || [];
    })());
  }
}
