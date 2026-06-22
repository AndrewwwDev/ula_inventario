import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../services/audit-log.service';
import { ToastService } from '../../services/toast.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-configuracion-sistema',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion-sistema.component.html'
})
export class ConfiguracionSistemaComponent {
  archivoRespaldo: File | null = null;
  isGenerandoRespaldo = false;
  isRestaurandoSistema = false;
  mostrarModalRestauracion = false;
  palabraConfirmacion = '';

  constructor(
    private auditLogService: AuditLogService,
    private toastService: ToastService,
    private supabaseService: SupabaseService
  ) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') {
        this.archivoRespaldo = file;
      } else {
        this.archivoRespaldo = null;
        this.toastService.show('Formato de archivo inválido. Solo se admite .json', 'error');
        event.target.value = ''; // Clear the input
      }
    }
  }

  async generarRespaldo() {
    this.isGenerandoRespaldo = true;
    try {
      // 1. Consultar todas las tablas críticas
      const { data: usuarios, error: errUsu } = await this.supabaseService.supabase.from('usuarios').select('*');
      if (errUsu) throw errUsu;
      const { data: bienes, error: errBie } = await this.supabaseService.supabase.from('bienes').select('*');
      if (errBie) throw errBie;
      const { data: mantenimientos, error: errMan } = await this.supabaseService.supabase.from('mantenimientos').select('*');
      if (errMan) throw errMan;
      const { data: desincorporaciones, error: errDes } = await this.supabaseService.supabase.from('desincorporaciones').select('*');
      if (errDes) throw errDes;
      const { data: bitacora, error: errBit } = await this.supabaseService.supabase.from('bitacora').select('*');
      if (errBit) throw errBit;

      // 2. Empaquetar
      const backupData = {
        usuarios,
        bienes,
        mantenimientos,
        desincorporaciones,
        bitacora
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const sizeBytes = blob.size;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `ula_inventario_backup_${dateStr}.json`;

      // 3. Forzar Descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      // 4. Auditoría
      await this.auditLogService.logAction({
        usuario_id: '00000000',
        tipo_accion: 'MODIFICACION', // o 'DATABASE_BACKUP' si es un tipo nuevo (asumiendo modificacion por ahora)
        modulo: 'administracion_bd',
        detalles_json: {
          mensaje: 'Se generó y descargó una copia de seguridad de la base de datos.',
          archivo: fileName,
          peso_bytes: sizeBytes
        }
      }).toPromise();

      this.toastService.show('Respaldo generado correctamente', 'success');
    } catch (error) {
      console.error('Error al generar el respaldo', error);
      this.toastService.show('Error al generar el respaldo. Verifique conexión.', 'error');
    } finally {
      this.isGenerandoRespaldo = false;
    }
  }

  abrirModalRestauracion() {
    if (!this.archivoRespaldo) {
      this.toastService.show('Por favor, selecciona un archivo de respaldo válido', 'warning');
      return;
    }
    this.mostrarModalRestauracion = true;
    this.palabraConfirmacion = '';
  }

  cerrarModalRestauracion() {
    this.mostrarModalRestauracion = false;
    this.palabraConfirmacion = '';
  }

  async confirmarRestauracion() {
    if (this.palabraConfirmacion === 'CONFIRMAR') {
      this.mostrarModalRestauracion = false;
      this.palabraConfirmacion = '';
      await this.restaurarSistema();
    }
  }

  async restaurarSistema() {
    this.isRestaurandoSistema = true;
    try {
      // Leer el archivo .json
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(this.archivoRespaldo!);
      });

      const backupData = JSON.parse(fileContent);

      // Orden Relacional Estricto (Upserts)
      if (backupData.usuarios && backupData.usuarios.length > 0) {
        const { error } = await this.supabaseService.supabase.from('usuarios').upsert(backupData.usuarios);
        if (error) throw error;
      }
      
      if (backupData.bienes && backupData.bienes.length > 0) {
        const { error } = await this.supabaseService.supabase.from('bienes').upsert(backupData.bienes);
        if (error) throw error;
      }
      
      if (backupData.mantenimientos && backupData.mantenimientos.length > 0) {
        const { error } = await this.supabaseService.supabase.from('mantenimientos').upsert(backupData.mantenimientos);
        if (error) throw error;
      }
      
      if (backupData.desincorporaciones && backupData.desincorporaciones.length > 0) {
        const { error } = await this.supabaseService.supabase.from('desincorporaciones').upsert(backupData.desincorporaciones);
        if (error) throw error;
      }

      if (backupData.bitacora && backupData.bitacora.length > 0) {
        const { error } = await this.supabaseService.supabase.from('bitacora').upsert(backupData.bitacora);
        if (error) throw error;
      }

      // Inyección a Bitácora
      await this.auditLogService.logAction({
        usuario_id: '00000000',
        tipo_accion: 'MODIFICACION', // o 'DATABASE_RESTORE'
        modulo: 'administracion_bd',
        detalles_json: {
          mensaje: 'Se restauró el sistema desde una copia de seguridad.',
          archivo_usado: this.archivoRespaldo?.name || 'Archivo desconocido',
          estado: 'Éxito'
        }
      }).toPromise();

      this.toastService.show('Base de datos restaurada con éxito.', 'success');
      this.archivoRespaldo = null;
    } catch (error) {
      console.error('Error al restaurar el sistema', error);
      this.toastService.show('Fallo al procesar el archivo. Verifique el formato o su conexión.', 'error');
    } finally {
      this.isRestaurandoSistema = false;
    }
  }
}
